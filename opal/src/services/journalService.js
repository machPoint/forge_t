const db = require('../config/database');
const logger = require('../logger');
const { toSnakeCase, toCamelCase } = require('../utils/caseConverter');

/**
 * Creates a backup of a journal entry before updating it.
 * This provides a safety net in case of accidental data loss.
 * @param {object} entry - The entry to backup
 * @returns {Promise<void>}
 */
async function createEntryBackup(entry) {
  try {
    // Create a backup entry in a separate table (if it exists)
    // For now, we'll just log it extensively
    logger.info(`[JournalService] BACKUP - Entry ${entry.id} state before update:`);
    logger.info(`[JournalService] BACKUP - Title: "${entry.title}"`);
    logger.info(`[JournalService] BACKUP - Content length: ${entry.content?.length || 0} characters`);
    logger.info(`[JournalService] BACKUP - Last updated: ${entry.updated_at}`);
    
    // TODO: In production, consider storing backups in a separate table
    // await db('journal_entry_backups').insert({
    //   entry_id: entry.id,
    //   backup_data: JSON.stringify(entry),
    //   backup_timestamp: new Date().toISOString()
    // });
  } catch (error) {
    logger.error(`[JournalService] Error creating backup for entry ${entry.id}: ${error.message}`);
    // Don't throw - backup failure shouldn't prevent updates
  }
}

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
    
    // Log if this is an import with a historical date
    if (snakeCaseData.created_at) {
      const providedDate = new Date(snakeCaseData.created_at);
      const now = new Date();
      const daysDiff = Math.floor((now - providedDate) / (1000 * 60 * 60 * 24));
      logger.info(`[JournalService] Received created_at: ${snakeCaseData.created_at}`);
      if (daysDiff > 1) {
        logger.info(`[JournalService] IMPORT - Preserving historical date: ${snakeCaseData.created_at} (${daysDiff} days ago)`);
      }
    } else {
      logger.info(`[JournalService] No created_at provided, using current timestamp`);
    }
    
    // Create a minimal dataset with careful type handling for SQLite compatibility
    // Remove the id field to let SQLite auto-generate it (it's an auto-increment integer, not UUID)
    const minimalData = {
      // id is intentionally omitted - let the database auto-generate it
      title: String(snakeCaseData.title || 'Untitled Entry'),
      content: String(snakeCaseData.content || ''),
      user_id: userId, // Keep as-is since it's a reference to users table
      is_complete: snakeCaseData.is_complete === true ? 1 : 0, // Convert boolean to integer for SQLite
      // IMPORTANT: Preserve original dates for imports - if created_at is provided (e.g., from import),
      // use it to maintain historical accuracy for calendars and sentiment analysis
      created_at: snakeCaseData.created_at || new Date().toISOString(),
      updated_at: snakeCaseData.updated_at || snakeCaseData.created_at || new Date().toISOString()
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
    
    // Insert and get the ID (SQLite doesn't support returning('*') well)
    // IMPORTANT: We're explicitly setting created_at/updated_at, so Knex won't override them
    const [insertedId] = await db('journal_entries')
      .insert(minimalData);
    
    // Fetch the newly created entry
    const newEntry = await db('journal_entries')
      .where({ id: insertedId })
      .first();
    
    // Verify the dates were stored correctly
    logger.info(`[JournalService] Entry ${insertedId} stored with created_at: ${newEntry.created_at}, updated_at: ${newEntry.updated_at}`);
    
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
    
    // SAFETY CHECK 1: Verify entry exists and belongs to user BEFORE updating
    const existingEntry = await db('journal_entries')
      .where({ id: entryId, user_id: userId })
      .first();
    
    if (!existingEntry) {
      logger.error(`[JournalService] Entry ${entryId} not found or doesn't belong to user ${userId}`);
      throw new Error(`Journal entry not found or you don't have permission to update it`);
    }
    
    // Create backup of entry state before updating
    await createEntryBackup(existingEntry);
    
    // SAFETY CHECK 2: Ensure we're not trying to update protected fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.userId;
    delete safeUpdates.user_id;
    delete safeUpdates.createdAt;
    delete safeUpdates.created_at;
    
    // SAFETY CHECK 3: Prevent empty updates that could corrupt data
    if (Object.keys(safeUpdates).length === 0) {
      logger.warn(`[JournalService] No valid fields to update for entry ${entryId}`);
      return toCamelCase(existingEntry);
    }
    
    // SAFETY CHECK 4: Validate critical fields aren't being set to null/undefined
    if (safeUpdates.title !== undefined && (!safeUpdates.title || safeUpdates.title.trim() === '')) {
      logger.warn(`[JournalService] Preventing empty title update for entry ${entryId}`);
      safeUpdates.title = existingEntry.title || 'Untitled Entry';
    }
    
    if (safeUpdates.content !== undefined && safeUpdates.content === null) {
      logger.warn(`[JournalService] Preventing null content update for entry ${entryId}`);
      safeUpdates.content = existingEntry.content || '';
    }
    
    // Convert camelCase keys from frontend to snake_case for database
    const snakeCaseUpdates = toSnakeCase(safeUpdates);
    
    // Always update the updated_at timestamp
    snakeCaseUpdates.updated_at = new Date().toISOString();
    
    logger.debug(`[JournalService] Safe update data (snake_case): ${JSON.stringify(snakeCaseUpdates)}`);
    
    // SAFETY CHECK 5: Use transaction to ensure atomic update
    const updatedEntry = await db.transaction(async (trx) => {
      // Update the entry
      const updateCount = await trx('journal_entries')
        .where({ id: entryId, user_id: userId })
        .update(snakeCaseUpdates);
      
      if (updateCount === 0) {
        throw new Error(`Failed to update entry ${entryId}`);
      }
      
      // Fetch and return the updated entry
      const updated = await trx('journal_entries')
        .where({ id: entryId })
        .first();
      
      return updated;
    });
    
    // Convert snake_case keys from database back to camelCase for frontend
    const camelCaseEntry = toCamelCase(updatedEntry);
    
    logger.info(`[JournalService] Successfully updated entry ${entryId}`);
    return camelCaseEntry;
  } catch (error) {
    logger.error(`[JournalService] Error updating entry ${entryId}: ${error.message}`);
    logger.error(`[JournalService] Error stack: ${error.stack}`);
    throw error;
  }
}

