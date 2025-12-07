/**
 * Theme Configuration for Generic Base Journaling Program
 * 
 * This file defines the visual themes and styling for the application.
 * Customize these values to create different visual experiences.
 */

export interface ThemeConfig {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    semantic: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    journal: {
      entryBackground: string;
      entryBorder: string;
      selectedEntry: string;
      tagBackground: string;
      tagText: string;
    };
  };
  fonts: {
    primary: string;
    secondary: string;
    monospace: string;
    journal: string; // Special font for journal content
  };
  spacing: {
    unit: number; // Base spacing unit in px
  };
  borderRadius: {
    small: string;
    medium: string;
    large: string;
  };
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
  animations: {
    duration: {
      fast: string;
      normal: string;
      slow: string;
    };
    easing: {
      default: string;
      bounce: string;
    };
  };
}

// Base theme - clean and minimal
export const BASE_THEME: ThemeConfig = {
  name: "base",
  colors: {
    primary: "#3B82F6",      // Blue
    secondary: "#10B981",    // Green
    accent: "#8B5CF6",       // Purple
    background: "#FFFFFF",   // White
    surface: "#F8FAFC",      // Light gray
    text: {
      primary: "#1F2937",    // Dark gray
      secondary: "#4B5563",  // Medium gray
      muted: "#6B7280"       // Light gray
    },
    semantic: {
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#3B82F6"
    },
    journal: {
      entryBackground: "#FFFFFF",
      entryBorder: "#E5E7EB",
      selectedEntry: "#EBF8FF",
      tagBackground: "#F3F4F6",
      tagText: "#374151"
    }
  },
  fonts: {
    primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    secondary: "'Inter', sans-serif",
    monospace: "'JetBrains Mono', 'Fira Code', monospace",
    journal: "'Georgia', 'Times New Roman', serif"
  },
  spacing: { unit: 8 },
  borderRadius: {
    small: "4px",
    medium: "8px",
    large: "16px"
  },
  shadows: {
    small: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    medium: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    large: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
  },
  animations: {
    duration: {
      fast: "150ms",
      normal: "300ms",
      slow: "500ms"
    },
    easing: {
      default: "cubic-bezier(0.4, 0, 0.2, 1)",
      bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
    }
  }
};

// Dark theme variant
export const DARK_THEME: ThemeConfig = {
  ...BASE_THEME,
  name: "dark",
  colors: {
    primary: "#60A5FA",      // Lighter blue for dark mode
    secondary: "#34D399",    // Lighter green
    accent: "#A78BFA",       // Lighter purple
    background: "#111827",   // Dark gray
    surface: "#1F2937",      // Slightly lighter dark gray
    text: {
      primary: "#F9FAFB",    // Light gray
      secondary: "#D1D5DB",  // Medium light gray
      muted: "#9CA3AF"       // Medium gray
    },
    semantic: {
      success: "#34D399",
      warning: "#FBBF24",
      error: "#F87171",
      info: "#60A5FA"
    },
    journal: {
      entryBackground: "#1F2937",
      entryBorder: "#374151",
      selectedEntry: "#1E3A8A",
      tagBackground: "#374151",
      tagText: "#D1D5DB"
    }
  },
  shadows: {
    small: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
    medium: "0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -1px rgba(0, 0, 0, 0.3)",
    large: "0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.3)"
  }
};

// Therapeutic theme - calming and warm
export const THERAPEUTIC_THEME: ThemeConfig = {
  ...BASE_THEME,
  name: "therapeutic",
  colors: {
    primary: "#059669",      // Calming green
    secondary: "#0891B2",    // Peaceful blue
    accent: "#7C3AED",       // Gentle purple
    background: "#FEFEFE",   // Warm white
    surface: "#F0FDF4",      // Very light green
    text: {
      primary: "#064E3B",    // Deep green
      secondary: "#065F46",  // Medium green
      muted: "#6B7280"       // Neutral gray
    },
    semantic: {
      success: "#059669",
      warning: "#D97706",
      error: "#DC2626",
      info: "#0891B2"
    },
    journal: {
      entryBackground: "#FEFEFE",
      entryBorder: "#D1FAE5",
      selectedEntry: "#ECFDF5",
      tagBackground: "#F0FDF4",
      tagText: "#065F46"
    }
  },
  fonts: {
    primary: "'Source Sans Pro', -apple-system, BlinkMacSystemFont, sans-serif",
    secondary: "'Source Sans Pro', sans-serif",
    monospace: "'Source Code Pro', monospace",
    journal: "'Crimson Text', 'Georgia', serif"
  }
};

