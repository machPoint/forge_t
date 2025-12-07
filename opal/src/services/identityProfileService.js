const db = require('../config/database');
const logger = require('../logger');
const { toSnakeCase } = require('../utils/caseConverter');
const historyService = require('./identityProfileHistoryService');

/**
 * Creates or updates identity profile in the database.
 * @param {string} userId - The ID of the user.
 * @param {object} profileData - The identity profile data.
 * @param {string} sectionChanged - The section that was changed ('biographical', 'personality_profile', or 'all')
 * @param {string} changeDescription - Optional description of what changed
 * @returns {Promise<object>} The saved identity profile.
 */
async function saveIdentityProfile(userId, profileData, sectionChanged = 'all', changeDescription = null) {
  try {
    logger.info(`[IdentityProfileService] Saving identity profile for user ${userId}`);
    logger.info(`[IdentityProfileService] Section changed: ${sectionChanged}, Change description: ${changeDescription}`);
    logger.debug(`[IdentityProfileService] User ID type: ${typeof userId}`);
    logger.debug(`[IdentityProfileService] Profile data type: ${typeof profileData}`);
    logger.debug(`[IdentityProfileService] Profile data keys: ${Object.keys(profileData).join(', ')}`);
    
    // Log the structure of each section
    if (profileData.biographical) {
      logger.debug(`[IdentityProfileService] Biographical keys: ${Object.keys(profileData.biographical).join(', ')}`);
    } else {
      logger.warn(`[IdentityProfileService] Biographical section is missing`);
    }
    
    if (profileData.personality_profile) {
      logger.debug(`[IdentityProfileService] Personality profile keys: ${Object.keys(profileData.personality_profile).join(', ')}`);
    } else {
      logger.warn(`[IdentityProfileService] Personality profile section is missing`);
    }
    
    if (profileData.meta) {
      logger.debug(`[IdentityProfileService] Meta keys: ${Object.keys(profileData.meta).join(', ')}`);
    } else {
      logger.warn(`[IdentityProfileService] Meta section is missing`);
    }
    
    // Ensure profileData has all required fields with proper structure
    const safeProfileData = {
      ...profileData,
      biographical: profileData.biographical || {
        name: '',
        preferred_name: '',
        pronouns: '',
        age: null,
        location: '',
        cultural_background: '',
        spiritual_orientation: '',
        education_level: '',
        occupation: '',
        identity_labels: []
      },
      personality_profile: profileData.personality_profile || {
        big_five: {
          openness: null,
          conscientiousness: null,
          extraversion: null,
          agreeableness: null,
          neuroticism: null
        },
        cognitive_style: {
          thinking_mode: null,
          decision_making: null,
          response_tendency: null
        },
        emotional_regulation: {
          expression: null,
          coping_style: null,
          volatility: null
        },
        attachment_style: null,
        locus_of_control: null,
        motivational_orientation: [],
        self_concept: {
          self_esteem: null,
          identity_coherence: null,
          core_narratives: []
        }
      },
      meta: profileData.meta || {
        confidence_levels: {
          big_five: null,
          attachment_style: null,
          motivational_orientation: null
        },
        inference_sources: [],
        last_updated: new Date().toISOString()
      }
    };
    
    // Convert camelCase keys from frontend to snake_case for database
    logger.debug(`[IdentityProfileService] Before snake case conversion: ${JSON.stringify(safeProfileData)}`);
    const snakeCaseData = toSnakeCase(safeProfileData);
    logger.debug(`[IdentityProfileService] After snake case conversion: ${JSON.stringify(snakeCaseData)}`);
    
    // Ensure JSON fields are stored as valid JSON strings
    ['biographical', 'personality_profile', 'meta'].forEach(field => {
      try {
        if (snakeCaseData[field]) {
          if (typeof snakeCaseData[field] === 'object') {
            snakeCaseData[field] = JSON.stringify(snakeCaseData[field]);
            logger.info(`[IdentityProfileService] Successfully stringified ${field} JSON`);
          } else if (typeof snakeCaseData[field] === 'string') {
            // Try parsing and re-stringifying to ensure valid JSON
            const parsed = JSON.parse(snakeCaseData[field]);
            snakeCaseData[field] = JSON.stringify(parsed);
            logger.info(`[IdentityProfileService] Re-stringified existing ${field} JSON string`);
          }
        } else {
          logger.warn(`[IdentityProfileService] ${field} is missing from profile data`);
        }
      } catch (e) {
        logger.error(`[IdentityProfileService] Error processing ${field} JSON: ${e.message}`);
        // Set a default empty object if there's an error
        snakeCaseData[field] = JSON.stringify({});
      }
    });
    
    // Check if profile already exists for this user
    logger.debug(`[IdentityProfileService] Checking if profile exists for user ${userId}`);
    const existingProfile = await db('identity_profile')
      .where({ user_id: userId })
      .first();
    logger.debug(`[IdentityProfileService] Existing profile found: ${existingProfile ? 'Yes' : 'No'}`);
    if (existingProfile) {
      logger.debug(`[IdentityProfileService] Existing profile data: ${JSON.stringify(existingProfile)}`);
    }
    
    let result;
    
    if (existingProfile) {
      // Update existing profile
      logger.info(`[IdentityProfileService] Updating existing identity profile for user ${userId}`);
      logger.debug(`[IdentityProfileService] Update operation with data: ${JSON.stringify(snakeCaseData)}`);
      
      // Update the last_updated timestamp in meta
      try {
        let meta;
        if (typeof snakeCaseData.meta === 'string') {
          meta = JSON.parse(snakeCaseData.meta);
        } else if (typeof snakeCaseData.meta === 'object') {
          meta = snakeCaseData.meta;
        } else {
          meta = {};
        }
        
        meta.last_updated = new Date().toISOString();
        snakeCaseData.meta = JSON.stringify(meta);
        logger.info(`[IdentityProfileService] Updated meta.last_updated timestamp`);
      } catch (e) {
        logger.error(`[IdentityProfileService] Error updating meta.last_updated: ${e.message}`);
        // Create a default meta object if there's an error
        snakeCaseData.meta = JSON.stringify({
          confidence_levels: {
            big_five: null,
            attachment_style: null,
            motivational_orientation: null
          },
          inference_sources: [],
          last_updated: new Date().toISOString()
        });
      }
      
      const dataToUpdate = {
        ...snakeCaseData,
        updated_at: new Date().toISOString()
      };
      
      logger.info(`[IdentityProfileService] Updating with data: ${JSON.stringify(dataToUpdate)}`);
      
      try {
        // Update the profile
        // Update the individual columns with their JSON string values
        logger.debug(`[IdentityProfileService] Updating individual columns with JSON strings`);
        
        result = await db('identity_profile')
          .where({ user_id: userId })
          .update({
            biographical: snakeCaseData.biographical,
            personality_profile: snakeCaseData.personality_profile,
            meta: snakeCaseData.meta,
            updated_at: db.fn.now()
          })
          .returning('*');
        logger.debug(`[IdentityProfileService] Update result: ${JSON.stringify(result)}`);
      } catch (dbError) {
        logger.error(`[IdentityProfileService] Database update error: ${dbError.message}`);
        logger.error(`[IdentityProfileService] Database update error stack: ${dbError.stack}`);
        throw dbError;
      }
    } else {
      // Create new profile
      logger.info(`[IdentityProfileService] Creating new identity profile for user ${userId}`);
      logger.debug(`[IdentityProfileService] Insert operation with data: ${JSON.stringify({
        user_id: userId,
        biographical: snakeCaseData.biographical,
        personality_profile: snakeCaseData.personality_profile,
        meta: snakeCaseData.meta
      })}`);
      
      try {
        // Insert the individual columns with their JSON string values
        logger.debug(`[IdentityProfileService] Inserting individual columns with JSON strings`);
        
        result = await db('identity_profile')
          .insert({
            user_id: userId,
            biographical: snakeCaseData.biographical,
            personality_profile: snakeCaseData.personality_profile,
            meta: snakeCaseData.meta
          })
          .returning('*');
        logger.debug(`[IdentityProfileService] Insert result: ${JSON.stringify(result)}`);
      } catch (dbError) {
        logger.error(`[IdentityProfileService] Database insert error: ${dbError.message}`);
        logger.error(`[IdentityProfileService] Database insert error stack: ${dbError.stack}`);
        logger.error(`[IdentityProfileService] Insert data that caused error: ${JSON.stringify({
          user_id: userId,
          profile_data: 'JSON string containing the complete profile'
        })}`);        
        logger.error(`[IdentityProfileService] Profile data structure: biographical: ${typeof snakeCaseData.biographical}, personality_profile: ${typeof snakeCaseData.personality_profile}, meta: ${typeof snakeCaseData.meta}`);
        throw dbError;
      }
    }
    
    // Add entry to history
    logger.info(`[IdentityProfileService] Recording history entry for user ${userId}, section: ${sectionChanged}`);
    try {
      await historyService.addHistoryEntry(userId, profileData, sectionChanged, changeDescription);
      logger.info(`[IdentityProfileService] Successfully recorded history entry`);
    } catch (historyError) {
      logger.error(`[IdentityProfileService] Error recording history: ${historyError.message}`);
      logger.error(`[IdentityProfileService] History error stack: ${historyError.stack}`);
      // Continue despite history error - don't fail the main operation
    }
    
    // Parse JSON fields back to objects
    ['biographical', 'personality_profile', 'meta'].forEach(field => {
      if (result[field] && typeof result[field] === 'string') {
        try {
          result[field] = JSON.parse(result[field]);
        } catch (e) {
          logger.error(`[IdentityProfileService] Error parsing ${field} JSON: ${e.message}`);
          result[field] = {};
        }
      }
    });
    
    return result;
  } catch (error) {
    logger.error(`[IdentityProfileService] Error saving identity profile: ${error.message}`);
    logger.error(`[IdentityProfileService] Error stack: ${error.stack}`);
    throw error;
  }
}

