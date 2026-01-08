import React from "react";
import { useTheme } from "@/components/ThemeProvider";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const ThemeCustomizer: React.FC = () => {
  const { currentTheme, availableThemes, setTheme } = useTheme();

  // Helper to convert HSL string to CSS color
  const hslToCss = (hsl: string) => `hsl(${hsl})`;

  return (
    <div className="space-y-6">
      {/* Current Theme Info */}
      <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Current Theme
            </h2>
            <p className="text-sm text-muted-foreground">
              {currentTheme.description}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-lg border-2 border-border shadow-sm"
              style={{ backgroundColor: hslToCss(currentTheme.colors.background) }}
            />
            <div>
              <div className="text-lg font-bold text-foreground">
                {currentTheme.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {currentTheme.isDark ? 'Dark Theme' : 'Light Theme'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Theme Selector Grid */}
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-4">
          Available Themes
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {availableThemes.map((theme) => {
            const isSelected = currentTheme.id === theme.id;

            return (
              <button
                key={theme.id}
                onClick={() => setTheme(theme.id)}
                className={cn(
                  "relative p-5 rounded-xl border-2 transition-all text-left",
                  "hover:shadow-lg hover:scale-[1.02]",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border bg-card hover:border-primary/50"
                )}
              >
                {/* Selected Badge */}
                {isSelected && (
                  <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}

                {/* Theme Preview */}
                <div className="mb-4 flex gap-2">
                  <div
                    className="w-16 h-16 rounded-lg border border-border shadow-sm flex flex-col overflow-hidden"
                    style={{ backgroundColor: hslToCss(theme.colors.background) }}
                  >
                    <div
                      className="h-1/3"
                      style={{ backgroundColor: hslToCss(theme.colors.card) }}
                    />
                    <div
                      className="h-2/3 flex items-center justify-center gap-1 px-2"
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: hslToCss(theme.colors.primary) }}
                      />
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: hslToCss(theme.colors.accent) }}
                      />
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: hslToCss(theme.colors.muted) }}
                      />
                    </div>
                  </div>

                  {/* Color Swatches */}
                  <div className="flex-1 grid grid-cols-3 gap-1.5">
                    <div
                      className="rounded border border-border"
                      style={{ backgroundColor: hslToCss(theme.colors.background) }}
                      title="Background"
                    />
                    <div
                      className="rounded border border-border"
                      style={{ backgroundColor: hslToCss(theme.colors.card) }}
                      title="Card"
                    />
                    <div
                      className="rounded border border-border"
                      style={{ backgroundColor: hslToCss(theme.colors.primary) }}
                      title="Primary"
                    />
                    <div
                      className="rounded border border-border"
                      style={{ backgroundColor: hslToCss(theme.colors.secondary) }}
                      title="Secondary"
                    />
                    <div
                      className="rounded border border-border"
                      style={{ backgroundColor: hslToCss(theme.colors.accent) }}
                      title="Accent"
                    />
                    <div
                      className="rounded border border-border"
                      style={{ backgroundColor: hslToCss(theme.colors.muted) }}
                      title="Muted"
                    />
                  </div>
                </div>

                {/* Theme Info */}
                <div>
                  <h3 className="font-semibold text-foreground mb-1">
                    {theme.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2">
                    {theme.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        theme.isDark
                          ? "bg-slate-800 text-slate-100"
                          : "bg-amber-100 text-amber-800"
                      )}
                    >
                      {theme.isDark ? '🌙 Dark' : '☀️ Light'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Color Palette Details */}
      <div className="p-6 rounded-xl bg-card border border-border shadow-sm">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {currentTheme.name} Color Palette
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries({
            Background: currentTheme.colors.background,
            Foreground: currentTheme.colors.foreground,
            Card: currentTheme.colors.card,
            Primary: currentTheme.colors.primary,
            Secondary: currentTheme.colors.secondary,
            Accent: currentTheme.colors.accent,
            Muted: currentTheme.colors.muted,
            Border: currentTheme.colors.border,
          }).map(([name, value]) => (
            <div key={name} className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-lg border border-border shadow-sm flex-shrink-0"
                style={{ backgroundColor: hslToCss(value) }}
              />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground truncate">
                  {name}
                </div>
                <div className="text-xs text-muted-foreground font-mono truncate">
                  {value}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tips */}
      <div className="p-5 rounded-xl bg-muted/50 border border-border">
        <h3 className="font-medium text-foreground mb-2">💡 Theme Tips</h3>
        <ul className="text-sm text-muted-foreground space-y-1.5">
          <li>• Your theme preference is saved automatically</li>
          <li>• All pages use the same theme for consistency</li>
          <li>• Dark themes reduce eye strain in low-light environments</li>
          <li>• Light themes work better in bright environments</li>
        </ul>
      </div>
    </div>
  );
};

export default ThemeCustomizer;
