/**
 * Theme System - Multiple Visual Themes
 * 
 * This file defines different visual themes that can be applied to the application.
 * Each theme provides a complete set of colors for backgrounds, borders, text, and accents.
 */

export interface ThemeColors {
  // Background colors
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    hover: string;
    active: string;
  };
  
  // Border colors
  border: {
    primary: string;
    secondary: string;
    focus: string;
    divider: string;
  };
  
  // Text colors
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
  };
  
  // Accent colors (same across all themes for consistency)
  accent: {
    blue: string;
    blueHover: string;
    purple: string;
    purpleHover: string;
    green: string;
    greenHover: string;
    yellow: string;
    yellowHover: string;
    red: string;
    redHover: string;
  };
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
}

// ============================================================================
// THEME 1: MIDNIGHT (Current Default - Dark Professional)
// ============================================================================

export const midnightTheme: Theme = {
  id: 'midnight',
  name: 'Midnight',
  description: 'Dark professional theme using the exact color palette',
  colors: {
    background: {
      primary: '#080808',      // Almost black (darkest from palette)
      secondary: '#212121',    // Dark gray from palette
      tertiary: '#353535',     // Medium dark gray from palette
      elevated: '#353535',     // Same as tertiary for cards
      hover: '#667684',        // Medium gray from palette (for hover states)
      active: '#0E2235',       // Dark blue from palette (for active states)
    },
    border: {
      primary: '#353535',      // Medium dark gray for borders
      secondary: '#212121',    // Dark gray for subtle borders
      focus: '#0E2235',        // Dark blue for focus states
      divider: '#212121',      // Dark gray for dividers
    },
    text: {
      primary: '#ffffff',      // White text for contrast
      secondary: '#667684',    // Medium gray from palette
      tertiary: '#353535',     // Medium dark gray for muted text
      disabled: '#212121',     // Dark gray for disabled text
    },
    accent: {
      blue: '#3b82f6',
      blueHover: '#2563eb',
      purple: '#9333ea',
      purpleHover: '#7e22ce',
      green: '#10b981',
      greenHover: '#059669',
      yellow: '#f59e0b',
      yellowHover: '#d97706',
      red: '#ef4444',
      redHover: '#dc2626',
    },
  },
};

// ============================================================================
// THEME 2: OCEAN (Cool Blue-Gray Theme)
// ============================================================================

export const oceanTheme: Theme = {
  id: 'ocean',
  name: 'Ocean',
  description: 'Cool blue-gray theme inspired by deep ocean waters',
  colors: {
    background: {
      primary: '#0f1419',      // Deep ocean blue-black
      secondary: '#1a2332',    // Dark blue-gray
      tertiary: '#1f2937',     // Slate blue
      elevated: '#2d3748',     // Medium blue-gray
      hover: '#374151',        // Lighter blue-gray
      active: '#4b5563',       // Active blue-gray
    },
    border: {
      primary: '#374151',
      secondary: '#2d3748',
      focus: '#4b5563',
      divider: '#1f2937',
    },
    text: {
      primary: '#e2e8f0',      // Light blue-white
      secondary: '#94a3b8',    // Medium blue-gray
      tertiary: '#64748b',     // Muted blue-gray
      disabled: '#475569',
    },
    accent: {
      blue: '#3b82f6',
      blueHover: '#2563eb',
      purple: '#9333ea',
      purpleHover: '#7e22ce',
      green: '#10b981',
      greenHover: '#059669',
      yellow: '#f59e0b',
      yellowHover: '#d97706',
      red: '#ef4444',
      redHover: '#dc2626',
    },
  },
};

// ============================================================================
// THEME 3: FOREST (Warm Green-Gray Theme)
// ============================================================================

export const forestTheme: Theme = {
  id: 'forest',
  name: 'Forest',
  description: 'Warm green-gray theme inspired by forest twilight',
  colors: {
    background: {
      primary: '#0f1410',      // Deep forest green-black
      secondary: '#1a1f1a',    // Dark green-gray
      tertiary: '#1f2420',     // Moss green-gray
      elevated: '#2a312a',     // Medium green-gray
      hover: '#353d35',        // Lighter green-gray
      active: '#404940',       // Active green-gray
    },
    border: {
      primary: '#3a423a',
      secondary: '#2a312a',
      focus: '#454d45',
      divider: '#252a25',
    },
    text: {
      primary: '#e8f0e8',      // Light green-white
      secondary: '#a8b8a8',    // Medium green-gray
      tertiary: '#6b7a6b',     // Muted green-gray
      disabled: '#4a564a',
    },
    accent: {
      blue: '#3b82f6',
      blueHover: '#2563eb',
      purple: '#9333ea',
      purpleHover: '#7e22ce',
      green: '#10b981',
      greenHover: '#059669',
      yellow: '#f59e0b',
      yellowHover: '#d97706',
      red: '#ef4444',
      redHover: '#dc2626',
    },
  },
};

// ============================================================================
// THEME REGISTRY
// ============================================================================

export const themes: Record<string, Theme> = {
  midnight: midnightTheme,
  ocean: oceanTheme,
  forest: forestTheme,
};

export const defaultTheme = midnightTheme;

// ============================================================================
// THEME UTILITIES
// ============================================================================

/**
 * Get a theme by ID
 */
export function getTheme(themeId: string): Theme {
  return themes[themeId] || defaultTheme;
}

/**
 * Get all available themes
 */
export function getAllThemes(): Theme[] {
  return Object.values(themes);
}

/**
 * Apply a theme to the application by updating CSS variables
 */
export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  
  // Apply background colors
  root.style.setProperty('--app-bg-primary', theme.colors.background.primary);
  root.style.setProperty('--app-bg-secondary', theme.colors.background.secondary);
  root.style.setProperty('--app-bg-tertiary', theme.colors.background.tertiary);
  root.style.setProperty('--app-bg-elevated', theme.colors.background.elevated);
  root.style.setProperty('--app-bg-hover', theme.colors.background.hover);
  root.style.setProperty('--app-bg-active', theme.colors.background.active);
  
  // Apply border colors
  root.style.setProperty('--app-border-primary', theme.colors.border.primary);
  root.style.setProperty('--app-border-secondary', theme.colors.border.secondary);
  root.style.setProperty('--app-border-focus', theme.colors.border.focus);
  root.style.setProperty('--app-border-divider', theme.colors.border.divider);
  
  // Apply text colors
  root.style.setProperty('--app-text-primary', theme.colors.text.primary);
  root.style.setProperty('--app-text-secondary', theme.colors.text.secondary);
  root.style.setProperty('--app-text-tertiary', theme.colors.text.tertiary);
  root.style.setProperty('--app-text-disabled', theme.colors.text.disabled);
  
  // Store the current theme ID in localStorage
  localStorage.setItem('app-theme', theme.id);
}

/**
 * Load the saved theme from localStorage or use default
 */
export function loadSavedTheme(): Theme {
  const savedThemeId = localStorage.getItem('app-theme');
  return savedThemeId ? getTheme(savedThemeId) : defaultTheme;
}

/**
 * Initialize the theme system on app startup
 */
export function initializeTheme(): void {
  // Force midnight theme to fix any incorrect theme issues
  const theme = midnightTheme; // Always use midnight theme for now
  applyTheme(theme);
  console.log('Applied theme:', theme.name, theme.colors.background);
}
