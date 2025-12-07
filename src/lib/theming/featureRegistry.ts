/**
 * Feature Registry - Manages feature flags and module loading based on brand configuration
 */

import { brandManager, BrandPack } from './brandManager';

export interface FeatureConfig {
  id: string;
  name: string;
  description: string;
  dependencies?: string[];
  routes?: string[];
  components?: string[];
  defaultEnabled: boolean;
}

class FeatureRegistry {
  private features: Map<string, FeatureConfig> = new Map();
  private enabledFeatures: Set<string> = new Set();

  constructor() {
    this.registerCoreFeatures();
  }

  /**
   * Register core application features
   */
  private registerCoreFeatures(): void {
    const coreFeatures: FeatureConfig[] = [
      {
        id: 'aiFeatures',
        name: 'AI Features',
        description: 'AI-powered feedback, insights, and chat functionality',
        routes: ['/chat', '/ai-feedback'],
        components: ['AIFeedback', 'ChatInterface', 'AIInsights'],
        defaultEnabled: true
      },
      {
        id: 'therapeuticMode',
        name: 'Therapeutic Mode',
        description: 'Therapeutic journaling with specialized prompts and analysis',
        dependencies: ['aiFeatures'],
        components: ['TherapeuticPrompts', 'MoodTracking'],
        defaultEnabled: true
      },
      {
        id: 'chatInterface',
        name: 'Chat Interface',
        description: 'Real-time chat with AI therapeutic companion',
        dependencies: ['aiFeatures'],
        routes: ['/chat'],
        components: ['ChatInterface'],
        defaultEnabled: true
      },
      {
        id: 'memorySystem',
        name: 'Memory System',
        description: 'Long-term memory storage and analysis',
        routes: ['/memories'],
        components: ['MemoryManager', 'CoreInsights'],
        defaultEnabled: true
      },
      {
        id: 'exportFeatures',
        name: 'Export Features',
        description: 'Export journal entries in various formats',
        components: ['JournalExport'],
        defaultEnabled: true
      },
      {
        id: 'guidedModules',
        name: 'Guided Modules',
        description: 'Structured therapeutic and reflection modules',
        routes: ['/modules', '/guided'],
        components: ['GuidedEditor', 'ModuleManager'],
        defaultEnabled: true
      },
      {
        id: 'customPersonas',
        name: 'Custom AI Personas',
        description: 'Customizable AI personality configurations',
        dependencies: ['aiFeatures'],
        components: ['PersonaManager'],
        defaultEnabled: true
      },
      {
        id: 'themeCustomization',
        name: 'Theme Customization',
        description: 'Advanced theming and branding customization',
        components: ['CustomizationManager', 'ThemeEditor'],
        defaultEnabled: true
      },
      {
        id: 'businessTemplates',
        name: 'Business Templates',
        description: 'Professional and executive journaling templates',
        components: ['BusinessTemplates', 'StrategicReflection'],
        defaultEnabled: false
      },
      {
        id: 'moodTracking',
        name: 'Mood Tracking',
        description: 'Mood tracking and emotional pattern analysis',
        dependencies: ['therapeuticMode'],
        components: ['MoodTracker', 'EmotionAnalysis'],
        defaultEnabled: false
      },
      {
        id: 'strategicTemplates',
        name: 'Strategic Templates',
        description: 'Leadership and strategic decision-making templates',
        dependencies: ['businessTemplates'],
        components: ['StrategicTemplates', 'DecisionTracking'],
        defaultEnabled: false
      }
    ];

    coreFeatures.forEach(feature => {
      this.features.set(feature.id, feature);
    });
  }

  /**
   * Initialize features based on brand configuration
   */
  initializeFromBrand(brand: BrandPack): void {
    this.enabledFeatures.clear();

    // Enable features based on brand configuration
    Object.entries(brand.features).forEach(([featureId, enabled]) => {
      if (enabled && this.features.has(featureId)) {
        this.enableFeature(featureId);
      }
    });
  }

  /**
   * Enable a feature and its dependencies
   */
  enableFeature(featureId: string): boolean {
    const feature = this.features.get(featureId);
    if (!feature) {
      console.warn(`Feature ${featureId} not found in registry`);
      return false;
    }

    // Enable dependencies first
    if (feature.dependencies) {
      for (const depId of feature.dependencies) {
        if (!this.enabledFeatures.has(depId)) {
          if (!this.enableFeature(depId)) {
            console.error(`Failed to enable dependency ${depId} for feature ${featureId}`);
            return false;
          }
        }
      }
    }

    this.enabledFeatures.add(featureId);
    console.log(`Feature enabled: ${feature.name}`);
    return true;
  }

  /**
   * Disable a feature
   */
  disableFeature(featureId: string): void {
    this.enabledFeatures.delete(featureId);
    
    // Disable dependent features
    this.features.forEach((feature, id) => {
      if (feature.dependencies?.includes(featureId)) {
        this.disableFeature(id);
      }
    });
  }

  /**
   * Check if a feature is enabled
   */
  has(featureId: string): boolean {
    return this.enabledFeatures.has(featureId);
  }

  /**
   * Get feature configuration
   */
  get(featureId: string): FeatureConfig | undefined {
    return this.features.get(featureId);
  }

  /**
   * Get all enabled features
   */
  getEnabledFeatures(): FeatureConfig[] {
    return Array.from(this.enabledFeatures)
      .map(id => this.features.get(id))
      .filter((feature): feature is FeatureConfig => feature !== undefined);
  }

  /**
   * Get enabled routes for routing configuration
   */
  getEnabledRoutes(): string[] {
    const routes: string[] = [];
    this.enabledFeatures.forEach(featureId => {
      const feature = this.features.get(featureId);
      if (feature?.routes) {
        routes.push(...feature.routes);
      }
    });
    return [...new Set(routes)]; // Remove duplicates
  }

  /**
   * Get enabled components for dynamic imports
   */
  getEnabledComponents(): string[] {
    const components: string[] = [];
    this.enabledFeatures.forEach(featureId => {
      const feature = this.features.get(featureId);
      if (feature?.components) {
        components.push(...feature.components);
      }
    });
    return [...new Set(components)]; // Remove duplicates
  }

  /**
   * Register a custom feature
   */
  registerFeature(feature: FeatureConfig): void {
    this.features.set(feature.id, feature);
  }

  /**
   * Get feature status for debugging
   */
  getFeatureStatus(): Record<string, { enabled: boolean; config: FeatureConfig }> {
    const status: Record<string, { enabled: boolean; config: FeatureConfig }> = {};
    
    this.features.forEach((config, id) => {
      status[id] = {
        enabled: this.enabledFeatures.has(id),
        config
      };
    });

    return status;
  }
}

// Export singleton instance
export const featureRegistry = new FeatureRegistry();
