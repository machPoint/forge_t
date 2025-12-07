const db = require('../config/database');
const logger = require('../logger');
const { toSnakeCase, toCamelCase } = require('../utils/caseConverter');

/**
 * Creates a new note in the database.
 * @param {string} userId - The ID of the user creating the note.
 * @param {object} noteData - The data for the new note.
 * @returns {Promise<object>} The newly created note.
 */
async function createNote(userId, noteData) {
  try {
    logger.info(`[NotesService] Creating note for user ${userId}`);
    
    // Convert camelCase keys from frontend to snake_case for database
    const snakeCaseData = toSnakeCase(noteData);
    logger.debug(`[NotesService] Original note data: ${JSON.stringify(snakeCaseData)}`);
    
    // Create a minimal dataset with careful type handling for SQLite compatibility
    const minimalData = {
      title: String(snakeCaseData.title || 'Untitled Note'),
      content: String(snakeCaseData.content || ''),
      user_id: userId,
      tags: JSON.stringify(snakeCaseData.tags || []),
      is_pinned: snakeCaseData.isPinned === true ? 1 : 0,
      is_archived: snakeCaseData.isArchived === true ? 1 : 0,
      created_at: snakeCaseData.createdAt || new Date().toISOString(),
      updated_at: snakeCaseData.updatedAt || new Date().toISOString()
    };

    logger.debug(`[NotesService] Sanitized note data: ${JSON.stringify(minimalData)}`);
    
    const [newNote] = await db('notes')
      .insert(minimalData)
      .returning('*');
    
    // Convert snake_case keys from database back to camelCase for frontend
    return toCamelCase(newNote);
  } catch (error) {
    logger.error(`[NotesService] Error creating note: ${error.message}`);
    throw error;
  }
}

/**
 * Retrieves all notes for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array<object>>} A list of notes with camelCase keys.
 */
async function getNotes(userId) {
  try {
    logger.info(`[NotesService] Fetching notes for user ${userId}`);
    
    // Fetch notes from database (snake_case)
    const notes = await db('notes')
      .where({ user_id: userId })
      .orderBy('updated_at', 'desc');
    
    // Convert snake_case keys from database to camelCase for frontend
    return toCamelCase(notes);
  } catch (error) {
    logger.error(`[NotesService] Error fetching notes: ${error.message}`);
    throw error;
  }
}

/**
 * Updates an existing note.
 * @param {string} noteId - The ID of the note to update.
 * @param {string} userId - The ID of the user owning the note.
 * @param {object} updates - The fields to update (in camelCase).
 * @returns {Promise<object>} The updated note (in camelCase).
 */
async function updateNote(noteId, userId, updates) {
  try {
    logger.info(`[NotesService] Updating note ${noteId} for user ${userId}`);
    
    // Ensure we're not trying to update protected fields
    const safeUpdates = { ...updates };
    delete safeUpdates.id;
    delete safeUpdates.userId;
    delete safeUpdates.createdAt;
    
    // Convert camelCase keys from frontend to snake_case for database
    const snakeCaseUpdates = toSnakeCase(safeUpdates);
    
    // Handle special fields
    if (snakeCaseUpdates.tags) {
      snakeCaseUpdates.tags = JSON.stringify(snakeCaseUpdates.tags);
    }
    if (snakeCaseUpdates.isPinned !== undefined) {
      snakeCaseUpdates.is_pinned = snakeCaseUpdates.isPinned ? 1 : 0;
      delete snakeCaseUpdates.isPinned;
    }
    if (snakeCaseUpdates.isArchived !== undefined) {
      snakeCaseUpdates.is_archived = snakeCaseUpdates.isArchived ? 1 : 0;
      delete snakeCaseUpdates.isArchived;
    }
    
    logger.debug(`[NotesService] Safe update data (snake_case): ${JSON.stringify(snakeCaseUpdates)}`);
    
    const [updatedNote] = await db('notes')
      .where({ id: noteId, user_id: userId })
      .update(snakeCaseUpdates)
      .returning('*');
    
    if (!updatedNote) {
      logger.error(`[NotesService] No note found or updated with id ${noteId} for user ${userId}`);
      throw new Error(`Note not found or you don't have permission to update it`);
    }
    
    // Convert snake_case keys from database back to camelCase for frontend
    const camelCaseNote = toCamelCase(updatedNote);
    
    logger.debug(`[NotesService] Successfully updated note: ${JSON.stringify(camelCaseNote)}`);
    return camelCaseNote;
  } catch (error) {
    logger.error(`[NotesService] Error updating note ${noteId}: ${error.message}`);
    logger.error(`[NotesService] Error stack: ${error.stack}`);
    throw error;
  }
}

/**
 * Deletes a note from the database.
 * @param {string} noteId - The ID of the note to delete.
 * @param {string} userId - The ID of the user owning the note.
 * @returns {Promise<number>} The number of rows deleted.
 */
async function deleteNote(noteId, userId) {
  try {
    logger.info(`[NotesService] Deleting note ${noteId} for user ${userId}`);
    
    const deletedCount = await db('notes')
      .where({ id: noteId, user_id: userId })
      .del();
    
    if (deletedCount === 0) {
      logger.warn(`[NotesService] No note found to delete with id ${noteId} for user ${userId}`);
    } else {
      logger.info(`[NotesService] Successfully deleted note ${noteId}`);
    }
    
    return deletedCount;
  } catch (error) {
    logger.error(`[NotesService] Error deleting note ${noteId}: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createNote,
  getNotes,
  updateNote,
  deleteNote,
};

