/**
 * Service for managing identity profile history
 */
const db = require('../config/database');
const logger = require('../logger');

/**
 * Add a new entry to the identity profile history
 * @param {string} userId - The user ID
 * @param {Object} profileData - The complete profile data at this point in time
 * @param {string} sectionChanged - The section that was changed ('biographical', 'personality_profile', or 'all')
 * @param {string} changeDescription - Optional description of what changed
 * @returns {Promise<number>} - The ID of the new history entry
 */
async function addHistoryEntry(userId, profileData, sectionChanged, changeDescription = null) {
  try {
    logger.info(`[IdentityProfileHistoryService] Adding history entry for user ${userId}, section: ${sectionChanged}`);
    logger.debug(`[IdentityProfileHistoryService] User ID type before conversion: ${typeof userId}`);
    
    // Ensure userId is treated as string for consistency
    const stringUserId = String(userId);
    logger.debug(`[IdentityProfileHistoryService] User ID after conversion: ${stringUserId} (type: ${typeof stringUserId})`);
    
    // Log profile data details
    logger.debug(`[IdentityProfileHistoryService] Profile data type: ${typeof profileData}`);
    if (profileData) {
      logger.debug(`[IdentityProfileHistoryService] Profile data keys: ${Object.keys(profileData).join(', ')}`);
    } else {
      logger.error(`[IdentityProfileHistoryService] Profile data is null or undefined`);
      // Create a minimal valid profile data object to avoid errors
      profileData = { biographical: {}, personality_profile: {}, meta: {} };
    }
    
    // Ensure profileData is properly stringified
    let profileDataString;
    try {
      profileDataString = JSON.stringify(profileData);
      logger.debug(`[IdentityProfileHistoryService] Successfully stringified profile data, length: ${profileDataString.length}`);
      logger.debug(`[IdentityProfileHistoryService] First 100 chars of profile data: ${profileDataString.substring(0, 100)}...`);
    } catch (err) {
      logger.error(`[IdentityProfileHistoryService] Error stringifying profile data: ${err.message}`);
      logger.error(`[IdentityProfileHistoryService] Error stack: ${err.stack}`);
      profileDataString = JSON.stringify({});
      logger.debug(`[IdentityProfileHistoryService] Using empty object as fallback`);
    }
    
    const historyEntry = {
      user_id: stringUserId,
      profile_data: profileDataString,
      section_changed: sectionChanged,
      change_description: changeDescription,
      created_at: new Date()
    };
    
    logger.debug(`[IdentityProfileHistoryService] Inserting history entry: ${JSON.stringify({
      user_id: historyEntry.user_id,
      section_changed: historyEntry.section_changed,
      change_description: historyEntry.change_description,
      created_at: historyEntry.created_at,
      profile_data_length: historyEntry.profile_data ? historyEntry.profile_data.length : 0
    })}`);
    
    // Check if the database is initialized
    try {
      const tableExists = await db.schema.hasTable('identity_profile_history');
      logger.debug(`[IdentityProfileHistoryService] identity_profile_history table exists: ${tableExists}`);
      
      if (!tableExists) {
        logger.error(`[IdentityProfileHistoryService] identity_profile_history table does not exist!`);
        throw new Error('identity_profile_history table does not exist');
      }
      
      // Log the table schema
      const tableInfo = await db.raw('PRAGMA table_info(identity_profile_history)');
      logger.debug(`[IdentityProfileHistoryService] Table schema: ${JSON.stringify(tableInfo)}`);
      
      // Try to insert the history entry
      logger.debug(`[IdentityProfileHistoryService] Attempting to insert history entry...`);
      const [id] = await db('identity_profile_history').insert(historyEntry);
      logger.info(`[IdentityProfileHistoryService] Successfully added history entry ${id} for user ${stringUserId}`);
      
      // Verify the entry was added
      const insertedEntry = await db('identity_profile_history').where('id', id).first();
      if (insertedEntry) {
        logger.info(`[IdentityProfileHistoryService] Verified history entry ${id} was inserted successfully`);
      } else {
        logger.warn(`[IdentityProfileHistoryService] Could not verify history entry ${id} was inserted`);
      }
      
      return id;
    } catch (dbError) {
      logger.error(`[IdentityProfileHistoryService] Database error adding history entry: ${dbError.message}`);
      logger.error(`[IdentityProfileHistoryService] Database error stack: ${dbError.stack}`);
      
      // Try to get more information about the database state
      try {
        const dbVersion = await db.raw('SELECT sqlite_version()');
        logger.debug(`[IdentityProfileHistoryService] SQLite version: ${JSON.stringify(dbVersion)}`);
      } catch (versionError) {
        logger.error(`[IdentityProfileHistoryService] Error getting SQLite version: ${versionError.message}`);
      }
      
      throw dbError;
    }
  } catch (error) {
    logger.error(`[IdentityProfileHistoryService] Error adding history entry: ${error.message}`);
    logger.error(`[IdentityProfileHistoryService] Error stack: ${error.stack}`);
    throw error;
  }
}

