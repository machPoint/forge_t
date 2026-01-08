# Forge Design System & Templating Architecture

## Current Issues Identified

1. **Inconsistent color application** - Dark backgrounds (#080808, #212121) clash and create poor contrast
2. **Limited theme scope** - Only buttons change, not layouts/spacing/typography
3. **Poor visual hierarchy** - Everything blends together
4. **Blocky appearance** - Missing elevation, shadows, and modern spacing
5. **Disconnected components** - No unified design language

## Proposed Solution: Comprehensive Design Token System

### Architecture Overview

```
Brand Configuration (JSON)
    ↓
Design Tokens (CSS Variables)
    ↓
Component Templates (React)
    ↓
Page Layouts (Compositions)
```

## 1. Enhanced Brand Configuration Schema

### Brand JSON Structure

```json
{
  "meta": {
    "id": "forge.midnight",
    "name": "Midnight Professional",
    "category": "dark-professional"
  },

  "design": {
    "philosophy": "clean-modern",
    "density": "comfortable",
    "elevation": "subtle",
    "animation": "smooth"
  },

  "colors": {
    "palette": {
      "background": {
        "base": "#0a0a0a",
        "elevated": "#141414",
        "overlay": "#1a1a1a",
        "dialog": "#1e1e1e"
      },
      "surface": {
        "primary": "#1a1a1a",
        "secondary": "#242424",
        "tertiary": "#2e2e2e",
        "hover": "#323232",
        "active": "#3a3a3a"
      },
      "border": {
        "subtle": "#2a2a2a",
        "default": "#3a3a3a",
        "emphasis": "#4a4a4a",
        "focus": "#5a8fd6"
      },
      "text": {
        "primary": "#ffffff",
        "secondary": "#b4b4b4",
        "tertiary": "#808080",
        "disabled": "#4a4a4a",
        "inverse": "#0a0a0a"
      },
      "brand": {
        "primary": "#5a8fd6",
        "primaryHover": "#6da0e0",
        "primaryActive": "#4a7fc6",
        "secondary": "#7b61ff",
        "accent": "#ff6b9d"
      },
      "semantic": {
        "success": "#4ade80",
        "warning": "#fbbf24",
        "error": "#f87171",
        "info": "#60a5fa"
      }
    },

    "gradients": {
      "subtle": "linear-gradient(135deg, #1a1a1a 0%, #242424 100%)",
      "brand": "linear-gradient(135deg, #5a8fd6 0%, #7b61ff 100%)",
      "glass": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)"
    },

    "shadows": {
      "sm": "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
      "md": "0 4px 6px -1px rgba(0, 0, 0, 0.4)",
      "lg": "0 10px 15px -3px rgba(0, 0, 0, 0.5)",
      "xl": "0 20px 25px -5px rgba(0, 0, 0, 0.6)",
      "inner": "inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)",
      "glow": "0 0 20px rgba(90, 143, 214, 0.3)"
    }
  },

  "typography": {
    "fontFamilies": {
      "display": ["Inter", "system-ui", "sans-serif"],
      "body": ["Inter", "system-ui", "sans-serif"],
      "code": ["JetBrains Mono", "Consolas", "monospace"],
      "journal": ["Playfair Display", "Georgia", "serif"]
    },
    "fontSizes": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem",
      "xl": "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem"
    },
    "fontWeights": {
      "light": "300",
      "normal": "400",
      "medium": "500",
      "semibold": "600",
      "bold": "700"
    },
    "lineHeights": {
      "tight": "1.25",
      "normal": "1.5",
      "relaxed": "1.75",
      "loose": "2"
    },
    "letterSpacing": {
      "tight": "-0.025em",
      "normal": "0",
      "wide": "0.025em",
      "wider": "0.05em"
    }
  },

  "spacing": {
    "scale": "1rem",
    "sizes": {
      "0": "0",
      "1": "0.25rem",
      "2": "0.5rem",
      "3": "0.75rem",
      "4": "1rem",
      "5": "1.25rem",
      "6": "1.5rem",
      "8": "2rem",
      "10": "2.5rem",
      "12": "3rem",
      "16": "4rem",
      "20": "5rem",
      "24": "6rem"
    },
    "layout": {
      "sidebarWidth": "280px",
      "sidebarCollapsed": "64px",
      "headerHeight": "64px",
      "footerHeight": "48px",
      "maxContentWidth": "1400px"
    }
  },

  "borderRadius": {
    "none": "0",
    "sm": "0.25rem",
    "md": "0.5rem",
    "lg": "0.75rem",
    "xl": "1rem",
    "2xl": "1.5rem",
    "full": "9999px"
  },

  "transitions": {
    "duration": {
      "fast": "150ms",
      "normal": "200ms",
      "slow": "300ms",
      "slower": "500ms"
    },
    "easing": {
      "default": "cubic-bezier(0.4, 0, 0.2, 1)",
      "in": "cubic-bezier(0.4, 0, 1, 1)",
      "out": "cubic-bezier(0, 0, 0.2, 1)",
      "inOut": "cubic-bezier(0.4, 0, 0.2, 1)"
    }
  },

  "effects": {
    "blur": {
      "sm": "4px",
      "md": "8px",
      "lg": "16px",
      "xl": "24px"
    },
    "opacity": {
      "disabled": "0.4",
      "muted": "0.6",
      "hover": "0.8",
      "full": "1.0"
    }
  },

  "components": {
    "button": {
      "variants": {
        "primary": {
          "background": "brand.primary",
          "color": "text.inverse",
          "hover": "brand.primaryHover",
          "shadow": "md"
        },
        "secondary": {
          "background": "surface.secondary",
          "color": "text.primary",
          "hover": "surface.hover",
          "border": "border.default"
        },
        "ghost": {
          "background": "transparent",
          "color": "text.secondary",
          "hover": "surface.secondary"
        }
      },
      "sizes": {
        "sm": { "height": "32px", "padding": "0 12px", "fontSize": "sm" },
        "md": { "height": "40px", "padding": "0 16px", "fontSize": "base" },
        "lg": { "height": "48px", "padding": "0 24px", "fontSize": "lg" }
      }
    },

    "card": {
      "variants": {
        "default": {
          "background": "surface.primary",
          "border": "border.subtle",
          "shadow": "md",
          "radius": "lg"
        },
        "elevated": {
          "background": "background.elevated",
          "shadow": "lg",
          "radius": "xl"
        },
        "glass": {
          "background": "rgba(255, 255, 255, 0.05)",
          "backdrop": "blur(16px)",
          "border": "rgba(255, 255, 255, 0.1)",
          "radius": "xl"
        }
      }
    },

    "input": {
      "background": "surface.secondary",
      "border": "border.default",
      "focus": "border.focus",
      "radius": "md",
      "height": "40px",
      "padding": "0 12px"
    },

    "sidebar": {
      "background": "background.elevated",
      "border": "border.subtle",
      "item": {
        "background": "transparent",
        "hover": "surface.hover",
        "active": "surface.active",
        "radius": "md"
      }
    }
  }
}
```

## 2. CSS Variable Generation System

### Dynamic Token Generator

Create `src/lib/themes/tokenGenerator.ts`:

```typescript
import { BrandConfig } from './types';

export function generateCSSVariables(brand: BrandConfig): string {
  const vars: string[] = [];

  // Colors
  Object.entries(brand.colors.palette).forEach(([category, colors]) => {
    Object.entries(colors).forEach(([name, value]) => {
      vars.push(`--color-${category}-${name}: ${value};`);
    });
  });

  // Typography
  Object.entries(brand.typography.fontSizes).forEach(([name, value]) => {
    vars.push(`--font-size-${name}: ${value};`);
  });

  // Spacing
  Object.entries(brand.spacing.sizes).forEach(([name, value]) => {
    vars.push(`--spacing-${name}: ${value};`);
  });

  // Shadows
  Object.entries(brand.colors.shadows).forEach(([name, value]) => {
    vars.push(`--shadow-${name}: ${value};`);
  });

  // Border Radius
  Object.entries(brand.borderRadius).forEach(([name, value]) => {
    vars.push(`--radius-${name}: ${value};`);
  });

  // Transitions
  Object.entries(brand.transitions.duration).forEach(([name, value]) => {
    vars.push(`--duration-${name}: ${value};`);
  });

  return `:root {\n  ${vars.join('\n  ')}\n}`;
}
```

## 3. Component Template System

### Base Component Primitives

Create `src/components/primitives/`:

```typescript
// src/components/primitives/Surface.tsx
interface SurfaceProps {
  variant?: 'default' | 'elevated' | 'glass' | 'overlay';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  radius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  border?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Surface: React.FC<SurfaceProps> = ({
  variant = 'default',
  padding = 'md',
  radius = 'lg',
  border = false,
  children,
  className
}) => {
  const baseStyles = 'surface-component';
  const variantStyles = {
    default: 'bg-surface-primary shadow-md',
    elevated: 'bg-background-elevated shadow-lg',
    glass: 'bg-white/5 backdrop-blur-md border border-white/10',
    overlay: 'bg-background-overlay shadow-xl'
  };

  const paddingStyles = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8'
  };

  const radiusStyles = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl'
  };

  return (
    <div
      className={cn(
        baseStyles,
        variantStyles[variant],
        paddingStyles[padding],
        radiusStyles[radius],
        border && 'border border-border-default',
        className
      )}
    >
      {children}
    </div>
  );
};
```

### Layout Templates

Create `src/components/templates/layouts/`:

```typescript
// src/components/templates/layouts/AppLayout.tsx
export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="app-layout">
      <AppHeader />
      <div className="app-body">
        <AppSidebar />
        <main className="app-main">
          <div className="app-content-wrapper">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

// CSS
.app-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--color-background-base);
}

.app-body {
  display: flex;
  flex: 1;
  min-height: 0;
}

.app-sidebar {
  width: var(--layout-sidebar-width);
  background: var(--color-background-elevated);
  border-right: 1px solid var(--color-border-subtle);
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.app-content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: var(--spacing-6);
  max-width: var(--layout-max-content-width);
  margin: 0 auto;
  width: 100%;
}
```

## 4. Page Templates

### Journal Page Template

```typescript
// src/components/templates/pages/JournalTemplate.tsx
interface JournalTemplateProps {
  sidebar: React.ReactNode;
  editor: React.ReactNode;
  toolbar?: React.ReactNode;
  metadata?: React.ReactNode;
}

export const JournalTemplate: React.FC<JournalTemplateProps> = ({
  sidebar,
  editor,
  toolbar,
  metadata
}) => {
  return (
    <div className="journal-template">
      {/* Sidebar */}
      <aside className="journal-sidebar">
        <Surface variant="default" padding="md" radius="none" className="h-full">
          {sidebar}
        </Surface>
      </aside>

      {/* Main Editor Area */}
      <div className="journal-main">
        {toolbar && (
          <Surface variant="glass" padding="sm" className="journal-toolbar">
            {toolbar}
          </Surface>
        )}

        <Surface variant="elevated" padding="lg" radius="xl" className="journal-editor">
          {editor}
        </Surface>

        {metadata && (
          <Surface variant="default" padding="md" className="journal-metadata">
            {metadata}
          </Surface>
        )}
      </div>
    </div>
  );
};

// CSS
.journal-template {
  display: grid;
  grid-template-columns: 280px 1fr;
  gap: var(--spacing-6);
  height: 100%;
}

.journal-sidebar {
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.journal-main {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-4);
  overflow-y: auto;
}

.journal-toolbar {
  position: sticky;
  top: 0;
  z-index: 10;
}

.journal-editor {
  flex: 1;
  min-height: 600px;
}
```

## 5. Visual Improvements

### Elevation & Depth System

```css
/* src/styles/elevation.css */

.elevation-0 {
  box-shadow: none;
}

.elevation-1 {
  box-shadow: var(--shadow-sm);
}

.elevation-2 {
  box-shadow: var(--shadow-md);
}

.elevation-3 {
  box-shadow: var(--shadow-lg);
}

.elevation-4 {
  box-shadow: var(--shadow-xl);
}

/* Hover elevations */
.hover\\:elevation-2:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
  transition: all var(--duration-normal) var(--easing-default);
}

.hover\\:elevation-3:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
  transition: all var(--duration-normal) var(--easing-default);
}
```

### Glass Morphism Effects

```css
/* src/styles/effects.css */

.glass {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(var(--blur-lg));
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.glass-dark {
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(var(--blur-lg));
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.glass-card {
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.03) 100%
  );
  backdrop-filter: blur(var(--blur-md));
  border: 1px solid rgba(255, 255, 255, 0.12);
}
```

### Improved Spacing & Layout

```css
/* src/styles/layout.css */

/* Container system */
.container-sm {
  max-width: 640px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.container-md {
  max-width: 768px;
  margin: 0 auto;
  padding: 0 var(--spacing-4);
}

.container-lg {
  max-width: 1024px;
  margin: 0 auto;
  padding: 0 var(--spacing-6);
}

.container-xl {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 var(--spacing-8);
}

/* Stack layouts */
.stack {
  display: flex;
  flex-direction: column;
}

.stack-sm > * + * { margin-top: var(--spacing-2); }
.stack-md > * + * { margin-top: var(--spacing-4); }
.stack-lg > * + * { margin-top: var(--spacing-6); }
.stack-xl > * + * { margin-top: var(--spacing-8); }

/* Grid layouts */
.grid-auto {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-4);
}
```

## 6. Component Styling Templates

### Button System

```typescript
// src/components/ui/button.tsx (enhanced)
const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center rounded-md font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-brand-primary text-text-inverse hover:bg-brand-primary-hover shadow-md hover:shadow-lg hover:-translate-y-0.5",
        secondary: "bg-surface-secondary text-text-primary hover:bg-surface-hover border border-border-default",
        ghost: "text-text-secondary hover:bg-surface-secondary hover:text-text-primary",
        glass: "bg-white/5 text-text-primary hover:bg-white/10 backdrop-blur-md border border-white/10",
        outline: "border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-text-inverse",
        danger: "bg-semantic-error text-text-inverse hover:bg-red-600 shadow-md"
      },
      size: {
        sm: "h-8 px-3 text-sm",
        md: "h-10 px-4 text-base",
        lg: "h-12 px-6 text-lg",
        xl: "h-14 px-8 text-xl"
      },
      radius: {
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        full: "rounded-full"
      }
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
      radius: "md"
    }
  }
);
```

### Card System

```typescript
// src/components/ui/card.tsx (enhanced)
const cardVariants = cva(
  "transition-all duration-200",
  {
    variants: {
      variant: {
        default: "bg-surface-primary border border-border-subtle shadow-md",
        elevated: "bg-background-elevated shadow-lg",
        glass: "bg-white/5 backdrop-blur-md border border-white/10",
        outline: "bg-transparent border-2 border-border-default",
        flat: "bg-surface-secondary"
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        md: "p-4",
        lg: "p-6",
        xl: "p-8"
      },
      radius: {
        none: "rounded-none",
        sm: "rounded-sm",
        md: "rounded-md",
        lg: "rounded-lg",
        xl: "rounded-xl",
        "2xl": "rounded-2xl"
      },
      hover: {
        none: "",
        lift: "hover:shadow-lg hover:-translate-y-1",
        glow: "hover:shadow-glow",
        border: "hover:border-brand-primary"
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "md",
      radius: "lg",
      hover: "none"
    }
  }
);
```

## 7. Implementation Plan

### Phase 1: Foundation (Week 1)
1. Create enhanced brand JSON schemas for 3 themes
2. Build token generation system
3. Update CSS variable structure
4. Create base primitive components

### Phase 2: Templates (Week 2)
1. Build layout template system
2. Create page templates for each main view
3. Implement component template variants
4. Add elevation and effects system

### Phase 3: Migration (Week 3)
1. Migrate existing pages to new templates
2. Apply consistent spacing and typography
3. Update color usage throughout
4. Test theme switching

### Phase 4: Polish (Week 4)
1. Add animations and transitions
2. Implement responsive breakpoints
3. Optimize performance
4. Documentation and examples

## 8. Theme Examples

### Midnight Professional
- Dark, clean, corporate
- Blue/purple accents
- Subtle shadows
- Comfortable spacing

### Nordic Light
- Light, airy, minimal
- Soft blues and grays
- Large white spaces
- High contrast text

### Therapeutic Warmth
- Warm neutrals
- Earthy tones
- Soft shadows
- Generous padding

## Benefits of This System

1. **Consistency** - All UI elements follow same design language
2. **Flexibility** - Easy to create new themes without code changes
3. **Maintainability** - Central configuration, no scattered styles
4. **Performance** - CSS variables are fast, no JS overhead
5. **Scalability** - Add new components easily following patterns
6. **Accessibility** - Built-in focus states, contrast ratios
7. **Developer Experience** - Type-safe, predictable, documented

## Next Steps

Would you like me to:
1. Implement the token generation system
2. Create the primitive components (Surface, Stack, Grid)
3. Build specific page templates (Journal, Settings, etc.)
4. Create 3 complete theme configurations
5. Migrate existing components to new system
