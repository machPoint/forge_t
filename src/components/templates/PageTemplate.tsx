import React from 'react';
import { cn } from '@/lib/utils';
import { pageSpacing, layout } from '@/lib/design-tokens';

/**
 * PageTemplate - Standardized page layout component
 * 
 * This component provides a consistent structure for all pages in the application.
 * It handles the page container, header, and content area with standardized spacing and colors.
 */

interface PageTemplateProps {
  children: React.ReactNode;
  className?: string;
  
  // Header props
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  showHeader?: boolean;
  
  // Layout props
  maxWidth?: 'default' | 'narrow' | 'full';
  padding?: 'default' | 'large' | 'none';
  
  // Background props
  background?: 'primary' | 'secondary' | 'gradient';
}

const PageTemplate: React.FC<PageTemplateProps> = ({
  children,
  className,
  title,
  subtitle,
  headerActions,
  showHeader = true,
  maxWidth = 'default',
  padding = 'default',
  background = 'primary',
}) => {
  // Determine max width class
  const maxWidthClass = {
    default: 'max-w-7xl',
    narrow: 'max-w-4xl',
    full: 'max-w-none',
  }[maxWidth];

  // Determine padding class
  const paddingClass = {
    default: 'p-6',
    large: 'p-8',
    none: 'p-0',
  }[padding];

  // Determine background style using CSS variables
  const backgroundClass = {
    primary: 'bg-[var(--app-bg-primary)]',
    secondary: 'bg-[var(--app-bg-secondary)]',
    gradient: 'bg-gradient-to-br from-[var(--app-bg-secondary)] to-[var(--app-bg-tertiary)]',
  }[background];

  return (
    <div className={cn('h-full flex flex-col', backgroundClass, className)}>
      {/* Page Header */}
      {showHeader && (title || headerActions) && (
        <div 
          className="flex-shrink-0 border-b px-6 py-4"
          style={{ 
            borderColor: 'var(--app-border-divider)',
            backgroundColor: 'var(--app-bg-primary)',
          }}
        >
          <div className={cn('mx-auto flex items-center justify-between', maxWidthClass)}>
            {/* Title Section */}
            {title && (
              <div className="flex flex-col gap-1">
                <h1 
                  className="text-2xl font-semibold"
                  style={{ color: 'var(--app-text-primary)' }}
                >
                  {title}
                </h1>
                {subtitle && (
                  <p 
                    className="text-sm"
                    style={{ color: 'var(--app-text-secondary)' }}
                  >
                    {subtitle}
                  </p>
                )}
              </div>
            )}
            
            {/* Header Actions */}
            {headerActions && (
              <div className="flex items-center gap-3">
                {headerActions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className={cn('flex-1 overflow-auto', paddingClass)}>
        <div className={cn('mx-auto h-full', maxWidthClass)}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageTemplate;
