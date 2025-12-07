// Theme constants for consistent styling across the Forge application
export const forgeTheme = {
  backgrounds: {
    primary: "bg-gradient-to-br from-[#111111] to-[#222222] dark:from-[#111111] dark:to-[#222222]",
    secondary: "bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] dark:from-[#1a1a1a] dark:to-[#2a2a2a]",
    sidebar: "bg-[#1d1d1d] dark:bg-[#1d1d1d]",
    card: "bg-[#1d1d1d]/80 dark:bg-[#1d1d1d]/80",
  },
  borders: {
    primary: "border-[#23232a]",
    secondary: "border-gray-600",
    focus: "focus:border-gray-600 focus-within:border-gray-600",
  },
  text: {
    primary: "text-gray-100",
    secondary: "text-gray-400",
    muted: "text-gray-500",
  },
  spacing: {
    xs: "p-1",
    sm: "p-2",
    md: "p-4",
    lg: "p-6",
    xl: "p-8",
  },
  layout: {
    page: "forge-page",
    sidebar: "forge-sidebar",
    card: "forge-card",
    input: "forge-input",
    button: "forge-button",
  }
};

// CSS class utilities for common theme patterns
export const themeClasses = {
  pageContainer: `${forgeTheme.backgrounds.primary} min-h-screen`,
  contentArea: `${forgeTheme.backgrounds.secondary} flex-1`,
  sidebarArea: `${forgeTheme.backgrounds.sidebar} ${forgeTheme.borders.primary}`,
  cardContainer: `${forgeTheme.backgrounds.card} ${forgeTheme.borders.primary} rounded-lg`,
  textPrimary: forgeTheme.text.primary,
  textSecondary: forgeTheme.text.secondary,
  textMuted: forgeTheme.text.muted,
};
