/**
 * Theme Configuration
 * Defines all available themes with their HSL color values for Tailwind CSS
 */

export interface ThemeColors {
  // Base colors
  background: string;
  foreground: string;

  // Card colors
  card: string;
  cardForeground: string;

  // Popover colors
  popover: string;
  popoverForeground: string;

  // Primary colors
  primary: string;
  primaryForeground: string;

  // Secondary colors
  secondary: string;
  secondaryForeground: string;

  // Muted colors
  muted: string;
  mutedForeground: string;

  // Accent colors
  accent: string;
  accentForeground: string;

  // Destructive colors
  destructive: string;
  destructiveForeground: string;

  // Border, input, and ring colors
  border: string;
  input: string;
  ring: string;

  // Sidebar colors
  sidebarBackground: string;
  sidebarForeground: string;
  sidebarPrimary: string;
  sidebarPrimaryForeground: string;
  sidebarAccent: string;
  sidebarAccentForeground: string;
  sidebarBorder: string;
  sidebarRing: string;

  // App-specific
  appHeaderBg: string;
  radius: string;
}

export interface Theme {
  id: string;
  name: string;
  description: string;
  isDark: boolean;
  colors: ThemeColors;
}

export const themes: Record<string, Theme> = {
  'midnight-soft': {
    id: 'midnight-soft',
    name: 'Midnight Soft',
    description: 'Monochrome dark theme with soft grays and excellent readability',
    isDark: true,
    colors: {
      background: '0 0% 8%',             // #141414 - Pure dark gray
      foreground: '0 0% 90%',            // #e6e6e6 - Soft white

      card: '0 0% 12%',                  // #1f1f1f - Elevated surfaces
      cardForeground: '0 0% 90%',

      popover: '0 0% 12%',
      popoverForeground: '0 0% 90%',

      primary: '0 0% 90%',               // Soft white
      primaryForeground: '0 0% 8%',

      secondary: '0 0% 15%',             // #262626 - Secondary surfaces
      secondaryForeground: '0 0% 90%',

      muted: '0 0% 25%',                 // #404040 - Muted elements
      mutedForeground: '0 0% 60%',       // #999999 - Muted text

      accent: '0 0% 20%',                // #333333 - Hover states
      accentForeground: '0 0% 90%',

      destructive: '0 60% 50%',          // Red for destructive
      destructiveForeground: '0 0% 90%',

      border: '0 0% 100% / 0.1',         // Transparent white border
      input: '0 0% 12%',
      ring: '0 0% 50% / 0.4',            // Gray focus ring

      sidebarBackground: '0 0% 10%',
      sidebarForeground: '0 0% 60%',
      sidebarPrimary: '0 0% 90%',
      sidebarPrimaryForeground: '0 0% 8%',
      sidebarAccent: '0 0% 15%',
      sidebarAccentForeground: '0 0% 90%',
      sidebarBorder: '0 0% 100% / 0.06',
      sidebarRing: '0 0% 50% / 0.4',

      appHeaderBg: '0 0% 10%',
      radius: '0.5rem',
    },
  },

  'dark-blue': {
    id: 'dark-blue',
    name: 'Dark Blue',
    description: 'GitHub-inspired dark theme with subtle blue accents',
    isDark: true,
    colors: {
      background: '217 32% 8%',          // #0d1117
      foreground: '213 31% 97%',         // #f0f6fc

      card: '215 28% 12%',               // #161b22
      cardForeground: '213 31% 97%',

      popover: '215 28% 12%',
      popoverForeground: '213 31% 97%',

      primary: '212 92% 56%',            // #1f6feb - GitHub blue
      primaryForeground: '213 31% 97%',

      secondary: '215 21% 17%',          // #21262d
      secondaryForeground: '213 31% 97%',

      muted: '215 21% 17%',
      mutedForeground: '218 11% 58%',    // #8b949e

      accent: '215 19% 23%',             // #30363d
      accentForeground: '213 31% 97%',

      destructive: '0 66% 54%',
      destructiveForeground: '213 31% 97%',

      border: '215 19% 23%',
      input: '215 19% 23%',
      ring: '212 92% 56%',

      sidebarBackground: '215 28% 12%',
      sidebarForeground: '218 11% 58%',
      sidebarPrimary: '213 31% 97%',
      sidebarPrimaryForeground: '217 32% 8%',
      sidebarAccent: '215 19% 23%',
      sidebarAccentForeground: '213 31% 97%',
      sidebarBorder: '215 19% 23%',
      sidebarRing: '212 92% 56%',

      appHeaderBg: '215 28% 12%',
      radius: '0.5rem',
    },
  },

  'warm-dark': {
    id: 'warm-dark',
    name: 'Warm Dark',
    description: 'Cozy dark theme with warm, earthy tones',
    isDark: true,
    colors: {
      background: '30 18% 9%',           // #1a1612
      foreground: '40 20% 95%',          // #f5f1eb

      card: '30 16% 14%',                // #2a251f
      cardForeground: '40 20% 95%',

      popover: '30 16% 14%',
      popoverForeground: '40 20% 95%',

      primary: '30 25% 44%',             // #8b7355 - Warm brown
      primaryForeground: '40 20% 95%',

      secondary: '30 15% 20%',           // #3a342c
      secondaryForeground: '40 20% 95%',

      muted: '30 15% 20%',
      mutedForeground: '35 15% 64%',     // #a69680

      accent: '30 13% 26%',              // #4a4339
      accentForeground: '40 20% 95%',

      destructive: '0 60% 50%',
      destructiveForeground: '40 20% 95%',

      border: '30 13% 26%',
      input: '30 13% 26%',
      ring: '30 25% 44%',

      sidebarBackground: '30 16% 14%',
      sidebarForeground: '35 15% 64%',
      sidebarPrimary: '40 20% 95%',
      sidebarPrimaryForeground: '30 18% 9%',
      sidebarAccent: '30 13% 26%',
      sidebarAccentForeground: '40 20% 95%',
      sidebarBorder: '30 13% 26%',
      sidebarRing: '30 25% 44%',

      appHeaderBg: '30 16% 14%',
      radius: '0.75rem',
    },
  },

  'deep-purple': {
    id: 'deep-purple',
    name: 'Deep Purple',
    description: 'Rich dark theme with purple accents',
    isDark: true,
    colors: {
      background: '260 30% 10%',         // #12101a
      foreground: '260 15% 95%',         // #f2f0f5

      card: '260 25% 15%',               // #1d1a26
      cardForeground: '260 15% 95%',

      popover: '260 25% 15%',
      popoverForeground: '260 15% 95%',

      primary: '270 65% 65%',            // #a78bfa - Purple
      primaryForeground: '260 30% 10%',

      secondary: '260 20% 20%',          // #262333
      secondaryForeground: '260 15% 95%',

      muted: '260 20% 20%',
      mutedForeground: '260 10% 70%',

      accent: '260 25% 25%',             // #322d40
      accentForeground: '260 15% 95%',

      destructive: '0 65% 60%',
      destructiveForeground: '260 15% 95%',

      border: '260 25% 25%',
      input: '260 25% 25%',
      ring: '270 65% 65%',

      sidebarBackground: '260 25% 15%',
      sidebarForeground: '260 10% 70%',
      sidebarPrimary: '260 15% 95%',
      sidebarPrimaryForeground: '260 30% 10%',
      sidebarAccent: '260 25% 25%',
      sidebarAccentForeground: '260 15% 95%',
      sidebarBorder: '260 25% 25%',
      sidebarRing: '270 65% 65%',

      appHeaderBg: '260 25% 15%',
      radius: '0.75rem',
    },
  },

  'light': {
    id: 'light',
    name: 'Light',
    description: 'Clean light theme for bright environments',
    isDark: false,
    colors: {
      background: '0 0% 98%',            // #fafafa
      foreground: '0 0% 12%',            // #1f1f1f

      card: '0 0% 100%',                 // #ffffff
      cardForeground: '0 0% 12%',

      popover: '0 0% 100%',
      popoverForeground: '0 0% 12%',

      primary: '221 83% 53%',            // #2563eb - Blue
      primaryForeground: '0 0% 100%',

      secondary: '0 0% 96%',             // #f5f5f5
      secondaryForeground: '0 0% 12%',

      muted: '0 0% 96%',
      mutedForeground: '0 0% 45%',

      accent: '0 0% 96%',
      accentForeground: '0 0% 12%',

      destructive: '0 84% 60%',
      destructiveForeground: '0 0% 100%',

      border: '0 0% 90%',
      input: '0 0% 90%',
      ring: '221 83% 53%',

      sidebarBackground: '0 0% 100%',
      sidebarForeground: '0 0% 45%',
      sidebarPrimary: '0 0% 12%',
      sidebarPrimaryForeground: '0 0% 98%',
      sidebarAccent: '0 0% 96%',
      sidebarAccentForeground: '0 0% 12%',
      sidebarBorder: '0 0% 90%',
      sidebarRing: '221 83% 53%',

      appHeaderBg: '0 0% 100%',
      radius: '0.5rem',
    },
  },
};

export const defaultTheme = themes['midnight-soft'];

export function getAllThemes(): Theme[] {
  return Object.values(themes);
}

export function getTheme(id: string): Theme {
  return themes[id] || defaultTheme;
}
