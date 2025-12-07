/**
 * Theme Injector - CSS Variable Injection System
 * 
 * This system dynamically injects CSS custom properties into the DOM
 * based on the selected theme, enabling real-time theme switching.
 */

import type { Theme, ThemeColors } from './themes';

// Storage key for persisting theme preference
const THEME_STORAGE_KEY = 'forge-theme-preference';

/**
 * CSS Variable mapping for theme colors
 */
const CSS_VARIABLES = {
  // Background colors
  '--app-bg-primary': 'background.primary',
  '--app-bg-secondary': 'background.secondary', 
  '--app-bg-tertiary': 'background.tertiary',
  '--app-bg-elevated': 'background.elevated',
  '--app-bg-hover': 'background.hover',
  '--app-bg-active': 'background.active',
  
  // Border colors
  '--app-border-primary': 'border.primary',
  '--app-border-secondary': 'border.secondary',
  '--app-border-focus': 'border.focus',
  '--app-border-divider': 'border.divider',
  
  // Text colors
  '--app-text-primary': 'text.primary',
  '--app-text-secondary': 'text.secondary',
  '--app-text-tertiary': 'text.tertiary',
  '--app-text-disabled': 'text.disabled',
  '--app-text-inverse': 'text.inverse',
  
  // Accent colors
  '--app-accent-blue': 'accent.blue',
  '--app-accent-blue-hover': 'accent.blueHover',
  '--app-accent-purple': 'accent.purple',
  '--app-accent-purple-hover': 'accent.purpleHover',
  '--app-accent-green': 'accent.green',
  '--app-accent-green-hover': 'accent.greenHover',
  '--app-accent-yellow': 'accent.yellow',
  '--app-accent-yellow-hover': 'accent.yellowHover',
  '--app-accent-red': 'accent.red',
  '--app-accent-red-hover': 'accent.redHover',
  
  // Status colors
  '--app-status-success': 'status.success',
  '--app-status-warning': 'status.warning',
  '--app-status-error': 'status.error',
  '--app-status-info': 'status.info',
} as const;

/**
 * Get a nested property value from an object using dot notation
 */
function getNestedValue(obj: any, path: string): string | undefined {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}

/**
 * Inject theme variables into the DOM
 */
export function injectThemeVariables(theme: Theme): void {
  const root = document.documentElement;
  
  // Inject color variables
  Object.entries(CSS_VARIABLES).forEach(([cssVar, colorPath]) => {
    const colorValue = getNestedValue(theme.colors, colorPath);
    if (colorValue) {
      root.style.setProperty(cssVar, colorValue);
    }
  });
  
  // Set theme metadata
  root.setAttribute('data-theme', theme.id);
  root.setAttribute('data-theme-name', theme.name);
  root.setAttribute('data-theme-type', theme.isDark ? 'dark' : 'light');
  
  console.log(`Theme injected: ${theme.name} (${theme.id})`);
}

/**
 * Remove all theme variables from the DOM
 */
export function removeThemeVariables(): void {
  const root = document.documentElement;
  
  // Remove CSS variables
  Object.keys(CSS_VARIABLES).forEach(cssVar => {
    root.style.removeProperty(cssVar);
  });
  
  // Remove theme metadata
  root.removeAttribute('data-theme');
  root.removeAttribute('data-theme-name');
  root.removeAttribute('data-theme-type');
}

/**
 * Get the currently applied theme ID from the DOM
 */
export function getCurrentThemeId(): string | null {
  return document.documentElement.getAttribute('data-theme');
}

/**
 * Check if a theme is currently applied
 */
export function isThemeApplied(themeId: string): boolean {
  return getCurrentThemeId() === themeId;
}

/**
 * Save theme preference to localStorage
 */
export function saveThemePreference(themeId: string): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  } catch (error) {
    console.warn('Failed to save theme preference:', error);
  }
}

/**
 * Load theme preference from localStorage
 */
export function loadThemePreference(): string | null {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to load theme preference:', error);
    return null;
  }
}

/**
 * Clear theme preference from localStorage
 */
export function clearThemePreference(): void {
  try {
    localStorage.removeItem(THEME_STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear theme preference:', error);
  }
}

/**
 * Generate CSS string from theme colors (useful for dynamic styles)
 */
export function generateThemeCSS(theme: Theme): string {
  const cssRules = Object.entries(CSS_VARIABLES).map(([cssVar, colorPath]) => {
    const colorValue = getNestedValue(theme.colors, colorPath);
    return colorValue ? `  ${cssVar}: ${colorValue};` : '';
  }).filter(Boolean);
  
  return `:root {\n${cssRules.join('\n')}\n}`;
}

/**
 * Validate theme structure
 */
export function validateTheme(theme: Theme): boolean {
  if (!theme.id || !theme.name || !theme.colors) {
    return false;
  }
  
  // Check if all required color paths exist
  const requiredPaths = Object.values(CSS_VARIABLES);
  return requiredPaths.every(path => 
    getNestedValue(theme.colors, path) !== undefined
  );
}

/**
 * Apply theme transition effects
 */
export function applyThemeTransition(duration: number = 300): void {
  const root = document.documentElement;
  
  // Add transition for smooth theme switching
  const transition = `all ${duration}ms ease-in-out`;
  root.style.setProperty('--theme-transition', transition);
  
  // Apply transition to commonly affected elements
  const style = document.createElement('style');
  style.id = 'theme-transition-style';
  style.textContent = `
    * {
      transition: background-color ${duration}ms ease-in-out,
                  border-color ${duration}ms ease-in-out,
                  color ${duration}ms ease-in-out,
                  box-shadow ${duration}ms ease-in-out !important;
    }
  `;
  
  document.head.appendChild(style);
  
  // Remove transition after it completes to avoid performance issues
  setTimeout(() => {
    const transitionStyle = document.getElementById('theme-transition-style');
    if (transitionStyle) {
      transitionStyle.remove();
    }
    root.style.removeProperty('--theme-transition');
  }, duration + 50);
}

/**
 * Get all CSS custom properties currently defined on :root
 */
export function getCurrentThemeVariables(): Record<string, string> {
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  const variables: Record<string, string> = {};
  
  Object.keys(CSS_VARIABLES).forEach(cssVar => {
    const value = computedStyle.getPropertyValue(cssVar).trim();
    if (value) {
      variables[cssVar] = value;
    }
  });
  
  return variables;
}

export default {
  inject: injectThemeVariables,
  remove: removeThemeVariables,
  getCurrentId: getCurrentThemeId,
  isApplied: isThemeApplied,
  save: saveThemePreference,
  load: loadThemePreference,
  clear: clearThemePreference,
  generateCSS: generateThemeCSS,
  validate: validateTheme,
  transition: applyThemeTransition,
  getVariables: getCurrentThemeVariables,
};