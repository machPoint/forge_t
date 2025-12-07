/**
 * Identity Profile Tools
 * 
 * Tools for managing identity profiles
 */

const identityProfileService = require('../services/identityProfileService');
const logger = require('../logger');

/**
 * Get the identity profile for the current user
 */
const getIdentityProfile = {
  name: 'getIdentityProfile',
  description: 'Get the identity profile for the current user',
  inputSchema: {},
  handler: async (params, context) => {
    try {
      // Deep debug of the entire context object
      logger.info(`[getIdentityProfile] Request received, debugging context...`);
      logger.debug(`[getIdentityProfile] Context keys: ${context ? Object.keys(context).join(', ') : 'undefined'}`);
      logger.debug(`[getIdentityProfile] Full context dump: ${JSON.stringify(context, (k, v) => k === 'socket' ? '[Socket Object]' : v)}`);
      
      // Validate context and user before proceeding
      if (!context || !context.user) {
        logger.error(`[getIdentityProfile] Missing context or user object in request context`);
        logger.error(`[getIdentityProfile] Context details:`, {
          hasContext: !!context,
          contextKeys: context ? Object.keys(context) : [],
          contextType: typeof context
        });
        
        // Try to get user from session if available
        if (context && context.session && context.session.user) {
          logger.info(`[getIdentityProfile] Found user in session context`);
          context.user = context.session.user;
        } else {
          // If no user context at all, return null to allow the frontend to handle gracefully
          logger.warn(`[getIdentityProfile] No user context available, returning null`);
          return null;
        }
      }
      
      // Debug context.user object
      logger.debug(`[getIdentityProfile] User object keys: ${Object.keys(context.user).join(', ')}`);
      logger.debug(`[getIdentityProfile] User object dump: ${JSON.stringify(context.user)}`);
      logger.debug(`[getIdentityProfile] Session info: ${context.sessionId || 'No session ID'}, Socket ID: ${context.socketId || 'No socket ID'}`);
      
      const userId = context.user.id;
      if (!userId) {
        logger.error(`[getIdentityProfile] Missing user ID in request context`);
        return { 
          error: true, 
          message: 'User ID not found in context. Please refresh the page or log out and log in again.',
          debug: { user: context.user }
        };
      }
      
      // Log detailed info about the userId
      logger.info(`[getIdentityProfile] Fetching identity profile for user ${userId}`);
      logger.debug(`[getIdentityProfile] User ID type: ${typeof userId}, value: ${JSON.stringify(userId)}`);
      
      // Check if authentication token is present in context
      if (context.token) {
        logger.debug(`[getIdentityProfile] Auth token present: ${context.token.substring(0, 10)}...`);
      } else {
        logger.warn(`[getIdentityProfile] No auth token found in context!`);
      }
      
      const profile = await identityProfileService.getIdentityProfile(userId);
      
      // If no profile exists yet, create a default one and save it to the database
      if (!profile) {
        logger.info(`[getIdentityProfile] No profile found for user ${userId}, creating default profile`);
        
        const defaultProfile = {
          userId: userId.toString(),
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
          personality_profile: {
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
        
        // Save the default profile to the database
        try {
          const savedProfile = await identityProfileService.saveIdentityProfile(
            userId, 
            defaultProfile, 
            'all', 
            'Initial profile creation'
          );
          
          return {
            ...savedProfile,
            userId: savedProfile.userId.toString() // Ensure userId is a string
          };
        } catch (saveError) {
          logger.error(`[getIdentityProfile] Error saving default profile: ${saveError.message}`);
          // Return the default profile even if saving failed
          return defaultProfile;
        }
      }
      
      // Debug log the profile structure
      logger.info(`[getIdentityProfile] Profile structure before fix: ${JSON.stringify({hasProfile: !!profile, hasUserId: !!profile.userId, hasMeta: !!profile.meta, hasLastUpdated: profile.meta && !!profile.meta.last_updated})}`);      
      
      // Create a safe copy of the profile with guaranteed structure
      const safeProfile = {
        ...profile,
        userId: profile.userId ? profile.userId.toString() : '', // Ensure userId is a string
        meta: profile.meta || {}
      };
      
      // Ensure biographical section is present with default values if missing
      if (!safeProfile.biographical) {
        logger.warn(`[getIdentityProfile] Missing biographical section, adding default values`);
        safeProfile.biographical = {
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
      }
      
      // Ensure personality_profile section is present with default values if missing
      if (!safeProfile.personality_profile) {
        logger.warn(`[getIdentityProfile] Missing personality_profile section, adding default values`);
        safeProfile.personality_profile = {
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
      }
      
      // Ensure meta object has all required properties
      safeProfile.meta = {
        confidence_levels: safeProfile.meta.confidence_levels || {
          big_five: null,
          attachment_style: null,
          motivational_orientation: null
        },
        inference_sources: safeProfile.meta.inference_sources || [],
        last_updated: safeProfile.meta.last_updated || new Date().toISOString()
      };
      
      logger.info(`[getIdentityProfile] Profile structure after fix: ${JSON.stringify({hasProfile: true, hasUserId: !!safeProfile.userId, hasMeta: !!safeProfile.meta, hasLastUpdated: !!safeProfile.meta.last_updated})}`);      
      
      // Log the complete response structure for debugging
      logger.info(`[getIdentityProfile] Returning complete profile structure with keys: ${Object.keys(safeProfile).join(', ')}`);
      
      // Log critical sections to ensure they exist and are properly structured
      if (safeProfile.biographical) {
        logger.debug(`[getIdentityProfile] Biographical data: ${JSON.stringify(safeProfile.biographical)}`);
      } else {
        logger.error(`[getIdentityProfile] CRITICAL: Missing biographical section in response!`);
      }
      
      if (safeProfile.personality_profile) {
        logger.debug(`[getIdentityProfile] Personality profile present with keys: ${Object.keys(safeProfile.personality_profile).join(', ')}`);
      } else {
        logger.error(`[getIdentityProfile] CRITICAL: Missing personality_profile section in response!`);
      }
      
      // Sanity check the final structure
      try {
        // Test JSON stringification of the response
        const jsonTest = JSON.stringify(safeProfile);
        logger.debug(`[getIdentityProfile] Response successfully serializable, length: ${jsonTest.length} chars`);
      } catch (jsonError) {
        logger.error(`[getIdentityProfile] CRITICAL: Response contains non-serializable data: ${jsonError.message}`);
      }
      
      return safeProfile;
    } catch (error) {
      logger.error(`[getIdentityProfile] Error: ${error.message}`);
      throw error;
    }
  }
};

/**
 * Update the entire identity profile for the current user
 */
const updateIdentityProfile = {
  name: 'updateIdentityProfile',
  description: 'Update the entire identity profile for the current user',
  inputSchema: {
    type: 'object',
    properties: {
      biographical: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          preferred_name: { type: 'string' },
          pronouns: { type: 'string' },
          age: { type: ['integer', 'null'] },
          location: { type: 'string' },
          cultural_background: { type: 'string' },
          spiritual_orientation: { type: 'string' },
          education_level: { type: 'string' },
          occupation: { type: 'string' },
          identity_labels: { 
            type: 'array',
            items: { type: 'string' }
          }
        }
      },
      personality_profile: {
        type: 'object',
        properties: {
          big_five: {
            type: 'object',
            properties: {
              openness: { type: ['number', 'null'] },
              conscientiousness: { type: ['number', 'null'] },
              extraversion: { type: ['number', 'null'] },
              agreeableness: { type: ['number', 'null'] },
              neuroticism: { type: ['number', 'null'] }
            }
          },
          cognitive_style: {
            type: 'object',
            properties: {
              thinking_mode: { type: ['string', 'null'], enum: ['abstract', 'concrete', null] },
              decision_making: { type: ['string', 'null'], enum: ['rational', 'intuitive', null] },
              response_tendency: { type: ['string', 'null'], enum: ['active', 'reflective', null] }
            }
          },
          emotional_regulation: {
            type: 'object',
            properties: {
              expression: { type: ['string', 'null'], enum: ['open', 'controlled', null] },
              coping_style: { type: ['string', 'null'], enum: ['problem-focused', 'emotion-focused', 'avoidant', null] },
              volatility: { type: ['string', 'null'], enum: ['stable', 'variable', null] }
            }
          },
          attachment_style: { 
            type: ['string', 'null'], 
            enum: ['secure', 'anxious', 'avoidant', 'disorganized', null] 
          },
          locus_of_control: { 
            type: ['string', 'null'], 
            enum: ['internal', 'external', null] 
          },
          motivational_orientation: {
            type: 'array',
            items: { type: 'string' }
          },
          self_concept: {
            type: 'object',
            properties: {
              self_esteem: { 
                type: ['string', 'null'], 
                enum: ['low', 'moderate', 'high', null] 
              },
              identity_coherence: { 
                type: ['string', 'null'], 
                enum: ['stable', 'in-progress', 'fragmented', null] 
              },
              core_narratives: {
                type: 'array',
                items: { type: 'string' }
              }
            }
          }
        }
      },
      meta: {
        type: 'object',
        properties: {
          confidence_levels: {
            type: 'object',
            properties: {
              big_five: { type: ['number', 'null'] },
              attachment_style: { type: ['number', 'null'] },
              motivational_orientation: { type: ['number', 'null'] }
            }
          },
          inference_sources: {
            type: 'array',
            items: { 
              type: 'string',
              enum: ['user_input', 'interaction_inference', 'manual_tagging']
            }
          }
        }
      }
    }
  },
  handler: async (params, context) => {
    try {
      const userId = context.user.id;
      logger.info(`[updateIdentityProfile] Updating identity profile for user ${userId}`);
      
      // Add userId to the profile data
      const profileData = {
        ...params,
        userId: userId
      };
      
      const updatedProfile = await identityProfileService.saveIdentityProfile(userId, profileData);
      
      return {
        ...updatedProfile,
        userId: updatedProfile.userId.toString() // Ensure userId is a string
      };
    } catch (error) {
      logger.error(`[updateIdentityProfile] Error: ${error.message}`);
      throw error;
    }
  }
};

/**
 * Update a specific section of the identity profile
 */
const updateProfileSection = {
  name: 'updateProfileSection',
  description: 'Update a specific section of the identity profile',
  inputSchema: {
    type: 'object',
    properties: {
      section: { 
        type: 'string',
        enum: ['biographical', 'personalityProfile', 'meta']
      },
      data: { type: 'object' }
    },
    required: ['section', 'data']
  },
  handler: async (params, context) => {
    try {
      if (!context || !context.user || !context.user.id) {
        logger.error(`[updateProfileSection] Missing user context or user ID: ${JSON.stringify(context)}`);
        return {
          error: true,
          message: 'User authentication required. Please log in and try again.'
        };
      }
      
      const userId = context.user.id;
      const { section, data } = params;
      
      logger.info(`[updateProfileSection] Started updating ${section} for user ${userId}`);
      
      // Map frontend section names to backend section names
      let backendSection = section;
      if (section === 'personalityProfile') {
        backendSection = 'personality_profile';
        logger.info(`[updateProfileSection] Mapped frontend 'personalityProfile' to backend 'personality_profile'`);
      }
      
      // Add comprehensive logging
      logger.debug(`[updateProfileSection] User ID type: ${typeof userId}, value: ${userId}`);
      logger.debug(`[updateProfileSection] Section: ${section}, backendSection: ${backendSection}`);
      logger.debug(`[updateProfileSection] Section data: ${JSON.stringify(data)}`);
      
      // Check for auth token context
      if (!context.token) {
        logger.warn(`[updateProfileSection] No auth token found in context! This may cause authentication issues.`);
      }
      
      // Update the profile section
      const updatedProfile = await identityProfileService.updateProfileSection(userId, backendSection, data);
      
      // Detailed logging after update
      if (updatedProfile) {
        logger.info(`[updateProfileSection] Profile successfully updated for user ${userId}`);
        logger.debug(`[updateProfileSection] Updated profile keys: ${Object.keys(updatedProfile).join(', ')}`);
        
        // Check if the updated section exists in the returned profile
        if (updatedProfile[backendSection]) {
          logger.info(`[updateProfileSection] ${backendSection} section exists in response`);
          logger.debug(`[updateProfileSection] ${backendSection} keys: ${Object.keys(updatedProfile[backendSection]).join(', ')}`);
        } else {
          logger.warn(`[updateProfileSection] ${backendSection} section missing from response!`);
        }
      } else {
        logger.warn(`[updateProfileSection] Updated profile is undefined or null`);
      }
      
      // Handle the case where updatedProfile might be undefined
      if (!updatedProfile) {
        logger.warn(`[updateProfileSection] Creating fallback profile response`);
        return {
          userId: userId.toString(),
          [backendSection]: data,  // Use backendSection key for consistency
          meta: { last_updated: new Date().toISOString() }
        };
      }
      
      // Ensure the updated data is included in the response
      // This is critical - we need to make sure the data we just saved is returned
      const enhancedProfile = {
        ...updatedProfile,
        [backendSection]: updatedProfile[backendSection] || data,  // Ensure the section data is present
        userId: updatedProfile.userId ? updatedProfile.userId.toString() : userId.toString() // Ensure userId is a string
      };
      
      logger.debug(`[updateProfileSection] Enhanced profile to return: ${JSON.stringify({
        hasUserId: !!enhancedProfile.userId,
        sections: Object.keys(enhancedProfile),
        hasSectionData: !!enhancedProfile[backendSection]
      })}`);
      
      // Ensure the response has the right sections on refresh
      // Force a refresh of the profile in the database to ensure latest data is retrieved
      await identityProfileService.getIdentityProfile(userId, true); // Force refresh
      
      logger.info(`[updateProfileSection] Successfully completed update for ${section}`);
      return enhancedProfile;
    } catch (error) {
      logger.error(`[updateProfileSection] Error: ${error.message}`);
      logger.error(`[updateProfileSection] Error stack: ${error.stack}`);
      throw error;
    }
  }
};

/**
 * Get the version history of an identity profile
 */
const getProfileVersionHistory = {
  name: 'getProfileVersionHistory',
  description: 'Get the version history of an identity profile',
  inputSchema: {
    type: 'object',
    properties: {
      limit: { type: 'number' },
      offset: { type: 'number' }
    }
  },
  handler: async (params, context) => {
    try {
      // Validate user context exists
      if (!context || !context.user || !context.user.id) {
        logger.error(`[getProfileVersionHistory] Missing user context: ${JSON.stringify(context)}`);  
        return {
          error: true,
          message: 'Authentication required: Missing user context',
          history: [],
          total: 0
        };
      }
      
      const userId = context.user.id;
      const { limit = 10, offset = 0 } = params;
      
      logger.info(`[getProfileVersionHistory] Getting profile history for user ${userId}, limit: ${limit}, offset: ${offset}`);
      
      // Ensure userId is treated as string for consistency
      const stringUserId = String(userId);
      
      // Get history entries from the history service
      const historyService = require('../services/identityProfileHistoryService');
      
      // Get history entries
      const history = await historyService.getProfileHistory(stringUserId, limit, offset);
      
      // Get total count
      const [countResult] = await historyService.getProfileHistoryCount(stringUserId);
      const total = countResult ? parseInt(countResult.count, 10) : 0;
      
      logger.info(`[getProfileVersionHistory] Found ${history.length} history entries, total: ${total}`);
      
      // Log the raw history entries for debugging
      if (history && history.length > 0) {
        logger.debug(`[getProfileVersionHistory] Sample entry (first history entry): ${JSON.stringify(history[0])}`);  
      } else {
        logger.warn(`[getProfileVersionHistory] No history entries found despite count being ${total}`); 
      }
      
      // Ensure all entries have the correct structure for the frontend
      const formattedHistory = Array.isArray(history) ? history.map(entry => {
        // Make sure all required fields are present
        return {
          id: entry.id,
          section_changed: entry.section_changed || 'unknown',
          change_description: entry.change_description || null,
          created_at: entry.created_at ? new Date(entry.created_at).toISOString() : new Date().toISOString()
        };
      }) : [];
      
      // Log the formatted history for debugging
      logger.info(`[getProfileVersionHistory] Returning ${formattedHistory.length} formatted history entries`);
      
      return {
        history: formattedHistory,
        total
      };
    } catch (error) {
      logger.error(`[getProfileVersionHistory] Error: ${error.message}`);
      return {
        history: [],
        total: 0
      };
    }
  }
};

/**
 * Alias for getIdentityProfile with snake_case name for backward compatibility
 */
const get_identity_profile = {
  name: 'get_identity_profile',
  description: 'Get the identity profile for the current user (snake_case alias)',
  inputSchema: {},
  handler: async (params, context) => {
    // Use the same handler as getIdentityProfile
    return await getIdentityProfile.handler(params, context);
  }
};

module.exports = {
  getIdentityProfile,
  get_identity_profile,
  updateIdentityProfile,
  updateProfileSection,
  getProfileVersionHistory
};
