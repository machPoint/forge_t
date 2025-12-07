import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ThemeSelector from '@/components/ThemeSelector';
import { getAllThemes, getTheme, loadSavedTheme } from '@/lib/themes';
import { 
  Palette, 
  Download, 
  RefreshCw, 
  Settings,
  AlertTriangle,
  CheckCircle,
  Info,
  Bot
} from 'lucide-react';

const CustomizationManager = () => {
  // State for theming functionality
  const [currentTheme, setCurrentTheme] = useState(loadSavedTheme());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const availableThemes = getAllThemes();

  // Load current theme on component mount
  useEffect(() => {
    // Theme is already loaded and applied by the ThemeSelector component
    setCurrentTheme(loadSavedTheme());
  }, []);

  // App data for display
  const appData = {
    name: 'Forge',
    version: '1.0.6',
    description: 'Personal journaling platform with AI-powered insights and therapeutic guidance'
  };

  // Update current theme when ThemeSelector changes it
  const handleThemeUpdate = () => {
    setCurrentTheme(loadSavedTheme());
  };

  // Export current theme configuration
  const exportThemeConfig = () => {
    const dataStr = JSON.stringify(currentTheme, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `${currentTheme.id}-theme.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };


  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading theme configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Theme Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Visual Theme
          </CardTitle>
          <CardDescription>
            Choose from multiple visual themes to personalize your experience. All pages will use consistent colors and styling.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-app-text-primary mb-2">Current Theme: {currentTheme.name}</h3>
              <p className="text-xs text-app-text-secondary mb-4">
                {currentTheme.description}
              </p>
            </div>
            <ThemeSelector variant="dropdown" showLabel={false} />
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" onClick={exportThemeConfig}>
                <Download className="h-4 w-4 mr-1" />
                Export Theme
              </Button>
              <Button variant="outline" size="sm" onClick={handleThemeUpdate}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Application Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">App Name</Label>
              <p className="text-sm text-muted-foreground">{appData.name}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Version</Label>
              <p className="text-sm text-muted-foreground">{appData.version}</p>
            </div>
            <div className="col-span-2">
              <Label className="text-sm font-medium">Description</Label>
              <p className="text-sm text-muted-foreground">{appData.description}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Theme Colors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Current Theme Colors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Background Colors */}
            <div>
              <h4 className="text-sm font-medium mb-3">Backgrounds</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(currentTheme.colors.background).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div 
                      className="w-5 h-5 rounded border border-gray-600"
                      style={{ backgroundColor: value }}
                    />
                    <div>
                      <p className="text-sm font-medium capitalize">{key}</p>
                      <p className="text-xs text-muted-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Border Colors */}
            <div>
              <h4 className="text-sm font-medium mb-3">Borders</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(currentTheme.colors.border).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div 
                      className="w-5 h-5 rounded border border-gray-600"
                      style={{ backgroundColor: value }}
                    />
                    <div>
                      <p className="text-sm font-medium capitalize">{key}</p>
                      <p className="text-xs text-muted-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Text Colors */}
            <div>
              <h4 className="text-sm font-medium mb-3">Text</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(currentTheme.colors.text).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div 
                      className="w-5 h-5 rounded border border-gray-600"
                      style={{ backgroundColor: value }}
                    />
                    <div>
                      <p className="text-sm font-medium capitalize">{key}</p>
                      <p className="text-xs text-muted-foreground">{value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Themes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Available Themes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {availableThemes.map((theme) => (
              <div key={theme.id} className="flex items-center justify-between p-3 border rounded">
                <div>
                  <span className="text-sm font-medium">{theme.name}</span>
                  <p className="text-xs text-muted-foreground">{theme.description}</p>
                </div>
                <Badge variant={currentTheme.id === theme.id ? "default" : "secondary"}>
                  {currentTheme.id === theme.id ? "Active" : "Available"}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Development Tools */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            Development Tools
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => console.log('Current Theme:', currentTheme)}
            >
              Log Theme Config
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                const root = document.documentElement;
                console.log('CSS Variables:', {
                  '--app-bg-primary': root.style.getPropertyValue('--app-bg-primary'),
                  '--app-bg-secondary': root.style.getPropertyValue('--app-bg-secondary'),
                  '--app-text-primary': root.style.getPropertyValue('--app-text-primary'),
                  '--app-border-primary': root.style.getPropertyValue('--app-border-primary'),
                });
              }}
            >
              Check CSS Variables
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                // Force re-apply current theme
                const { applyTheme } = require('@/lib/themes');
                applyTheme(currentTheme);
                console.log('Theme re-applied:', currentTheme.name);
              }}
            >
              Re-apply Theme
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CustomizationManager;
