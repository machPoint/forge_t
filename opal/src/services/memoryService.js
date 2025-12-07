/**
 * Memory Service for OPAL server
 * Handles creating, searching, and updating memories with vector embeddings
 */

const { OpenAI } = require('openai');
const db = require('../config/database');
const logger = require('../logger');
const { v4: uuidv4 } = require('uuid');
const { toSnakeCase, toCamelCase } = require('../utils/caseConverter');

// Log OpenAI API key status
const openaiApiKey = process.env.OPENAI_API_KEY || 'sk-your-key-here';
logger.info('OpenAI API Key status:', { 
  exists: !!process.env.OPENAI_API_KEY,
  length: openaiApiKey.length,
  preview: openaiApiKey.substring(0, 7) + '...'
});

// Initialize OpenAI client for embeddings
const openai = new OpenAI({
  apiKey: openaiApiKey
});

/**
 * Generate embeddings for text using OpenAI's API
 * @param {string} text - The text to embed
 * @returns {Promise<number[]>} - The embedding vector
 */
async function generateEmbedding(text) {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
      encoding_format: "float"
    });
    
    return response.data[0].embedding;
  } catch (error) {
    logger.error('Error generating embedding:', error);
    
    // Fallback to random embedding if OpenAI is unavailable
    // This is just for development purposes
    logger.warn('Using fallback random embedding');
    return Array(1536).fill().map(() => Math.random() * 2 - 1);
  }
}

/**
 * Create a new memory with embedded vector
 * @param {string} userId - The user ID
 * @param {string} title - Memory title
 * @param {string} content - Memory content
 * @param {Object} options - Additional options in camelCase (type, tags, source, sourceEntryId, metadata)
 * @returns {Promise<Object>} - The created memory in camelCase
 */
async function createMemory(userId, title, content, options = {}) {
  try {
    // Convert options from camelCase to snake_case
    const snakeCaseOptions = toSnakeCase(options);
    
    const {
      type = 'summary',
      tags = [],
      source = null,
      source_entry_id = null,
      metadata = {}
    } = snakeCaseOptions;
    
    const embedding = await generateEmbedding(content);
    const contentToStore = typeof content === 'string' ? content : JSON.stringify(content);

    const memoryData = {
      id: uuidv4(), // Generate a UUID for the memory
      user_id: userId,
      title,
      content: contentToStore,
      type,
      tags: JSON.stringify(tags),
      source,
      source_entry_id,
      metadata: JSON.stringify(metadata),
      embedding: JSON.stringify(embedding)
    };

    logger.debug(`[memoryService] Creating memory with data: ${JSON.stringify(memoryData)}`);
    
    const [newMemory] = await db('memories')
      .insert(memoryData)
      .returning('*');

    logger.info(`Created memory: ${newMemory.id} for user: ${userId}`);
    
    // Convert the result from snake_case back to camelCase for frontend
    return toCamelCase(newMemory);
  } catch (err) {
    logger.error('Error creating memory:', err);
    throw err;
  }
}

/**
 * Search memories using vector similarity
 * @param {string} userId - The user ID
 * @param {string} query - Search query
 * @param {number} limit - Maximum number of results
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {Promise<Array>} - Matching memories with camelCase keys
 */
async function searchMemories(userId, query, limit = 10, threshold = 0.7) {
  try {
    // Generate embedding for the query
    const queryEmbedding = await generateEmbedding(query);
    
    // For SQLite, use the custom vector similarity function
    const memories = await db.vectorSimilarity.findSimilar(
      queryEmbedding,
      userId,
      threshold,
      limit
    );
    
    logger.info(`Found ${memories.length} memories for query: "${query.substring(0, 20)}..."`);
    
    // Convert snake_case keys from database to camelCase for frontend
    return toCamelCase(memories);
  } catch (error) {
    logger.error('Error searching memories:', error);
    throw new Error(`Failed to search memories: ${error.message}`);
  }
}

/**
 * Update an existing memory
 * @param {string} memoryId - The memory ID
 * @param {string} userId - The user ID (for authorization)
 * @param {Object} updates - Fields to update in camelCase
 * @returns {Promise<Object>} - The updated memory with camelCase keys
 */
async function updateMemory(memoryId, userId, updates) {
  try {
    const existingMemory = await db('memories')
      .where({ id: memoryId, user_id: userId })
      .first();
    
    if (!existingMemory) {
      throw new Error('Memory not found or access denied');
    }
    
    // Convert updates from camelCase to snake_case
    const snakeCaseUpdates = toSnakeCase(updates);
    const updateData = { ...snakeCaseUpdates };
    
    // Handle special fields that need processing
    if (updates.content || updates.text) {
      const contentToEmbed = updates.content || updates.text;
      updateData.embedding = JSON.stringify(await generateEmbedding(contentToEmbed));
    }
    
    if (updateData.tags && Array.isArray(updateData.tags)) {
      updateData.tags = JSON.stringify(updateData.tags);
    }

    if (updateData.metadata && typeof updateData.metadata === 'object') {
      updateData.metadata = JSON.stringify(updateData.metadata);
    }

    // Ensure we're not trying to update protected fields
    delete updateData.id;
    delete updateData.user_id;
    delete updateData.created_at;
    
    logger.debug(`[memoryService] Updating memory with data: ${JSON.stringify(updateData)}`);

    const [updatedMemory] = await db('memories')
      .where({ id: memoryId })
      .update({
        ...updateData,
        updated_at: db.fn.now()
      })
      .returning('*');
    
    logger.info(`Updated memory: ${memoryId}`);
    
    // Convert snake_case keys from database back to camelCase for frontend
    return toCamelCase(updatedMemory);
  } catch (error) {
    logger.error('Error updating memory:', error);
    throw new Error(`Failed to update memory: ${error.message}`);
  }
}

