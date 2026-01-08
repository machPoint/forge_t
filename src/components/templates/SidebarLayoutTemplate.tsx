import React from 'react';
import { cn } from '@/lib/utils';
import { layout } from '@/lib/design-tokens';

/**
 * SidebarLayoutTemplate - Modern Floating Layout
 * 
 * Implements a "Unix" / Mobile-style aesthetic with floating panels,
 * rounded corners, and high-contrast dark theme support.
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
  showDivider = true, // Ignored in floating layout
  padding = 'default',
}) => {
  const [isCollapsed, setIsCollapsed] = React.useState(defaultCollapsed);

  // Determine sidebar width class
  const sidebarWidthClass = {
    narrow: 'w-64',     // 256px
    default: 'w-80',    // 320px  
    wide: 'w-96',       // 384px
  }[sidebarWidth];

  // Determine padding class for content
  const paddingClass = {
    none: 'p-0',
    small: 'p-4',
    default: 'p-6',
    large: 'p-8',
  }[padding];

  // Determine layout direction
  const isRightSidebar = sidebarPosition === 'right';
  const layoutClass = isRightSidebar ? 'flex-row-reverse' : 'flex-row';

  return (
    <div className={cn('flex h-screen w-full bg-background p-4 gap-4 overflow-hidden', layoutClass, className)}>
      {/* Sidebar - Floating Dock Style */}
      <div
        className={cn(
          'flex-shrink-0 transition-all duration-300 relative',
          'bg-sidebar/50 backdrop-blur-xl border border-sidebar-border rounded-[2rem] overflow-hidden shadow-2xl',
          isCollapsed ? 'w-20' : sidebarWidthClass
        )}
      >
        <div className="h-full flex flex-col">
          <div className={cn('flex-1 overflow-auto scrollbar-hide', !isCollapsed && 'p-2')}>
             {/* Hide sidebar content if collapsed to prevent squishing */}
            <div className={cn('h-full transition-opacity duration-200', isCollapsed ? 'opacity-0 invisible w-0' : 'opacity-100')}>
              {sidebar}
            </div>
          </div>
          
          {/* Collapse Toggle Button (Bottom of Sidebar) */}
          {collapsible && (
             <div className="p-4 flex justify-center border-t border-sidebar-border/50">
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-2 rounded-full hover:bg-sidebar-accent text-sidebar-foreground transition-colors"
                >
                  <svg 
                    className={cn('w-5 h-5 transition-transform duration-300', {
                      'rotate-180': !isCollapsed,
                    })}
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                  </svg>
                </button>
             </div>
          )}
        </div>
      </div>

      {/* Main Content - Floating Card Style */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-[2rem] bg-card border border-border shadow-2xl relative">
        <div className={cn('flex-1 overflow-auto scrollbar-thin', paddingClass)}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default SidebarLayoutTemplate;