/**
 * Get the history of changes for a user's identity profile
 * @param {string} userId - The user ID
 * @param {number} limit - Maximum number of history entries to return
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Array>} - Array of history entries
 */
async function getProfileHistory(userId, limit = 10, offset = 0) {
  try {
    logger.info(`[IdentityProfileHistoryService] Getting profile history for user ${userId}, limit: ${limit}, offset: ${offset}`);
    logger.debug(`[IdentityProfileHistoryService] User ID type before conversion: ${typeof userId}`);
    
    // Ensure userId is treated as string for consistency
    const stringUserId = String(userId);
    logger.debug(`[IdentityProfileHistoryService] User ID after conversion: ${stringUserId} (type: ${typeof stringUserId})`);
    
    logger.debug(`[IdentityProfileHistoryService] Executing query: SELECT id, section_changed, change_description, created_at FROM identity_profile_history WHERE user_id = '${stringUserId}' ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`);
    
    try {
      const history = await db('identity_profile_history')
        .where('user_id', stringUserId)
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset)
        .select('id', 'section_changed', 'change_description', 'created_at');
      
      logger.info(`[IdentityProfileHistoryService] Found ${history.length} history entries`);
      logger.debug(`[IdentityProfileHistoryService] History entries: ${JSON.stringify(history)}`);
      
      if (history.length === 0) {
        logger.warn(`[IdentityProfileHistoryService] No history entries found for user ${stringUserId}`);
      }
      
      return history;
    } catch (dbError) {
      logger.error(`[IdentityProfileHistoryService] Database error getting profile history: ${dbError.message}`);
      logger.error(`[IdentityProfileHistoryService] Database error stack: ${dbError.stack}`);
      throw dbError;
    }
  } catch (error) {
    logger.error(`[IdentityProfileHistoryService] Error getting profile history: ${error.message}`);
    return [];
  }
}

/**
 * Get the total count of history entries for a user's identity profile
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} - Array with count object
 */
async function getProfileHistoryCount(userId) {
  try {
    logger.info(`[IdentityProfileHistoryService] Getting profile history count for user ${userId}`);
    logger.debug(`[IdentityProfileHistoryService] User ID type before conversion: ${typeof userId}`);
    
    // Ensure userId is treated as string for consistency
    const stringUserId = String(userId);
    logger.debug(`[IdentityProfileHistoryService] User ID after conversion: ${stringUserId} (type: ${typeof stringUserId})`);
    
    logger.debug(`[IdentityProfileHistoryService] Executing query: SELECT COUNT(id) as count FROM identity_profile_history WHERE user_id = '${stringUserId}'`);
    
    try {
      const result = await db('identity_profile_history')
        .where('user_id', stringUserId)
        .count('id as count');
      
      const count = result[0]?.count || 0;
      logger.info(`[IdentityProfileHistoryService] Profile history count: ${count}`);
      logger.debug(`[IdentityProfileHistoryService] Count result: ${JSON.stringify(result)}`);
      
      return result;
    } catch (dbError) {
      logger.error(`[IdentityProfileHistoryService] Database error getting profile history count: ${dbError.message}`);
      logger.error(`[IdentityProfileHistoryService] Database error stack: ${dbError.stack}`);
      throw dbError;
    }
  } catch (error) {
    logger.error(`[IdentityProfileHistoryService] Error getting profile history count: ${error.message}`);
    return [{ count: 0 }];
  }
}

