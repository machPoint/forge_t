import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette } from 'lucide-react';
import { getAllThemes, getTheme, applyTheme, loadSavedTheme, type Theme } from '@/lib/themes';

/**
 * ThemeSelector Component
 * 
 * Allows users to switch between different visual themes.
 * Can be placed in settings, admin panel, or header.
 */

interface ThemeSelectorProps {
  variant?: 'dropdown' | 'buttons';
  showLabel?: boolean;
  className?: string;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  variant = 'dropdown',
  showLabel = true,
  className = '',
}) => {
  const [currentTheme, setCurrentTheme] = useState<Theme>(loadSavedTheme());
  const themes = getAllThemes();

  useEffect(() => {
    // Apply the current theme on mount
    applyTheme(currentTheme);
  }, [currentTheme]);

  const handleThemeChange = (themeId: string) => {
    const newTheme = getTheme(themeId);
    setCurrentTheme(newTheme);
    applyTheme(newTheme);
  };

  if (variant === 'buttons') {
    return (
      <div className={`flex flex-col gap-2 ${className}`}>
        {showLabel && (
          <label className="text-sm font-medium text-app-text-primary flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Theme
          </label>
        )}
        <div className="flex gap-2">
          {themes.map((theme) => (
            <Button
              key={theme.id}
              variant={currentTheme.id === theme.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleThemeChange(theme.id)}
              className="flex-1"
            >
              {theme.name}
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {showLabel && (
        <label className="text-sm font-medium text-app-text-primary flex items-center gap-2">
          <Palette className="w-4 h-4" />
          Theme
        </label>
      )}
      <Select value={currentTheme.id} onValueChange={handleThemeChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select theme" />
        </SelectTrigger>
        <SelectContent>
          {themes.map((theme) => (
            <SelectItem key={theme.id} value={theme.id}>
              <div className="flex flex-col">
                <span className="font-medium">{theme.name}</span>
                <span className="text-xs text-app-text-secondary">{theme.description}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ThemeSelector;
