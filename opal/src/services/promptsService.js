/**
 * Prompts Service
 * Handles prompt management and notifications
 */

const logger = require('../logger');
const { sendNotificationToAll } = require('../utils/notifications');
const crypto = require('crypto');

/**
 * Normalize profile data to ensure consistent field naming
 * Handles both camelCase and snake_case field names
 * @param {Object} profile - The profile object to normalize
 * @returns {Object} Normalized profile with consistent snake_case field names
 */
function normalizeProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    return profile;
  }
  
  const normalized = {
    biographical: profile.biographical || {},
    personality_profile: profile.personalityProfile || profile.personality_profile || {}
  };
  
  // Ensure big_five is properly mapped from both formats
  const personalityData = normalized.personality_profile;
  if (personalityData) {
    // Handle Big Five traits
    if (personalityData.bigFive && !personalityData.big_five) {
      personalityData.big_five = personalityData.bigFive;
      delete personalityData.bigFive;
    }
    
    // Handle other personality fields
    const fieldMappings = {
      'attachmentStyle': 'attachment_style',
      'locusOfControl': 'locus_of_control', 
      'motivationalOrientation': 'motivational_orientation',
      'cognitiveStyle': 'cognitive_style',
      'emotionalRegulation': 'emotional_regulation',
      'selfConcept': 'self_concept'
    };
    
    Object.keys(fieldMappings).forEach(camelKey => {
      const snakeKey = fieldMappings[camelKey];
      if (personalityData[camelKey] && !personalityData[snakeKey]) {
        personalityData[snakeKey] = personalityData[camelKey];
        delete personalityData[camelKey];
      }
    });
    
    // Handle nested object field mappings in cognitive_style
    if (personalityData.cognitive_style) {
      const cogStyle = personalityData.cognitive_style;
      const cogMappings = {
        'thinkingMode': 'thinking_mode',
        'decisionMaking': 'decision_making',
        'responseTendency': 'response_tendency'
      };
      Object.keys(cogMappings).forEach(camelKey => {
        const snakeKey = cogMappings[camelKey];
        if (cogStyle[camelKey] && !cogStyle[snakeKey]) {
          cogStyle[snakeKey] = cogStyle[camelKey];
          delete cogStyle[camelKey];
        }
      });
    }
    
    // Handle nested object field mappings in emotional_regulation
    if (personalityData.emotional_regulation) {
      const emoReg = personalityData.emotional_regulation;
      const emoMappings = {
        'copingStyle': 'coping_style'
      };
      Object.keys(emoMappings).forEach(camelKey => {
        const snakeKey = emoMappings[camelKey];
        if (emoReg[camelKey] && !emoReg[snakeKey]) {
          emoReg[snakeKey] = emoReg[camelKey];
          delete emoReg[camelKey];
        }
      });
    }
    
    // Handle nested object field mappings in self_concept
    if (personalityData.self_concept) {
      const selfConcept = personalityData.self_concept;
      const selfMappings = {
        'selfEsteem': 'self_esteem',
        'identityCoherence': 'identity_coherence',
        'coreNarratives': 'core_narratives'
      };
      Object.keys(selfMappings).forEach(camelKey => {
        const snakeKey = selfMappings[camelKey];
        if (selfConcept[camelKey] && !selfConcept[snakeKey]) {
          selfConcept[snakeKey] = selfConcept[camelKey];
          delete selfConcept[camelKey];
        }
      });
    }
  }
  
  // Handle biographical field mappings
  const bio = normalized.biographical;
  if (bio) {
    const bioMappings = {
      'preferredName': 'preferred_name',
      'culturalBackground': 'cultural_background',
      'spiritualOrientation': 'spiritual_orientation',
      'educationLevel': 'education_level',
      'identityLabels': 'identity_labels'
    };
    Object.keys(bioMappings).forEach(camelKey => {
      const snakeKey = bioMappings[camelKey];
      if (bio[camelKey] && !bio[snakeKey]) {
        bio[snakeKey] = bio[camelKey];
        delete bio[camelKey];
      }
    });
  }
  
  // Preserve other fields from original profile
  Object.keys(profile).forEach(key => {
    if (!normalized[key] && key !== 'personalityProfile') {
      normalized[key] = profile[key];
    }
  });
  
  console.log('[PromptsService] Normalized profile:', {
    hasBiographical: !!normalized.biographical,
    hasPersonality: !!normalized.personality_profile,
    bioKeys: normalized.biographical ? Object.keys(normalized.biographical) : [],
    personalityKeys: normalized.personality_profile ? Object.keys(normalized.personality_profile) : []
  });
  
  return normalized;
}

