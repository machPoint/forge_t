/**
 * Centralized Application Configuration
 * Single source of truth for all app configuration to eliminate fragile integration points
 */
import { getApiUrl, getWsUrl, isTauri } from '../lib/tauri-bridge.ts';

class AppConfig {
  static _instance = null;
  static _config = {};
  static _loadPromise = null;

  static getInstance() {
    if (!AppConfig._instance) {
      AppConfig._instance = new AppConfig();
    }
    return AppConfig._instance;
  }

  async _loadConfigAsync() {
    // Load configuration using Tauri bridge
    const isTauriApp = isTauri();
    
    AppConfig._config = {
      // API Configuration - load from Tauri if available
      apiUrl: isTauriApp ? await getApiUrl() : this._getFallbackApiUrl(),
      wsUrl: isTauriApp ? await getWsUrl() : this._getFallbackWsUrl(),
      
      // Environment
      isDevelopment: import.meta.env.DEV || false,
      isTauri: isTauriApp,
      
      // Ports and URLs
      defaultApiPort: 3000,
      defaultWsPort: 3000,
      
      // Feature flags
      enableHealthChecks: true,
      enableAutoReconnect: true,
      reconnectMaxAttempts: 5,
      reconnectDelay: 1000,
      
      // Validation
      requiredEnvVars: ['OPENAI_API_KEY'],
      
      // Loaded timestamp
      loadedAt: new Date().toISOString()
    };
  }

  _getFallbackApiUrl() {
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    return 'http://localhost:3000/journal';
  }

  _getFallbackWsUrl() {
    if (import.meta.env.VITE_WS_URL) {
      return import.meta.env.VITE_WS_URL;
    }
    return 'ws://localhost:3000';
  }

  // Ensure config is loaded (async wrapper)
  static async ensureLoaded() {
    const instance = AppConfig.getInstance();
    if (!AppConfig._loadPromise) {
      AppConfig._loadPromise = instance._loadConfigAsync();
    }
    await AppConfig._loadPromise;
  }

  // Static getters for easy access (synchronous - returns cached or fallback)
  static get apiUrl() {
    return AppConfig._config?.apiUrl || 'http://localhost:3000/journal';
  }

  static get wsUrl() {
    return AppConfig._config?.wsUrl || 'ws://localhost:3000';
  }

  static get isDevelopment() {
    return AppConfig._config?.isDevelopment || false;
  }

  static get isTauri() {
    return AppConfig._config?.isTauri || isTauri();
  }

  static get enableHealthChecks() {
    const instance = AppConfig.getInstance();
    return instance._config?.enableHealthChecks || false;
  }

  static get enableAutoReconnect() {
    const instance = AppConfig.getInstance();
    return instance._config?.enableAutoReconnect || true;
  }

  static get reconnectMaxAttempts() {
    const instance = AppConfig.getInstance();
    return instance._config?.reconnectMaxAttempts || 3;
  }

  static get reconnectDelay() {
    const instance = AppConfig.getInstance();
    return instance._config?.reconnectDelay || 1000;
  }

  // Get all config for debugging
  static getAll() {
    return { ...AppConfig.getInstance()._config };
  }

  // Force reload configuration
  static reload() {
    AppConfig._instance = null;
    return AppConfig.getInstance();
  }

  // Validate configuration
  static validate() {
    const config = AppConfig.getInstance()._config;
    const errors = [];

    // Check required URLs
    if (!config.apiUrl || config.apiUrl === '') {
      errors.push('API URL is not configured');
    }

    if (!config.wsUrl || config.wsUrl === '') {
      errors.push('WebSocket URL is not configured');
    }

    // Check URL formats
    try {
      new URL(config.apiUrl.replace('localhost', '127.0.0.1'));
    } catch (e) {
      errors.push(`Invalid API URL format: ${config.apiUrl}`);
    }

    // Check WebSocket URL format
    if (!config.wsUrl.startsWith('ws://') && !config.wsUrl.startsWith('wss://')) {
      errors.push(`WebSocket URL must start with ws:// or wss://: ${config.wsUrl}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      config: config
    };
  }

  // Health check
  static async healthCheck() {
    const validation = AppConfig.validate();
    if (!validation.isValid) {
      return {
        status: 'error',
        errors: validation.errors,
        timestamp: new Date().toISOString()
      };
    }

    // Test API connectivity
    try {
      const response = await fetch(`${AppConfig.apiUrl.replace('/journal', '')}/health`, {
        method: 'GET',
        timeout: 5000
      });
      
      return {
        status: response.ok ? 'healthy' : 'degraded',
        apiUrl: AppConfig.apiUrl,
        wsUrl: AppConfig.wsUrl,
        responseStatus: response.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        apiUrl: AppConfig.apiUrl,
        wsUrl: AppConfig.wsUrl,
        timestamp: new Date().toISOString()
      };
    }
  }
}

export default AppConfig;
