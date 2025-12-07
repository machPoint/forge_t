/**
 * Brand Manager - Core theming engine for Forge
 * Handles brand configuration loading, merging, and CSS token generation
 */

export interface BrandPack {
  meta: {
    id: string;
    name: string;
    version: string;
    description: string;
    author: string;
    created: string;
    updated: string;
  };
  app: {
    name: string;
    tagline: string;
    description: string;
    version: string;
    website?: string;
    supportEmail?: string;
  };
  assets: {
    logo: string;
    icon: string;
    splash: string;
    favicon: string;
  };
  theme: {
    colors: {
      primary: Record<string, string>;
      secondary: Record<string, string>;
      accent: Record<string, string>;
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    typography: {
      fontFamily: Record<string, string[]>;
      fontSize: Record<string, string>;
    };
    spacing: Record<string, string>;
    borderRadius: Record<string, string>;
  };
  features: Record<string, boolean>;
  content: {
    welcomeMessage: string;
    aboutText: string;
    privacyStatement: string;
  };
  compliance: {
    disclaimers: string[];
    prohibitedPhrases: string[];
    requiresConsent: boolean;
  };
  windowsPackaging: {
    productName: string;
    companyName: string;
    description: string;
    copyright: string;
  };
}

class BrandManager {
  private currentBrand: BrandPack | null = null;
  private baseBrand: BrandPack | null = null;

  /**
   * Load and merge brand configurations
   */
  async loadBrand(brandId: string): Promise<BrandPack> {
    try {
      // Load base brand if not already loaded
      if (!this.baseBrand) {
        const baseResponse = await fetch('/src/brands/forge.base.json');
        this.baseBrand = await baseResponse.json();
      }

      // If requesting base brand, return it directly
      if (brandId === 'forge.base') {
        this.currentBrand = this.baseBrand;
        return this.baseBrand;
      }

      // Load brand override
      const brandResponse = await fetch(`/src/brands/brand.${brandId}.json`);
      const brandOverride = await brandResponse.json();

      // Merge base with override
      this.currentBrand = this.mergeBrandConfigs(this.baseBrand, brandOverride);
      return this.currentBrand;
    } catch (error) {
      console.error(`Failed to load brand ${brandId}:`, error);
      // Fallback to base brand
      if (this.baseBrand) {
        this.currentBrand = this.baseBrand;
        return this.baseBrand;
      }
      throw error;
    }
  }

  /**
   * Deep merge brand configurations with override precedence
   */
  private mergeBrandConfigs(base: BrandPack, override: Partial<BrandPack>): BrandPack {
    return {
      meta: { ...base.meta, ...override.meta },
      app: { ...base.app, ...override.app },
      assets: { ...base.assets, ...override.assets },
      theme: {
        colors: {
          primary: { ...base.theme.colors.primary, ...override.theme?.colors?.primary },
          secondary: { ...base.theme.colors.secondary, ...override.theme?.colors?.secondary },
          accent: { ...base.theme.colors.accent, ...override.theme?.colors?.accent },
          success: override.theme?.colors?.success || base.theme.colors.success,
          warning: override.theme?.colors?.warning || base.theme.colors.warning,
          error: override.theme?.colors?.error || base.theme.colors.error,
          info: override.theme?.colors?.info || base.theme.colors.info,
        },
        typography: {
          fontFamily: { ...base.theme.typography.fontFamily, ...override.theme?.typography?.fontFamily },
          fontSize: { ...base.theme.typography.fontSize, ...override.theme?.typography?.fontSize },
        },
        spacing: { ...base.theme.spacing, ...override.theme?.spacing },
        borderRadius: { ...base.theme.borderRadius, ...override.theme?.borderRadius },
      },
      features: { ...base.features, ...override.features },
      content: { ...base.content, ...override.content },
      compliance: {
        disclaimers: override.compliance?.disclaimers || base.compliance.disclaimers,
        prohibitedPhrases: override.compliance?.prohibitedPhrases || base.compliance.prohibitedPhrases,
        requiresConsent: override.compliance?.requiresConsent ?? base.compliance.requiresConsent,
      },
      windowsPackaging: { ...base.windowsPackaging, ...override.windowsPackaging },
    };
  }

