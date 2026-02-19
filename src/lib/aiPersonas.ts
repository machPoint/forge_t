import { getPersonas as getPersonasFromDB, getPersonaById as getPersonaByIdFromDB } from '@/services/personaService';

export type AIPersona = {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
  accentColor: string;
};

// Default personas that will be used as fallback
export const defaultPersonas: AIPersona[] = [
  {
    id: "jungian",
    name: "Jungian Guide",
    description: "Provides feedback based on Jungian psychology and archetypes",
    icon: "psychology",
    prompt: "Analyze this journal entry from a Jungian perspective, focusing on archetypes, the shadow, and the collective unconscious.",
    accentColor: "rgb(74, 134, 232)",
  },
  {
    id: "cbt",
    name: "CBT Coach",
    description: "Offers cognitive behavioral therapy insights",
    icon: "brain",
    prompt: "Analyze this journal entry using cognitive behavioral therapy principles. Identify cognitive distortions and suggest alternative thought patterns.",
    accentColor: "rgb(52, 168, 83)",
  },
  {
    id: "supportive",
    name: "Supportive Friend",
    description: "Provides empathetic and encouraging feedback",
    icon: "heart",
    prompt: "Respond to this journal entry with empathy, validation, and gentle encouragement, as a supportive friend would.",
    accentColor: "rgb(234, 67, 53)",
  },
  {
    id: "stern",
    name: "Stern Mentor",
    description: "Gives direct, challenging feedback to promote growth",
    icon: "target",
    prompt: "Analyze this journal entry with direct, challenging feedback. Point out blind spots and suggest actionable steps for growth.",
    accentColor: "rgb(251, 188, 5)",
  },
];

// Get personas from database
export const getPersonas = async (): Promise<AIPersona[]> => {
  if (typeof window === 'undefined') {
    return defaultPersonas;
  }
  
  try {
    console.log('[getPersonas] Fetching from database');
    const personas = await getPersonasFromDB();
    console.log('[getPersonas] Fetched personas:', personas.map((p: AIPersona) => ({ id: p.id, name: p.name })));
    
    // If no personas found, return defaults (they should be initialized on login)
    if (personas.length === 0) {
      console.log('[getPersonas] No personas found, returning defaults');
      return defaultPersonas;
    }
    
    return personas;
  } catch (error) {
    console.error('Error loading personas from database:', error);
    return defaultPersonas;
  }
};

// Synchronous version for backward compatibility - returns cached or defaults
let cachedPersonas: AIPersona[] | null = null;

export const getPersonasSync = (): AIPersona[] => {
  if (cachedPersonas) {
    return cachedPersonas;
  }
  return defaultPersonas;
};

// Cache personas for synchronous access
export const cachePersonas = (personas: AIPersona[]) => {
  cachedPersonas = personas;
};

// For backward compatibility, expose the personas as a variable
export const aiPersonas = defaultPersonas;

// Get a specific persona by ID (async, DB-backed)
export const getPersonaByIdAsync = async (id: string): Promise<AIPersona> => {
  try {
    const persona = await getPersonaByIdFromDB(id);
    if (persona) {
      return persona;
    }
  } catch (error) {
    console.error('Error fetching persona by ID:', error);
  }
  
  // Fallback to cached or default personas
  const personas = cachedPersonas || defaultPersonas;
  const persona = personas.find((p) => p.id === id);
  return persona || personas[0];
};

// Get a specific persona by ID (sync, cache/default-backed)
export const getPersonaById = (id: string): AIPersona => {
  const personas = cachedPersonas || defaultPersonas;
  const persona = personas.find((p) => p.id === id);
  return persona || personas[0];
};
