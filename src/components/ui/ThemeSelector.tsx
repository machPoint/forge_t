import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Palette, 
  Check, 
  Monitor, 
  Moon, 
  Sun, 
  Sparkles,
  ChevronDown,
  Eye,
  Undo2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import themeManager from '@/lib/theming/themeManager';
import { themes, type Theme } from '@/lib/theming/themes';

/**
 * ThemeSelector Component
 * 
 * Provides UI for switching between different application themes
 */

interface ThemeSelectorProps {
  variant?: 'button' | 'dropdown' | 'card';
  showLabels?: boolean;
  className?: string;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  variant = 'dropdown',
  showLabels = true,
  className,
}) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(themeManager.getCurrentTheme());
  const [isOpen, setIsOpen] = useState(false);
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);

  // Listen for theme changes
  useEffect(() => {
    const handleThemeChange = (detail: { theme: Theme }) => {
      setCurrentTheme(detail.theme);
    };

    themeManager.addEventListener('theme-changed', handleThemeChange);

    return () => {
      themeManager.removeEventListener('theme-changed', handleThemeChange);
    };
  }, []);

  const handleThemeSelect = async (theme: Theme) => {
    try {
      await themeManager.switchTheme(theme.id, true);
      setIsOpen(false);
      setIsPreviewMode(false);
      setPreviewTheme(null);
    } catch (error) {
      console.error('Failed to switch theme:', error);
    }
  };

  const handlePreviewTheme = async (theme: Theme) => {
    if (isPreviewMode && previewTheme?.id === theme.id) {
      // Exit preview mode
      await themeManager.switchTheme(currentTheme.id, true);
      setIsPreviewMode(false);
      setPreviewTheme(null);
    } else {
      // Enter preview mode
      await themeManager.switchTheme(theme.id, true);
      setIsPreviewMode(true);
      setPreviewTheme(theme);
    }
  };

  const handleExitPreview = async () => {
    if (isPreviewMode) {
      await themeManager.switchTheme(currentTheme.id, true);
      setIsPreviewMode(false);
      setPreviewTheme(null);
    }
  };

  // Theme preview component
  const ThemePreview: React.FC<{ theme: Theme }> = ({ theme }) => (
    <div 
      className="flex gap-2 items-center p-2 rounded-md border"
      style={{
        backgroundColor: theme.colors.background.tertiary,
        borderColor: theme.colors.border.secondary,
      }}
    >
      <div className="flex gap-1">
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: theme.colors.background.primary }}
        />
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: theme.colors.accent.blue }}
        />
        <div 
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: theme.colors.status.success }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div 
          className="text-sm font-medium truncate"
          style={{ color: theme.colors.text.primary }}
        >
          {theme.name}
        </div>
        <div 
          className="text-xs truncate"
          style={{ color: theme.colors.text.secondary }}
        >
          {theme.description}
        </div>
      </div>
    </div>
  );

  // Button variant
  if (variant === 'button') {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn('flex items-center gap-2', className)}
      >
        <Palette className="w-4 h-4" />
        {showLabels && currentTheme.name}
      </Button>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Theme Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Theme Display */}
          <div>
            <label className="text-sm font-medium mb-2 block">Current Theme</label>
            <ThemePreview theme={currentTheme} />
          </div>

          {/* Preview Mode Indicator */}
          {isPreviewMode && (
            <div className="flex items-center gap-2 p-2 rounded-md bg-blue-500/10 border border-blue-500/20">
              <Eye className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-blue-500">
                Previewing {previewTheme?.name}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExitPreview}
                className="ml-auto h-6 px-2"
              >
                <Undo2 className="w-3 h-3" />
              </Button>
            </div>
          )}

          {/* Theme Options */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Available Themes</label>
            {themes.map((theme) => (
              <div key={theme.id} className="flex items-center gap-2">
                <ThemePreview theme={theme} />
                <div className="flex gap-1">
                  <Button
                    variant={currentTheme.id === theme.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => handleThemeSelect(theme)}
                    className="h-8 px-3"
                  >
                    {currentTheme.id === theme.id && <Check className="w-3 h-3 mr-1" />}
                    Apply
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handlePreviewTheme(theme)}
                    className="h-8 px-3"
                  >
                    <Eye className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Dropdown variant (default)
  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn('flex items-center gap-2', className)}
        >
          <Palette className="w-4 h-4" />
          {showLabels && currentTheme.name}
          <ChevronDown className="w-3 h-3" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Choose Theme
        </DropdownMenuLabel>
        
        {isPreviewMode && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs text-blue-500 flex items-center gap-2">
              <Eye className="w-3 h-3" />
              Previewing {previewTheme?.name}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExitPreview}
                className="ml-auto h-5 px-1"
              >
                <Undo2 className="w-3 h-3" />
              </Button>
            </div>
          </>
        )}
        
        <DropdownMenuSeparator />
        
        {themes.map((theme) => (
          <DropdownMenuItem
            key={theme.id}
            onClick={() => handleThemeSelect(theme)}
            className="flex items-center gap-3 p-2"
          >
            {/* Theme icon */}
            <div className="flex items-center gap-1">
              {theme.isDark ? (
                <Moon className="w-3 h-3" />
              ) : (
                <Sun className="w-3 h-3" />
              )}
            </div>
            
            {/* Color preview */}
            <div className="flex gap-1">
              <div 
                className="w-3 h-3 rounded-full border"
                style={{ backgroundColor: theme.colors.background.primary }}
              />
              <div 
                className="w-3 h-3 rounded-full border"
                style={{ backgroundColor: theme.colors.accent.blue }}
              />
            </div>
            
            {/* Theme details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{theme.name}</span>
                {currentTheme.id === theme.id && (
                  <Check className="w-3 h-3 text-green-500" />
                )}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {theme.description}
              </div>
            </div>
          </DropdownMenuItem>
        ))}
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1.5">
          <div className="text-xs text-muted-foreground flex items-center gap-2">
            <Sparkles className="w-3 h-3" />
            {themes.length} themes available
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ThemeSelector;