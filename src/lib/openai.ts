// Utility to call OpenAI API for AI feedback and insights

import opal from './simple-opal-client';
import { IdentityProfile } from '@/pages/ProfilePage';
import { getIdentityProfile } from './identityProfileService';
import { getSelectedModel } from './modelConfig';

// Define types for personality profile structure
interface BigFiveTraits {
  openness?: number;
  conscientiousness?: number;
  extraversion?: number;
  agreeableness?: number;
  neuroticism?: number;
}

interface PersonalityProfile {
  big_five?: BigFiveTraits;
  attachment_style?: string;
  locus_of_control?: string;
  motivational_orientation?: string[];
  // Also support camelCase variants for backward compatibility
  bigFive?: BigFiveTraits;
  attachmentStyle?: string;
  locusOfControl?: string;
  motivationalOrientation?: string[];
}

// Define a type for accessing normalized camelCase properties 
type ExtendedProfile = IdentityProfile & {
  personality_profile: PersonalityProfile;
};

/**
 * Gets AI feedback by calling the backend tool
 * @param {string} entryContent The content to get feedback on
 * @param {string} personaPrompt The persona to use for the feedback
 * @param {IdentityProfile} identityProfile Optional identity profile data with biographical and personality data
 * @returns {Promise<string>} The AI-generated feedback
 */
/**
 * Gets AI feedback for journal entries by calling the backend tool
 * @param {string} entryContent The content to get feedback on
 * @param {string} personaPrompt The persona to use for the feedback
 * @param {Record<string, unknown>} identityProfile Optional identity profile data with biographical and personality data
 * @returns {Promise<string>} The AI-generated feedback
 */
export async function getAIFeedback(entryContent: string, personaPrompt: string, identityProfile?: IdentityProfile): Promise<string> {
  if (!opal.ready()) {
    throw new Error('OPAL server is not connected.');
  }

  try {
    // Get the selected model
    const selectedModel = getSelectedModel();
    
    // DEBUG: Log detailed model information
    console.log('[getAIFeedback] DEBUG - Model details:', {
      selectedModel: selectedModel,
      modelType: typeof selectedModel,
      modelLength: selectedModel ? selectedModel.length : 'null',
      modelCharCodes: selectedModel ? selectedModel.split('').map(c => c.charCodeAt(0)) : 'null',
      modelJSON: JSON.stringify(selectedModel)
    });
    
    // Log what we're sending to ensure personality data is included
    console.log('[getAIFeedback] Sending to backend:', { 
      hasIdentityProfile: !!identityProfile,
      hasBiographical: !!(identityProfile?.biographical),
      hasPersonality: !!(identityProfile?.personality_profile),
      selectedModel: selectedModel
    });
    
    // Detailed personality data validation log
    if (identityProfile?.personality_profile) {
      const pp = identityProfile.personality_profile;
      const extendedPP = pp as PersonalityProfile & { bigFive?: BigFiveTraits };
      
      // Check for both snake_case and camelCase properties to verify normalization
      console.log('[getAIFeedback] Personality data validation:', {
        // Big Five traits
        openness: pp.big_five?.openness || extendedPP.bigFive?.openness,
        conscientiousness: pp.big_five?.conscientiousness || extendedPP.bigFive?.conscientiousness,
        extraversion: pp.big_five?.extraversion || extendedPP.bigFive?.extraversion,
        agreeableness: pp.big_five?.agreeableness || extendedPP.bigFive?.agreeableness,
        neuroticism: pp.big_five?.neuroticism || extendedPP.bigFive?.neuroticism,
        
        // Core traits
        attachmentStyle: pp.attachment_style || extendedPP.attachmentStyle,
        locusOfControl: pp.locus_of_control || extendedPP.locusOfControl,
        
        // Has arrays
        hasMotivationalOrientation: Array.isArray(pp.motivational_orientation || extendedPP.motivationalOrientation),
        motivationalOrientationSample: Array.isArray(pp.motivational_orientation || extendedPP.motivationalOrientation) ? 
          (pp.motivational_orientation || extendedPP.motivationalOrientation)[0] : 'None'
      });
    }
    
    // Ensure we're not double-nesting the identity profile
    console.log('[getAIFeedback] Identity profile structure check:', {
      isNested: identityProfile && 'identityProfile' in identityProfile,
      topLevelKeys: identityProfile ? Object.keys(identityProfile) : []
    });
    
    // Use the correct structure - avoid double nesting
    const identityProfileToSend = identityProfile && 'identityProfile' in identityProfile 
      ? identityProfile.identityProfile 
      : identityProfile;
      
    const result = await opal.callTool('get_ai_feedback', {
      content: entryContent,
      persona: personaPrompt,
      identityProfile: identityProfileToSend,
      model: selectedModel
    });
    
    console.log('[getAIFeedback] Sent to AI:', {
      contentPreview: entryContent.substring(0, 50) + '...',
      personaPromptPreview: personaPrompt.substring(0, 50) + '...',
      identityProfileSent: !!identityProfileToSend
    });
    
    // We expect a string response for AI Feedback, not an array
    if (Array.isArray(result)) {
      console.log('Unexpected array response for AI Feedback');
      return 'Unexpected response format from AI feedback service. Please try again.';
    }
    
    // Handle the MCP formatted response from toolsService.formatToolResult
    if (result && Array.isArray(result.content)) {
      // Extract text from the first content item of type 'text'
      const textContent = result.content.find(item => item.type === 'text');
      if (textContent && typeof textContent.text === 'string') {
        return textContent.text;
      }
    }

    // The tool returns a text result directly
    if (result && typeof result.text === 'string') {
      return result.text;
    }

    // Handle cases where the result might be straight text
    if (typeof result === 'string') {
      return result;
    }
    
    console.error('Invalid feedback format:', result);
    throw new Error('Invalid feedback format received from the server.');

  } catch (error) {
    console.error('Error getting AI feedback:', error);
    throw new Error(`Failed to get AI feedback: ${error.message}`);
  }
}