/**
 * Helper function to convert snake_case to camelCase recursively
 * @param {any} obj - Object to convert
 * @returns {any} Converted object with camelCase keys
 */
function toCamelCase(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays - recursively convert each item
  if (Array.isArray(obj)) {
    return obj.map(item => toCamelCase(item));
  }

  const result = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = key.replace(/(_\w)/g, m => m[1].toUpperCase());
      // Recursively convert nested objects
      result[camelKey] = toCamelCase(obj[key]);
    }
  }
  return result;
}

/**
 * Retrieves identity profile for a specific user.
 * @param {string} userId - The ID of the user.
 * @param {boolean} forceRefresh - If true, bypasses any caching and forces a fresh database query
 * @returns {Promise<object|null>} The identity profile or null if not found.
 */
async function getIdentityProfile(userId, forceRefresh = false) {
  try {
    logger.info(`[IdentityProfileService] Getting identity profile for user ${userId}`);
    logger.debug(`[IdentityProfileService] User ID type: ${typeof userId}`);
    logger.debug(`[IdentityProfileService] User ID value: ${JSON.stringify(userId)}`);
    
    // Ensure userId is treated as string for consistency
    const stringUserId = String(userId);
    logger.debug(`[IdentityProfileService] User ID after conversion: ${stringUserId} (type: ${typeof stringUserId})`);
    
    // Check if the database is initialized
    try {
      logger.debug(`[IdentityProfileService] Checking database connection status...`);
      const testQuery = await db.raw('SELECT 1+1 as result');
      logger.debug(`[IdentityProfileService] Database connection test result: ${JSON.stringify(testQuery)}`);
      
      const tableExists = await db.schema.hasTable('identity_profile');
      logger.debug(`[IdentityProfileService] identity_profile table exists: ${tableExists}`);
      
      if (!tableExists) {
        logger.error(`[IdentityProfileService] identity_profile table does not exist!`);
        throw new Error('identity_profile table does not exist');
      }
      
      // Log the table schema
      const tableInfo = await db.raw('PRAGMA table_info(identity_profile)');
      logger.debug(`[IdentityProfileService] Table schema: ${JSON.stringify(tableInfo)}`);
      
      // Count total profiles in the database for debugging
      const totalProfiles = await db('identity_profile').count('* as count').first();
      logger.debug(`[IdentityProfileService] Total profiles in database: ${JSON.stringify(totalProfiles)}`);
      
      // List all user_ids in the database for debugging
      const allUserIds = await db('identity_profile').select('user_id');
      logger.debug(`[IdentityProfileService] All user_ids in database: ${JSON.stringify(allUserIds)}`);
    } catch (dbError) {
      logger.error(`[IdentityProfileService] Database error checking table: ${dbError.message}`);
      logger.error(`[IdentityProfileService] Database error stack: ${dbError.stack}`);
      throw dbError;
    }
    
    // Try to get the profile with explicit string conversion for user_id
    let profile;
    try {
      // First log the raw query we're about to execute
      const query = db('identity_profile').where({ user_id: stringUserId }).toString();
      logger.debug(`[IdentityProfileService] Executing query: ${query}`);
      
      profile = await db('identity_profile')
        .where({ user_id: stringUserId })
        .first();
      
      logger.debug(`[IdentityProfileService] Raw profile from database: ${profile ? 'Found' : 'Not found'}`);
      if (profile) {
        logger.debug(`[IdentityProfileService] Profile keys: ${Object.keys(profile).join(', ')}`);
        logger.debug(`[IdentityProfileService] Profile user_id: ${profile.user_id}`);
        logger.debug(`[IdentityProfileService] Profile id: ${profile.id}`);
      } else {
        // Try a less strict query to find similar user IDs
        logger.debug(`[IdentityProfileService] Profile not found, trying case-insensitive search...`);
        const similarProfiles = await db('identity_profile')
          .whereRaw('LOWER(user_id) = LOWER(?)', [stringUserId])
          .select('user_id', 'id');
        
        if (similarProfiles && similarProfiles.length > 0) {
          logger.debug(`[IdentityProfileService] Found similar user_ids: ${JSON.stringify(similarProfiles)}`);
        } else {
          logger.debug(`[IdentityProfileService] No similar user_ids found.`);
        }
      }
    } catch (queryError) {
      logger.error(`[IdentityProfileService] Error querying profile: ${queryError.message}`);
      logger.error(`[IdentityProfileService] Query error stack: ${queryError.stack}`);
      throw queryError;
    }
    
    if (!profile) {
      logger.info(`[IdentityProfileService] No identity profile found for user ${stringUserId}`);
      return null;
    }
    
    // Create a safe copy of the profile to avoid modifying the original
    const safeProfile = { ...profile };
    logger.debug(`[IdentityProfileService] Safe profile keys: ${Object.keys(safeProfile).join(', ')}`);
    
    // The individual fields are already in the database, but may be stored as JSON strings
    // Make sure we have default values and proper parsing for each field
    
    // Initialize default objects for missing fields
    if (!safeProfile.biographical) {
      logger.warn(`[IdentityProfileService] biographical field is missing or empty`);
      safeProfile.biographical = {};
    }
    
    if (!safeProfile.personality_profile) {
      logger.warn(`[IdentityProfileService] personality_profile field is missing or empty`);
      safeProfile.personality_profile = {};
    }
    
    if (!safeProfile.meta) {
      logger.warn(`[IdentityProfileService] meta field is missing or empty`);
      safeProfile.meta = {};
    }
    
    // Parse each field if it's a string (JSON)
    ['biographical', 'personality_profile', 'meta'].forEach(field => {
      try {
        logger.debug(`[IdentityProfileService] Processing field ${field}, type: ${typeof safeProfile[field]}`);
        
        if (safeProfile[field]) {
          if (typeof safeProfile[field] === 'string') {
            try {
              // Log the raw JSON string before parsing
              logger.debug(`[IdentityProfileService] Raw ${field} JSON (first 100 chars): ${safeProfile[field].substring(0, 100)}...`);
              
              safeProfile[field] = JSON.parse(safeProfile[field]);
              logger.info(`[IdentityProfileService] Successfully parsed ${field} JSON`);
              logger.debug(`[IdentityProfileService] Parsed ${field} keys: ${Object.keys(safeProfile[field]).join(', ')}`);
            } catch (parseError) {
              logger.error(`[IdentityProfileService] Error parsing ${field} JSON: ${parseError.message}`);
              logger.error(`[IdentityProfileService] Raw ${field} content causing error: ${safeProfile[field]}`);
              
              // Set default empty objects based on field type
              if (field === 'biographical') {
                safeProfile[field] = {
                  name: '',
                  preferred_name: '',
                  pronouns: '',
                  age: null,
                  location: '',
                  cultural_background: '',
                  spiritual_orientation: '',
                  education_level: '',
                  occupation: '',
                  identity_labels: []
                };
              } else if (field === 'personality_profile') {
                safeProfile[field] = {
                  big_five: {
                    openness: null,
                    conscientiousness: null,
                    extraversion: null,
                    agreeableness: null,
                    neuroticism: null
                  },
                  cognitive_style: {
                    thinking_mode: null,
                    decision_making: null,
                    response_tendency: null
                  },
                  emotional_regulation: {
                    expression: null,
                    coping_style: null,
                    volatility: null
                  },
                  attachment_style: null,
                  locus_of_control: null,
                  motivational_orientation: [],
                  self_concept: {
                    self_esteem: null,
                    identity_coherence: null,
                    core_narratives: []
                  }
                };
              } else if (field === 'meta') {
                safeProfile[field] = {
                  confidence_levels: {
                    big_five: null,
                    attachment_style: null,
                    motivational_orientation: null
                  },
                  inference_sources: [],
                  last_updated: new Date().toISOString()
                };
              }
            }
          } else if (typeof safeProfile[field] === 'object') {
            logger.debug(`[IdentityProfileService] Field ${field} is already an object, no parsing needed`);
          } else {
            logger.warn(`[IdentityProfileService] Field ${field} is not a string or object (type: ${typeof safeProfile[field]}), setting to empty object`);
            safeProfile[field] = {};
          }
        } else {
          logger.warn(`[IdentityProfileService] ${field} is missing from profile`);
          // Set default empty objects for missing fields
          if (field === 'biographical') {
            safeProfile[field] = {
              name: '',
              preferred_name: '',
              pronouns: '',
              age: null,
              location: '',
              cultural_background: '',
              spiritual_orientation: '',
              education_level: '',
              occupation: '',
              identity_labels: []
            };
          } else if (field === 'personality_profile') {
            safeProfile[field] = {
              big_five: {
                openness: null,
                conscientiousness: null,
                extraversion: null,
                agreeableness: null,
                neuroticism: null
              },
              cognitive_style: {
                thinking_mode: null,
                decision_making: null,
                response_tendency: null
              },
              emotional_regulation: {
                expression: null,
                coping_style: null,
                volatility: null
              },
              attachment_style: null,
              locus_of_control: null,
              motivational_orientation: [],
              self_concept: {
                self_esteem: null,
                identity_coherence: null,
                core_narratives: []
              }
            };
          } else if (field === 'meta') {
            safeProfile[field] = {
              confidence_levels: {
                big_five: null,
                attachment_style: null,
                motivational_orientation: null
              },
              inference_sources: [],
              last_updated: new Date().toISOString()
            };
          }
        }
      } catch (fieldError) {
        logger.error(`[IdentityProfileService] Unexpected error processing field ${field}: ${fieldError.message}`);
        logger.error(`[IdentityProfileService] Field error stack: ${fieldError.stack}`);
      }
    });
    
    try {
      // No profile_data field to remove
      
      // Convert snake_case keys from database to camelCase for frontend
      logger.debug(`[IdentityProfileService] Before camelCase conversion, profile has keys: ${Object.keys(safeProfile).join(', ')}`);
      logger.debug(`[IdentityProfileService] biographical type: ${typeof safeProfile.biographical}, personality_profile type: ${typeof safeProfile.personality_profile}, meta type: ${typeof safeProfile.meta}`);
      
      // Ensure all fields are objects before conversion
      if (typeof safeProfile.biographical === 'string') {
        try {
          safeProfile.biographical = JSON.parse(safeProfile.biographical);
          logger.debug(`[IdentityProfileService] Parsed biographical from string to object`);
        } catch (e) {
          logger.error(`[IdentityProfileService] Failed to parse biographical: ${e.message}`);
        }
      }
      
      if (typeof safeProfile.personality_profile === 'string') {
        try {
          safeProfile.personality_profile = JSON.parse(safeProfile.personality_profile);
          logger.debug(`[IdentityProfileService] Parsed personality_profile from string to object`);
        } catch (e) {
          logger.error(`[IdentityProfileService] Failed to parse personality_profile: ${e.message}`);
        }
      }
      
      if (typeof safeProfile.meta === 'string') {
        try {
          safeProfile.meta = JSON.parse(safeProfile.meta);
          logger.debug(`[IdentityProfileService] Parsed meta from string to object`);
        } catch (e) {
          logger.error(`[IdentityProfileService] Failed to parse meta: ${e.message}`);
        }
      }
      
      // Apply recursive camelCase conversion to the entire profile
      const camelCaseProfile = toCamelCase(safeProfile);
      logger.debug(`[IdentityProfileService] After camelCase conversion, profile has keys: ${Object.keys(camelCaseProfile).join(', ')}`);
      
      // Double-check critical fields to ensure they were properly converted
      if (!camelCaseProfile.personalityProfile && camelCaseProfile.personality_profile) {
        logger.warn(`[IdentityProfileService] camelCase conversion failed for personality_profile, manually fixing`);
        camelCaseProfile.personalityProfile = toCamelCase(camelCaseProfile.personality_profile);
        delete camelCaseProfile.personality_profile;
      }
      
      // Log the structure of the personalityProfile to verify conversion
      if (camelCaseProfile.personalityProfile) {
        logger.debug(`[IdentityProfileService] personalityProfile keys: ${Object.keys(camelCaseProfile.personalityProfile).join(', ')}`);
        
        // Check if bigFive was correctly converted from big_five
        if (camelCaseProfile.personalityProfile.big_five && !camelCaseProfile.personalityProfile.bigFive) {
          logger.warn(`[IdentityProfileService] camelCase conversion failed for big_five, manually fixing`);
          camelCaseProfile.personalityProfile.bigFive = toCamelCase(camelCaseProfile.personalityProfile.big_five);
          delete camelCaseProfile.personalityProfile.big_five;
        }
        
        // Check other nested objects
        if (camelCaseProfile.personalityProfile.cognitive_style && !camelCaseProfile.personalityProfile.cognitiveStyle) {
          logger.warn(`[IdentityProfileService] camelCase conversion failed for cognitive_style, manually fixing`);
          camelCaseProfile.personalityProfile.cognitiveStyle = toCamelCase(camelCaseProfile.personalityProfile.cognitive_style);
          delete camelCaseProfile.personalityProfile.cognitive_style;
        }
        
        if (camelCaseProfile.personalityProfile.emotional_regulation && !camelCaseProfile.personalityProfile.emotionalRegulation) {
          logger.warn(`[IdentityProfileService] camelCase conversion failed for emotional_regulation, manually fixing`);
          camelCaseProfile.personalityProfile.emotionalRegulation = toCamelCase(camelCaseProfile.personalityProfile.emotional_regulation);
          delete camelCaseProfile.personalityProfile.emotional_regulation;
        }
        
        if (camelCaseProfile.personalityProfile.self_concept && !camelCaseProfile.personalityProfile.selfConcept) {
          logger.warn(`[IdentityProfileService] camelCase conversion failed for self_concept, manually fixing`);
          camelCaseProfile.personalityProfile.selfConcept = toCamelCase(camelCaseProfile.personalityProfile.self_concept);
          delete camelCaseProfile.personalityProfile.self_concept;
        }
      }
      
      // Add userId as a string to ensure consistency
      camelCaseProfile.userId = profile.user_id ? profile.user_id.toString() : userId.toString();
      logger.debug(`[IdentityProfileService] Final userId: ${camelCaseProfile.userId}`);
      
      // Log the final structure
      logger.debug(`[IdentityProfileService] Final profile structure: biographical keys: ${camelCaseProfile.biographical ? Object.keys(camelCaseProfile.biographical).join(', ') : 'undefined'}, personalityProfile keys: ${camelCaseProfile.personalityProfile ? Object.keys(camelCaseProfile.personalityProfile).join(', ') : 'undefined'}`);
      
      return camelCaseProfile;
    } catch (conversionError) {
      logger.error(`[IdentityProfileService] Error converting to camelCase: ${conversionError.message}`);
      logger.error(`[IdentityProfileService] Conversion error stack: ${conversionError.stack}`);
      // Return the unconverted profile as a fallback
      return safeProfile;
    }
  } catch (error) {
    logger.error(`[IdentityProfileService] Error fetching identity profile: ${error.message}`);
    logger.error(`[IdentityProfileService] Error stack: ${error.stack}`);
    
    // Create a fallback profile with minimal data
    const fallbackProfile = {
      userId: userId,
      biographical: {
        name: '',
        preferredName: '',
        pronouns: '',
        age: null,
        location: '',
        culturalBackground: '',
        spiritualOrientation: '',
        educationLevel: '',
        occupation: '',
        identityLabels: []
      },
      personalityProfile: {
        bigFive: {
          openness: null,
          conscientiousness: null,
          extraversion: null,
          agreeableness: null,
          neuroticism: null
        }
      },
      meta: {
        lastUpdated: new Date().toISOString(),
        errorRecovery: true
      }
    };
    
    logger.warn(`[IdentityProfileService] Returning emergency fallback profile after error`);
    return fallbackProfile;
  }
}

