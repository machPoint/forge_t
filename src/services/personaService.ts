/**
 * Persona Service - Frontend
 * Handles persona operations via OPAL API
 */

import opal from '@/lib/simple-opal-client';

export interface AIPersona {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
  accentColor: string;
  isDefault?: boolean;
}

type ToolResponse = {
  content?: Array<{ type?: string; text?: string }>;
  personas?: AIPersona[];
  persona?: AIPersona;
  success?: boolean;
  [key: string]: unknown;
};

function unwrapToolResponse(result: ToolResponse): ToolResponse {
  if (result && Array.isArray(result.content) && result.content[0]?.text) {
    try {
      const parsed = JSON.parse(result.content[0].text);
      if (parsed && typeof parsed === 'object') {
        return parsed as ToolResponse;
      }
    } catch {
      // Fall through to raw result
    }
  }

  return result;
}

/**
 * Get all personas for the current user
 */
export async function getPersonas(): Promise<AIPersona[]> {
  try {
    console.log('[PersonaService] Fetching personas from database');
    const result = await opal.callTool('get_personas', {});
    const unwrapped = unwrapToolResponse(result as ToolResponse);
    console.log('[PersonaService] Received personas:', unwrapped);

    if (Array.isArray(unwrapped.personas)) {
      return unwrapped.personas;
    }
    
    return [];
  } catch (error) {
    console.error('[PersonaService] Error fetching personas:', error);
    throw error;
  }
}

/**
 * Get a single persona by ID
 */
export async function getPersonaById(personaId: string): Promise<AIPersona | null> {
  try {
    const result = await opal.callTool('get_persona', { personaId });
    const unwrapped = unwrapToolResponse(result as ToolResponse);

    if (unwrapped && unwrapped.persona) {
      return unwrapped.persona;
    }
    
    return null;
  } catch (error) {
    console.error('[PersonaService] Error fetching persona:', error);
    throw error;
  }
}

/**
 * Create a new persona
 */
export async function createPersona(personaData: Omit<AIPersona, 'id'>): Promise<AIPersona> {
  try {
    console.log('[PersonaService] Creating persona:', personaData.name);
    const result = await opal.callTool('create_persona', personaData);
    const unwrapped = unwrapToolResponse(result as ToolResponse);
    console.log('[PersonaService] Created persona:', unwrapped);

    if (unwrapped && unwrapped.persona) {
      return unwrapped.persona;
    }
    
    throw new Error('Failed to create persona');
  } catch (error) {
    console.error('[PersonaService] Error creating persona:', error);
    throw error;
  }
}

/**
 * Update an existing persona
 */
export async function updatePersona(personaId: string, personaData: Omit<AIPersona, 'id'>): Promise<AIPersona> {
  try {
    console.log('[PersonaService] Updating persona:', personaId);
    const result = await opal.callTool('update_persona', {
      personaId,
      ...personaData
    });
    const unwrapped = unwrapToolResponse(result as ToolResponse);
    console.log('[PersonaService] Updated persona:', unwrapped);

    if (unwrapped && unwrapped.persona) {
      return unwrapped.persona;
    }
    
    throw new Error('Failed to update persona');
  } catch (error) {
    console.error('[PersonaService] Error updating persona:', error);
    throw error;
  }
}

/**
 * Delete a persona
 */
export async function deletePersona(personaId: string): Promise<boolean> {
  try {
    console.log('[PersonaService] Deleting persona:', personaId);
    const result = await opal.callTool('delete_persona', { personaId });
    const unwrapped = unwrapToolResponse(result as ToolResponse);
    console.log('[PersonaService] Deleted persona:', unwrapped);

    return unwrapped && unwrapped.success === true;
  } catch (error) {
    console.error('[PersonaService] Error deleting persona:', error);
    throw error;
  }
}

/**
 * Initialize default personas for a new user
 * This is called automatically when a user first logs in
 */
export async function initializeDefaultPersonas(): Promise<void> {
  try {
    // Check if user already has personas
    const existingPersonas = await getPersonas();
    
    if (existingPersonas.length > 0) {
      console.log('[PersonaService] User already has personas, skipping initialization');
      return;
    }
    
    console.log('[PersonaService] Initializing default personas');
    
    // Create default personas
    const defaultPersonas = [
      {
        name: "Jungian Guide",
        description: "Provides feedback based on Jungian psychology and archetypes",
        icon: "psychology",
        prompt: "Analyze this journal entry from a Jungian perspective, focusing on archetypes, the shadow, and the collective unconscious.",
        accentColor: "rgb(74, 134, 232)"
      },
      {
        name: "CBT Coach",
        description: "Offers cognitive behavioral therapy insights",
        icon: "brain",
        prompt: "Analyze this journal entry using cognitive behavioral therapy principles. Identify cognitive distortions and suggest alternative thought patterns.",
        accentColor: "rgb(52, 168, 83)"
      },
      {
        name: "Supportive Friend",
        description: "Provides empathetic and encouraging feedback",
        icon: "heart",
        prompt: "Respond to this journal entry with empathy, validation, and gentle encouragement, as a supportive friend would.",
        accentColor: "rgb(234, 67, 53)"
      },
      {
        name: "Stern Mentor",
        description: "Gives direct, challenging feedback to promote growth",
        icon: "target",
        prompt: "Analyze this journal entry with direct, challenging feedback. Point out blind spots and suggest actionable steps for growth.",
        accentColor: "rgb(251, 188, 5)"
      }
    ];
    
    for (const personaData of defaultPersonas) {
      await createPersona(personaData);
    }
    
    console.log('[PersonaService] Default personas initialized');
  } catch (error) {
    console.error('[PersonaService] Error initializing default personas:', error);
    throw error;
  }
}