/**
 * Gets AI insights for Core memories by calling the backend tool
 * This function is completely separate from getAIFeedback to ensure they don't interfere with each other
 * @param {string} memoriesContext The memories context to analyze
 * @param {string} systemPrompt The system prompt for the AI
 * @returns {Promise<Array<{id: string, type: string, title: string, description: string, confidence: number, relatedTags: string[]}>>} Array of AI-generated insights
 */
export async function getAIInsights(memoriesContext: string, systemPrompt: string): Promise<Array<{id: string, type: string, title: string, description: string, confidence: number, relatedTags: string[]}>> {
  if (!opal.ready()) {
    throw new Error('OPAL server is not connected.');
  }

  try {
    // Get the selected model
    const selectedModel = getSelectedModel();
    
    console.log('[getAIInsights] Sending memories context to backend');
    
    // Get the user's identity profile for personalized insights
    let identityProfile = null;
    try {
      identityProfile = await getIdentityProfile();
      console.log('[getAIInsights] Identity profile retrieved successfully');
    } catch (error) {
      console.warn('[getAIInsights] Failed to get identity profile:', error.message);
      console.warn('[getAIInsights] Continuing without profile data');
    }
    
    console.log('[getAIInsights] Identity profile:', {
      hasIdentityProfile: !!identityProfile,
      hasBiographical: !!(identityProfile?.biographical),
      hasPersonality: !!(identityProfile?.personality_profile),
      identityProfileKeys: identityProfile ? Object.keys(identityProfile) : [],
      selectedModel: selectedModel
    });
    
    // Call the dedicated backend tool for insights to avoid conflicts with feedback
    const result = await opal.callTool('get_ai_insights', {
      memoriesContext: memoriesContext,
      systemPrompt: systemPrompt,
      identityProfile: identityProfile,
      model: selectedModel
    });
    
    console.log('[getAIInsights] Received response:', {
      type: typeof result,
      isArray: Array.isArray(result?.insights),
      length: Array.isArray(result?.insights) ? result.insights.length : 'N/A',
      resultKeys: result ? Object.keys(result) : 'null',
      fullResult: result
    });
    
    // The new tool returns insights in a dedicated field
    if (result && Array.isArray(result.insights)) {
      console.log('[getAIInsights] Found insights array with', result.insights.length, 'items');
      console.log('[getAIInsights] First insight sample:', result.insights[0]);
      return result.insights;
    } else {
      console.log('[getAIInsights] No insights array found in result.insights');
    }
    
    // For backward compatibility, check if result itself is an array
    if (Array.isArray(result)) {
      console.log('[getAIInsights] Result is directly an array with', result.length, 'items');
      return result;
    } else {
      console.log('[getAIInsights] Result is not directly an array');
    }
    
    // If we got a string, try to parse it as JSON
    if (typeof result === 'string') {
      try {
        const parsed = JSON.parse(result.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim());
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (error) {
        console.error('Error parsing insights JSON:', error);
      }
    }
    
    // Handle MCP formatted response
    if (result && Array.isArray(result.content)) {
      console.log('[getAIInsights] Found MCP content format');
      const textContent = result.content.find(item => item.type === 'text');
      if (textContent && typeof textContent.text === 'string') {
        console.log('[getAIInsights] Found text content:', textContent.text.substring(0, 200) + '...');
        try {
          // First try to parse as JSON directly
          const parsed = JSON.parse(textContent.text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```\s*$/i, '').trim());
          
          // Check if it's the expected { insights: [...] } format
          if (parsed && Array.isArray(parsed.insights)) {
            console.log('[getAIInsights] Found insights array in MCP text with', parsed.insights.length, 'items');
            return parsed.insights;
          }
          
          // Check if it's a direct array
          if (Array.isArray(parsed)) {
            console.log('[getAIInsights] Found direct array in MCP text with', parsed.length, 'items');
            return parsed;
          }
          
          console.log('[getAIInsights] Parsed MCP text but format not recognized:', typeof parsed, parsed);
        } catch (error) {
          console.error('[getAIInsights] Error parsing insights JSON from MCP response:', error);
          console.log('[getAIInsights] Raw MCP text content:', textContent.text);
        }
      }
    }
    
    console.error('[getAIInsights] All format checks failed. Result details:', {
      type: typeof result,
      isObject: typeof result === 'object' && result !== null,
      hasInsights: result && 'insights' in result,
      insightsType: result && result.insights ? typeof result.insights : 'undefined',
      isInsightsArray: result && Array.isArray(result.insights),
      keys: result ? Object.keys(result) : 'null',
      stringified: JSON.stringify(result, null, 2)
    });
    throw new Error('Invalid insights format received from the server.');

  } catch (error) {
    console.error('Error getting AI insights:', error);
    throw new Error(`Failed to get AI insights: ${error instanceof Error ? error.message : String(error)}`);
  }
}