// Professional theme - sophisticated and clean
export const PROFESSIONAL_THEME: ThemeConfig = {
  ...BASE_THEME,
  name: "professional",
  colors: {
    primary: "#1E40AF",      // Professional blue
    secondary: "#059669",    // Success green
    accent: "#7C2D12",       // Elegant brown
    background: "#FFFFFF",   // Pure white
    surface: "#F8FAFC",      // Cool gray
    text: {
      primary: "#1F2937",    // Charcoal
      secondary: "#374151",  // Dark gray
      muted: "#6B7280"       // Medium gray
    },
    semantic: {
      success: "#059669",
      warning: "#D97706",
      error: "#DC2626",
      info: "#1E40AF"
    },
    journal: {
      entryBackground: "#FFFFFF",
      entryBorder: "#E5E7EB",
      selectedEntry: "#EFF6FF",
      tagBackground: "#F1F5F9",
      tagText: "#475569"
    }
  },
  fonts: {
    primary: "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif",
    secondary: "'Roboto', sans-serif",
    monospace: "'Roboto Mono', monospace",
    journal: "'Merriweather', 'Georgia', serif"
  }
};

// Active theme - change this to switch themes
export const ACTIVE_THEME = BASE_THEME;

// Helper function to get current theme configuration
export function getThemeConfig(): ThemeConfig {
  return ACTIVE_THEME;
}

// Helper function to apply theme to CSS custom properties
export function applyThemeToCSS(theme: ThemeConfig): void {
  const root = document.documentElement;
  
  // Apply color variables
  root.style.setProperty('--color-primary', theme.colors.primary);
  root.style.setProperty('--color-secondary', theme.colors.secondary);
  root.style.setProperty('--color-accent', theme.colors.accent);
  root.style.setProperty('--color-background', theme.colors.background);
  root.style.setProperty('--color-surface', theme.colors.surface);
  
  // Text colors
  root.style.setProperty('--color-text-primary', theme.colors.text.primary);
  root.style.setProperty('--color-text-secondary', theme.colors.text.secondary);
  root.style.setProperty('--color-text-muted', theme.colors.text.muted);
  
  // Semantic colors
  root.style.setProperty('--color-success', theme.colors.semantic.success);
  root.style.setProperty('--color-warning', theme.colors.semantic.warning);
  root.style.setProperty('--color-error', theme.colors.semantic.error);
  root.style.setProperty('--color-info', theme.colors.semantic.info);
  
  // Journal-specific colors
  root.style.setProperty('--color-journal-entry-bg', theme.colors.journal.entryBackground);
  root.style.setProperty('--color-journal-entry-border', theme.colors.journal.entryBorder);
  root.style.setProperty('--color-journal-selected', theme.colors.journal.selectedEntry);
  root.style.setProperty('--color-tag-bg', theme.colors.journal.tagBackground);
  root.style.setProperty('--color-tag-text', theme.colors.journal.tagText);
  
  // Typography
  root.style.setProperty('--font-primary', theme.fonts.primary);
  root.style.setProperty('--font-secondary', theme.fonts.secondary);
  root.style.setProperty('--font-monospace', theme.fonts.monospace);
  root.style.setProperty('--font-journal', theme.fonts.journal);
  
  // Spacing
  root.style.setProperty('--spacing-unit', `${theme.spacing.unit}px`);
  
  // Border radius
  root.style.setProperty('--radius-small', theme.borderRadius.small);
  root.style.setProperty('--radius-medium', theme.borderRadius.medium);
  root.style.setProperty('--radius-large', theme.borderRadius.large);
  
  // Shadows
  root.style.setProperty('--shadow-small', theme.shadows.small);
  root.style.setProperty('--shadow-medium', theme.shadows.medium);
  root.style.setProperty('--shadow-large', theme.shadows.large);
  
  // Animation durations
  root.style.setProperty('--duration-fast', theme.animations.duration.fast);
  root.style.setProperty('--duration-normal', theme.animations.duration.normal);
  root.style.setProperty('--duration-slow', theme.animations.duration.slow);
  
  // Animation easing
  root.style.setProperty('--easing-default', theme.animations.easing.default);
  root.style.setProperty('--easing-bounce', theme.animations.easing.bounce);
}

// Helper function to get theme-aware CSS classes
export function getThemeClasses(theme: ThemeConfig): Record<string, string> {
  return {
    primary: `bg-[${theme.colors.primary}] text-white`,
    secondary: `bg-[${theme.colors.secondary}] text-white`,
    accent: `bg-[${theme.colors.accent}] text-white`,
    surface: `bg-[${theme.colors.surface}] text-[${theme.colors.text.primary}]`,
    journalEntry: `bg-[${theme.colors.journal.entryBackground}] border-[${theme.colors.journal.entryBorder}]`,
    selectedEntry: `bg-[${theme.colors.journal.selectedEntry}]`,
    tag: `bg-[${theme.colors.journal.tagBackground}] text-[${theme.colors.journal.tagText}]`
  };
}