/**
 * Get a specific version of the profile from history
 * @param {string} userId - The user ID
 * @param {number} historyId - The history entry ID
 * @returns {Promise<Object|null>} - The profile data at that point in time, or null if not found
 */
async function getProfileVersion(userId, historyId) {
  try {
    logger.info(`[IdentityProfileHistoryService] Getting profile version ${historyId} for user ${userId}`);
    logger.debug(`[IdentityProfileHistoryService] User ID type before conversion: ${typeof userId}`);
    logger.debug(`[IdentityProfileHistoryService] History ID type: ${typeof historyId}`);
    
    // Ensure userId is treated as string for consistency
    const stringUserId = String(userId);
    logger.debug(`[IdentityProfileHistoryService] User ID after conversion: ${stringUserId} (type: ${typeof stringUserId})`);
    
    logger.debug(`[IdentityProfileHistoryService] Executing query: SELECT profile_data FROM identity_profile_history WHERE user_id = '${stringUserId}' AND id = ${historyId}`);
    
    try {
      const entry = await db('identity_profile_history')
        .where({
          'user_id': stringUserId,
          'id': historyId
        })
        .first('profile_data');
      
      if (!entry) {
        logger.warn(`[IdentityProfileHistoryService] Profile version ${historyId} not found for user ${stringUserId}`);
        return null;
      }
      
      logger.debug(`[IdentityProfileHistoryService] Found profile data entry, type: ${typeof entry.profile_data}, length: ${entry.profile_data?.length || 0}`);
      
      try {
        const profileData = JSON.parse(entry.profile_data);
        logger.info(`[IdentityProfileHistoryService] Successfully parsed profile version ${historyId}`);
        logger.debug(`[IdentityProfileHistoryService] Profile data keys: ${Object.keys(profileData).join(', ')}`);
        return profileData;
      } catch (parseError) {
        logger.error(`[IdentityProfileHistoryService] Error parsing profile data: ${parseError.message}`);
        logger.error(`[IdentityProfileHistoryService] Error stack: ${parseError.stack}`);
        logger.debug(`[IdentityProfileHistoryService] Raw profile data that failed to parse: ${entry.profile_data?.substring(0, 100)}...`);
        return null;
      }
    } catch (dbError) {
      logger.error(`[IdentityProfileHistoryService] Database error getting profile version: ${dbError.message}`);
      logger.error(`[IdentityProfileHistoryService] Database error stack: ${dbError.stack}`);
      throw dbError;
    }
  } catch (error) {
    logger.error(`[IdentityProfileHistoryService] Error getting profile version: ${error.message}`);
    return null;
  }
}

/**
 * Compare two versions of a profile and generate a diff summary
 * @param {number} historyId1 - The first history entry ID
 * @param {number} historyId2 - The second history entry ID
 * @returns {Promise<Object>} - Summary of differences between versions
 */
