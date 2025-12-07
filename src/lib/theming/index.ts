/**
 * Theming System - Main Export File
 * 
 * Central exports for the Forge theming system
 */

// Theme definitions
export * from './themes';
export { default as themes } from './themes';

// Theme management
export { default as themeManager, ThemeManager } from './themeManager';
export type { ThemeEvent, ThemeChangeEventDetail } from './themeManager';

// Theme injection utilities
export * from './themeInjector';
export { default as themeInjector } from './themeInjector';

// Re-export design tokens for consistency
export { default as designTokens } from '../design-tokens';
export * from '../design-tokens';

// Template components
export { default as PageTemplate } from '../../components/templates/PageTemplate';
export { default as CardTemplate } from '../../components/templates/CardTemplate';
export { default as SectionTemplate } from '../../components/templates/SectionTemplate';
export { default as SidebarLayoutTemplate } from '../../components/templates/SidebarLayoutTemplate';
export { default as GridLayoutTemplate, GridItemTemplate } from '../../components/templates/GridLayoutTemplate';

// UI components
export { default as ThemeSelector } from '../../components/ui/ThemeSelector';

// Legacy compatibility exports (if needed)
export { themeEngine } from './themeEngine';
export { brandManager } from './brandManager'; 
export { featureRegistry } from './featureRegistry';

// Initialize theme manager when module loads
if (typeof window !== 'undefined') {
  import('./themeManager').then(({ default: themeManager }) => {
    themeManager.initialize().catch(error => {
      console.error('Failed to initialize theme manager:', error);
    });
  });
}

// Convenience exports for common operations
import themeManager from './themeManager';
export const {
  switchTheme,
  getCurrentTheme,
  getAvailableThemes,
  addEventListener: addThemeEventListener,
  removeEventListener: removeThemeEventListener,
} = themeManager;