/**
 * Updates a specific section of the identity profile.
 * @param {string} userId - The ID of the user.
 * @param {string} section - The section to update ('biographical', 'personality_profile', or 'meta').
 * @param {object} sectionData - The section data to update.
 * @param {string} changeDescription - Optional description of what changed
 * @returns {Promise<object>} The updated identity profile.
 */
async function updateProfileSection(userId, section, sectionData, changeDescription = null) {
  try {
    logger.info(`[IdentityProfileService] Updating ${section} for user ${userId}`);
    logger.debug(`[IdentityProfileService] User ID type: ${typeof userId}, value: ${userId}`);
    logger.debug(`[IdentityProfileService] Section: ${section}, Data keys: ${Object.keys(sectionData).join(', ')}`);
    
    // Ensure userId is treated as string for consistency
    const stringUserId = String(userId);
    
    // Get current profile
    const currentProfile = await getIdentityProfile(userId);
    logger.debug(`[IdentityProfileService] Current profile found: ${!!currentProfile}`);
    
    if (!currentProfile) {
      logger.info(`[IdentityProfileService] No existing profile found, creating new profile with section ${section}`);
      
      // Create a new profile with default values
      const newProfile = {
        userId: stringUserId, // Explicitly add userId
        biographical: {
          name: '',
          preferred_name: '',
          pronouns: '',
          age: null,
          location: '',
          cultural_background: '',
          spiritual_orientation: '',
          education_level: '',
          occupation: '',
          identity_labels: []
        },
        personality_profile: { // Use snake_case for consistency with backend
          big_five: {
            openness: null,
            conscientiousness: null,
            extraversion: null,
            agreeableness: null,
            neuroticism: null
          },
          cognitive_style: {
            thinking_mode: null,
            decision_making: null,
            response_tendency: null
          },
          emotional_regulation: {
            expression: null,
            coping_style: null,
            volatility: null
          },
          attachment_style: null,
          locus_of_control: null,
          motivational_orientation: [],
          self_concept: {
            self_esteem: null,
            identity_coherence: null,
            core_narratives: []
          }
        },
        meta: {
          confidence_levels: {
            big_five: null,
            attachment_style: null,
            motivational_orientation: null
          },
          inference_sources: [],
          last_updated: new Date().toISOString()
        }
      };
      
      // Update the specified section
      newProfile[section] = sectionData;
      
      logger.debug(`[IdentityProfileService] New profile created with section ${section} updated`);
      
      try {
        // Save the new profile
        const savedProfile = await saveIdentityProfile(userId, newProfile, section, `Initial profile creation with ${section} update`);
        
        // Ensure the returned profile has a userId
        if (savedProfile && !savedProfile.userId) {
          savedProfile.userId = stringUserId;
        }
        
        logger.debug(`[IdentityProfileService] New profile saved successfully: ${!!savedProfile}, has userId: ${savedProfile && !!savedProfile.userId}`);
        return savedProfile;
      } catch (saveError) {
        logger.error(`[IdentityProfileService] Error saving new profile: ${saveError.message}`);
        logger.error(`[IdentityProfileService] Error stack: ${saveError.stack}`);
        
        // Return a fallback profile with the updated section
        const fallbackProfile = { ...newProfile };
        logger.warn(`[IdentityProfileService] Returning fallback profile with userId: ${fallbackProfile.userId}`);
        return fallbackProfile;
      }
    }
    
    // Update the specified section
    const updatedProfile = { ...currentProfile };
    
    // Ensure userId is present
    if (!updatedProfile.userId) {
      updatedProfile.userId = stringUserId;
    }
    
    // Update the section
    updatedProfile[section] = sectionData;
    
    // Update the last_updated timestamp in meta
    if (!updatedProfile.meta) {
      updatedProfile.meta = {};
    }
    updatedProfile.meta.last_updated = new Date().toISOString();
    
    logger.debug(`[IdentityProfileService] Existing profile updated with new ${section} data`);
    
    try {
      // Save the updated profile
      const savedProfile = await saveIdentityProfile(userId, updatedProfile, section, changeDescription || `Updated ${section}`);
      
      // Ensure the returned profile has a userId
      if (savedProfile && !savedProfile.userId) {
        savedProfile.userId = stringUserId;
      }
      
      logger.debug(`[IdentityProfileService] Updated profile saved successfully: ${!!savedProfile}, has userId: ${savedProfile && !!savedProfile.userId}`);
      return savedProfile;
    } catch (saveError) {
      logger.error(`[IdentityProfileService] Error saving updated profile: ${saveError.message}`);
      logger.error(`[IdentityProfileService] Error stack: ${saveError.stack}`);
      
      // Return the updated profile even if saving failed
      logger.warn(`[IdentityProfileService] Returning unsaved updated profile with userId: ${updatedProfile.userId}`);
      return updatedProfile;
    }
  } catch (error) {
    logger.error(`[IdentityProfileService] Error updating profile section: ${error.message}`);
    logger.error(`[IdentityProfileService] Error stack: ${error.stack}`);
    
    // Return a minimal valid profile with the section data
    const fallbackProfile = {
      userId: String(userId),
      [section]: sectionData,
      meta: { last_updated: new Date().toISOString() }
    };
    
    logger.warn(`[IdentityProfileService] Returning emergency fallback profile after error`);
    return fallbackProfile;
  }
}

