import React from 'react';
import { cn } from '@/lib/utils';
import { borderRadius, shadows, pageSpacing } from '@/lib/design-tokens';

/**
 * CardTemplate - Standardized card component
 * 
 * Provides consistent styling for card-based layouts across the application.
 */

interface CardTemplateProps {
  children: React.ReactNode;
  className?: string;
  
  // Header props
  title?: string;
  subtitle?: string;
  icon?: React.ReactNode;
  headerActions?: React.ReactNode;
  
  // Styling props
  padding?: 'sm' | 'md' | 'lg' | 'none';
  variant?: 'default' | 'elevated' | 'bordered';
  
  // Interaction props
  onClick?: () => void;
  hoverable?: boolean;
}

const CardTemplate: React.FC<CardTemplateProps> = ({
  children,
  className,
  title,
  subtitle,
  icon,
  headerActions,
  padding = 'md',
  variant = 'default',
  onClick,
  hoverable = false,
}) => {
  // Determine padding class
  const paddingClass = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    none: 'p-0',
  }[padding];

  // Determine variant styles using CSS variables
  const variantStyles = {
    default: {
      backgroundColor: 'var(--app-bg-tertiary)',
      borderColor: 'var(--app-border-secondary)',
      borderWidth: '1px',
    },
    elevated: {
      backgroundColor: 'var(--app-bg-elevated)',
      borderColor: 'var(--app-border-primary)',
      borderWidth: '1px',
      boxShadow: shadows.md,
    },
    bordered: {
      backgroundColor: 'var(--app-bg-tertiary)',
      borderColor: 'var(--app-border-primary)',
      borderWidth: '1px',
    },
  }[variant];

  // Hover styles
  const hoverClass = hoverable || onClick ? 'transition-all duration-200 hover:brightness-110 cursor-pointer' : '';

  return (
    <div
      className={cn('rounded-lg', paddingClass, hoverClass, className)}
      style={variantStyles}
      onClick={onClick}
    >
      {/* Card Header */}
      {(title || icon || headerActions) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3 flex-1">
            {icon && (
              <div style={{ color: 'var(--app-text-secondary)' }}>
                {icon}
              </div>
            )}
            {title && (
              <div className="flex flex-col gap-1">
                <h3 
                  className="text-lg font-semibold"
                  style={{ color: 'var(--app-text-primary)' }}
                >
                  {title}
                </h3>
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
          </div>
          
          {headerActions && (
            <div className="flex items-center gap-2">
              {headerActions}
            </div>
          )}
        </div>
      )}

      {/* Card Content */}
      <div>
        {children}
      </div>
    </div>
  );
};

export default CardTemplate;
