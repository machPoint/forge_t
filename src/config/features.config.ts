/**
 * Features Configuration for Generic Base Journaling Program
 * 
 * This file defines which features are enabled/disabled for different builds.
 * Use this to create specialized versions with different feature sets.
 */

export interface FeatureConfig {
  name: string;
  core: {
    journaling: boolean;
    tagging: boolean;
    search: boolean;
    export: boolean;
  };
  ai: {
    enabled: boolean;
    feedback: boolean;
    insights: boolean;
    chat: boolean;
    prompts: boolean;
    models: string[];
  };
  advanced: {
    memories: boolean;
    analytics: boolean;
    templates: boolean;
    collaboration: boolean;
    sync: boolean;
  };
  ui: {
    darkMode: boolean;
    customThemes: boolean;
    splashScreen: boolean;
    animations: boolean;
    shortcuts: boolean;
  };
  privacy: {
    localOnly: boolean;
    encryption: boolean;
    autoBackup: boolean;
    dataExport: boolean;
  };
  customization: {
    branding: boolean;
    themes: boolean;
    plugins: boolean;
    apiIntegration: boolean;
  };
}

// Base feature set - minimal but complete journaling
export const BASE_FEATURES: FeatureConfig = {
  name: "base",
  core: {
    journaling: true,
    tagging: true,
    search: true,
    export: true
  },
  ai: {
    enabled: false,
    feedback: false,
    insights: false,
    chat: false,
    prompts: false,
    models: []
  },
  advanced: {
    memories: false,
    analytics: false,
    templates: false,
    collaboration: false,
    sync: false
  },
  ui: {
    darkMode: true,
    customThemes: true,
    splashScreen: true,
    animations: true,
    shortcuts: true
  },
  privacy: {
    localOnly: true,
    encryption: false,
    autoBackup: true,
    dataExport: true
  },
  customization: {
    branding: true,
    themes: true,
    plugins: false,
    apiIntegration: false
  }
};

// Therapeutic feature set - AI-powered with mental health focus
export const THERAPEUTIC_FEATURES: FeatureConfig = {
  name: "therapeutic",
  core: {
    journaling: true,
    tagging: true,
    search: true,
    export: true
  },
  ai: {
    enabled: true,
    feedback: true,
    insights: true,
    chat: true,
    prompts: true,
    models: ["gpt-4o", "gpt-4o-mini"]
  },
  advanced: {
    memories: true,
    analytics: true,
    templates: true,
    collaboration: false,
    sync: false
  },
  ui: {
    darkMode: true,
    customThemes: true,
    splashScreen: true,
    animations: true,
    shortcuts: true
  },
  privacy: {
    localOnly: true,
    encryption: true,
    autoBackup: true,
    dataExport: true
  },
  customization: {
    branding: true,
    themes: true,
    plugins: true,
    apiIntegration: true
  }
};

// Professional feature set - business-focused with collaboration
export const PROFESSIONAL_FEATURES: FeatureConfig = {
  name: "professional",
  core: {
    journaling: true,
    tagging: true,
    search: true,
    export: true
  },
  ai: {
    enabled: true,
    feedback: true,
    insights: true,
    chat: false,
    prompts: true,
    models: ["gpt-4o"]
  },
  advanced: {
    memories: true,
    analytics: true,
    templates: true,
    collaboration: true,
    sync: true
  },
  ui: {
    darkMode: true,
    customThemes: true,
    splashScreen: false,
    animations: false,
    shortcuts: true
  },
  privacy: {
    localOnly: true,
    encryption: true,
    autoBackup: true,
    dataExport: true
  },
  customization: {
    branding: true,
    themes: true,
    plugins: true,
    apiIntegration: true
  }
};

// Development feature set - all features enabled for testing
export const DEVELOPMENT_FEATURES: FeatureConfig = {
  name: "development",
  core: {
    journaling: true,
    tagging: true,
    search: true,
    export: true
  },
  ai: {
    enabled: true,
    feedback: true,
    insights: true,
    chat: true,
    prompts: true,
    models: ["gpt-4o", "gpt-4o-mini"]
  },
  advanced: {
    memories: true,
    analytics: true,
    templates: true,
    collaboration: true,
    sync: true
  },
  ui: {
    darkMode: true,
    customThemes: true,
    splashScreen: true,
    animations: true,
    shortcuts: true
  },
  privacy: {
    localOnly: true,
    encryption: true,
    autoBackup: true,
    dataExport: true
  },
  customization: {
    branding: true,
    themes: true,
    plugins: true,
    apiIntegration: true
  }
};

