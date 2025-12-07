/**
 * Theme Engine - Main orchestrator for theming system
 * Coordinates brand loading, feature initialization, and theme application
 */

import { brandManager, BrandPack } from './brandManager';
import { featureRegistry, FeatureConfig } from './featureRegistry';

export interface ThemeEngineConfig {
  brandId: string;
  autoApply: boolean;
  validateBrand: boolean;
  enableDevMode: boolean;
}

class ThemeEngine {
  private initialized = false;
  private currentBrandId: string | null = null;
  private config: ThemeEngineConfig = {
    brandId: 'forge.base',
    autoApply: true,
    validateBrand: true,
    enableDevMode: false
  };

  /**
   * Initialize the theme engine with configuration
   */
  async initialize(config?: Partial<ThemeEngineConfig>): Promise<void> {
    if (this.initialized) {
      console.warn('Theme engine already initialized');
      return;
    }

    this.config = { ...this.config, ...config };
    
    try {
      // Load and apply initial brand
      await this.loadBrand(this.config.brandId);
      this.initialized = true;
      
      console.log(`Theme engine initialized with brand: ${this.config.brandId}`);
    } catch (error) {
      console.error('Failed to initialize theme engine:', error);
      throw error;
    }
  }

  /**
   * Load and apply a brand configuration
   */
  async loadBrand(brandId: string): Promise<BrandPack> {
    try {
      console.log(`Loading brand: ${brandId}`);
      
      // Load brand configuration
      const brand = await brandManager.loadBrand(brandId);
      
      // Validate brand if enabled
      if (this.config.validateBrand) {
        const validation = brandManager.validateBrand(brand);
        if (!validation.valid) {
          console.warn('Brand validation warnings:', validation.errors);
          if (this.config.enableDevMode) {
            throw new Error(`Brand validation failed: ${validation.errors.join(', ')}`);
          }
        }
      }

      // Initialize features based on brand
      featureRegistry.initializeFromBrand(brand);
      
      // Apply theme if auto-apply is enabled
      if (this.config.autoApply) {
        brandManager.applyBrandTheme(brand);
      }

      this.currentBrandId = brandId;
      
      // Emit brand loaded event
      this.emitBrandLoadedEvent(brand);
      
      console.log(`Brand loaded successfully: ${brand.app.name}`);
      return brand;
      
    } catch (error) {
      console.error(`Failed to load brand ${brandId}:`, error);
      
      // Fallback to base brand if not already trying base
      if (brandId !== 'forge.base') {
        console.log('Falling back to base brand');
        return this.loadBrand('forge.base');
      }
      
      throw error;
    }
  }

  /**
   * Switch to a different brand
   */
  async switchBrand(brandId: string): Promise<void> {
    if (!this.initialized) {
      throw new Error('Theme engine not initialized');
    }

    if (this.currentBrandId === brandId) {
      console.log(`Already using brand: ${brandId}`);
      return;
    }

    await this.loadBrand(brandId);
  }

  /**
   * Get current brand configuration
   */
  getCurrentBrand(): BrandPack | null {
    return brandManager.getCurrentBrand();
  }

  /**
   * Get current brand ID
   */
  getCurrentBrandId(): string | null {
    return this.currentBrandId;
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(featureId: string): boolean {
    return featureRegistry.has(featureId);
  }

  /**
   * Get enabled routes for router configuration
   */
  getEnabledRoutes(): string[] {
    return featureRegistry.getEnabledRoutes();
  }

  /**
   * Get brand content
   */
  getContent(key: keyof BrandPack['content']): string {
    return brandManager.getContent(key);
  }

  /**
   * Generate CSS for current brand
   */
  generateCSS(): string {
    const brand = this.getCurrentBrand();
    if (!brand) {
      throw new Error('No brand loaded');
    }
    return brandManager.generateBrandCSS(brand);
  }

  /**
   * Apply theme manually (useful when autoApply is false)
   */
  applyTheme(): void {
    const brand = this.getCurrentBrand();
    if (!brand) {
      throw new Error('No brand loaded');
    }
    brandManager.applyBrandTheme(brand);
  }

  /**
   * Get available brands (for dev mode)
   */
  async getAvailableBrands(): Promise<string[]> {
    // In a real implementation, this would scan the brands directory
    // For now, return known brands
    return ['forge.base', 'therapeutic', 'professional', 'astro'];
  }

  /**
   * Get feature status for debugging
   */
  getFeatureStatus(): Record<string, { enabled: boolean; config: FeatureConfig }> {
    return featureRegistry.getFeatureStatus();
  }

  /**
   * Enable dev mode features
   */
  enableDevMode(): void {
    this.config.enableDevMode = true;
    console.log('Theme engine dev mode enabled');
    
    // Add dev mode CSS class to body
    document.body.classList.add('theme-dev-mode');
    
    // Log current state
    console.log('Current brand:', this.getCurrentBrand());
    console.log('Feature status:', this.getFeatureStatus());
  }

  /**
   * Disable dev mode
   */
  disableDevMode(): void {
    this.config.enableDevMode = false;
    document.body.classList.remove('theme-dev-mode');
    console.log('Theme engine dev mode disabled');
  }

  /**
   * Emit brand loaded event for components to listen to
   */
  private emitBrandLoadedEvent(brand: BrandPack): void {
    const event = new CustomEvent('brandLoaded', {
      detail: { brand, brandId: this.currentBrandId }
    });
    window.dispatchEvent(event);
  }

  /**
   * Create a brand preview (for dev mode)
   */
  async previewBrand(brandId: string): Promise<void> {
    if (!this.config.enableDevMode) {
      throw new Error('Brand preview only available in dev mode');
    }

    const originalBrandId = this.currentBrandId;
    
    try {
      await this.loadBrand(brandId);
      console.log(`Previewing brand: ${brandId}`);
      
      // Auto-revert after 10 seconds in dev mode
      setTimeout(async () => {
        if (originalBrandId) {
          await this.loadBrand(originalBrandId);
          console.log(`Reverted to original brand: ${originalBrandId}`);
        }
      }, 10000);
      
    } catch (error) {
      console.error('Failed to preview brand:', error);
      if (originalBrandId) {
        await this.loadBrand(originalBrandId);
      }
    }
  }

  /**
   * Export current brand configuration
   */
  exportBrandConfig(): string {
    const brand = this.getCurrentBrand();
    if (!brand) {
      throw new Error('No brand loaded');
    }
    return JSON.stringify(brand, null, 2);
  }

  /**
   * Reset to base brand
   */
  async resetToBase(): Promise<void> {
    await this.loadBrand('forge.base');
  }
}

// Export singleton instance
export const themeEngine = new ThemeEngine();
