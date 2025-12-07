/**
 * Journal and AI tools for OPAL
 * 
 * This module provides tools for journal entries and AI feedback/insights
 */

const toolCreator = require('../utils/toolCreator');
const logger = require('../logger');
const promptsService = require('../services/promptsService');
const identityProfileService = require('../services/identityProfileService');

/**
 * Register journal tools
 * 
 * @param {Object} configs - The global configs object
 * @param {WebSocketServer} wss - The WebSocket server instance
 */
function registerJournalTools(configs, wss) {
  logger.info('Registering journal tools...');
  
  // Update OpenAI API key tool
  toolCreator.createTool(
    configs,
    wss,
    {
      name: 'update_openai_key',
      description: 'Update the OpenAI API key for the server',
      inputSchema: {
        type: 'object',
        properties: {
          apiKey: {
            type: 'string',
            description: 'The OpenAI API key to set'
          }
        },
        required: ['apiKey']
      }
    },
    async (params) => {
      try {
        const { apiKey } = params;
        
        if (!apiKey || !apiKey.startsWith('sk-')) {
          throw new Error('Invalid OpenAI API key format');
        }
        
        // Update the environment variable
        process.env.OPENAI_API_KEY = apiKey;
        
        logger.info(`OpenAI API key updated in environment: ${apiKey.substring(0, 7)}...`);
        
        logger.info('OpenAI API key updated successfully');
        
        return {
          success: true,
          message: 'OpenAI API key updated successfully'
        };
      } catch (error) {
        logger.error('Error updating OpenAI API key:', error);
        throw error;
      }
    }
  );
  
  // AI feedback tool
  toolCreator.createTool(
    configs,
    wss,
    {
      name: 'get_ai_feedback',
      description: 'Get AI feedback on journal content using a specific persona',
      inputSchema: {
        type: 'object',
        properties: {
          content: { type: 'string', description: 'The journal entry content' },
          persona: { type: 'string', description: 'The persona prompt to use for feedback' },
          model: { type: 'string', description: 'The OpenAI model to use (e.g., gpt-4o, gpt-4o-mini)', default: 'gpt-4o' },
          identityProfile: { 
            type: 'object', 
            description: 'The identity profile to use for context',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              bio: { type: 'string' },
              goals: { type: 'array', items: { type: 'string' } },
              values: { type: 'array', items: { type: 'string' } },
              traits: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        required: ['content', 'persona']
      },
      _internal: {
        processor: async (params, context) => {
          logger.info('[get_ai_feedback] Processing request');
          
          try {
            // Get the identity profile from the params or fetch by userId
            const identityProfile = params.identityProfile || null;
            
            // ENHANCED DEBUG: Comprehensive profile validation
            console.log('[get_ai_feedback] Profile validation:', {
              hasProfile: !!identityProfile,
              profileType: typeof identityProfile,
              profileKeys: identityProfile ? Object.keys(identityProfile) : [],
              hasBiographical: !!(identityProfile?.biographical),
              hasPersonality: !!(identityProfile?.personality_profile || identityProfile?.personalityProfile),
              bigFiveData: identityProfile?.personality_profile?.big_five || identityProfile?.personalityProfile?.bigFive
            });
            
            // Deep inspection of biographical data
            if (identityProfile?.biographical) {
              console.log('[get_ai_feedback] Biographical data found:', {
                name: identityProfile.biographical.name,
                age: identityProfile.biographical.age,
                location: identityProfile.biographical.location,
                occupation: identityProfile.biographical.occupation,
                culturalBackground: identityProfile.biographical.cultural_background || identityProfile.biographical.culturalBackground,
                educationLevel: identityProfile.biographical.education_level || identityProfile.biographical.educationLevel
              });
            } else {
              console.warn('[get_ai_feedback] No biographical data found in identity profile');
            }
            
            // Deep inspection of personality data - prioritize camelCase version with actual data
            const personalityData = identityProfile?.personalityProfile || identityProfile?.personality_profile;
            if (personalityData) {
              console.log('[get_ai_feedback] Personality data found:', {
                hasBigFive: !!(personalityData.big_five || personalityData.bigFive),
                attachmentStyle: personalityData.attachment_style || personalityData.attachmentStyle,
                locusOfControl: personalityData.locus_of_control || personalityData.locusOfControl,
                motivationalOrientation: personalityData.motivational_orientation || personalityData.motivationalOrientation
              });
              
              // Check Big Five specifically - prioritize camelCase version with actual data
              const bigFive = personalityData.bigFive || personalityData.big_five;
              if (bigFive) {
                console.log('[get_ai_feedback] Big Five traits:', {
                  openness: bigFive.openness,
                  conscientiousness: bigFive.conscientiousness, 
                  extraversion: bigFive.extraversion,
                  agreeableness: bigFive.agreeableness,
                  neuroticism: bigFive.neuroticism
                });
              } else {
                console.warn('[get_ai_feedback] No Big Five data found');
              }
            } else {
              console.warn('[get_ai_feedback] No personality data found in identity profile');
            }
            
            // DEBUG: Log what we're passing to promptsService
            console.log('[journalTools] DEBUG - AI Feedback params:', {
              hasContent: !!params.content,
              contentPreview: params.content ? params.content.substring(0, 50) + '...' : 'null',
              hasPersona: !!params.persona,
              personaPreview: params.persona ? params.persona.substring(0, 50) + '...' : 'null',
              hasIdentityProfile: !!identityProfile,
              identityProfileType: typeof identityProfile,
              identityProfileKeys: identityProfile && typeof identityProfile === 'object' ? Object.keys(identityProfile) : 'N/A',
              modelParam: params.model,
              modelParamType: typeof params.model,
              finalModel: params.model || 'gpt-4o'
            });
            
            // Call the promptsService to get AI feedback
            const feedback = await promptsService.getAIFeedback(
              params.content,
              params.persona,
              identityProfile,
              params.model || 'gpt-4o-2024-08-06'
            );
            
            logger.info('[get_ai_feedback] Successfully generated feedback');
            // Return the feedback in a format the frontend expects (text property)
            return { text: feedback };
          } catch (error) {
            logger.error('[get_ai_feedback] Error:', error);
            throw error;
          }
        }
      }
    }
  );

  // AI insights tool - completely separate from AI feedback
  toolCreator.createTool(
    configs,
    wss,
    {
      name: 'get_ai_insights',
      description: 'Get AI insights from memory content with personalized analysis based on user profile',
      inputSchema: {
        type: 'object',
        properties: {
          memoriesContext: { type: 'string', description: 'The memories content to analyze' },
          systemPrompt: { type: 'string', description: 'The system prompt to use for generating insights' },
          model: { type: 'string', description: 'The OpenAI model to use (e.g., gpt-4o, gpt-4o-mini)', default: 'gpt-4o' },
          identityProfile: { type: 'object', description: 'User identity profile with biographical and personality data for personalized insights' }
        },
        required: ['memoriesContext', 'systemPrompt']
      },
      _internal: {
        processor: async (params, context) => {
          logger.info('[get_ai_insights] Processing request');
          const identityProfile = params.identityProfile || null;
          
          console.log('[journalTools] DEBUG - AI Insights params:', {
            hasMemoriesContext: !!params.memoriesContext,
            memoriesContextLength: params.memoriesContext ? params.memoriesContext.length : 0,
            hasSystemPrompt: !!params.systemPrompt,
            hasIdentityProfile: !!identityProfile,
            identityProfileType: typeof identityProfile,
            identityProfileKeys: identityProfile && typeof identityProfile === 'object' ? Object.keys(identityProfile) : 'N/A'
          });
          
          try {
            // Call the promptsService to get AI insights with identity profile
            const insights = await promptsService.getAIInsights(
              params.memoriesContext,
              params.systemPrompt,
              identityProfile,
              params.model || 'gpt-4o'
            );
            
            logger.info('[get_ai_insights] Successfully generated insights');
            return { insights };
          } catch (error) {
            logger.error('[get_ai_insights] Error:', error);
            throw error;
          }
        }
      }
    }
  );

  // Test OpenAI API connection tool
  toolCreator.createTool(
    configs,
    wss,
    {
      name: 'test_openai_connection',
      description: 'Test the OpenAI API connection and validate the API key',
      inputSchema: {
        type: 'object',
        properties: {},
        required: []
      },
      _internal: {
        processor: async (params, context) => {
          console.log('🔥🔥🔥 TEST OPENAI CONNECTION CALLED IN ORIGINAL OPAL 🔥🔥🔥');
          logger.info('[test_openai_connection] Testing OpenAI API connection');
          
          try {
            // Get API key from environment
            const apiKey = process.env.OPENAI_API_KEY;
            
            if (!apiKey) {
              const error = 'OpenAI API key not found in environment variables';
              logger.error('[test_openai_connection]', error);
              return {
                success: false,
                error: error,
                details: 'Please set the OPENAI_API_KEY environment variable'
              };
            }
            
            console.log('[test_openai_connection] API key found, length:', apiKey.length);
            console.log('[test_openai_connection] API key starts with:', apiKey.substring(0, 7));
            
            // Test the connection by calling the OpenAI API
            const fetch = require('node-fetch');
            
            const response = await fetch('https://api.openai.com/v1/models', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              const modelCount = data.data ? data.data.length : 0;
              
              console.log('[test_openai_connection] ✅ SUCCESS - API connection working');
              logger.info('[test_openai_connection] Successfully connected to OpenAI API');
              
              return {
                success: true,
                message: 'OpenAI API connection successful',
                details: `Connected successfully. ${modelCount} models available.`,
                modelCount: modelCount
              };
            } else {
              const errorText = await response.text();
              const error = `OpenAI API error: ${response.status} ${response.statusText}`;
              
              console.log('[test_openai_connection] ❌ FAILED - API error:', error);
              logger.error('[test_openai_connection]', error, errorText);
              
              return {
                success: false,
                error: error,
                details: errorText
              };
            }
          } catch (error) {
            console.log('[test_openai_connection] ❌ EXCEPTION:', error.message);
            logger.error('[test_openai_connection] Exception:', error);
            
            return {
              success: false,
              error: 'Failed to test OpenAI API connection',
              details: error.message
            };
          }
        }
      }
    }
  );

  // Identity profile tool
  toolCreator.createTool(
    configs,
    wss,
    {
      name: 'get_identity_profile',
      description: 'Get user identity profile including biographical and psychological data',
      inputSchema: {
        type: 'object',
        properties: {
          userId: { type: 'string', description: 'The user ID to get profile for' }
        },
        required: []
      },
      _internal: {
        processor: async (params, context) => {
          logger.info('[get_identity_profile] Processing request');
          logger.info('[get_identity_profile] Params:', JSON.stringify(params));
          logger.info('[get_identity_profile] Context keys:', Object.keys(context || {}));
          logger.info('[get_identity_profile] Context.userId:', context?.userId);
          logger.info('[get_identity_profile] Context.user:', context?.user);
          logger.info('[get_identity_profile] Context.sessionId:', context?.sessionId);
          
          // Try to get userId from multiple sources
          let userId = params.userId || context?.userId || context?.user?.id || context?.sessionId;
          
          if (!userId) {
            logger.warn('[get_identity_profile] No userId found in params or context, using default admin');
            userId = 'admin'; // Fallback to admin user for testing
          }
          
          logger.info('[get_identity_profile] Using userId:', userId);
          
          try {
            // Call the identityProfileService to get the user's profile
            const profile = await identityProfileService.getIdentityProfile(userId);
            
            if (!profile) {
              logger.info('[get_identity_profile] No profile found, returning empty profile');
              return {
                biography: null,
                psychProfile: null,
                identityProfile: null
              };
            }
            
            logger.info('[get_identity_profile] Raw profile retrieved:', JSON.stringify(profile, null, 2));
            logger.info('[get_identity_profile] Profile keys:', Object.keys(profile));
            logger.info('[get_identity_profile] Profile.biographical type:', typeof profile.biographical);
            logger.info('[get_identity_profile] Profile.biographical value:', profile.biographical);
            logger.info('[get_identity_profile] Profile.personality_profile type:', typeof profile.personality_profile);
            logger.info('[get_identity_profile] Profile.personality_profile value:', profile.personality_profile);
            
            // Check if data exists but in different fields
            Object.keys(profile).forEach(key => {
              logger.info(`[get_identity_profile] Field '${key}':`, typeof profile[key], profile[key] ? '(has data)' : '(empty/null)');
            });
            
            // Parse biographical data if it exists
            let biographical = null;
            if (profile.biographical) {
              try {
                biographical = typeof profile.biographical === 'string' 
                  ? JSON.parse(profile.biographical) 
                  : profile.biographical;
                logger.info('[get_identity_profile] Parsed biographical data:', JSON.stringify(biographical, null, 2));
              } catch (parseError) {
                logger.error('[get_identity_profile] Error parsing biographical data:', parseError);
                biographical = profile.biographical;
              }
            }
            
            // Parse personality profile data if it exists
            let personalityProfile = null;
            if (profile.personality_profile) {
              try {
                personalityProfile = typeof profile.personality_profile === 'string' 
                  ? JSON.parse(profile.personality_profile) 
                  : profile.personality_profile;
                logger.info('[get_identity_profile] Parsed personality profile:', JSON.stringify(personalityProfile, null, 2));
              } catch (parseError) {
                logger.error('[get_identity_profile] Error parsing personality profile:', parseError);
                personalityProfile = profile.personality_profile;
              }
            }
            
            // Return in the format expected by the frontend
            const result = {
              biography: biographical,
              psychProfile: personalityProfile,
              identityProfile: profile
            };
            
            logger.info('[get_identity_profile] Returning formatted profile:', JSON.stringify(result, null, 2));
            return result;
            
          } catch (error) {
            logger.error('[get_identity_profile] Error:', error);
            // Return empty profile instead of throwing error to prevent frontend crashes
            return {
              biography: null,
              psychProfile: null,
              identityProfile: null
            };
          }
        }
      }
    }
  );
  
  // Create journal entry tool
  toolCreator.createTool(configs, wss, {
    name: 'createJournalEntry',
    description: 'Create a new journal entry',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Entry title' },
        content: { type: 'string', description: 'Entry content' },
        moduleId: { type: 'string', description: 'Optional module ID for guided entries' },
        moduleStep: { type: 'string', description: 'Optional module step for guided entries' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Entry tags' }
      },
      required: ['title', 'content']
    },
    _internal: {
      processor: async (params, session) => {
        if (!session || !session.user || !session.user.id) {
          logger.error('[createJournalEntry] User not authenticated - session:', { 
            hasSession: !!session, 
            hasUser: !!(session && session.user),
            userId: session?.user?.id
          });
          throw new Error('User not authenticated');
        }
        
        const userId = session.user.id;
        logger.info(`[createJournalEntry] Creating journal entry for user ${userId}`);
        
        try {
          // Use the journalService instead of direct database calls
          const journalService = require('../services/journalService');
          
          const entryData = {
            title: params.title,
            content: params.content,
            moduleId: params.moduleId || null,
            moduleStep: params.moduleStep || null,
            tags: params.tags || []
          };
          
          const entry = await journalService.createJournalEntry(userId, entryData);
          logger.info(`[createJournalEntry] Successfully created entry ${entry.id} for user ${userId}`);
          
          return entry;
        } catch (error) {
          logger.error(`[createJournalEntry] Error creating journal entry for user ${userId}:`, error);
          throw error;
        }
      }
    }
  });

  // Get all journal entries tool
  toolCreator.createTool(configs, wss, {
    name: 'getAllJournalEntries',
    description: 'Get all journal entries for the authenticated user',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    _internal: {
      processor: async (params, session) => {
        if (!session || !session.user || !session.user.id) {
          logger.error('[getAllJournalEntries] User not authenticated - session:', { 
            hasSession: !!session, 
            hasUser: !!(session && session.user),
            userId: session?.user?.id
          });
          throw new Error('User not authenticated');
        }
        
        const userId = session.user.id;
        logger.info(`[getAllJournalEntries] Retrieving journal entries for user ${userId}`);
        
        try {
          // Use the journalService instead of direct database calls
          const journalService = require('../services/journalService');
          const entries = await journalService.getJournalEntries(userId);
          
          logger.info(`[getAllJournalEntries] Successfully retrieved ${entries.length} entries for user ${userId}`);
          return entries;
        } catch (error) {
          logger.error(`[getAllJournalEntries] Error retrieving journal entries for user ${userId}:`, error);
          throw error;
        }
      }
    }
  });

  // Update journal entry tool
  toolCreator.createTool(configs, wss, {
    name: 'updateJournalEntry',
    description: 'Update an existing journal entry',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Entry ID' },
        title: { type: 'string', description: 'Entry title' },
        content: { type: 'string', description: 'Entry content' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Entry tags' },
        starred: { type: 'boolean', description: 'Starred status' },
        archived: { type: 'boolean', description: 'Archived status' },
        pinned: { type: 'boolean', description: 'Pinned status' }
      },
      required: ['id']
    },
    _internal: {
      processor: async (params, session) => {
        if (!session || !session.user || !session.user.id) {
          logger.error('[updateJournalEntry] User not authenticated - session:', { 
            hasSession: !!session, 
            hasUser: !!(session && session.user),
            userId: session?.user?.id
          });
          throw new Error('User not authenticated');
        }
        
        const userId = session.user.id;
        logger.info(`[updateJournalEntry] Updating journal entry ${params.id} for user ${userId}`);
        
        try {
          // Use the journalService instead of direct database calls
          const journalService = require('../services/journalService');
          
          const updateData = {};
          if (params.title !== undefined) updateData.title = params.title;
          if (params.content !== undefined) updateData.content = params.content;
          if (params.tags !== undefined) updateData.tags = params.tags;
          if (params.starred !== undefined) updateData.starred = params.starred;
          if (params.archived !== undefined) updateData.archived = params.archived;
          if (params.pinned !== undefined) updateData.pinned = params.pinned;
          
          const entry = await journalService.updateJournalEntry(params.id, userId, updateData);
          logger.info(`[updateJournalEntry] Successfully updated entry ${entry.id} for user ${userId}`);
          
          return entry;
        } catch (error) {
          logger.error(`[updateJournalEntry] Error updating journal entry ${params.id} for user ${userId}:`, error);
          throw error;
        }
      }
    }
  });

  // Delete journal entry tool
  toolCreator.createTool(configs, wss, {
    name: 'deleteJournalEntry',
    description: 'Delete a journal entry',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Entry ID to delete' }
      },
      required: ['id']
    },
    _internal: {
      processor: async (params, session) => {
        if (!session || !session.user || !session.user.id) {
          logger.error('[deleteJournalEntry] User not authenticated - session:', { 
            hasSession: !!session, 
            hasUser: !!(session && session.user),
            userId: session?.user?.id
          });
          throw new Error('User not authenticated');
        }
        
        const userId = session.user.id;
        logger.info(`[deleteJournalEntry] Deleting journal entry ${params.id} for user ${userId}`);
        
        try {
          // Use the journalService instead of direct database calls
          const journalService = require('../services/journalService');
          const deletedCount = await journalService.deleteJournalEntry(params.id, userId);
          
          logger.info(`[deleteJournalEntry] Successfully deleted entry ${params.id} for user ${userId}`);
          return { success: true, deletedId: params.id, deletedCount };
        } catch (error) {
          logger.error(`[deleteJournalEntry] Error deleting journal entry ${params.id} for user ${userId}:`, error);
          throw error;
        }
      }
    }
  });

  logger.info('Journal tools registration completed');
}

module.exports = {
  registerJournalTools
};
