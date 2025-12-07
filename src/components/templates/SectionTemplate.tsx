import React from 'react';
import { cn } from '@/lib/utils';
import { pageSpacing } from '@/lib/design-tokens';

/**
 * SectionTemplate - Standardized section component
 * 
 * Provides consistent spacing and structure for page sections.
 */

interface SectionTemplateProps {
  children: React.ReactNode;
  className?: string;
  
  // Header props
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  
  // Layout props
  spacing?: 'sm' | 'md' | 'lg';
  divider?: boolean;
}

const SectionTemplate: React.FC<SectionTemplateProps> = ({
  children,
  className,
  title,
  subtitle,
  actions,
  spacing = 'md',
  divider = false,
}) => {
  // Determine spacing class
  const spacingClass = {
    sm: 'mb-4',
    md: 'mb-6',
    lg: 'mb-8',
  }[spacing];

  return (
    <section className={cn(spacingClass, className)}>
      {/* Section Header */}
      {(title || actions) && (
        <div className="flex items-start justify-between mb-4">
          {title && (
            <div className="flex flex-col gap-1">
              <h2 
                className="text-xl font-semibold"
                style={{ color: 'var(--app-text-primary)' }}
              >
                {title}
              </h2>
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
          
          {actions && (
            <div className="flex items-center gap-2">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Section Content */}
      <div>
        {children}
      </div>

      {/* Optional Divider */}
      {divider && (
        <div 
          className="mt-6 h-px"
          style={{ backgroundColor: 'var(--app-border-divider)' }}
        />
      )}
    </section>
  );
};

export default SectionTemplate;
