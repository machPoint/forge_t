/**
 * Content Templates Configuration for Generic Base Journaling Program
 * 
 * This file defines content templates, prompts, and guided journaling modules
 * that can be customized for different audiences and use cases.
 */

export interface JournalTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  prompts: Array<{
    id: string;
    question: string;
    placeholder?: string;
    type: 'text' | 'textarea' | 'rating' | 'choice';
    options?: string[];
    required?: boolean;
  }>;
  tags?: string[];
  estimatedTime?: number; // in minutes
}

export interface ContentConfig {
  templates: JournalTemplate[];
  quickPrompts: Array<{
    id: string;
    text: string;
    category: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    description: string;
    color: string;
    icon: string;
  }>;
  defaultTags: string[];
}

// Base content configuration - generic journaling templates
export const BASE_CONTENT: ContentConfig = {
  templates: [
    {
      id: 'daily_reflection',
      name: 'Daily Reflection',
      description: 'A simple template for daily journaling and reflection',
      category: 'daily',
      estimatedTime: 10,
      prompts: [
        {
          id: 'today_summary',
          question: 'How was your day today?',
          placeholder: 'Describe the highlights, challenges, or notable moments...',
          type: 'textarea',
          required: true
        },
        {
          id: 'grateful_for',
          question: 'What are you grateful for today?',
          placeholder: 'List 3 things you appreciate from today...',
          type: 'textarea'
        },
        {
          id: 'tomorrow_intention',
          question: 'What do you want to focus on tomorrow?',
          placeholder: 'Set an intention or goal for tomorrow...',
          type: 'text'
        }
      ],
      tags: ['daily', 'reflection', 'gratitude']
    },
    {
      id: 'goal_tracking',
      name: 'Goal Progress',
      description: 'Track progress on your personal or professional goals',
      category: 'goals',
      estimatedTime: 15,
      prompts: [
        {
          id: 'goal_name',
          question: 'Which goal are you reflecting on?',
          placeholder: 'Enter the goal you want to track...',
          type: 'text',
          required: true
        },
        {
          id: 'progress_made',
          question: 'What progress did you make?',
          placeholder: 'Describe the steps you took or progress made...',
          type: 'textarea'
        },
        {
          id: 'obstacles',
          question: 'What obstacles did you encounter?',
          placeholder: 'Describe any challenges or setbacks...',
          type: 'textarea'
        },
        {
          id: 'next_steps',
          question: 'What are your next steps?',
          placeholder: 'Plan your next actions...',
          type: 'textarea'
        }
      ],
      tags: ['goals', 'progress', 'planning']
    },
    {
      id: 'creative_writing',
      name: 'Creative Writing',
      description: 'Free-form creative writing and storytelling',
      category: 'creative',
      estimatedTime: 20,
      prompts: [
        {
          id: 'writing_prompt',
          question: 'Choose a writing prompt or theme',
          placeholder: 'What would you like to write about today?',
          type: 'text'
        },
        {
          id: 'creative_content',
          question: 'Let your creativity flow',
          placeholder: 'Write your story, poem, or creative piece...',
          type: 'textarea',
          required: true
        }
      ],
      tags: ['creative', 'writing', 'storytelling']
    }
  ],
  quickPrompts: [
    { id: 'mood_check', text: 'How are you feeling right now?', category: 'mood' },
    { id: 'highlight', text: 'What was the best part of your day?', category: 'positive' },
    { id: 'challenge', text: 'What challenged you today?', category: 'growth' },
    { id: 'learning', text: 'What did you learn today?', category: 'growth' },
    { id: 'tomorrow', text: 'What are you looking forward to?', category: 'future' },
    { id: 'random_thought', text: 'What\'s on your mind?', category: 'thoughts' }
  ],
  categories: [
    { id: 'daily', name: 'Daily Life', description: 'Everyday experiences and reflections', color: '#3B82F6', icon: 'Calendar' },
    { id: 'goals', name: 'Goals & Progress', description: 'Goal setting and achievement tracking', color: '#10B981', icon: 'Target' },
    { id: 'creative', name: 'Creative', description: 'Creative writing and artistic expression', color: '#8B5CF6', icon: 'Palette' },
    { id: 'mood', name: 'Mood & Emotions', description: 'Emotional awareness and processing', color: '#F59E0B', icon: 'Heart' },
    { id: 'growth', name: 'Personal Growth', description: 'Learning and self-development', color: '#EF4444', icon: 'TrendingUp' },
    { id: 'relationships', name: 'Relationships', description: 'Social connections and interactions', color: '#06B6D4', icon: 'Users' }
  ],
  defaultTags: ['personal', 'reflection', 'journal']
};