async function compareVersions(historyId1, historyId2) {
  try {
    logger.info(`[IdentityProfileHistoryService] Comparing profile versions ${historyId1} and ${historyId2}`);
    logger.debug(`[IdentityProfileHistoryService] History ID types: ${typeof historyId1}, ${typeof historyId2}`);
    
    // Get both history entries
    logger.debug(`[IdentityProfileHistoryService] Executing queries to fetch both history entries`);
    
    try {
      const [entry1, entry2] = await Promise.all([
        db('identity_profile_history').where('id', historyId1).first('profile_data', 'created_at'),
        db('identity_profile_history').where('id', historyId2).first('profile_data', 'created_at')
      ]);
      
      logger.debug(`[IdentityProfileHistoryService] Entry 1 found: ${!!entry1}, Entry 2 found: ${!!entry2}`);
      
      if (!entry1 || !entry2) {
        logger.error(`[IdentityProfileHistoryService] One or both history entries not found: ${!entry1 ? historyId1 : ''} ${!entry2 ? historyId2 : ''}`);
        throw new Error('One or both history entries not found');
      }
      
      logger.debug(`[IdentityProfileHistoryService] Entry 1 created at: ${entry1.created_at}, Entry 2 created at: ${entry2.created_at}`);
      logger.debug(`[IdentityProfileHistoryService] Entry 1 data type: ${typeof entry1.profile_data}, Entry 2 data type: ${typeof entry2.profile_data}`);
      logger.debug(`[IdentityProfileHistoryService] Entry 1 data length: ${entry1.profile_data?.length || 0}, Entry 2 data length: ${entry2.profile_data?.length || 0}`);
    } catch (dbError) {
      logger.error(`[IdentityProfileHistoryService] Database error fetching history entries: ${dbError.message}`);
      logger.error(`[IdentityProfileHistoryService] Database error stack: ${dbError.stack}`);
      throw dbError;
    }
    
    let profile1, profile2;
    
    try {
      profile1 = JSON.parse(entry1.profile_data);
      profile2 = JSON.parse(entry2.profile_data);
    } catch (parseError) {
      logger.error(`[IdentityProfileHistoryService] Error parsing profile data: ${parseError.message}`);
      throw new Error(`Error parsing profile data: ${parseError.message}`);
    }
    
    // Generate a simple diff summary
    const changes = {
      biographical: {},
      personality_profile: {},
      meta: {}
    };
    
    // Compare biographical changes
    Object.keys(profile1.biographical || {}).forEach(key => {
      try {
        if (JSON.stringify(profile1.biographical[key]) !== JSON.stringify(profile2.biographical[key])) {
          changes.biographical[key] = {
            from: profile1.biographical[key],
            to: profile2.biographical[key]
          };
        }
      } catch (error) {
        logger.warn(`[IdentityProfileHistoryService] Error comparing biographical.${key}: ${error.message}`);
      }
    });
    
    // Compare personality profile changes (top level)
    Object.keys(profile1.personality_profile || {}).forEach(key => {
      try {
        if (typeof profile1.personality_profile[key] === 'object' && 
            profile1.personality_profile[key] !== null) {
          
          // For nested objects, compare each field
          const nestedChanges = {};
          Object.keys(profile1.personality_profile[key] || {}).forEach(nestedKey => {
            try {
              if (JSON.stringify(profile1.personality_profile[key][nestedKey]) !== 
                  JSON.stringify(profile2.personality_profile[key][nestedKey])) {
                nestedChanges[nestedKey] = {
                  from: profile1.personality_profile[key][nestedKey],
                  to: profile2.personality_profile[key][nestedKey]
                };
              }
            } catch (nestedError) {
              logger.warn(`[IdentityProfileHistoryService] Error comparing personality_profile.${key}.${nestedKey}: ${nestedError.message}`);
            }
          });
          
          if (Object.keys(nestedChanges).length > 0) {
            changes.personality_profile[key] = nestedChanges;
          }
        } else if (JSON.stringify(profile1.personality_profile[key]) !== 
                   JSON.stringify(profile2.personality_profile[key])) {
          changes.personality_profile[key] = {
            from: profile1.personality_profile[key],
            to: profile2.personality_profile[key]
          };
        }
      } catch (error) {
        logger.warn(`[IdentityProfileHistoryService] Error comparing personality_profile.${key}: ${error.message}`);
      }
    });
    
    // Compare meta changes
    Object.keys(profile1.meta || {}).forEach(key => {
      try {
        if (JSON.stringify(profile1.meta[key]) !== JSON.stringify(profile2.meta[key])) {
          changes.meta[key] = {
            from: profile1.meta[key],
            to: profile2.meta[key]
          };
        }
      } catch (error) {
        logger.warn(`[IdentityProfileHistoryService] Error comparing meta.${key}: ${error.message}`);
      }
    });
    
    logger.info(`[IdentityProfileHistoryService] Successfully compared versions ${historyId1} and ${historyId2}`);
    
    return {
      historyId1,
      historyId2,
      date1: entry1.created_at,
      date2: entry2.created_at,
      changes
    };
  } catch (error) {
    logger.error(`[IdentityProfileHistoryService] Error comparing versions: ${error.message}`);
    throw error;
  }
}

module.exports = {
  addHistoryEntry,
  getProfileHistory,
  getProfileHistoryCount,
  getProfileVersion,
  compareVersions
};