/**
 * Delete a memory
 * @param {string} memoryId - The memory ID
 * @param {string} userId - The user ID (for authorization)
 * @returns {Promise<boolean>} - Success status
 */
async function deleteMemory(memoryId, userId) {
  try {
    // Check if the memory exists and belongs to the user
    const existingMemory = await db('memories')
      .where({ id: memoryId, user_id: userId })
      .first();
    
    if (!existingMemory) {
      throw new Error('Memory not found or access denied');
    }
    
    // Delete the memory
    await db('memories')
      .where({ id: memoryId })
      .del();
    
    logger.info(`Deleted memory: ${memoryId}`);
    return true;
  } catch (error) {
    logger.error('Error deleting memory:', error);
    throw new Error(`Failed to delete memory: ${error.message}`);
  }
}

/**
 * Get memories for a user with optional filters
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @param {Object} options.filter - Filter conditions
 * @param {number} options.limit - Max number of results
 * @param {number} options.offset - Pagination offset
 * @param {boolean} options.includeArchived - Whether to include archived memories
 * @param {boolean} options.onlyStarred - Whether to only show starred memories
 * @returns {Promise<Array>} - List of memories
 */
async function getUserMemories(userId, { filter = {}, limit = 50, offset = 0, includeArchived = false, onlyStarred = false } = {}) {
  try {
    console.log('[getUserMemories] Called with:', { userId, filter, limit, offset, includeArchived, onlyStarred });
    
    // Start building the query
    const query = db('memories').where('user_id', userId);
    
    // Check if the columns exist before applying filters
    const hasNewColumns = await checkColumnsExist('memories', ['is_archived', 'is_starred']);
    
    // Apply archived filter only if the column exists
    if (!includeArchived && hasNewColumns.is_archived) {
      query.andWhere(function() {
        this.where('is_archived', false).orWhereNull('is_archived');
      });
    }
    
    // Apply starred filter only if the column exists
    if (onlyStarred && hasNewColumns.is_starred) {
      query.where('is_starred', true);
    }
    
    // Apply other filters
    const snakeCaseFilter = toSnakeCase(filter);
    if (snakeCaseFilter.type) query = query.andWhere('type', snakeCaseFilter.type);
    if (snakeCaseFilter.source) query = query.andWhere('source', snakeCaseFilter.source);
    if (snakeCaseFilter.source_entry_id) query = query.andWhere('source_entry_id', snakeCaseFilter.source_entry_id);
    
    // Tags filter: simple contains (for now)
    if (snakeCaseFilter.tags && Array.isArray(snakeCaseFilter.tags) && snakeCaseFilter.tags.length > 0) {
      snakeCaseFilter.tags.forEach(tag => {
        query = query.andWhere('tags', 'like', `%${tag}%`);
      });
    }
    
    logger.debug('[getUserMemories] SQL Query:', query.toString());
    
    const memories = await query.orderBy('created_at', 'desc').limit(limit).offset(offset);
    logger.info(`[getUserMemories] Retrieved ${memories.length} memories for user: ${userId}`);
    
    // Convert snake_case keys from database to camelCase for frontend
    const camelCaseMemories = toCamelCase(memories);
    
    return camelCaseMemories;
  } catch (error) {
    logger.error('Error getting user memories:', error);
    throw new Error(`Failed to get user memories: ${error.message}`);
  }
}

/**
 * Check if columns exist in a table
 * @param {string} tableName - Name of the table
 * @param {string[]} columnNames - Array of column names to check
 * @returns {Promise<Object>} - Object with column names as keys and boolean values
 */
async function checkColumnsExist(tableName, columnNames) {
  try {
    // Get table info from SQLite
    const tableInfo = await db.raw(`PRAGMA table_info(${tableName})`);
    
    // Extract column names from the result
    const existingColumns = tableInfo.map(col => col.name);
    
    // Create result object with boolean values for each column
    const result = {};
    columnNames.forEach(colName => {
      result[colName] = existingColumns.includes(colName);
    });
    
    return result;
  } catch (error) {
    logger.error(`Error checking columns in ${tableName}:`, error);
    // Default to false for all columns if there's an error
    return columnNames.reduce((acc, col) => ({ ...acc, [col]: false }), {});
  }
}

module.exports = {
  createMemory,
  searchMemories,
  updateMemory,
  deleteMemory,
  getUserMemories
};