// Therapeutic content configuration - mental health focused
export const THERAPEUTIC_CONTENT: ContentConfig = {
  templates: [
    {
      id: 'mood_tracking',
      name: 'Mood Check-In',
      description: 'Track your emotional state and identify patterns',
      category: 'mood',
      estimatedTime: 10,
      prompts: [
        {
          id: 'current_mood',
          question: 'How would you rate your mood today?',
          type: 'rating',
          options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          required: true
        },
        {
          id: 'mood_description',
          question: 'Describe how you\'re feeling',
          placeholder: 'Use words to describe your emotional state...',
          type: 'textarea'
        },
        {
          id: 'mood_triggers',
          question: 'What influenced your mood today?',
          placeholder: 'Identify events, thoughts, or situations that affected you...',
          type: 'textarea'
        },
        {
          id: 'coping_strategies',
          question: 'What helped you cope today?',
          placeholder: 'Note any strategies or activities that helped...',
          type: 'textarea'
        }
      ],
      tags: ['mood', 'mental-health', 'tracking']
    },
    {
      id: 'anxiety_processing',
      name: 'Anxiety Processing',
      description: 'Work through anxious thoughts and feelings',
      category: 'mental-health',
      estimatedTime: 15,
      prompts: [
        {
          id: 'anxiety_level',
          question: 'Rate your anxiety level (1-10)',
          type: 'rating',
          options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
          required: true
        },
        {
          id: 'anxiety_thoughts',
          question: 'What thoughts are making you anxious?',
          placeholder: 'Write down the specific thoughts or worries...',
          type: 'textarea'
        },
        {
          id: 'reality_check',
          question: 'How likely are these concerns to actually happen?',
          placeholder: 'Challenge your anxious thoughts with realistic assessment...',
          type: 'textarea'
        },
        {
          id: 'action_steps',
          question: 'What can you do about this situation?',
          placeholder: 'Identify concrete steps you can take...',
          type: 'textarea'
        }
      ],
      tags: ['anxiety', 'mental-health', 'coping']
    }
  ],
  quickPrompts: [
    { id: 'feeling_check', text: 'What emotion am I experiencing right now?', category: 'mood' },
    { id: 'body_scan', text: 'How does my body feel right now?', category: 'mindfulness' },
    { id: 'stress_level', text: 'What is my stress level today?', category: 'stress' },
    { id: 'self_compassion', text: 'What would I say to a friend in my situation?', category: 'self-care' },
    { id: 'positive_affirmation', text: 'What positive truth can I remind myself of?', category: 'positive' }
  ],
  categories: [
    { id: 'mood', name: 'Mood Tracking', description: 'Monitor emotional states and patterns', color: '#F59E0B', icon: 'Heart' },
    { id: 'mental-health', name: 'Mental Health', description: 'Process thoughts and feelings therapeutically', color: '#10B981', icon: 'Brain' },
    { id: 'mindfulness', name: 'Mindfulness', description: 'Present moment awareness and grounding', color: '#8B5CF6', icon: 'Circle' },
    { id: 'self-care', name: 'Self-Care', description: 'Nurturing and caring for yourself', color: '#06B6D4', icon: 'Flower' },
    { id: 'coping', name: 'Coping Strategies', description: 'Tools and techniques for managing challenges', color: '#EF4444', icon: 'Shield' }
  ],
  defaultTags: ['mental-health', 'therapy', 'wellness']
};

