/**
 * Theme Manager - Central Theme Management System
 * 
 * Coordinates theme switching, state management, and event handling
 * for the entire application.
 */

import { 
  themes, 
  defaultTheme, 
  getThemeById, 
  type Theme 
} from './themes';
import { 
  injectThemeVariables, 
  saveThemePreference, 
  loadThemePreference,
  applyThemeTransition,
  validateTheme,
  getCurrentThemeId 
} from './themeInjector';

// Event types for theme management
export type ThemeEvent = 'theme-changed' | 'theme-loaded' | 'theme-error';

// Theme change event detail interface
export interface ThemeChangeEventDetail {
  theme: Theme;
  previousTheme: Theme | null;
}

// Theme manager state
interface ThemeManagerState {
  currentTheme: Theme;
  previousTheme: Theme | null;
  isInitialized: boolean;
  eventListeners: Map<ThemeEvent, Set<(detail: any) => void>>;
}

class ThemeManager {
  private state: ThemeManagerState;

  constructor() {
    this.state = {
      currentTheme: defaultTheme,
      previousTheme: null,
      isInitialized: false,
      eventListeners: new Map([
        ['theme-changed', new Set()],
        ['theme-loaded', new Set()],
        ['theme-error', new Set()],
      ]),
    };
  }

  /**
   * Initialize the theme manager
   */
  public async initialize(): Promise<void> {
    if (this.state.isInitialized) {
      console.warn('ThemeManager is already initialized');
      return;
    }

    try {
      // Load saved theme preference
      const savedThemeId = loadThemePreference();
      let initialTheme = defaultTheme;

      if (savedThemeId) {
        const savedTheme = getThemeById(savedThemeId);
        if (savedTheme && validateTheme(savedTheme)) {
          initialTheme = savedTheme;
        } else {
          console.warn(`Invalid saved theme: ${savedThemeId}, falling back to default`);
        }
      }

      // Apply the initial theme
      await this.applyTheme(initialTheme, false);
      
      this.state.isInitialized = true;
      this.emit('theme-loaded', { theme: initialTheme });
      
      console.log(`ThemeManager initialized with theme: ${initialTheme.name}`);
    } catch (error) {
      console.error('Failed to initialize ThemeManager:', error);
      this.emit('theme-error', { error });
      throw error;
    }
  }

  /**
   * Switch to a new theme
   */
  public async switchTheme(themeId: string, animate: boolean = true): Promise<void> {
    const newTheme = getThemeById(themeId);
    
    if (!newTheme) {
      const error = new Error(`Theme not found: ${themeId}`);
      this.emit('theme-error', { error });
      throw error;
    }

    if (!validateTheme(newTheme)) {
      const error = new Error(`Invalid theme structure: ${themeId}`);
      this.emit('theme-error', { error });
      throw error;
    }

    if (this.state.currentTheme.id === themeId) {
      console.log(`Theme ${themeId} is already active`);
      return;
    }

    await this.applyTheme(newTheme, animate);
  }

  /**
   * Get the current theme
   */
  public getCurrentTheme(): Theme {
    return this.state.currentTheme;
  }

  /**
   * Get the previous theme
   */
  public getPreviousTheme(): Theme | null {
    return this.state.previousTheme;
  }

  /**
   * Get all available themes
   */
  public getAvailableThemes(): Theme[] {
    return [...themes];
  }

  /**
   * Check if the theme manager is initialized
   */
  public isInitialized(): boolean {
    return this.state.isInitialized;
  }

  /**
   * Revert to the previous theme
   */
  public async revertToPreviousTheme(animate: boolean = true): Promise<void> {
    if (!this.state.previousTheme) {
      console.warn('No previous theme to revert to');
      return;
    }

    await this.applyTheme(this.state.previousTheme, animate);
  }

  /**
   * Reset to default theme
   */
  public async resetToDefault(animate: boolean = true): Promise<void> {
    await this.applyTheme(defaultTheme, animate);
  }

  /**
   * Add event listener
   */
  public addEventListener(event: ThemeEvent, callback: (detail: any) => void): void {
    const listeners = this.state.eventListeners.get(event);
    if (listeners) {
      listeners.add(callback);
    }
  }

  /**
   * Remove event listener
   */
  public removeEventListener(event: ThemeEvent, callback: (detail: any) => void): void {
    const listeners = this.state.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Get theme manager status/debugging info
   */
  public getStatus() {
    return {
      isInitialized: this.state.isInitialized,
      currentTheme: {
        id: this.state.currentTheme.id,
        name: this.state.currentTheme.name,
      },
      previousTheme: this.state.previousTheme ? {
        id: this.state.previousTheme.id,
        name: this.state.previousTheme.name,
      } : null,
      availableThemes: themes.length,
      appliedThemeId: getCurrentThemeId(),
      eventListeners: Array.from(this.state.eventListeners.entries()).map(([event, listeners]) => ({
        event,
        listenerCount: listeners.size,
      })),
    };
  }

  // Private methods

  /**
   * Apply a theme to the DOM
   */
  private async applyTheme(theme: Theme, animate: boolean): Promise<void> {
    const previousTheme = this.state.currentTheme;

    try {
      // Apply transition animation if requested
      if (animate) {
        applyThemeTransition(300);
      }

      // Inject theme variables into DOM
      injectThemeVariables(theme);

      // Save theme preference
      saveThemePreference(theme.id);

      // Update state
      this.state.previousTheme = previousTheme;
      this.state.currentTheme = theme;

      // Emit theme change event
      this.emit('theme-changed', {
        theme,
        previousTheme: previousTheme.id !== theme.id ? previousTheme : null,
      });

      console.log(`Theme switched: ${previousTheme.name} → ${theme.name}`);
    } catch (error) {
      console.error('Failed to apply theme:', error);
      this.emit('theme-error', { error, theme });
      throw error;
    }
  }

  /**
   * Emit an event to all listeners
   */
  private emit(event: ThemeEvent, detail: any): void {
    const listeners = this.state.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(detail);
        } catch (error) {
          console.error(`Error in theme event listener for ${event}:`, error);
        }
      });
    }
  }
}

// Create singleton instance
const themeManager = new ThemeManager();

// Export singleton instance and class for testing
export { themeManager, ThemeManager };
export default themeManager;