/**
 * Deletes a journal entry from the database.
 * SAFETY: This operation is permanent and cannot be undone.
 * @param {string} entryId - The ID of the entry to delete.
 * @param {string} userId - The ID of the user owning the entry.
 * @returns {Promise<number>} The number of rows deleted.
 */
async function deleteJournalEntry(entryId, userId) {
  try {
    logger.info(`[JournalService] DELETE REQUEST - Entry ${entryId} for user ${userId}`);
    
    // SAFETY CHECK 1: Verify entry exists and belongs to user BEFORE deleting
    const existingEntry = await db('journal_entries')
      .where({ id: entryId, user_id: userId })
      .first();
    
    if (!existingEntry) {
      logger.warn(`[JournalService] DELETE BLOCKED - Entry ${entryId} not found or doesn't belong to user ${userId}`);
      return 0;
    }
    
    // SAFETY CHECK 2: Create backup before deletion (permanent record)
    logger.warn(`[JournalService] PERMANENT DELETE - Backing up entry ${entryId} before deletion`);
    logger.warn(`[JournalService] DELETED ENTRY - Title: "${existingEntry.title}"`);
    logger.warn(`[JournalService] DELETED ENTRY - Content: ${existingEntry.content?.substring(0, 200)}...`);
    logger.warn(`[JournalService] DELETED ENTRY - Created: ${existingEntry.created_at}`);
    logger.warn(`[JournalService] DELETED ENTRY - Full backup: ${JSON.stringify(existingEntry)}`);
    
    // SAFETY CHECK 3: Use transaction to ensure atomic deletion
    const deletedCount = await db.transaction(async (trx) => {
      return await trx('journal_entries')
        .where({ id: entryId, user_id: userId })
        .del();
    });
    
    if (deletedCount === 0) {
      logger.error(`[JournalService] DELETE FAILED - No entry deleted for ${entryId}`);
    } else {
      logger.warn(`[JournalService] DELETE COMPLETED - Entry ${entryId} permanently deleted`);
    }
    
    return deletedCount;
  } catch (error) {
    logger.error(`[JournalService] DELETE ERROR - Failed to delete entry ${entryId}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createJournalEntry,
  getJournalEntries,
  updateJournalEntry,
  deleteJournalEntry,
}; 