// Professional content configuration - business focused
export const PROFESSIONAL_CONTENT: ContentConfig = {
  templates: [
    {
      id: 'leadership_reflection',
      name: 'Leadership Reflection',
      description: 'Reflect on leadership decisions and team interactions',
      category: 'leadership',
      estimatedTime: 15,
      prompts: [
        {
          id: 'leadership_challenge',
          question: 'What leadership challenge did you face today?',
          placeholder: 'Describe the situation and your role...',
          type: 'textarea',
          required: true
        },
        {
          id: 'decision_process',
          question: 'How did you approach the decision-making process?',
          placeholder: 'Outline your thought process and considerations...',
          type: 'textarea'
        },
        {
          id: 'team_impact',
          question: 'How did your actions impact your team?',
          placeholder: 'Consider both positive and negative effects...',
          type: 'textarea'
        },
        {
          id: 'lessons_learned',
          question: 'What would you do differently next time?',
          placeholder: 'Identify key learnings and improvements...',
          type: 'textarea'
        }
      ],
      tags: ['leadership', 'decision-making', 'team-management']
    },
    {
      id: 'strategic_planning',
      name: 'Strategic Planning',
      description: 'Document strategic thinking and business planning',
      category: 'strategy',
      estimatedTime: 20,
      prompts: [
        {
          id: 'strategic_objective',
          question: 'What strategic objective are you working on?',
          placeholder: 'Define the goal or initiative...',
          type: 'text',
          required: true
        },
        {
          id: 'current_situation',
          question: 'What is the current state?',
          placeholder: 'Assess where things stand today...',
          type: 'textarea'
        },
        {
          id: 'opportunities',
          question: 'What opportunities do you see?',
          placeholder: 'Identify potential advantages or openings...',
          type: 'textarea'
        },
        {
          id: 'action_plan',
          question: 'What are the next strategic steps?',
          placeholder: 'Outline your strategic action plan...',
          type: 'textarea'
        }
      ],
      tags: ['strategy', 'planning', 'business']
    }
  ],
  quickPrompts: [
    { id: 'key_decision', text: 'What important decision did I make today?', category: 'decisions' },
    { id: 'team_feedback', text: 'How did my team respond to my leadership today?', category: 'leadership' },
    { id: 'business_insight', text: 'What business insight did I gain?', category: 'insights' },
    { id: 'stakeholder_interaction', text: 'How did my stakeholder meetings go?', category: 'relationships' },
    { id: 'strategic_thinking', text: 'What strategic opportunity am I considering?', category: 'strategy' }
  ],
  categories: [
    { id: 'leadership', name: 'Leadership', description: 'Leadership decisions and team management', color: '#1E40AF', icon: 'Crown' },
    { id: 'strategy', name: 'Strategy', description: 'Strategic planning and business thinking', color: '#059669', icon: 'Target' },
    { id: 'decisions', name: 'Decision Making', description: 'Important business decisions and outcomes', color: '#7C2D12', icon: 'Scale' },
    { id: 'relationships', name: 'Stakeholder Relations', description: 'Interactions with team, clients, and partners', color: '#06B6D4', icon: 'Users' },
    { id: 'insights', name: 'Business Insights', description: 'Market observations and business learnings', color: '#8B5CF6', icon: 'Lightbulb' }
  ],
  defaultTags: ['business', 'professional', 'leadership']
};

// Active content configuration - change this to switch content sets
export const ACTIVE_CONTENT = BASE_CONTENT;

// Helper function to get current content configuration
export function getContentConfig(): ContentConfig {
  return ACTIVE_CONTENT;
}

// Helper function to get templates by category
export function getTemplatesByCategory(category?: string): JournalTemplate[] {
  const config = getContentConfig();
  if (!category) return config.templates;
  return config.templates.filter(template => template.category === category);
}

// Helper function to get quick prompts by category
export function getQuickPromptsByCategory(category?: string): Array<{id: string; text: string; category: string}> {
  const config = getContentConfig();
  if (!category) return config.quickPrompts;
  return config.quickPrompts.filter(prompt => prompt.category === category);
}

// Helper function to get random quick prompt
export function getRandomQuickPrompt(): {id: string; text: string; category: string} {
  const config = getContentConfig();
  const prompts = config.quickPrompts;
  return prompts[Math.floor(Math.random() * prompts.length)];
}

// Helper function to get category by id
export function getCategoryById(id: string): {id: string; name: string; description: string; color: string; icon: string} | undefined {
  const config = getContentConfig();
  return config.categories.find(category => category.id === id);
}

// Environment-based content selection
export function getEnvironmentContent(): ContentConfig {
  const buildType = process.env.BUILD_TYPE || 'base';
  
  switch (buildType) {
    case 'therapeutic':
      return THERAPEUTIC_CONTENT;
    case 'professional':
      return PROFESSIONAL_CONTENT;
    default:
      return BASE_CONTENT;
  }
}