  /**
   * Generate CSS custom properties from brand theme
   */
  generateBrandCSS(brand: BrandPack): string {
    const css: string[] = [':root {'];

    // Color tokens
    Object.entries(brand.theme.colors.primary).forEach(([shade, color]) => {
      css.push(`  --color-primary-${shade}: ${color};`);
    });

    Object.entries(brand.theme.colors.secondary).forEach(([shade, color]) => {
      css.push(`  --color-secondary-${shade}: ${color};`);
    });

    Object.entries(brand.theme.colors.accent).forEach(([shade, color]) => {
      css.push(`  --color-accent-${shade}: ${color};`);
    });

    // Semantic colors
    css.push(`  --color-success: ${brand.theme.colors.success};`);
    css.push(`  --color-warning: ${brand.theme.colors.warning};`);
    css.push(`  --color-error: ${brand.theme.colors.error};`);
    css.push(`  --color-info: ${brand.theme.colors.info};`);

    // Typography tokens
    Object.entries(brand.theme.typography.fontFamily).forEach(([name, fonts]) => {
      css.push(`  --font-${name}: ${fonts.join(', ')};`);
    });

    Object.entries(brand.theme.typography.fontSize).forEach(([size, value]) => {
      css.push(`  --text-${size}: ${value};`);
    });

    // Spacing tokens
    Object.entries(brand.theme.spacing).forEach(([size, value]) => {
      css.push(`  --spacing-${size}: ${value};`);
    });

    // Border radius tokens
    Object.entries(brand.theme.borderRadius).forEach(([size, value]) => {
      css.push(`  --radius-${size}: ${value};`);
    });

    css.push('}');

    // Component variant classes
    css.push('', '/* Component Variants */');
    
    // Button variants
    css.push('.btn-primary {');
    css.push('  background-color: var(--color-primary-600);');
    css.push('  color: white;');
    css.push('  border-radius: var(--radius-md);');
    css.push('  padding: var(--spacing-sm) var(--spacing-md);');
    css.push('}');

    css.push('.btn-primary:hover {');
    css.push('  background-color: var(--color-primary-700);');
    css.push('}');

    css.push('.btn-secondary {');
    css.push('  background-color: var(--color-secondary-200);');
    css.push('  color: var(--color-secondary-800);');
    css.push('  border-radius: var(--radius-md);');
    css.push('  padding: var(--spacing-sm) var(--spacing-md);');
    css.push('}');

    css.push('.btn-accent {');
    css.push('  background-color: var(--color-accent-600);');
    css.push('  color: white;');
    css.push('  border-radius: var(--radius-md);');
    css.push('  padding: var(--spacing-sm) var(--spacing-md);');
    css.push('}');

    // Card variants
    css.push('.card {');
    css.push('  background-color: var(--color-secondary-50);');
    css.push('  border: 1px solid var(--color-secondary-200);');
    css.push('  border-radius: var(--radius-lg);');
    css.push('  padding: var(--spacing-lg);');
    css.push('}');

    css.push('.card-dark {');
    css.push('  background-color: var(--color-secondary-800);');
    css.push('  border: 1px solid var(--color-secondary-700);');
    css.push('  color: var(--color-secondary-100);');
    css.push('}');

    return css.join('\n');
  }

  /**
   * Apply brand theme to DOM
   */
  applyBrandTheme(brand: BrandPack): void {
    const css = this.generateBrandCSS(brand);
    
    // Remove existing brand styles
    const existingStyle = document.getElementById('brand-theme');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Add new brand styles
    const styleElement = document.createElement('style');
    styleElement.id = 'brand-theme';
    styleElement.textContent = css;
    document.head.appendChild(styleElement);

    // Update document title and favicon
    document.title = brand.app.name;
    
    const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (favicon) {
      favicon.href = brand.assets.favicon;
    }
  }

  /**
   * Get current brand configuration
   */
  getCurrentBrand(): BrandPack | null {
    return this.currentBrand;
  }

  /**
   * Check if a feature is enabled in current brand
   */
  isFeatureEnabled(feature: string): boolean {
    return this.currentBrand?.features[feature] ?? false;
  }

  /**
   * Get brand content by key
   */
  getContent(key: keyof BrandPack['content']): string {
    return this.currentBrand?.content[key] || '';
  }

  /**
   * Validate brand configuration
   */
  validateBrand(brand: BrandPack): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Required fields validation
    if (!brand.meta?.id) errors.push('Brand meta.id is required');
    if (!brand.app?.name) errors.push('Brand app.name is required');
    if (!brand.theme?.colors?.primary) errors.push('Brand theme.colors.primary is required');

    // Color contrast validation (basic)
    const primaryBg = brand.theme.colors.primary['600'];
    const primaryText = '#ffffff';
    if (primaryBg && !this.hasGoodContrast(primaryBg, primaryText)) {
      errors.push('Primary color may have insufficient contrast with white text');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Basic contrast ratio check
   */
  private hasGoodContrast(bg: string, text: string): boolean {
    // Simplified contrast check - in production, use a proper contrast library
    return true; // Placeholder
  }
}

// Export singleton instance
export const brandManager = new BrandManager();
