/**
 * Example script for creating MCP tools
 * 
 * This script demonstrates how to use the toolCreator utility to add
 * various types of tools to your OPAL server.
 * 
 * To use this script:
 * 1. Require it in your server.js file after server initialization
 * 2. Call the registerExampleTools function with your configs and wss objects
 */

const toolCreator = require('../utils/toolCreator');
const logger = require('../logger');
const memoryService = require('../services/memoryService');

/**
 * Register example MCP tools
 * 
 * @param {Object} configs - The global configs object
 * @param {WebSocketServer} wss - The WebSocket server instance
 */
function registerExampleTools(configs, wss) {
  logger.info('Starting to register example tools...');
  
  // 1. Simple text transformation tools
  logger.info('Registering text tools...');
  registerTextTools(configs, wss);
  
  // 2. Data retrieval tools
  logger.info('Registering data tools...');
  registerDataTools(configs, wss);
  
  // 3. Custom advanced tools
  logger.info('Registering advanced tools...');
  registerAdvancedTools(configs, wss);
  
  // 4. Memory tools
  logger.info('Registering memory tools...');
  registerMemoryTools(configs, wss);
  
  logger.info('Finished registering all example tools');
}

/**
 * Register text processing tools
 */
function registerTextTools(configs, wss) {
  // Text to uppercase
  toolCreator.createTextTool(
    configs, 
    wss,
    'text_uppercase',
    'Convert text to uppercase',
    (params) => {
      return { result: params.text.toUpperCase() };
    }
  );
  
  // Text to lowercase
  toolCreator.createTextTool(
    configs, 
    wss,
    'text_lowercase',
    'Convert text to lowercase',
    (params) => {
      return { result: params.text.toLowerCase() };
    }
  );
  
  // Word count
  toolCreator.createTextTool(
    configs, 
    wss,
    'text_word_count',
    'Count words in text',
    (params) => {
      const words = params.text.trim().split(/\s+/).filter(w => w.length > 0);
      return { 
        count: words.length,
        text: params.text
      };
    }
  );
  
  // Text reversal
  toolCreator.createTextTool(
    configs, 
    wss,
    'text_reverse',
    'Reverse the characters in text',
    (params) => {
      return { result: params.text.split('').reverse().join('') };
    }
  );
}

/**
 * Register data retrieval tools
 */
function registerDataTools(configs, wss) {
  // Removed weather tool - not needed for journal application
  
  // Removed user profile tool - not needed for basic journal operations
}

/**
 * Register advanced custom tools
 */
function registerAdvancedTools(configs, wss) {
  // Removed unnecessary advanced tools - keeping only essential journal functionality
}

