
export type ModuleStep = {
  id: string;
  title: string;
  description: string;
  prompt: string;
};

export type GuidedModule = {
  id: string;
  title: string;
  description: string;
  category: string;
  introduction?: string; // Optional introduction/instructions page
  steps: ModuleStep[];
  icon: string;
};

export const guidedModules: GuidedModule[] = [
  {
    id: "expressive-writing",
    title: "Expressive Writing",
    description: "Process emotions through structured writing exercises",
    category: "Emotional Well-being",
    icon: "pen-square",
    introduction: "Expressive writing is a powerful therapeutic technique backed by decades of research. Studies have shown that writing about emotional experiences for just 15-20 minutes over 3-4 days can lead to improved mental and physical health.\n\nThis module will guide you through a structured approach to process your emotions through writing. You'll identify what you're feeling, explore the context, express yourself freely, and reflect on what you discover.\n\nTips for success:\n• Find a quiet space where you won't be interrupted\n• Write continuously without worrying about grammar or spelling\n• Be honest with yourself - this is for you alone\n• Allow yourself to feel whatever comes up\n\nWhen you're ready, click 'Begin Step 1' to start.",
    steps: [
      {
        id: "identify",
        title: "Identify the Emotion",
        description: "Name and describe what you're feeling right now",
        prompt: "What emotions are you experiencing right now? Name them specifically and describe how they feel in your body.",
      },
      {
        id: "explore",
        title: "Explore the Context",
        description: "Investigate when this emotion started and what triggered it",
        prompt: "When did you first notice this emotion? What was happening around you? What might have triggered it?",
      },
      {
        id: "express",
        title: "Express Freely",
        description: "Write without filtering about your emotional experience",
        prompt: "Write freely for 10 minutes about this emotion. Don't filter or edit - just let the words flow.",
      },
      {
        id: "reflect",
        title: "Reflect and Find Meaning",
        description: "Look for patterns and insights about your emotional response",
        prompt: "What does this emotion tell you about your needs, values, or boundaries? What patterns do you notice?",
      },
    ],
  },
  {
    id: "atomic-habits",
    title: "Habit Building",
    description: "Create lasting habits using principles from Atomic Habits",
    category: "Productivity",
    icon: "repeat",
    steps: [
      {
        id: "cue",
        title: "Identify the Cue",
        description: "Recognize what triggers your current habits",
        prompt: "What triggers the habit you want to change or develop? When, where, and with whom does it typically occur?",
      },
      {
        id: "craving",
        title: "Understand the Craving",
        description: "Explore your motivation behind the habit",
        prompt: "What do you crave or desire that this habit satisfies? What feeling are you seeking?",
      },
      {
        id: "response",
        title: "Design Your Response",
        description: "Create a specific plan for your new habit",
        prompt: "What specific action will you take? Make it small, specific, and achievable. How will you make it obvious, attractive, easy, and satisfying?",
      },
      {
        id: "reward",
        title: "Establish the Reward",
        description: "Create a reward system for your new habit",
        prompt: "How will you reward yourself for following through? What immediate satisfaction can you build into the habit?",
      },
    ],
  },
  {
    id: "self-compassion",
    title: "Self-Compassion Practice",
    description: "Develop a kinder relationship with yourself",
    category: "Self-Care",
    icon: "heart-handshake",
    steps: [
      {
        id: "mindfulness",
        title: "Mindful Awareness",
        description: "Notice your self-talk without judgment",
        prompt: "What critical thoughts are you having about yourself right now? Simply notice them without judgment.",
      },
      {
        id: "humanity",
        title: "Common Humanity",
        description: "Recognize that you're not alone in your struggles",
        prompt: "How might others also experience similar struggles or feelings? How is your experience part of being human?",
      },
      {
        id: "kindness",
        title: "Self-Kindness",
        description: "Speak to yourself as you would to a good friend",
        prompt: "If a friend shared this situation with you, what would you say to them? Now, write that same message to yourself.",
      },
      {
        id: "action",
        title: "Compassionate Action",
        description: "Take one small step to care for yourself",
        prompt: "What is one small, specific action you can take right now to show yourself kindness or care?",
      },
    ],
  },
];

export const getModuleById = (id: string): GuidedModule | undefined => {
  return guidedModules.find((m) => m.id === id);
};
