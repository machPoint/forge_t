import React from 'react';
import { cn } from '@/lib/utils';
import { layout } from '@/lib/design-tokens';

/**
 * SidebarLayoutTemplate - Standardized sidebar layout
 * 
 * Provides a consistent sidebar + main content layout pattern
 * used across pages like Memories, Core, Modules, etc.
 */

interface SidebarLayoutTemplateProps {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  className?: string;
  
  // Layout props
  sidebarWidth?: 'default' | 'narrow' | 'wide';
  sidebarPosition?: 'left' | 'right';
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  
  // Styling props
  showDivider?: boolean;
  padding?: 'default' | 'none' | 'small' | 'large';
}

const SidebarLayoutTemplate: React.FC<SidebarLayoutTemplateProps> = ({
  children,
  sidebar,
  className,
  sidebarWidth = 'default',
  sidebarPosition = 'left',
  collapsible = false,
  defaultCollapsed = false,
  showDivider = true,
  padding = 'default',
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  // Determine sidebar width class
  const sidebarWidthClass = {
    narrow: 'w-64',     // 256px
    default: 'w-80',    // 320px  
    wide: 'w-96',       // 384px
  }[sidebarWidth];

  // Determine padding class
  const paddingClass = {
    none: 'p-0',
    small: 'p-3',
    default: 'p-6',
    large: 'p-8',
  }[padding];

  // Determine layout direction
  const isRightSidebar = sidebarPosition === 'right';
  const layoutClass = isRightSidebar ? 'flex-row-reverse' : 'flex-row';

  return (
    <div className={cn('flex h-full', layoutClass, className)}>
      {/* Sidebar */}
      <div
        className={cn(
          'flex-shrink-0 transition-all duration-300',
          isCollapsed ? 'w-0 overflow-hidden' : sidebarWidthClass,
          showDivider && !isCollapsed && (
            isRightSidebar 
              ? 'border-l' 
              : 'border-r'
          )
        )}
        style={{
          borderColor: showDivider ? 'var(--app-border-divider)' : 'transparent',
          backgroundColor: 'var(--app-bg-secondary)',
        }}
      >
        {!isCollapsed && (
          <div className={cn('h-full overflow-auto', paddingClass)}>
            {sidebar}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {collapsible && (
          <div 
            className={cn(
              'flex-shrink-0 p-2',
              isRightSidebar ? 'justify-end' : 'justify-start'
            )}
            style={{ backgroundColor: 'var(--app-bg-primary)' }}
          >
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={cn(
                'p-2 rounded-md transition-colors duration-200',
                'hover:bg-[var(--app-bg-hover)]'
              )}
              style={{ color: 'var(--app-text-secondary)' }}
              title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              <svg 
                className={cn('w-4 h-4 transition-transform duration-200', {
                  'rotate-180': isRightSidebar && !isCollapsed || !isRightSidebar && isCollapsed,
                })}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        )}
        
        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default SidebarLayoutTemplate;