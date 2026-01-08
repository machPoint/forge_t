import React, { createContext, useContext, useEffect, useState } from "react";
import { getAllThemes, getTheme, defaultTheme, type Theme } from "@/lib/themeConfig";
import "../styles/theme.css";

type ThemeContextType = {
  currentTheme: Theme;
  availableThemes: Theme[];
  setTheme: (themeId: string) => void;
  toggleLightDark: () => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    // Check if theme ID is stored in localStorage
    const savedThemeId = localStorage.getItem("forge-theme-id");
    return savedThemeId ? getTheme(savedThemeId) : defaultTheme;
  });

  const availableThemes = getAllThemes();

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;

    // Apply theme colors as CSS variables
    const colors = currentTheme.colors;
    root.style.setProperty('--background', colors.background);
    root.style.setProperty('--foreground', colors.foreground);
    root.style.setProperty('--card', colors.card);
    root.style.setProperty('--card-foreground', colors.cardForeground);
    root.style.setProperty('--popover', colors.popover);
    root.style.setProperty('--popover-foreground', colors.popoverForeground);
    root.style.setProperty('--primary', colors.primary);
    root.style.setProperty('--primary-foreground', colors.primaryForeground);
    root.style.setProperty('--secondary', colors.secondary);
    root.style.setProperty('--secondary-foreground', colors.secondaryForeground);
    root.style.setProperty('--muted', colors.muted);
    root.style.setProperty('--muted-foreground', colors.mutedForeground);
    root.style.setProperty('--accent', colors.accent);
    root.style.setProperty('--accent-foreground', colors.accentForeground);
    root.style.setProperty('--destructive', colors.destructive);
    root.style.setProperty('--destructive-foreground', colors.destructiveForeground);
    root.style.setProperty('--border', colors.border);
    root.style.setProperty('--input', colors.input);
    root.style.setProperty('--ring', colors.ring);
    root.style.setProperty('--sidebar-background', colors.sidebarBackground);
    root.style.setProperty('--sidebar-foreground', colors.sidebarForeground);
    root.style.setProperty('--sidebar-primary', colors.sidebarPrimary);
    root.style.setProperty('--sidebar-primary-foreground', colors.sidebarPrimaryForeground);
    root.style.setProperty('--sidebar-accent', colors.sidebarAccent);
    root.style.setProperty('--sidebar-accent-foreground', colors.sidebarAccentForeground);
    root.style.setProperty('--sidebar-border', colors.sidebarBorder);
    root.style.setProperty('--sidebar-ring', colors.sidebarRing);
    root.style.setProperty('--radius', colors.radius);

    // Add/remove dark class based on theme
    if (currentTheme.isDark) {
      root.classList.add("dark");
      body.classList.add("dark");
    } else {
      root.classList.remove("dark");
      body.classList.remove("dark");
    }

    // Apply forge theme classes to body
    body.className = `${currentTheme.isDark ? 'dark' : 'light'} forge-app theme-${currentTheme.id}`;

    // Save theme ID to localStorage
    localStorage.setItem("forge-theme-id", currentTheme.id);
  }, [currentTheme]);

  const setTheme = (themeId: string) => {
    const theme = getTheme(themeId);
    setCurrentTheme(theme);
  };

  const toggleLightDark = () => {
    // Find a theme with opposite isDark value
    const oppositeTheme = availableThemes.find(t => t.isDark !== currentTheme.isDark);
    if (oppositeTheme) {
      setCurrentTheme(oppositeTheme);
    }
  };

  return (
    <ThemeContext.Provider value={{ currentTheme, availableThemes, setTheme, toggleLightDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
