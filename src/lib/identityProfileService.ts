import opal from './simple-opal-client';
import { IdentityProfile, PersonalityProfile, BigFive, CognitiveStyle, EmotionalRegulation, SelfConcept } from '@/pages/ProfilePage';

// Type definitions for raw profile from server with snake_case
interface RawPersonalityData {
  attachment_style?: string;
  locus_of_control?: string;
  motivational_orientation?: string[];
  big_five?: Record<string, unknown>;
  cognitive_style?: Record<string, unknown>;
  emotional_regulation?: Record<string, unknown>;
  self_concept?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ExtendedPersonalityProfile extends PersonalityProfile {
  attachmentStyle?: string;
  locusOfControl?: string;
  motivationalOrientation?: string[];
  bigFive?: BigFive;
  cognitiveStyle?: CognitiveStyle;
  emotionalRegulation?: EmotionalRegulation;
  selfConcept?: SelfConcept;
  [key: string]: unknown;
}

// Cache for the identity profile to avoid excessive fetching
let cachedProfile: IdentityProfile | null = null;
let lastFetchTime: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Normalizes snake_case property values to camelCase objects
 * @param profile The profile to normalize
 * @returns Normalized profile
 */
function normalizeProfile(profile: Record<string, unknown> | null): IdentityProfile {
  if (!profile) return null;

  // Deep clone to avoid modifying the original
  const normalized = JSON.parse(JSON.stringify(profile)) as Record<string, unknown>;

  // Normalize personality_profile to camelCase for values we know are critical
  if (normalized.personality_profile) {
    const pp = normalized.personality_profile as RawPersonalityData;
    const extendedPP = pp as unknown as ExtendedPersonalityProfile;
    
    // Convert snake_case strings to camelCase
    if (pp.attachment_style) {
      extendedPP.attachmentStyle = pp.attachment_style;
    }
    
    if (pp.locus_of_control) {
      extendedPP.locusOfControl = pp.locus_of_control;
    }
    
    if (Array.isArray(pp.motivational_orientation)) {
      extendedPP.motivationalOrientation = [...pp.motivational_orientation];
    }
    
    // Also normalize nested objects
    if (pp.big_five) {
      extendedPP.bigFive = pp.big_five as unknown as BigFive;
    }
    
    if (pp.cognitive_style) {
      extendedPP.cognitiveStyle = pp.cognitive_style as unknown as CognitiveStyle;
    }
    
    if (pp.emotional_regulation) {
      extendedPP.emotionalRegulation = pp.emotional_regulation as unknown as EmotionalRegulation;
    }
    
    if (pp.self_concept) {
      extendedPP.selfConcept = pp.self_concept as unknown as SelfConcept;
    }
  }

  return normalized as unknown as IdentityProfile;
}

/**
 * Fetches identity profile from the backend
 * @returns IdentityProfile object
 */
export async function getIdentityProfile(forceRefresh = false): Promise<IdentityProfile | null> {
  // Return cached profile if available and not forcing refresh
  const now = Date.now();
  if (!forceRefresh && cachedProfile && (now - lastFetchTime) < CACHE_TTL) {
    console.log('[identityProfileService] Returning cached profile');
    return cachedProfile;
  }

  if (!opal.ready()) {
    try {
      console.log('[identityProfileService] OPAL not ready, waiting...');
      await opal.waitForReady(10000);
      console.log('[identityProfileService] OPAL is now ready');
    } catch (error) {
      console.error('[identityProfileService] OPAL not connected:', error);
      throw new Error('OPAL not connected');
    }
  }

  // Check if we need to authenticate
  const sessionId = opal.getSessionId();
  console.log('[identityProfileService] Session ID:', sessionId);

  try {
    console.log('[identityProfileService] Fetching identity profile...');
    const result = await opal.callTool('getIdentityProfile', {});
    
    console.log('[identityProfileService] Tool call result:', {
      hasResult: !!result,
      resultType: typeof result,
      isNull: result === null,
      hasError: !!(result && result.error)
    });
    
    // Handle null result (no user context)
    if (result === null) {
      console.warn('[identityProfileService] No user context available, profile unavailable');
      return null;
    }
    
    if (!result || result.error) {
      console.error('[identityProfileService] Profile fetch error:', result?.error);
      throw new Error(result?.error || 'Failed to fetch identity profile');
    }

    // Parse the profile data from OPAL response format
    let profileData: Record<string, unknown>;
    
    console.log('[identityProfileService] Raw result structure:', {
      hasContent: !!(result.content),
      isContentArray: Array.isArray(result.content),
      contentLength: Array.isArray(result.content) ? result.content.length : 'N/A',
      hasText: !!(result.content && result.content[0] && result.content[0].text),
      resultKeys: Object.keys(result)
    });
    
    if (result.content && Array.isArray(result.content) && result.content[0]?.text) {
      // Profile data is in content[0].text as JSON string
      try {
        profileData = JSON.parse(result.content[0].text);
        console.log('[identityProfileService] Parsed profile data from JSON:', profileData);
      } catch (parseError) {
        console.error('[identityProfileService] Failed to parse profile JSON:', parseError);
        console.error('[identityProfileService] Raw text content:', result.content[0].text);
        throw new Error('Failed to parse profile data');
      }
    } else {
      // Fallback: use result directly
      profileData = result as Record<string, unknown>;
      console.log('[identityProfileService] Using result directly as profile data');
    }

    // Normalize and cache the profile
    cachedProfile = normalizeProfile(profileData);
    lastFetchTime = now;
    
    console.log('[identityProfileService] Profile fetched and normalized successfully');
    return cachedProfile;
  } catch (error) {
    console.error('[identityProfileService] Error fetching identity profile:', error);
    throw error;
  }
}

/**
 * Clears the cached profile
 */
export function clearProfileCache() {
  cachedProfile = null;
  lastFetchTime = 0;
}
