/**
 * Design Tokens - Centralized Design System
 * 
 * This file contains all design tokens for consistent styling across the application.
 * Use these tokens instead of hardcoded values to maintain consistency.
 */

// ============================================================================
// COLOR TOKENS
// ============================================================================

export const colors = {
  // Background colors - Dark theme with subtle blue tints
  background: {
    primary: '#0a0a0a',      // Main app background (darker black)
    secondary: '#141414',    // Secondary background (very dark gray)
    tertiary: '#1a1a1a',     // Card backgrounds (dark gray)
    elevated: '#1f1f1f',     // Elevated elements (modals, popovers)
    hover: '#252525',        // Hover states
    active: '#2a2a2a',       // Active/pressed states
  },

  // Border colors - Subtle blue tints
  border: {
    primary: '#2a3f5f',      // Main borders (subtle blue)
    secondary: '#1a2332',    // Subtle borders (darker blue)
    focus: '#3b5a8f',        // Focus states (brighter blue)
    divider: '#1a1a1a',      // Divider lines (very subtle)
  },

  // Text colors
  text: {
    primary: '#e8e8e8',      // Main text (high contrast)
    secondary: '#9ca3af',    // Secondary text (medium contrast)
    tertiary: '#6b7280',     // Tertiary text (low contrast)
    disabled: '#4b5563',     // Disabled text
    inverse: '#0a0a0a',      // Text on light backgrounds
  },

  // Accent colors
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

  // Status colors
  status: {
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
  },
} as const;

// ============================================================================
// SPACING TOKENS
// ============================================================================

export const spacing = {
  // Base spacing scale (in pixels, will be converted to rem)
  xs: '0.25rem',    // 4px
  sm: '0.5rem',     // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.5rem',     // 24px
  '2xl': '2rem',    // 32px
  '3xl': '3rem',    // 48px
  '4xl': '4rem',    // 64px
  '5xl': '6rem',    // 96px
} as const;

// Page-specific spacing
export const pageSpacing = {
  // Page padding
  pagePadding: '1.5rem',        // 24px - Standard page padding
  pagePaddingLarge: '2rem',     // 32px - Large screen page padding
  
  // Section spacing
  sectionGap: '1.5rem',         // 24px - Gap between major sections
  sectionGapLarge: '2rem',      // 32px - Gap between major sections on large screens
  
  // Card spacing
  cardPadding: '1rem',          // 16px - Standard card padding
  cardPaddingLarge: '1.5rem',   // 24px - Large card padding
  cardGap: '1rem',              // 16px - Gap between cards
  
  // Component spacing
  componentGap: '0.75rem',      // 12px - Gap between related components
  elementGap: '0.5rem',         // 8px - Gap between small elements
} as const;

// ============================================================================
// TYPOGRAPHY TOKENS
// ============================================================================

export const typography = {
  // Font families
  fontFamily: {
    sans: 'Inter, system-ui, -apple-system, sans-serif',
    serif: 'Playfair Display, Georgia, serif',
    mono: 'Consolas, Monaco, monospace',
  },

  // Font sizes
  fontSize: {
    xs: '0.75rem',      // 12px
    sm: '0.875rem',     // 14px
    base: '1rem',       // 16px
    lg: '1.125rem',     // 18px
    xl: '1.25rem',      // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

// ============================================================================
// BORDER RADIUS TOKENS
// ============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.25rem',    // 4px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  full: '9999px',   // Fully rounded
} as const;

// ============================================================================
// SHADOW TOKENS
// ============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.5)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.6)',
} as const;

// ============================================================================
// TRANSITION TOKENS
// ============================================================================

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '200ms ease-in-out',
  slow: '300ms ease-in-out',
} as const;

// ============================================================================
// Z-INDEX TOKENS
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
} as const;

// ============================================================================
// LAYOUT TOKENS
// ============================================================================

export const layout = {
  // Header heights
  headerHeight: '3.5rem',       // 56px - Standard header height
  
  // Sidebar widths
  sidebarMinWidth: '220px',
  sidebarMaxWidth: '320px',
  sidebarDefaultWidth: '25%',
  
  // Content widths
  contentMaxWidth: '1400px',
  contentMaxWidthNarrow: '800px',
  
  // Breakpoints (for reference, actual breakpoints in tailwind.config)
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
} as const;

// ============================================================================
// COMPONENT-SPECIFIC TOKENS
// ============================================================================

export const components = {
  // Card styles
  card: {
    background: colors.background.tertiary,
    border: colors.border.secondary,
    padding: pageSpacing.cardPadding,
    borderRadius: borderRadius.lg,
    shadow: shadows.sm,
  },

  // Button styles
  button: {
    paddingX: spacing.lg,
    paddingY: spacing.sm,
    borderRadius: borderRadius.md,
    fontWeight: typography.fontWeight.medium,
  },

  // Input styles
  input: {
    background: colors.background.secondary,
    border: colors.border.primary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    focusBorder: colors.border.focus,
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get a color value from the design tokens
 * @param path - Dot notation path to the color (e.g., 'background.primary')
 */
export function getColor(path: string): string {
  const keys = path.split('.');
  let value: any = colors;
  
  for (const key of keys) {
    value = value[key];
    if (value === undefined) {
      console.warn(`Color token not found: ${path}`);
      return '#000000';
    }
  }
  
  return value;
}

/**
 * Get a spacing value from the design tokens
 * @param key - Spacing key (e.g., 'lg', '2xl')
 */
export function getSpacing(key: keyof typeof spacing): string {
  return spacing[key] || spacing.md;
}

// Export all tokens as a single object for convenience
export const designTokens = {
  colors,
  spacing,
  pageSpacing,
  typography,
  borderRadius,
  shadows,
  transitions,
  zIndex,
  layout,
  components,
} as const;

export default designTokens;