// Active feature configuration - change this to switch feature sets
export const ACTIVE_FEATURES = BASE_FEATURES;

// Helper function to get current feature configuration
export function getFeatureConfig(): FeatureConfig {
  return ACTIVE_FEATURES;
}

// Helper function to check if a specific feature is enabled
export function isFeatureEnabled(category: keyof FeatureConfig, feature: string): boolean {
  const config = getFeatureConfig();
  const categoryConfig = config[category];
  
  if (typeof categoryConfig === 'object' && categoryConfig !== null) {
    // Type-safe property access using bracket notation with proper typing
    return (categoryConfig as Record<string, boolean>)[feature] === true;
  }
  
  return false;
}

// Helper function to check if AI features are available
export function isAIEnabled(): boolean {
  return getFeatureConfig().ai.enabled;
}

// Helper function to get available AI models
export function getAvailableAIModels(): string[] {
  const config = getFeatureConfig();
  return config.ai.enabled ? config.ai.models : [];
}

// Helper function to get feature-based navigation items
export function getNavigationItems(): Array<{
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  path: string;
}> {
  const config = getFeatureConfig();
  
  return [
    {
      id: 'journal',
      label: 'Journal',
      icon: 'BookOpen',
      enabled: config.core.journaling,
      path: '/journal'
    },
    {
      id: 'memories',
      label: 'Memories',
      icon: 'Brain',
      enabled: config.advanced.memories,
      path: '/memories'
    },
    {
      id: 'chat',
      label: 'AI Chat',
      icon: 'MessageCircle',
      enabled: config.ai.chat,
      path: '/chat'
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: 'BarChart3',
      enabled: config.advanced.analytics,
      path: '/analytics'
    },
    {
      id: 'templates',
      label: 'Templates',
      icon: 'FileTemplate',
      enabled: config.advanced.templates,
      path: '/templates'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: 'Settings',
      enabled: true, // Settings always available
      path: '/settings'
    }
  ].filter(item => item.enabled);
}

// Helper function to get enabled export formats
export function getEnabledExportFormats(): Array<{
  id: string;
  label: string;
  extension: string;
  description: string;
}> {
  const config = getFeatureConfig();
  
  if (!config.core.export) return [];
  
  return [
    {
      id: 'markdown',
      label: 'Markdown',
      extension: '.md',
      description: 'Export as Markdown files with formatting preserved'
    },
    {
      id: 'text',
      label: 'Plain Text',
      extension: '.txt',
      description: 'Export as simple text files'
    },
    {
      id: 'json',
      label: 'JSON',
      extension: '.json',
      description: 'Export as structured JSON data'
    },
    {
      id: 'pdf',
      label: 'PDF',
      extension: '.pdf',
      description: 'Export as PDF documents (requires advanced features)'
    }
  ];
}

// Helper function to validate feature dependencies
export function validateFeatureConfig(config: FeatureConfig): string[] {
  const errors: string[] = [];
  
  // AI features require AI to be enabled
  if (!config.ai.enabled) {
    if (config.ai.feedback) errors.push('AI feedback requires AI to be enabled');
    if (config.ai.insights) errors.push('AI insights requires AI to be enabled');
    if (config.ai.chat) errors.push('AI chat requires AI to be enabled');
    if (config.ai.prompts) errors.push('AI prompts requires AI to be enabled');
  }
  
  // AI features require models to be specified
  if (config.ai.enabled && config.ai.models.length === 0) {
    errors.push('AI features require at least one model to be specified');
  }
  
  // Collaboration requires sync
  if (config.advanced.collaboration && !config.advanced.sync) {
    errors.push('Collaboration features require sync to be enabled');
  }
  
  // Encryption requires local-only mode for security
  if (config.privacy.encryption && !config.privacy.localOnly) {
    errors.push('Encryption requires local-only mode for security');
  }
  
  return errors;
}

// Environment-based configuration selection
export function getEnvironmentFeatures(): FeatureConfig {
  const env = process.env.NODE_ENV || 'development';
  const buildType = process.env.BUILD_TYPE || 'base';
  
  switch (buildType) {
    case 'therapeutic':
      return THERAPEUTIC_FEATURES;
    case 'professional':
      return PROFESSIONAL_FEATURES;
    case 'development':
      return DEVELOPMENT_FEATURES;
    default:
      return BASE_FEATURES;
  }
}
