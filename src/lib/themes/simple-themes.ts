// Simple Theme System - Using inline styles for reliability
// No CSS classes, no conflicts, just direct style objects

export interface Theme {
  id: string;
  name: string;
  description: string;
  styles: {
    // Background colors
    primaryBg: string;
    secondaryBg: string;
    elevatedBg: string;
    hoverBg: string;
    activeBg: string;
    
    // Text colors
    primaryText: string;
    secondaryText: string;
    tertiaryText: string;
    
    // Border colors
    primaryBorder: string;
    secondaryBorder: string;
    focusBorder: string;
  };
}

export const AVAILABLE_THEMES: Theme[] = [
  {
    id: 'dark-minimal',
    name: 'Dark Minimal',
    description: 'Clean dark theme with minimal distractions',
    styles: {
      primaryBg: '#0a0a0a',
      secondaryBg: '#1a1a1a',
      elevatedBg: '#252525',
      hoverBg: '#353535',
      activeBg: '#0E2235',
      
      primaryText: '#ffffff',
      secondaryText: '#b0b0b0',
      tertiaryText: '#666666',
      
      primaryBorder: '#353535',
      secondaryBorder: '#252525',
      focusBorder: '#0E2235',
    },
  },
  {
    id: 'dark-blue',
    name: 'Dark Blue',
    description: 'Dark theme with subtle blue accents',
    styles: {
      primaryBg: '#0d1117',
      secondaryBg: '#161b22',
      elevatedBg: '#21262d',
      hoverBg: '#30363d',
      activeBg: '#1f6feb',
      
      primaryText: '#f0f6fc',
      secondaryText: '#8b949e',
      tertiaryText: '#6e7681',
      
      primaryBorder: '#30363d',
      secondaryBorder: '#21262d',
      focusBorder: '#1f6feb',
    },
  },
  {
    id: 'warm-dark',
    name: 'Warm Dark',
    description: 'Dark theme with warm, cozy tones',
    styles: {
      primaryBg: '#1a1612',
      secondaryBg: '#2a251f',
      elevatedBg: '#3a342c',
      hoverBg: '#4a4339',
      activeBg: '#8b7355',
      
      primaryText: '#f5f1eb',
      secondaryText: '#d4c5b0',
      tertiaryText: '#a69680',
      
      primaryBorder: '#4a4339',
      secondaryBorder: '#3a342c',
      focusBorder: '#8b7355',
    },
  },
  {
    id: 'light-minimal',
    name: 'Light Minimal',
    description: 'Clean light theme for bright environments',
    styles: {
      primaryBg: '#ffffff',
      secondaryBg: '#f8f9fa',
      elevatedBg: '#e9ecef',
      hoverBg: '#dee2e6',
      activeBg: '#0066cc',
      
      primaryText: '#212529',
      secondaryText: '#6c757d',
      tertiaryText: '#adb5bd',
      
      primaryBorder: '#dee2e6',
      secondaryBorder: '#e9ecef',
      focusBorder: '#0066cc',
    },
  },
];

// Simple theme manager - just stores the current theme ID
class SimpleThemeManager {
  private currentThemeId: string = 'dark-minimal';
  private listeners: (() => void)[] = [];

  getCurrentTheme(): Theme {
    return AVAILABLE_THEMES.find(theme => theme.id === this.currentThemeId) || AVAILABLE_THEMES[0];
  }

  setTheme(themeId: string): void {
    const theme = AVAILABLE_THEMES.find(theme => theme.id === themeId);
    if (theme) {
      this.currentThemeId = themeId;
      localStorage.setItem('forge-theme', themeId);
      this.applyCSSVariables(theme);
      this.notifyListeners();
    }
  }

  private applyCSSVariables(theme: Theme): void {
    const root = document.documentElement;
    root.style.setProperty('--theme-primary-bg', theme.styles.primaryBg);
    root.style.setProperty('--theme-secondary-bg', theme.styles.secondaryBg);
    root.style.setProperty('--theme-elevated-bg', theme.styles.elevatedBg);
    root.style.setProperty('--theme-hover-bg', theme.styles.hoverBg);
    root.style.setProperty('--theme-active-bg', theme.styles.activeBg);
    root.style.setProperty('--theme-primary-text', theme.styles.primaryText);
    root.style.setProperty('--theme-secondary-text', theme.styles.secondaryText);
    root.style.setProperty('--theme-tertiary-text', theme.styles.tertiaryText);
    root.style.setProperty('--theme-primary-border', theme.styles.primaryBorder);
    root.style.setProperty('--theme-secondary-border', theme.styles.secondaryBorder);
    root.style.setProperty('--theme-focus-border', theme.styles.focusBorder);
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }

  initialize(): void {
    const savedTheme = localStorage.getItem('forge-theme');
    if (savedTheme && AVAILABLE_THEMES.find(theme => theme.id === savedTheme)) {
      this.currentThemeId = savedTheme;
    }
    // Apply CSS variables for the current theme
    this.applyCSSVariables(this.getCurrentTheme());
  }
}

export const themeManager = new SimpleThemeManager();

// Simple hook to use themes in components
export function useTheme() {
  const [currentTheme, setCurrentTheme] = React.useState(themeManager.getCurrentTheme());

  React.useEffect(() => {
    const unsubscribe = themeManager.subscribe(() => {
      setCurrentTheme(themeManager.getCurrentTheme());
    });
    return unsubscribe;
  }, []);

  return {
    theme: currentTheme,
    setTheme: (themeId: string) => themeManager.setTheme(themeId),
    availableThemes: AVAILABLE_THEMES,
  };
}

// Import React for the hook
import React from 'react';