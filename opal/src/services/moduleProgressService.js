const db = require('../config/database');
const logger = require('../logger');
const { toSnakeCase, toCamelCase } = require('../utils/caseConverter');

/**
 * Creates or updates module progress in the database.
 * @param {string} userId - The ID of the user.
 * @param {string} moduleId - The ID of the module.
 * @param {object} progressData - The module progress data.
 * @returns {Promise<object>} The saved module progress.
 */
async function saveModuleProgress(userId, moduleId, progressData) {
  try {
    logger.info(`[ModuleProgressService] Saving progress for module ${moduleId} for user ${userId}`);
    
    // Convert camelCase keys from frontend to snake_case for database
    const snakeCaseData = toSnakeCase(progressData);
    
    // Ensure entries is stored as JSON
    if (snakeCaseData.entries && typeof snakeCaseData.entries === 'object') {
      snakeCaseData.entries = JSON.stringify(snakeCaseData.entries);
    }
    
    // Check if progress already exists for this user and module
    const existingProgress = await db('module_progress')
      .where({ user_id: userId, module_id: moduleId })
      .first();
    
    let result;
    
    if (existingProgress) {
      // Update existing progress
      logger.info(`[ModuleProgressService] Updating existing progress for module ${moduleId}`);
      
      const dataToUpdate = {
        ...snakeCaseData,
        updated_at: new Date().toISOString()
      };
      
      const [updatedProgress] = await db('module_progress')
        .where({ user_id: userId, module_id: moduleId })
        .update(dataToUpdate)
        .returning('*');
      
      result = updatedProgress;
    } else {
      // Create new progress
      logger.info(`[ModuleProgressService] Creating new progress for module ${moduleId}`);
      
      const dataToInsert = {
        ...snakeCaseData,
        user_id: userId,
        module_id: moduleId,
        is_complete: snakeCaseData.is_complete || false,
        current_step: snakeCaseData.current_step || 0
      };
      
      const [newProgress] = await db('module_progress')
        .insert(dataToInsert)
        .returning('*');
      
      result = newProgress;
    }
    
    // Parse entries JSON back to object
    if (result.entries && typeof result.entries === 'string') {
      try {
        result.entries = JSON.parse(result.entries);
      } catch (e) {
        logger.error(`[ModuleProgressService] Error parsing entries JSON: ${e.message}`);
        result.entries = {};
      }
    }
    
    // Convert snake_case keys from database back to camelCase for frontend
    return toCamelCase(result);
  } catch (error) {
    logger.error(`[ModuleProgressService] Error saving progress: ${error.message}`);
    throw error;
  }
}

/**
 * Retrieves module progress for a specific module and user.
 * @param {string} userId - The ID of the user.
 * @param {string} moduleId - The ID of the module.
 * @returns {Promise<object|null>} The module progress or null if not found.
 */
async function getModuleProgressById(userId, moduleId) {
  try {
    logger.info(`[ModuleProgressService] Fetching progress for module ${moduleId} for user ${userId}`);
    
    const progress = await db('module_progress')
      .where({ user_id: userId, module_id: moduleId })
      .first();
    
    if (!progress) {
      logger.info(`[ModuleProgressService] No progress found for module ${moduleId}`);
      return null;
    }
    
    // Parse entries JSON to object
    if (progress.entries && typeof progress.entries === 'string') {
      try {
        progress.entries = JSON.parse(progress.entries);
      } catch (e) {
        logger.error(`[ModuleProgressService] Error parsing entries JSON: ${e.message}`);
        progress.entries = {};
      }
    }
    
    // Convert snake_case keys from database to camelCase for frontend
    return toCamelCase(progress);
  } catch (error) {
    logger.error(`[ModuleProgressService] Error fetching progress: ${error.message}`);
    throw error;
  }
}

/**
 * Retrieves all module progress for a specific user.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Array<object>>} A list of module progress with camelCase keys.
 */
async function getAllModuleProgress(userId) {
  try {
    logger.info(`[ModuleProgressService] Fetching all module progress for user ${userId}`);
    
    const progressList = await db('module_progress')
      .where({ user_id: userId })
      .orderBy('updated_at', 'desc');
    
    // Parse entries JSON to objects for each progress item
    const processedList = progressList.map(progress => {
      if (progress.entries && typeof progress.entries === 'string') {
        try {
          progress.entries = JSON.parse(progress.entries);
        } catch (e) {
          logger.error(`[ModuleProgressService] Error parsing entries JSON: ${e.message}`);
          progress.entries = {};
        }
      }
      return progress;
    });
    
    // Convert snake_case keys from database to camelCase for frontend
    return toCamelCase(processedList);
  } catch (error) {
    logger.error(`[ModuleProgressService] Error fetching all progress: ${error.message}`);
    throw error;
  }
}

/**
 * Deletes module progress from the database.
 * @param {string} userId - The ID of the user.
 * @param {string} moduleId - The ID of the module.
 * @returns {Promise<number>} The number of rows deleted.
 */
async function deleteModuleProgress(userId, moduleId) {
  try {
    logger.info(`[ModuleProgressService] Deleting progress for module ${moduleId} for user ${userId}`);
    
    const deletedCount = await db('module_progress')
      .where({ user_id: userId, module_id: moduleId })
      .del();
    
    if (deletedCount === 0) {
      logger.warn(`[ModuleProgressService] No progress found to delete for module ${moduleId}`);
    } else {
      logger.info(`[ModuleProgressService] Successfully deleted progress for module ${moduleId}`);
    }
    
    return deletedCount;
  } catch (error) {
    logger.error(`[ModuleProgressService] Error deleting progress: ${error.message}`);
    throw error;
  }
}

module.exports = {
  saveModuleProgress,
  getModuleProgressById,
  getAllModuleProgress,
  deleteModuleProgress
};