// In-memory prompts storage (would be replaced with a database in production)
const promptStore = new Map();

/**
 * Generate a unique ID for a prompt
 * 
 * @param {string} name - The name of the prompt
 * @returns {string} The ID for the prompt
 */
function generatePromptId(name) {
  const hash = crypto.createHash('md5').update(`${name}:${Date.now()}`).digest('hex');
  return `${name.replace(/[^a-zA-Z0-9_-]/g, '_')}_${hash.substring(0, 8)}`;
}

/**
 * Add or update a prompt
 * 
 * @param {Object} configs - The global configs object
 * @param {Object} wss - The WebSocket server instance
 * @param {string} id - The ID of the prompt (optional, will be generated if not provided)
 * @param {Object} prompt - The prompt data
 * @returns {Object} The created or updated prompt
 */
function setPrompt(configs, wss, id, prompt) {
  if (!prompt.name) {
    throw new Error('Prompt must have a name');
  }
  
  if (!prompt.messages || !Array.isArray(prompt.messages) || prompt.messages.length === 0) {
    throw new Error('Prompt must have at least one message');
  }
  
  // Generate ID if not provided
  if (!id) {
    id = generatePromptId(prompt.name);
  }
  
  // Check if prompt already exists
  const isNewPrompt = !promptStore.has(id);
  
  // Create the prompt object
  const mcpPrompt = {
    id,
    name: prompt.name,
    description: prompt.description || '',
    messages: prompt.messages,
    argumentSchema: prompt.argumentSchema || null,
    created: isNewPrompt ? new Date().toISOString() : promptStore.get(id).created,
    updated: new Date().toISOString()
  };
  
  // Store the prompt
  promptStore.set(id, mcpPrompt);
  
  logger.info(`${isNewPrompt ? 'Created' : 'Updated'} prompt: ${id}`);
  
  // Send notification if WebSocket server is available
  if (wss) {
    // Notify all clients about the prompt list change
    sendNotificationToAll(wss, 'notifications/prompts/list_changed');
    logger.info('Sent prompts/list_changed notification');
  }
  
  return mcpPrompt;
}

/**
 * Get a prompt by ID
 * 
 * @param {string} id - The ID of the prompt
 * @param {Object} args - Arguments to apply to the prompt (optional)
 * @returns {Object|null} The prompt or null if not found
 */
function getPrompt(id, args = null) {
  const prompt = promptStore.get(id);
  if (!prompt) {
    return null;
  }
  
  // If no arguments provided, return the prompt as is
  if (!args) {
    return prompt;
  }
  
  // Apply arguments to the prompt
  const processedPrompt = {
    ...prompt,
    messages: applyArgumentsToMessages(prompt.messages, args)
  };
  
  return processedPrompt;
}

/**
 * Apply arguments to prompt messages
 * 
 * @param {Array} messages - The prompt messages
 * @param {Object} args - The arguments to apply
 * @returns {Array} The processed messages
 */
function applyArgumentsToMessages(messages, args) {
  if (!args) {
    return messages;
  }
  
  return messages.map(message => {
    // Process text content
    if (message.content && typeof message.content === 'string') {
      let processedContent = message.content;
      
      // Replace placeholders with argument values
      for (const [key, value] of Object.entries(args)) {
        const placeholder = `{{${key}}}`;
        processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
      }
      
      return {
        ...message,
        content: processedContent
      };
    }
    
    // Process array content (e.g., for multi-part messages)
    if (message.content && Array.isArray(message.content)) {
      const processedContent = message.content.map(part => {
        if (part.type === 'text' && part.text) {
          let processedText = part.text;
          
          // Replace placeholders with argument values
          for (const [key, value] of Object.entries(args)) {
            const placeholder = `{{${key}}}`;
            processedText = processedText.replace(new RegExp(placeholder, 'g'), value);
          }
          
          return {
            ...part,
            text: processedText
          };
        }
        
        return part;
      });
      
      return {
        ...message,
        content: processedContent
      };
    }
    
    return message;
  });
}

/**
 * Delete a prompt
 * 
 * @param {Object} configs - The global configs object
 * @param {Object} wss - The WebSocket server instance
 * @param {string} id - The ID of the prompt to delete
 * @returns {boolean} True if the prompt was deleted, false if it didn't exist
 */
function deletePrompt(configs, wss, id) {
  if (!promptStore.has(id)) {
    return false;
  }
  
  // Delete the prompt
  promptStore.delete(id);
  
  logger.info(`Deleted prompt: ${id}`);
  
  // Send notification if WebSocket server is available
  if (wss) {
    // Notify all clients about the prompt list change
    sendNotificationToAll(wss, 'notifications/prompts/list_changed');
    logger.info('Sent prompts/list_changed notification');
  }
  
  return true;
}

