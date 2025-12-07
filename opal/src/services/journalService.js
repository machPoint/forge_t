const db = require('../config/database');
const logger = require('../logger');
const { toSnakeCase, toCamelCase } = require('../utils/caseConverter');

/**
 * Creates a new journal entry in the database.
 * @param {string} userId - The ID of the user creating the entry.
 * @param {object} entryData - The data for the new journal entry.
 * @returns {Promise<object>} The newly created journal entry.
 */
async function createJournalEntry(userId, entryData) {
  try {
    logger.info(`[JournalService] Creating entry for user ${userId}`);
    
    // Convert camelCase keys from frontend to snake_case for database
    const snakeCaseData = toSnakeCase(entryData);
    logger.debug(`[JournalService] Original entry data: ${JSON.stringify(snakeCaseData)}`);
    
    // Create a minimal dataset with careful type handling for SQLite compatibility
    // Remove the id field to let SQLite auto-generate it (it's an auto-increment integer, not UUID)
    const minimalData = {
      // id is intentionally omitted - let the database auto-generate it
      title: String(snakeCaseData.title || 'Untitled Entry'),
      content: String(snakeCaseData.content || ''),
      user_id: userId, // Keep as-is since it's a reference to users table
      is_complete: snakeCaseData.is_complete === true ? 1 : 0, // Convert boolean to integer for SQLite
      created_at: snakeCaseData.created_at || new Date().toISOString(),
      updated_at: snakeCaseData.updated_at || new Date().toISOString()
      // persona_id is intentionally omitted to avoid datatype mismatch
    };
    
    // Add module fields for guided entries if present
    if (snakeCaseData.module_id !== undefined) {
      minimalData.module_id = snakeCaseData.module_id;
    }
    if (snakeCaseData.module_step !== undefined) {
      minimalData.module_step = snakeCaseData.module_step;
    }

    logger.debug(`[JournalService] Sanitized entry data: ${JSON.stringify(minimalData)}`);
    
    const [newEntry] = await db('journal_entries')
      .insert(minimalData)
      .returning('*');
    
    // Convert snake_case keys from database back to camelCase for frontend
    return toCamelCase(newEntry);
  } catch (error) {
    logger.error(`[JournalService] Error creating entry: ${error.message}`);
    throw error;
  }
}

/**
 * Retrieves all journal entries for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array<object>>} A list of journal entries with camelCase keys.
 */
async function getJournalEntries(userId) {
  try {
    logger.info(`[JournalService] Fetching entries for user ${userId}`);
    
    // Fetch entries from database (snake_case)
    const entries = await db('journal_entries')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc');
    
    // Convert snake_case keys from database to camelCase for frontend
    return toCamelCase(entries);
  } catch (error) {
    logger.error(`[JournalService] Error fetching entries: ${error.message}`);
    throw error;
  }
}

/**
 * Updates an existing journal entry.
 * @param {string} entryId - The ID of the entry to update.
 * @param {string} userId - The ID of the user owning the entry.
 * @param {object} updates - The fields to update (in camelCase).
 * @returns {Promise<object>} The updated journal entry (in camelCase).
 */
async function updateJournalEntry(entryId, userId, updates) {
  try {
    logger.info(`[JournalService] Updating entry ${entryId} for user ${userId}`);
    
    // Ensure we're not trying to update protected fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.userId;
    delete safeUpdates.createdAt;
    
    // Convert camelCase keys from frontend to snake_case for database
    const snakeCaseUpdates = toSnakeCase(safeUpdates);
    
    logger.debug(`[JournalService] Safe update data (snake_case): ${JSON.stringify(snakeCaseUpdates)}`);
    
    const [updatedEntry] = await db('journal_entries')
      .where({ id: entryId, user_id: userId })
      .update(snakeCaseUpdates)
      .returning('*');
    
    if (!updatedEntry) {
      logger.error(`[JournalService] No entry found or updated with id ${entryId} for user ${userId}`);
      throw new Error(`Journal entry not found or you don't have permission to update it`);
    }
    
    // Convert snake_case keys from database back to camelCase for frontend
    const camelCaseEntry = toCamelCase(updatedEntry);
    
    logger.debug(`[JournalService] Successfully updated entry: ${JSON.stringify(camelCaseEntry)}`);
    return camelCaseEntry;
  } catch (error) {
    logger.error(`[JournalService] Error updating entry ${entryId}: ${error.message}`);
    logger.error(`[JournalService] Error stack: ${error.stack}`);
    throw error;
  }
}

/**
 * Deletes a journal entry from the database.
 * @param {string} entryId - The ID of the entry to delete.
 * @param {string} userId - The ID of the user owning the entry.
 * @returns {Promise<number>} The number of rows deleted.
 */
async function deleteJournalEntry(entryId, userId) {
  try {
    logger.info(`[JournalService] Deleting entry ${entryId} for user ${userId}`);
    
    const deletedCount = await db('journal_entries')
      .where({ id: entryId, user_id: userId })
      .del();
    
    if (deletedCount === 0) {
      logger.warn(`[JournalService] No entry found to delete with id ${entryId} for user ${userId}`);
    } else {
      logger.info(`[JournalService] Successfully deleted entry ${entryId}`);
    }
    
    return deletedCount;
  } catch (error) {
    logger.error(`[JournalService] Error deleting entry ${entryId}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createJournalEntry,
  getJournalEntries,
  updateJournalEntry,
  deleteJournalEntry,
}; 