/**
 * Theme Configuration System
 * 
 * This file defines the available themes for the Forge application.
 * Each theme provides a complete set of colors, spacing, and styling values.
 */

export interface ThemeColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    elevated: string;
    hover: string;
    active: string;
  };
  border: {
    primary: string;
    secondary: string;
    focus: string;
    divider: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    disabled: string;
    inverse: string;
  };
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
  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  isDark: boolean;
}

// ============================================================================
// MIDNIGHT THEME (Default Dark Theme)
// ============================================================================

export const midnightTheme: Theme = {
  id: 'midnight',
  name: 'Midnight',
  description: 'Deep blacks with subtle blue accents for focused work',
  isDark: true,
  colors: {
    background: {
      primary: '#0a0a0a',
      secondary: '#141414',
      tertiary: '#1a1a1a',
      elevated: '#1f1f1f',
      hover: '#252525',
      active: '#2a2a2a',
    },
    border: {
      primary: '#2a3f5f',
      secondary: '#1a2332',
      focus: '#3b5a8f',
      divider: '#1a1a1a',
    },
    text: {
      primary: '#e8e8e8',
      secondary: '#9ca3af',
      tertiary: '#6b7280',
      disabled: '#4b5563',
      inverse: '#0a0a0a',
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
    status: {
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
};

// ============================================================================
// OCEAN THEME
// ============================================================================

export const oceanTheme: Theme = {
  id: 'ocean',
  name: 'Ocean',
  description: 'Calming blues and teals for a serene writing experience',
  isDark: true,
  colors: {
    background: {
      primary: '#0a1a2a',
      secondary: '#0f1d2d',
      tertiary: '#142438',
      elevated: '#1a2b3d',
      hover: '#1f3242',
      active: '#243947',
    },
    border: {
      primary: '#2d5f7f',
      secondary: '#1a3b4f',
      focus: '#4d8faf',
      divider: '#1a2b3d',
    },
    text: {
      primary: '#e1f0ff',
      secondary: '#9cc5e8',
      tertiary: '#6fa3d0',
      disabled: '#4a7ba7',
      inverse: '#0a1a2a',
    },
    accent: {
      blue: '#06b6d4',
      blueHover: '#0891b2',
      purple: '#8b5cf6',
      purpleHover: '#7c3aed',
      green: '#14b8a6',
      greenHover: '#0d9488',
      yellow: '#f59e0b',
      yellowHover: '#d97706',
      red: '#f87171',
      redHover: '#ef4444',
    },
    status: {
      success: '#14b8a6',
      warning: '#f59e0b',
      error: '#f87171',
      info: '#06b6d4',
    },
  },
};

// ============================================================================
// FOREST THEME
// ============================================================================

export const forestTheme: Theme = {
  id: 'forest',
  name: 'Forest',
  description: 'Natural greens and earth tones for mindful journaling',
  isDark: true,
  colors: {
    background: {
      primary: '#0a1a0a',
      secondary: '#0f1d0f',
      tertiary: '#142414',
      elevated: '#1a2b1a',
      hover: '#1f321f',
      active: '#243924',
    },
    border: {
      primary: '#2d5f2d',
      secondary: '#1a3b1a',
      focus: '#4d8f4d',
      divider: '#1a2b1a',
    },
    text: {
      primary: '#e8f5e8',
      secondary: '#9cc59c',
      tertiary: '#6fa36f',
      disabled: '#4a7b4a',
      inverse: '#0a1a0a',
    },
    accent: {
      blue: '#3b82f6',
      blueHover: '#2563eb',
      purple: '#a855f7',
      purpleHover: '#9333ea',
      green: '#22c55e',
      greenHover: '#16a34a',
      yellow: '#eab308',
      yellowHover: '#ca8a04',
      red: '#ef4444',
      redHover: '#dc2626',
    },
    status: {
      success: '#22c55e',
      warning: '#eab308',
      error: '#ef4444',
      info: '#3b82f6',
    },
  },
};

// ============================================================================
// WARM THEME (Light Option)
// ============================================================================

export const warmTheme: Theme = {
  id: 'warm',
  name: 'Warm Light',
  description: 'Soft warm tones for comfortable daytime writing',
  isDark: false,
  colors: {
    background: {
      primary: '#fdfcfb',
      secondary: '#faf9f7',
      tertiary: '#f5f4f2',
      elevated: '#ffffff',
      hover: '#f0efed',
      active: '#ebeae8',
    },
    border: {
      primary: '#d1c7bc',
      secondary: '#e5ddd5',
      focus: '#8b7355',
      divider: '#f0efed',
    },
    text: {
      primary: '#2d2318',
      secondary: '#5a4d3a',
      tertiary: '#8b7355',
      disabled: '#a69885',
      inverse: '#fdfcfb',
    },
    accent: {
      blue: '#2563eb',
      blueHover: '#1d4ed8',
      purple: '#7c3aed',
      purpleHover: '#6d28d9',
      green: '#059669',
      greenHover: '#047857',
      yellow: '#d97706',
      yellowHover: '#b45309',
      red: '#dc2626',
      redHover: '#b91c1c',
    },
    status: {
      success: '#059669',
      warning: '#d97706',
      error: '#dc2626',
      info: '#2563eb',
    },
  },
};

// ============================================================================
// THEME REGISTRY
// ============================================================================

export const themes: Theme[] = [
  midnightTheme,
  oceanTheme,
  forestTheme,
  warmTheme,
];

export const defaultTheme = midnightTheme;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export function getThemeById(id: string): Theme | null {
  return themes.find(theme => theme.id === id) || null;
}

export function getThemeByName(name: string): Theme | null {
  return themes.find(theme => theme.name.toLowerCase() === name.toLowerCase()) || null;
}

export function getDarkThemes(): Theme[] {
  return themes.filter(theme => theme.isDark);
}

export function getLightThemes(): Theme[] {
  return themes.filter(theme => !theme.isDark);
}

export default themes;