function registerMemoryTools(configs, wss) {
  const memoryService = require('../services/memoryService');
  const { v4: uuidv4 } = require('uuid');
  
  logger.info('Starting memory tools registration...');

  // Create memory tool
  logger.info('Registering memory_create tool...');
  toolCreator.createTool(configs, wss, {
    name: 'memory_create',
    description: 'Create a new memory (summary or full entry) with tags and metadata',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Memory title' },
        content: { type: 'string', description: 'Full content of the memory' },
        type: { type: 'string', description: 'Type of memory (summary or full)', enum: ['summary', 'full'], default: 'summary' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for the memory' },
        source: { type: 'string', description: 'Source of the memory (e.g., journal, note)' },
        source_entry_id: { type: 'string', description: 'ID of the original entry (optional)' },
        metadata: { type: 'object', description: 'Additional metadata (optional)' }
      },
      required: ['title', 'content']
    },
    _internal: {
      method: 'POST',
      path: '/memory/create',
      processor: async (params, session) => {
        logger.info('[memory_create] Processing request with session:', { 
          hasSession: !!session, 
          hasUser: !!(session && session.user),
          userId: session?.user?.id
        });
        
        if (!session || !session.user || !session.user.id) {
          logger.error('[memory_create] Authentication failed - missing user in session');
          throw new Error('User not authenticated');
        }
        
        const { title, content, ...options } = params;
        const userId = session.user.id;
        
        // Check if a memory for this source entry already exists
        if (options.source && options.sourceEntryId) {
          logger.info(`[memory_create] Checking for existing memory with source ${options.source} and sourceEntryId ${options.sourceEntryId}`);
          
          try {
            // Use snake_case for database queries
            const existingMemories = await memoryService.getUserMemories(userId, {
              source: options.source,
              sourceEntryId: options.sourceEntryId
            });
            
            if (existingMemories && existingMemories.length > 0) {
              const existingMemory = existingMemories[0];
              logger.info(`[memory_create] Found existing memory with ID: ${existingMemory.id}, updating instead of creating new`);
              
              // Update the existing memory
              const updatedMemory = await memoryService.updateMemory(
                existingMemory.id,
                userId,
                { title, content, ...options }
              );
              
              logger.info(`[memory_create] Successfully updated memory with ID: ${updatedMemory.id}`);
              return { type: 'json', json: updatedMemory };
            }
          } catch (err) {
            logger.error(`[memory_create] Error checking for existing memory: ${err.message}`);
            // Continue with creating a new memory if there was an error checking
          }
        }
        
        // If no existing memory was found or there was an error, create a new one
        logger.info(`[memory_create] Creating new memory for user ${userId} with title: ${title}`);
        
        const memory = await memoryService.createMemory(
          userId,
          title,
          content,
          options
        );
        
        logger.info(`[memory_create] Successfully created memory with ID: ${memory.id}`);
        return { type: 'json', json: memory };
      }
    }
  });

  // List memories tool
  logger.info('Registering memory_list tool...');
  toolCreator.createTool(configs, wss, {
    name: 'memory_list',
    description: 'List all memories for the user, with optional filters',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', description: 'Type of memory to filter (summary or full)' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags to filter' },
        source: { type: 'string', description: 'Source to filter (e.g., journal, note)' },
        sourceEntryId: { type: 'string', description: 'Source entry ID to filter' },
        includeArchived: { type: 'boolean', description: 'Whether to include archived memories', default: false },
        onlyStarred: { type: 'boolean', description: 'Whether to only show starred memories', default: false },
        limit: { type: 'integer', description: 'Max number of results', default: 50 },
        offset: { type: 'integer', description: 'Pagination offset', default: 0 }
      }
    },
    _internal: {
      method: 'GET',
      path: '/memories',
      processor: async (params, session) => {
        logger.info('[memory_list] Processing request with session:', { 
          hasSession: !!session, 
          hasUser: !!(session && session.user),
          userId: session?.user?.id
        });
        
        if (!session || !session.user || !session.user.id) {
          logger.error('[memory_list] Authentication failed - missing user in session');
          throw new Error('User not authenticated');
        }
        
        const userId = session.user.id;
        logger.info(`[memory_list] Retrieving memories for user ${userId} with filters:`, params);
        
        const filter = {
          type: params.type,
          tags: params.tags,
          source: params.source,
          sourceEntryId: params.sourceEntryId,
          includeArchived: params.includeArchived,
          onlyStarred: params.onlyStarred
        };
        
        const memories = await memoryService.getUserMemories(
          userId,
          filter,
          params.limit || 50,
          params.offset || 0
        );
        
        logger.info(`[memory_list] Retrieved ${memories.length} memories successfully`);
        return memories;
      }
    }
  });

  // Register memory_delete tool
  logger.info('Registering memory_delete tool...');
  toolCreator.createTool(configs, wss, {
    name: 'memory_delete',
    description: 'Delete a memory by id',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the memory to delete' }
      },
      required: ['id']
    },
    _internal: {
      method: 'DELETE',
      path: '/memories/:id',
      processor: async (params, session) => {
        logger.info('[memory_delete] Processing request with session:', { 
          hasSession: !!session, 
          hasUser: !!(session && session.user),
          userId: session?.user?.id
        });
        
        if (!session || !session.user || !session.user.id) {
          logger.error('[memory_delete] Authentication failed - missing user in session');
          throw new Error('User not authenticated');
        }
        
        const userId = session.user.id;
        logger.info(`[memory_delete] Deleting memory ${params.id} for user ${userId}`);
        
        try {
          await memoryService.deleteMemory(params.id, userId);
          logger.info(`[memory_delete] Successfully deleted memory: ${params.id}`);
          return { success: true, message: 'Memory deleted successfully', id: params.id };
        } catch (err) {
          logger.error('[memory_delete] Error:', err);
          throw err;
        }
      }
    }
  });

  // Register memory_update tool
  logger.info('Registering memory_update tool...');
  toolCreator.createTool(configs, wss, {
    name: 'memory_update',
    description: 'Update a memory with new content, star status, or archive status',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'ID of the memory to update' },
        title: { type: 'string', description: 'New title for the memory' },
        content: { type: 'string', description: 'New content for the memory' },
        isStarred: { type: 'boolean', description: 'Whether the memory is starred' },
        isArchived: { type: 'boolean', description: 'Whether the memory is archived' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Updated tags for the memory' },
        metadata: { type: 'object', description: 'Updated metadata for the memory' }
      },
      required: ['id']
    },
    _internal: {
      method: 'PUT',
      path: '/memories/:id',
      processor: async (params, session) => {
        logger.info('[memory_update] Processing request with session:', { 
          hasSession: !!session, 
          hasUser: !!(session && session.user),
          userId: session?.user?.id
        });
        
        if (!session || !session.user || !session.user.id) {
          logger.error('[memory_update] Authentication failed - missing user in session');
          throw new Error('User not authenticated');
        }
        
        const userId = session.user.id;
        logger.info(`[memory_update] Updating memory ${params.id} for user ${userId}`);
        
        try {
          // Prepare update object with only the fields that are provided
          // Note: memoryService.updateMemory expects camelCase keys which it will convert to snake_case internally
          const updates = {};
          if (params.title !== undefined) updates.title = params.title;
          if (params.content !== undefined) updates.content = params.content;
          if (params.isStarred !== undefined) updates.isStarred = params.isStarred;
          if (params.isArchived !== undefined) updates.isArchived = params.isArchived;
          if (params.tags !== undefined) updates.tags = params.tags;
          if (params.metadata !== undefined) updates.metadata = params.metadata;
          
          logger.debug(`[memory_update] Update data: ${JSON.stringify(updates)}`);
          
          const updatedMemory = await memoryService.updateMemory(params.id, userId, updates);
          logger.info(`[memory_update] Successfully updated memory: ${params.id}`);
          return updatedMemory;
        } catch (err) {
          logger.error('[memory_update] Error:', err);
          throw err;
        }
      }
    }
  });
  
  logger.info('Memory tools registration completed');
}

module.exports = registerExampleTools;