/**
 * Gets the version history of an identity profile.
 * @param {string} userId - The ID of the user.
 * @param {number} limit - Maximum number of history entries to return
 * @param {number} offset - Offset for pagination
 * @returns {Promise<Object>} Object with history array and total count
 */
async function getProfileVersionHistory(userId, limit = 10, offset = 0) {
  try {
    logger.info(`[IdentityProfileService] Getting profile version history for user ${userId}, limit: ${limit}, offset: ${offset}`);
    logger.debug(`[IdentityProfileService] User ID type before conversion: ${typeof userId}`);
    logger.debug(`[IdentityProfileService] Limit type: ${typeof limit}, value: ${limit}`);
    logger.debug(`[IdentityProfileService] Offset type: ${typeof offset}, value: ${offset}`);
    
    // Ensure userId is treated as string for consistency
    const stringUserId = String(userId);
    logger.debug(`[IdentityProfileService] User ID after conversion: ${stringUserId} (type: ${typeof stringUserId})`);
    
    // Use the history service to get the version history
    logger.debug(`[IdentityProfileService] Calling historyService.getProfileHistory with userId: ${stringUserId}, limit: ${limit}, offset: ${offset}`);
    
    let history = [];
    try {
      history = await historyService.getProfileHistory(stringUserId, limit, offset);
      logger.debug(`[IdentityProfileService] History results type: ${typeof history}, isArray: ${Array.isArray(history)}`);
      logger.debug(`[IdentityProfileService] History results length: ${history.length}`);
      
      if (history.length > 0) {
        logger.debug(`[IdentityProfileService] First history entry: ${JSON.stringify(history[0])}`);
        logger.debug(`[IdentityProfileService] First history entry keys: ${Object.keys(history[0]).join(', ')}`);
      } else {
        logger.warn(`[IdentityProfileService] No history entries found for user ${stringUserId}`);
      }
    } catch (historyError) {
      logger.error(`[IdentityProfileService] Error getting profile history: ${historyError.message}`);
      logger.error(`[IdentityProfileService] History error stack: ${historyError.stack}`);
      history = [];
    }
    
    // Get total count
    logger.debug(`[IdentityProfileService] Calling historyService.getProfileHistoryCount with userId: ${stringUserId}`);
    
    let countResult;
    let total = 0;
    
    try {
      const countResults = await historyService.getProfileHistoryCount(stringUserId);
      logger.debug(`[IdentityProfileService] Count results type: ${typeof countResults}, isArray: ${Array.isArray(countResults)}`);
      logger.debug(`[IdentityProfileService] Count results: ${JSON.stringify(countResults)}`);
      
      countResult = countResults[0];
      total = countResult ? parseInt(countResult.count, 10) : 0;
      logger.debug(`[IdentityProfileService] Parsed total count: ${total} (type: ${typeof total})`);
    } catch (countError) {
      logger.error(`[IdentityProfileService] Error getting profile history count: ${countError.message}`);
      logger.error(`[IdentityProfileService] Count error stack: ${countError.stack}`);
      total = history.length;
      logger.debug(`[IdentityProfileService] Using history length as fallback total: ${total}`);
    }
    
    logger.info(`[IdentityProfileService] Found ${history.length} history entries, total: ${total}`);
    
    // Log the final response structure
    const response = {
      history,
      total
    };
    
    logger.debug(`[IdentityProfileService] Returning response with history length: ${response.history.length}, total: ${response.total}`);
    return response;
  } catch (error) {
    logger.error(`[IdentityProfileService] Error getting profile version history: ${error.message}`);
    return {
      history: [],
      total: 0
    };
  }
}

module.exports = {
  saveIdentityProfile,
  getIdentityProfile,
  updateProfileSection,
  getProfileVersionHistory
};
