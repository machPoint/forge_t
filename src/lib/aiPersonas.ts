
export type AIPersona = {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
  accentColor: string;
};

// Default personas that will be used if no custom personas are found in localStorage
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

// Get personas from localStorage or use defaults
export const getPersonas = (): AIPersona[] => {
  if (typeof window === 'undefined') {
    return defaultPersonas;
  }
  
  try {
    const storedPersonas = window.localStorage.getItem('aiPersonas');
    return storedPersonas ? JSON.parse(storedPersonas) : defaultPersonas;
  } catch (error) {
    console.error('Error loading personas from localStorage:', error);
    return defaultPersonas;
  }
};

// For backward compatibility, expose the personas as a variable
export const aiPersonas = getPersonas();

// Get a specific persona by ID
export const getPersonaById = (id: string): AIPersona => {
  const personas = getPersonas();
  const persona = personas.find((p) => p.id === id);
  if (!persona) {
    return personas[0];
  }
  return persona;
};
