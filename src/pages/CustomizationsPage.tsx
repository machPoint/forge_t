import React, { useEffect } from "react";
import AppHeader from "@/components/AppHeader";
import { SimpleThemeSelector } from "@/components/SimpleThemeSelector";
import { useTheme, themeManager } from "@/lib/themes/simple-themes";

const CustomizationsPage: React.FC = () => {
  const { theme } = useTheme();
  
  // Initialize theme system on mount
  useEffect(() => {
    themeManager.initialize();
  }, []);

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: theme.styles.primaryBg }}>
      {/* Header */}
      <div className="flex-shrink-0 border-b px-6 py-4" style={{ borderColor: theme.styles.primaryBorder, backgroundColor: theme.styles.secondaryBg }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold" style={{ color: theme.styles.primaryText }}>Customizations</h1>
            <p className="mt-1" style={{ color: theme.styles.secondaryText }}>Configure themes and appearance settings</p>
          </div>
          <AppHeader />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-6 rounded-lg" style={{ backgroundColor: theme.styles.elevatedBg, border: `1px solid ${theme.styles.primaryBorder}` }}>
            <h2 className="text-xl font-semibold mb-4" style={{ color: theme.styles.primaryText }}>Theme Settings</h2>
            <SimpleThemeSelector />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomizationsPage;