/**
 * List all prompts with pagination
 * 
 * @param {function} paginateItems - The pagination function
 * @param {string|null} cursor - The pagination cursor
 * @returns {Object} The paginated prompts
 */
function listPrompts(paginateItems, cursor = null) {
  // Get all prompts as an array
  const prompts = Array.from(promptStore.values());
  
  // Apply pagination
  const { items: paginatedPrompts, nextCursor } = paginateItems(prompts, cursor);
  
  return {
    prompts: paginatedPrompts,
    nextCursor
  };
}

/**
 * Get AI feedback from OpenAI
 * 
 * @param {string} entryContent - The content of the journal entry
 * @param {string} personaPrompt - The system prompt for the AI persona
 * @param {Object|string} identityProfileOrUserId - Either the identity profile object directly or a userId to fetch it
 * @param {string} model - The OpenAI model to use (default: gpt-4o)
 * @returns {Promise<string>} The AI-generated feedback
 */
async function getAIFeedback(entryContent, personaPrompt, identityProfileOrUserId = 'default', model = 'gpt-4o') {
  // Try multiple environment variable names and fallback methods
  let apiKey = process.env.OPENAI_API_KEY || 
               process.env.OPENAI_KEY || 
               process.env.API_KEY_OPENAI;
  
  // If still no API key, try loading from config-loader as fallback
  if (!apiKey) {
    try {
      const configLoader = require('../config-loader');
      apiKey = configLoader.getOpenAIApiKey();
      if (apiKey) {
        logger.info('[PromptsService] Retrieved OpenAI API key from config loader fallback');
      }
    } catch (error) {
      logger.warn('[PromptsService] Config loader fallback failed:', error.message);
    }
  }
  
  if (!apiKey) {
    logger.error('[PromptsService] OPENAI_API_KEY not found in any environment variable or config');
    logger.error('[PromptsService] Checked: OPENAI_API_KEY, OPENAI_KEY, API_KEY_OPENAI');
    throw new Error('OpenAI API key not configured on the server. Please check your .env file.');
  }
  
  logger.info('[PromptsService] OpenAI API key successfully loaded for AI Feedback');
  
  // Import the identityProfileService
  const { getIdentityProfile } = require('./identityProfileService');
  
  // Get the user's identity profile
  let profileContext = '';
  try {
    // DEBUG: Log what we received
    console.log('[PromptsService] DEBUG - identityProfileOrUserId received:', {
      type: typeof identityProfileOrUserId,
      isNull: identityProfileOrUserId === null,
      isUndefined: identityProfileOrUserId === undefined,
      keys: identityProfileOrUserId && typeof identityProfileOrUserId === 'object' ? Object.keys(identityProfileOrUserId) : 'N/A'
    });
    
    // ENHANCED: Handle both direct identity profile object and userId string
    let profile;
    
    if (identityProfileOrUserId && typeof identityProfileOrUserId === 'object') {
      // Handle nested structure from frontend: {content: [{type: "text", text: "JSON_STRING"}]}
      if (identityProfileOrUserId.content && Array.isArray(identityProfileOrUserId.content)) {
        console.log('[PromptsService] Parsing nested identity profile structure');
        try {
          const textContent = identityProfileOrUserId.content[0]?.text;
          if (textContent) {
            const parsedProfile = JSON.parse(textContent);
            // Extract the actual identity profile from the parsed structure
            profile = parsedProfile.identityProfile || parsedProfile;
            console.log('[PromptsService] Successfully parsed nested profile structure');
            console.log('[PromptsService] DEBUG - Parsed profile keys:', Object.keys(profile));
            
            // Debug the biographical data extraction
            const bio = profile.biographical || profile.biography || {};
            console.log('[PromptsService] DEBUG - Biographical data:', {
              hasName: !!bio.name,
              name: bio.name,
              age: bio.age,
              location: bio.location,
              occupation: bio.occupation,
              educationLevel: bio.educationLevel
            });
          } else {
            console.log('[PromptsService] No text content found in nested structure');
            profile = null;
          }
        } catch (error) {
          console.error('[PromptsService] Profile parsing failed:', error);
          console.error('[PromptsService] Raw content causing error:', identityProfileOrUserId.content);
          profile = null;
        }
      } else {
        // Direct identity profile object provided - normalize it
        profile = normalizeProfile(identityProfileOrUserId);
        console.log('[PromptsService] Normalized direct identity profile');
        console.log('[PromptsService] DEBUG - Normalized profile keys:', Object.keys(profile));
      }
    } else {
      // UserId provided, fetch profile from database
      const userId = identityProfileOrUserId || 'default';
      try {
        profile = await getIdentityProfile(userId);
        if (profile) {
          profile = normalizeProfile(profile);
          console.log(`[PromptsService] Fetched and normalized profile for user ${userId}`);
        } else {
          console.log(`[PromptsService] No profile found for user ${userId}`);
        }
        console.log('[PromptsService] DEBUG - Fetched profile keys:', profile ? Object.keys(profile) : 'null');
      } catch (error) {
        console.error(`[PromptsService] Error fetching profile for user ${userId}:`, error);
        profile = null;
      }
    }
    
    if (profile) {
      // Format biographical information
      // Handle both camelCase and snake_case property names
      const bio = profile.biographical || profile.biographical_data || {};
      let bioContext = 'User Biographical Information:\n';
      Object.entries(bio).forEach(([key, value]) => {
        if (value && (typeof value === 'string' ? value.trim() : value)) {
          bioContext += `- ${key}: ${value}\n`;
        }
      });
      
      // Format personality information
      // Handle both camelCase and snake_case property names
      const personality = profile.personalityProfile || profile.personality_profile || {};
      let personalityContext = '\nUser Personality Profile:\n';
      
      // Handle big five traits (support both camelCase and snake_case)
      const bigFive = personality.bigFive || personality.big_five;
      if (bigFive) {
        personalityContext += '- Big Five Traits:\n';
        Object.entries(bigFive).forEach(([trait, score]) => {
          if (score !== null) {
            personalityContext += `  * ${trait}: ${score}\n`;
          }
        });
      }
      
      // Handle other personality aspects
      ['cognitiveStyle', 'emotionalRegulation', 'selfConcept'].forEach(category => {
        if (personality[category]) {
          personalityContext += `- ${category}:\n`;
          Object.entries(personality[category]).forEach(([aspect, value]) => {
            if (value !== null && (typeof value === 'string' ? value.trim() : value)) {
              personalityContext += `  * ${aspect}: ${value}\n`;
            }
          });
        }
      });
      
      // Add direct values (support both camelCase and snake_case)
      const directFields = [
        { camel: 'attachmentStyle', snake: 'attachment_style', display: 'Attachment Style' },
        { camel: 'locusOfControl', snake: 'locus_of_control', display: 'Locus of Control' },
        { camel: 'motivationalOrientation', snake: 'motivational_orientation', display: 'Motivational Orientation' }
      ];
      
      directFields.forEach(field => {
        const value = personality[field.camel] || personality[field.snake];
        if (value) {
          if (Array.isArray(value)) {
            personalityContext += `- ${field.display}: ${value.join(', ')}\n`;
          } else {
            personalityContext += `- ${field.display}: ${value}\n`;
          }
        }
      });
      
      // Combine contexts
      profileContext = `${bioContext}${personalityContext}\n\nPlease consider this user information in your response.`;
      logger.info('[PromptsService] Successfully added identity profile context');
    } else {
      logger.warn('[PromptsService] No valid identity profile found, proceeding without profile context');
    }
  } catch (error) {
    logger.error(`[PromptsService] Error fetching identity profile: ${error.message}`);
    // Continue without the profile data if there's an error
  }

  // DEBUG: Log the model being used
  console.log('[PromptsService] DEBUG - Model info:', {
    modelParam: model,
    modelType: typeof model,
    modelLength: model ? model.length : 'null',
    modelTrimmed: model ? model.trim() : 'null'
  });

  // Use the model as-is (dynamically fetched from OpenAI API)
  // Only provide a fallback if no model is specified
  let validatedModel = model;
  if (!model || model.trim() === '') {
    validatedModel = 'gpt-4o'; // Default fallback
    console.log('[PromptsService] No model specified, using default:', validatedModel);
  } else {
    console.log('[PromptsService] Using requested model:', validatedModel);
  }

  // ENHANCED: Add profile context validation before sending to OpenAI
  if (profileContext) {
    console.log('[PromptsService] Profile context length:', profileContext.length);
    console.log('[PromptsService] Profile context preview:', profileContext.substring(0, 200) + '...');
    logger.info('[PromptsService] Including identity profile context in AI Feedback request');
  } else {
    console.warn('[PromptsService] No profile context generated - AI responses will be generic');
    logger.warn('[PromptsService] AI Feedback will not be personalized without profile context');
  }

  // Determine which token parameter to use based on model
  // GPT-5 models: omit token limit (let OpenAI use default)
  // GPT-4o, GPT-4-turbo use max_completion_tokens
  // Older models (gpt-3.5, gpt-4 without suffix) use max_tokens
  const isGpt5Model = validatedModel.startsWith('gpt-5');
  const isOlderModel = validatedModel.startsWith('gpt-3') || 
                       validatedModel === 'gpt-4' ||
                       validatedModel.startsWith('gpt-4-0') ||
                       validatedModel.startsWith('gpt-4-1');
  
  // Select the appropriate token limit parameter
  // GPT-5 models don't need a token limit specified
  let tokenParam = {};
  if (isGpt5Model) {
    // GPT-5 models - don't specify token limit
    tokenParam = {};
  } else if (isOlderModel) {
    tokenParam = { max_tokens: 1800 };
  } else {
    tokenParam = { max_completion_tokens: 1800 };
  }
  
  console.log('[PromptsService] Token parameter for feedback model', validatedModel, ':', tokenParam);
  
  // Some newer models (like gpt-5) don't support custom temperature
  const supportsTemperature = !validatedModel.startsWith('gpt-5') && !validatedModel.includes('o1-') && !validatedModel.includes('o3-');
  
  const body = {
    model: validatedModel,
    messages: [
      { role: 'system', content: personaPrompt },
      // Add profile context as a system message if available
      ...(profileContext ? [{ role: 'system', content: profileContext }] : []),
      { role: 'user', content: entryContent }
    ],
    ...(supportsTemperature ? { temperature: 0.8 } : {}),
    ...tokenParam
  };
  
  // Log the messages being sent (but mask any personal data)
  logger.debug(`[PromptsService] Sending ${body.messages.length} messages to OpenAI: [${body.messages.map(m => m.role).join(', ')}]`);
  console.log('[PromptsService] Message structure:', body.messages.map((msg, i) => ({
    index: i,
    role: msg.role,
    contentLength: msg.content.length,
    contentPreview: msg.content.substring(0, 50) + '...'
  })));
  
  if (profileContext) {
    logger.debug('[PromptsService] Including identity profile context in request');
  }

  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log('[PromptsService] Making OpenAI API request with model:', validatedModel);
    console.log('[PromptsService] API key preview:', apiKey.substring(0, 10) + '...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[PromptsService] OpenAI API error response:', response.status, errorText);
      logger.error(`OpenAI API error: ${response.status} ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[PromptsService] OpenAI API response received, choices:', data.choices?.length);
    
    const feedback = data.choices?.[0]?.message?.content?.trim();
    if (!feedback) {
      console.error('[PromptsService] No feedback in response:', JSON.stringify(data));
      throw new Error('No feedback returned from OpenAI.');
    }
    
    console.log('[PromptsService] Successfully got feedback, length:', feedback.length);
    return feedback;
  } catch (error) {
    console.error('[PromptsService] Error calling OpenAI for feedback:', error.message);
    console.error('[PromptsService] Full error:', error);
    logger.error('Error calling OpenAI for feedback:', error);
    throw new Error(`Failed to get feedback from AI service: ${error.message}`);
  }
}

/**
 * Get AI insights from OpenAI
 * This function is completely separate from getAIFeedback to ensure they don't interfere with each other
 * 
 * @param {string} memoriesContext - The context data from memories
 * @param {string} systemPrompt - The system prompt for the AI
 * @returns {Promise<Array>} The AI-generated insights as an array
 */
async function getAIInsights(memoriesContext, systemPrompt, identityProfileOrUserId = 'default', model = 'gpt-4o-2024-08-06') {
  logger.info('[PromptsService] Getting AI insights');
  
  // Try multiple environment variable names and fallback methods
  let apiKey = process.env.OPENAI_API_KEY || 
               process.env.OPENAI_KEY || 
               process.env.API_KEY_OPENAI;
  
  // If still no API key, try loading from config-loader as fallback
  if (!apiKey) {
    try {
      const configLoader = require('../config-loader');
      apiKey = configLoader.getOpenAIApiKey();
      if (apiKey) {
        logger.info('[PromptsService] Retrieved OpenAI API key from config loader fallback for AI Insights');
      }
    } catch (error) {
      logger.warn('[PromptsService] Config loader fallback failed for AI Insights:', error.message);
    }
  }
  
  if (!apiKey) {
    logger.error('[PromptsService] OpenAI API key not configured for AI Insights');
    logger.error('[PromptsService] Checked: OPENAI_API_KEY, OPENAI_KEY, API_KEY_OPENAI');
    throw new Error('AI insights service error: OpenAI API key not configured on the server. Please check your .env file.');
  }
  
  logger.info('[PromptsService] OpenAI API key successfully loaded for AI Insights');

  // Import the identityProfileService
  const { getIdentityProfile } = require('./identityProfileService');
  
  // Get the user's identity profile for personalized insights
  let profileContext = '';
  try {
    // DEBUG: Log what we received
    console.log('[PromptsService] DEBUG - AI Insights identityProfileOrUserId received:', {
      type: typeof identityProfileOrUserId,
      isNull: identityProfileOrUserId === null,
      isUndefined: identityProfileOrUserId === undefined,
      keys: identityProfileOrUserId && typeof identityProfileOrUserId === 'object' ? Object.keys(identityProfileOrUserId) : 'N/A'
    });
    
    // Handle both direct identity profile object and userId string
    let profile;
    
    if (identityProfileOrUserId && typeof identityProfileOrUserId === 'object') {
      // Handle nested structure from frontend: {content: [{type: "text", text: "JSON_STRING"}]}
      if (identityProfileOrUserId.content && Array.isArray(identityProfileOrUserId.content)) {
        console.log('[PromptsService] Parsing nested identity profile structure for AI Insights');
        try {
          const textContent = identityProfileOrUserId.content[0]?.text;
          if (textContent) {
            const parsedProfile = JSON.parse(textContent);
            // Extract the actual identity profile from the parsed structure
            profile = parsedProfile.identityProfile || parsedProfile;
            console.log('[PromptsService] Successfully parsed nested profile structure for AI Insights');
            console.log('[PromptsService] DEBUG - Parsed profile keys:', Object.keys(profile));
            
            // Debug the biographical data extraction
            const bio = profile.biographical || profile.biography || {};
            console.log('[PromptsService] DEBUG - AI Insights biographical data:', {
              hasName: !!bio.name,
              name: bio.name,
              age: bio.age,
              location: bio.location,
              occupation: bio.occupation,
              educationLevel: bio.educationLevel,
              spiritualOrientation: bio.spiritualOrientation
            });
          } else {
            console.log('[PromptsService] No text content found in nested structure for AI Insights');
            profile = null;
          }
        } catch (error) {
          console.error('[PromptsService] Error parsing nested identity profile for AI Insights:', error);
          profile = null;
        }
      } else {
        // Direct identity profile object provided
        profile = identityProfileOrUserId;
        console.log('[PromptsService] Using provided identity profile directly for AI Insights');
        console.log('[PromptsService] DEBUG - Profile keys:', Object.keys(profile));
      }
    } else {
      // UserId provided, fetch profile from database
      const userId = identityProfileOrUserId || 'default';
      profile = await getIdentityProfile(userId);
      console.log(`[PromptsService] Fetched identity profile for AI Insights for user ${userId}`);
      console.log('[PromptsService] DEBUG - Fetched profile keys:', profile ? Object.keys(profile) : 'null');
    }
    
    if (profile) {
      // Format biographical information for AI Insights
      const bio = profile.biographical || profile.biographical_data || {};
      let bioContext = 'User Biographical Information:\n';
      Object.entries(bio).forEach(([key, value]) => {
        if (value && (typeof value === 'string' ? value.trim() : value)) {
          bioContext += `- ${key}: ${value}\n`;
        }
      });
      
      // Format personality information for AI Insights (more detailed than feedback)
      const personality = profile.personalityProfile || profile.personality_profile || {};
      let personalityContext = '\nUser Personality Profile (for deeper psychological insights):\n';
      
      // Handle big five traits
      const bigFive = personality.bigFive || personality.big_five;
      if (bigFive) {
        personalityContext += '- Big Five Traits (0.0-1.0 scale):\n';
        Object.entries(bigFive).forEach(([trait, score]) => {
          if (score !== null) {
            personalityContext += `  * ${trait}: ${score} (${score > 0.7 ? 'High' : score > 0.3 ? 'Moderate' : 'Low'})\n`;
          }
        });
      }
      
      // Handle other personality aspects with more detail for insights
      ['cognitiveStyle', 'emotionalRegulation', 'selfConcept'].forEach(category => {
        if (personality[category]) {
          personalityContext += `- ${category}:\n`;
          Object.entries(personality[category]).forEach(([aspect, value]) => {
            if (value !== null && (typeof value === 'string' ? value.trim() : value)) {
              personalityContext += `  * ${aspect}: ${value}\n`;
            }
          });
        }
      });
      
      // Add direct values
      const directFields = [
        { camel: 'attachmentStyle', snake: 'attachment_style', display: 'Attachment Style' },
        { camel: 'locusOfControl', snake: 'locus_of_control', display: 'Locus of Control' },
        { camel: 'motivationalOrientation', snake: 'motivational_orientation', display: 'Motivational Orientation' }
      ];
      
      directFields.forEach(field => {
        const value = personality[field.camel] || personality[field.snake];
        if (value) {
          personalityContext += `- ${field.display}: ${Array.isArray(value) ? value.join(', ') : value}\n`;
        }
      });
      
      profileContext = bioContext + personalityContext;
      console.log('[PromptsService] Generated profile context for AI Insights:', profileContext.length, 'characters');
    }
  } catch (error) {
    logger.error('[PromptsService] Error processing identity profile for AI Insights:', error);
    profileContext = '';
  }

  // DEBUG: Log the model being used for AI Insights
  console.log('[PromptsService] DEBUG - AI Insights Model info:', {
    modelParam: model,
    modelType: typeof model,
    modelLength: model ? model.length : 'null',
    modelTrimmed: model ? model.trim() : 'null'
  });

  // Use the model as-is (dynamically fetched from OpenAI API)
  // Only provide a fallback if no model is specified
  let validatedModel = model;
  if (!model || model.trim() === '') {
    validatedModel = 'gpt-4o'; // Default fallback
    console.log('[PromptsService] No model specified for AI Insights, using default:', validatedModel);
  } else {
    console.log('[PromptsService] Using requested model for AI Insights:', validatedModel);
  }

  // Determine which token parameter to use based on model
  // GPT-5 models: omit token limit (let OpenAI use default)
  // GPT-4o, GPT-4-turbo use max_completion_tokens
  // Older models (gpt-3.5, gpt-4 without suffix) use max_tokens
  const isGpt5Model = validatedModel.startsWith('gpt-5');
  const isOlderModel = validatedModel.startsWith('gpt-3') || 
                       validatedModel === 'gpt-4' ||
                       validatedModel.startsWith('gpt-4-0') ||
                       validatedModel.startsWith('gpt-4-1');
  
  // Select the appropriate token limit parameter
  // GPT-5 models don't need a token limit specified
  let tokenParam = {};
  if (isGpt5Model) {
    // GPT-5 models - don't specify token limit
    tokenParam = {};
  } else if (isOlderModel) {
    tokenParam = { max_tokens: 800 };
  } else {
    tokenParam = { max_completion_tokens: 800 };
  }
  
  console.log('[PromptsService] Token parameter for model', validatedModel, ':', tokenParam);
  
  // Some newer models (like gpt-5) don't support custom temperature
  const supportsTemperature = !validatedModel.startsWith('gpt-5') && !validatedModel.includes('o1-') && !validatedModel.includes('o3-');
  
  const body = {
    model: validatedModel,
    messages: [
      { role: 'system', content: systemPrompt },
      // Add profile context as a system message if available for more personalized insights
      ...(profileContext ? [{ role: 'system', content: `IMPORTANT: Use this user profile information to provide highly personalized and psychologically-informed insights:\n\n${profileContext}` }] : []),
      { role: 'user', content: memoriesContext }
    ],
    ...(supportsTemperature ? { temperature: 0.6 } : {}),
    ...tokenParam
  };
  
  // Log the request (but mask any personal data)
  logger.debug(`[PromptsService] Sending ${body.messages.length} messages to OpenAI for insights`);
  console.log('[PromptsService] AI Insights request body:', {
    model: body.model,
    messageCount: body.messages.length,
    temperature: body.temperature,
    hasMaxCompletionTokens: !!body.max_completion_tokens,
    hasMaxTokens: !!body.max_tokens
  });

  try {
    const fetch = (await import('node-fetch')).default;
    
    console.log('[PromptsService] Making OpenAI API request for insights with model:', validatedModel);
    console.log('[PromptsService] API key preview for insights:', apiKey.substring(0, 10) + '...');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(body)
    });

    console.log('[PromptsService] OpenAI insights response status:', response.status);
    
    // Get the raw response text first to debug
    const responseText = await response.text();
    console.log('[PromptsService] 🔥 Raw response text (first 1000 chars):', responseText.substring(0, 1000));

    if (!response.ok) {
      console.error('[PromptsService] OpenAI API error for insights:', response.status, responseText);
      logger.error(`OpenAI API error for insights: ${response.status} ${responseText}`);
      throw new Error(`OpenAI API error for insights: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    
    console.log('[PromptsService] 🔥 Raw OpenAI response keys:', Object.keys(data));
    console.log('[PromptsService] 🔥 Raw OpenAI response:', JSON.stringify(data, null, 2).substring(0, 2000));
    
    // Handle different response formats from various OpenAI models
    let insightsText = null;
    
    // Standard format: data.choices[0].message.content
    if (data.choices?.[0]?.message?.content) {
      insightsText = data.choices[0].message.content.trim();
      console.log('[PromptsService] 🔥 Found content in standard format');
    }
    // Some newer models might use output_text or other fields
    else if (data.output_text) {
      insightsText = data.output_text.trim();
      console.log('[PromptsService] 🔥 Found content in output_text format');
    }
    // Check for output array format
    else if (data.output?.[0]?.content?.[0]?.text) {
      insightsText = data.output[0].content[0].text.trim();
      console.log('[PromptsService] 🔥 Found content in output array format');
    }
    
    console.log('[PromptsService] 🔥 Extracted insights text:', insightsText ? insightsText.substring(0, 500) : 'null');
    
    if (!insightsText) {
      console.log('[PromptsService] 🔥 No insights text found in response. Full response:', JSON.stringify(data));
      throw new Error('No insights returned from OpenAI.');
    }
    
    // Try to parse the response as JSON first, fallback to plain text
    try {
      // Clean up any markdown code blocks
      const cleanedText = insightsText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim();
      
      const insights = JSON.parse(cleanedText);
      
      if (!Array.isArray(insights)) {
        logger.warn('[PromptsService] OpenAI returned non-array JSON, converting to array');
        const singleInsight = typeof insights === 'string' ? insights : JSON.stringify(insights);
        return [{
          id: '1',
          type: 'general',
          title: singleInsight.length > 50 ? singleInsight.substring(0, 50) + '...' : singleInsight,
          description: singleInsight,
          confidence: 0.8,
          relatedTags: []
        }];
      }
      
      // Ensure each insight has the correct format
      const formattedInsights = insights.map((insight, index) => {
        if (typeof insight === 'string') {
          return {
            id: String(index + 1),
            type: 'general',
            title: insight.length > 50 ? insight.substring(0, 50) + '...' : insight,
            description: insight,
            confidence: 0.8,
            relatedTags: []
          };
        }
        
        // If it's already an object, ensure it has all required fields
        return {
          id: insight.id ? String(insight.id) : String(index + 1),
          type: insight.type || 'general',
          title: insight.title || (insight.description && insight.description.length > 50 ? insight.description.substring(0, 50) + '...' : insight.description) || insight.insight || 'Insight',
          description: insight.description || insight.insight || insight.title || 'No description available',
          confidence: typeof insight.confidence === 'number' ? insight.confidence : 0.8,
          relatedTags: Array.isArray(insight.relatedTags) ? insight.relatedTags : []
        };
      });
      
      logger.info('[PromptsService] Successfully parsed and formatted JSON insights');
      return formattedInsights;
    } catch (parseError) {
      logger.info('[PromptsService] JSON parse failed, treating as plain text insights');
      
      // If JSON parsing fails, treat as plain text and convert to structured format
      // Split by common delimiters and create insight objects
      const textInsights = insightsText
        .split(/\n\n|\n-|\n\d+\.|•/)
        .map(text => text.trim())
        .filter(text => text.length > 0)
        .map((text, index) => {
          const cleanText = text.replace(/^[-•\d+\.\s]+/, '').trim();
          return {
            id: String(index + 1),
            type: 'general',
            title: cleanText.length > 50 ? cleanText.substring(0, 50) + '...' : cleanText,
            description: cleanText,
            confidence: 0.8, // Default confidence for AI-generated insights
            relatedTags: [] // Empty array for now, could be enhanced later
          };
        });
      
      if (textInsights.length === 0) {
        // If no structured insights found, return the whole text as one insight
        return [{
          id: '1',
          type: 'general',
          title: insightsText.length > 50 ? insightsText.substring(0, 50) + '...' : insightsText,
          description: insightsText,
          confidence: 0.8,
          relatedTags: []
        }];
      }
      
      logger.info(`[PromptsService] Converted plain text to ${textInsights.length} structured insights`);
      console.log('[PromptsService] 🔥 Final structured insights:', JSON.stringify(textInsights, null, 2));
      return textInsights;
    }
  } catch (error) {
    console.log('[PromptsService] 🔥 Error in getAIInsights:', error);
    logger.error('Error calling OpenAI for insights:', error);
    throw new Error(`Failed to get insights from AI service: ${error.message}`);
  }
}

module.exports = {
  setPrompt,
  getPrompt,
  deletePrompt,
  listPrompts,
  generatePromptId,
  getAIFeedback,
  getAIInsights
};
