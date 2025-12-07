/**
 * useTheme Hook - React integration for theme management
 * 
 * Provides a React hook interface for the theme system
 */

import { useState, useEffect, useCallback } from 'react';
import themeManager from '@/lib/theming/themeManager';
import type { Theme } from '@/lib/theming/themes';
import type { ThemeChangeEventDetail } from '@/lib/theming/themeManager';

interface UseThemeReturn {
  // Current state
  currentTheme: Theme;
  availableThemes: Theme[];
  isInitialized: boolean;
  
  // Actions
  switchTheme: (themeId: string, animate?: boolean) => Promise<void>;
  resetToDefault: (animate?: boolean) => Promise<void>;
  revertToPrevious: (animate?: boolean) => Promise<void>;
  
  // Theme info
  isDarkTheme: boolean;
  previousTheme: Theme | null;
  
  // Utilities
  getThemeById: (id: string) => Theme | null;
  isCurrentTheme: (id: string) => boolean;
}

/**
 * React hook for theme management
 */
export function useTheme(): UseThemeReturn {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeManager.getCurrentTheme());
  const [isInitialized, setIsInitialized] = useState<boolean>(themeManager.isInitialized());
  const [availableThemes] = useState<Theme[]>(themeManager.getAvailableThemes());

  // Handle theme changes
  useEffect(() => {
    const handleThemeChange = (detail: ThemeChangeEventDetail) => {
      setCurrentTheme(detail.theme);
    };

    const handleThemeLoaded = (detail: { theme: Theme }) => {
      setCurrentTheme(detail.theme);
      setIsInitialized(true);
    };

    const handleThemeError = (detail: { error: Error }) => {
      console.error('Theme error:', detail.error);
    };

    // Add event listeners
    themeManager.addEventListener('theme-changed', handleThemeChange);
    themeManager.addEventListener('theme-loaded', handleThemeLoaded);
    themeManager.addEventListener('theme-error', handleThemeError);

    // Initialize if not already done
    if (!themeManager.isInitialized()) {
      themeManager.initialize().catch(console.error);
    } else {
      setIsInitialized(true);
    }

    // Cleanup
    return () => {
      themeManager.removeEventListener('theme-changed', handleThemeChange);
      themeManager.removeEventListener('theme-loaded', handleThemeLoaded);
      themeManager.removeEventListener('theme-error', handleThemeError);
    };
  }, []);

  // Theme actions
  const switchTheme = useCallback(async (themeId: string, animate = true): Promise<void> => {
    try {
      await themeManager.switchTheme(themeId, animate);
    } catch (error) {
      console.error('Failed to switch theme:', error);
      throw error;
    }
  }, []);

  const resetToDefault = useCallback(async (animate = true): Promise<void> => {
    try {
      await themeManager.resetToDefault(animate);
    } catch (error) {
      console.error('Failed to reset theme:', error);
      throw error;
    }
  }, []);

  const revertToPrevious = useCallback(async (animate = true): Promise<void> => {
    try {
      await themeManager.revertToPreviousTheme(animate);
    } catch (error) {
      console.error('Failed to revert theme:', error);
      throw error;
    }
  }, []);

  // Utility functions
  const getThemeById = useCallback((id: string): Theme | null => {
    return availableThemes.find(theme => theme.id === id) || null;
  }, [availableThemes]);

  const isCurrentTheme = useCallback((id: string): boolean => {
    return currentTheme.id === id;
  }, [currentTheme.id]);

  return {
    // Current state
    currentTheme,
    availableThemes,
    isInitialized,
    
    // Actions
    switchTheme,
    resetToDefault,
    revertToPrevious,
    
    // Theme info
    isDarkTheme: currentTheme.isDark,
    previousTheme: themeManager.getPreviousTheme(),
    
    // Utilities
    getThemeById,
    isCurrentTheme,
  };
}

/**
 * Hook for getting theme colors with CSS variable fallbacks
 */
export function useThemeColors() {
  const { currentTheme } = useTheme();
  
  return {
    // Background colors
    bgPrimary: currentTheme.colors.background.primary,
    bgSecondary: currentTheme.colors.background.secondary,
    bgTertiary: currentTheme.colors.background.tertiary,
    bgElevated: currentTheme.colors.background.elevated,
    bgHover: currentTheme.colors.background.hover,
    bgActive: currentTheme.colors.background.active,
    
    // Border colors
    borderPrimary: currentTheme.colors.border.primary,
    borderSecondary: currentTheme.colors.border.secondary,
    borderFocus: currentTheme.colors.border.focus,
    borderDivider: currentTheme.colors.border.divider,
    
    // Text colors
    textPrimary: currentTheme.colors.text.primary,
    textSecondary: currentTheme.colors.text.secondary,
    textTertiary: currentTheme.colors.text.tertiary,
    textDisabled: currentTheme.colors.text.disabled,
    textInverse: currentTheme.colors.text.inverse,
    
    // Accent colors
    accentBlue: currentTheme.colors.accent.blue,
    accentBlueHover: currentTheme.colors.accent.blueHover,
    accentPurple: currentTheme.colors.accent.purple,
    accentPurpleHover: currentTheme.colors.accent.purpleHover,
    accentGreen: currentTheme.colors.accent.green,
    accentGreenHover: currentTheme.colors.accent.greenHover,
    accentYellow: currentTheme.colors.accent.yellow,
    accentYellowHover: currentTheme.colors.accent.yellowHover,
    accentRed: currentTheme.colors.accent.red,
    accentRedHover: currentTheme.colors.accent.redHover,
    
    // Status colors
    statusSuccess: currentTheme.colors.status.success,
    statusWarning: currentTheme.colors.status.warning,
    statusError: currentTheme.colors.status.error,
    statusInfo: currentTheme.colors.status.info,
    
    // Theme metadata
    isDark: currentTheme.isDark,
    themeName: currentTheme.name,
    themeId: currentTheme.id,
  };
}

/**
 * Hook for theme-aware CSS variable generation
 */
export function useThemeVariables() {
  const { currentTheme } = useTheme();
  
  return {
    // CSS variables for inline styles
    cssVars: {
      '--app-bg-primary': currentTheme.colors.background.primary,
      '--app-bg-secondary': currentTheme.colors.background.secondary,
      '--app-bg-tertiary': currentTheme.colors.background.tertiary,
      '--app-bg-elevated': currentTheme.colors.background.elevated,
      '--app-bg-hover': currentTheme.colors.background.hover,
      '--app-bg-active': currentTheme.colors.background.active,
      
      '--app-border-primary': currentTheme.colors.border.primary,
      '--app-border-secondary': currentTheme.colors.border.secondary,
      '--app-border-focus': currentTheme.colors.border.focus,
      '--app-border-divider': currentTheme.colors.border.divider,
      
      '--app-text-primary': currentTheme.colors.text.primary,
      '--app-text-secondary': currentTheme.colors.text.secondary,
      '--app-text-tertiary': currentTheme.colors.text.tertiary,
      '--app-text-disabled': currentTheme.colors.text.disabled,
      '--app-text-inverse': currentTheme.colors.text.inverse,
    } as React.CSSProperties,
    
    // Generate style object for components
    getStyle: (styles: Record<string, string>) => styles,
    
    // Theme class name for conditional styling
    themeClassName: `theme-${currentTheme.id}`,
    isDarkClassName: currentTheme.isDark ? 'theme-dark' : 'theme-light',
  };
}

export default useTheme;