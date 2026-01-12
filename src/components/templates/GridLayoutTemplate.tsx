import React from 'react';
import { cn } from '@/lib/utils';

/**
 * GridLayoutTemplate - Standardized grid layout
 * 
 * Provides consistent grid layouts for dashboard-style pages
 * like the home page with cards, modules, etc.
 */

interface GridLayoutTemplateProps {
  children: React.ReactNode;
  className?: string;
  
  // Grid configuration
  columns?: 1 | 2 | 3 | 4 | 6 | 12 | 'auto';
  gap?: 'sm' | 'md' | 'lg' | 'xl';
  
  // Responsive behavior  
  responsive?: {
    sm?: 1 | 2 | 3 | 4 | 6 | 12 | 'auto';
    md?: 1 | 2 | 3 | 4 | 6 | 12 | 'auto';
    lg?: 1 | 2 | 3 | 4 | 6 | 12 | 'auto';
    xl?: 1 | 2 | 3 | 4 | 6 | 12 | 'auto';
  };
  
  // Layout props
  padding?: 'none' | 'sm' | 'md' | 'lg';
  equalHeight?: boolean;
  autoFlow?: 'row' | 'column' | 'dense';
}

const GridLayoutTemplate: React.FC<GridLayoutTemplateProps> = ({
  children,
  className,
  columns = 'auto',
  gap = 'md',
  responsive,
  padding = 'md',
  equalHeight = false,
  autoFlow = 'row',
}) => {
  // Generate grid column classes
  const getColumnClass = (cols: typeof columns) => {
    if (cols === 'auto') return 'grid-cols-auto';
    return `grid-cols-${cols}`;
  };

  // Generate responsive classes
  const responsiveClasses = responsive ? [
    responsive.sm && `sm:${getColumnClass(responsive.sm)}`,
    responsive.md && `md:${getColumnClass(responsive.md)}`, 
    responsive.lg && `lg:${getColumnClass(responsive.lg)}`,
    responsive.xl && `xl:${getColumnClass(responsive.xl)}`,
  ].filter(Boolean) : [];

  // Gap classes
  const gapClass = {
    sm: 'gap-4',   // 16px
    md: 'gap-6',   // 24px  
    lg: 'gap-8',   // 32px
    xl: 'gap-12',  // 48px
  }[gap];

  // Padding classes
  const paddingClass = {
    none: 'p-0',
    sm: 'p-4',
    md: 'p-6', 
    lg: 'p-8',
  }[padding];

  // Auto-flow class
  const autoFlowClass = {
    row: 'grid-flow-row',
    column: 'grid-flow-col',
    dense: 'grid-flow-dense',
  }[autoFlow];

  return (
    <div 
      className={cn(
        'grid w-full',
        getColumnClass(columns),
        ...responsiveClasses,
        gapClass,
        paddingClass,
        autoFlowClass,
        equalHeight && 'items-stretch',
        className
      )}
      style={{
        backgroundColor: 'var(--app-bg-primary)',
      }}
    >
      {children}
    </div>
  );
};

/**
 * GridItemTemplate - Standardized grid item wrapper
 * 
 * Provides consistent styling for individual grid items
 */

interface GridItemTemplateProps {
  children: React.ReactNode;
  className?: string;
  
  // Span configuration
  colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'full';
  rowSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 'full';
  
  // Responsive spans
  responsive?: {
    sm?: { colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'full'; rowSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 'full' };
    md?: { colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'full'; rowSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 'full' };
    lg?: { colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'full'; rowSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 'full' };
    xl?: { colSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 12 | 'full'; rowSpan?: 1 | 2 | 3 | 4 | 5 | 6 | 'full' };
  };
  
  // Styling
  variant?: 'default' | 'card' | 'elevated' | 'transparent';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const GridItemTemplate: React.FC<GridItemTemplateProps> = ({
  children,
  className,
  colSpan,
  rowSpan,
  responsive,
  variant = 'default',
  padding = 'md',
}) => {
  // Generate span classes
  const getColSpanClass = (span: typeof colSpan) => {
    if (!span) return '';
    if (span === 'full') return 'col-span-full';
    return `col-span-${span}`;
  };

  const getRowSpanClass = (span: typeof rowSpan) => {
    if (!span) return '';
    if (span === 'full') return 'row-span-full';
    return `row-span-${span}`;
  };

  // Generate responsive classes
  const responsiveClasses = responsive ? [
    responsive.sm?.colSpan && `sm:${getColSpanClass(responsive.sm.colSpan)}`,
    responsive.sm?.rowSpan && `sm:${getRowSpanClass(responsive.sm.rowSpan)}`,
    responsive.md?.colSpan && `md:${getColSpanClass(responsive.md.colSpan)}`,
    responsive.md?.rowSpan && `md:${getRowSpanClass(responsive.md.rowSpan)}`,
    responsive.lg?.colSpan && `lg:${getColSpanClass(responsive.lg.colSpan)}`,
    responsive.lg?.rowSpan && `lg:${getRowSpanClass(responsive.lg.rowSpan)}`,
    responsive.xl?.colSpan && `xl:${getColSpanClass(responsive.xl.colSpan)}`,
    responsive.xl?.rowSpan && `xl:${getRowSpanClass(responsive.xl.rowSpan)}`,
  ].filter(Boolean) : [];

  // Padding classes
  const paddingClass = {
    none: 'p-0',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  }[padding];

  // Variant styles
  const variantStyles = {
    default: {
      backgroundColor: 'transparent',
    },
    card: {
      backgroundColor: 'var(--app-bg-tertiary)',
      borderColor: 'var(--app-border-secondary)',
      borderWidth: '1px',
    },
    elevated: {
      backgroundColor: 'var(--app-bg-elevated)',
      borderColor: 'var(--app-border-primary)',
      borderWidth: '1px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    },
    transparent: {
      backgroundColor: 'transparent',
    },
  }[variant];

  return (
    <div
      className={cn(
        getColSpanClass(colSpan),
        getRowSpanClass(rowSpan),
        ...responsiveClasses,
        paddingClass,
        variant !== 'default' && variant !== 'transparent' && 'rounded-lg',
        className
      )}
      style={variantStyles}
    >
      {children}
    </div>
  );
};

export default GridLayoutTemplate;