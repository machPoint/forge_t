/**
 * Configuration Loader
 * Centralized configuration management for OPAL server
 */

const logger = require('./logger');

class ConfigLoader {
  constructor() {
    this.config = {};
    this.openaiApiKey = null;
  }

  /**
   * Initialize configuration from environment variables
   */
  init() {
    // Load all environment variables
    this.config = { ...process.env };
    
    // Specifically handle OpenAI API key with multiple fallbacks
    this.openaiApiKey = process.env.OPENAI_API_KEY || 
                       process.env.OPENAI_KEY || 
                       process.env.API_KEY_OPENAI;
    
    if (this.openaiApiKey) {
      logger.info('[ConfigLoader] OpenAI API key loaded successfully');
    } else {
      logger.warn('[ConfigLoader] No OpenAI API key found in environment');
    }
  }

  /**
   * Get OpenAI API key with fallback handling
   * @returns {string|null} The OpenAI API key or null if not found
   */
  getOpenAIApiKey() {
    // Return cached key if available
    if (this.openaiApiKey) {
      return this.openaiApiKey;
    }
    
    // Try to reload from environment
    this.openaiApiKey = process.env.OPENAI_API_KEY || 
                       process.env.OPENAI_KEY || 
                       process.env.API_KEY_OPENAI;
    
    return this.openaiApiKey;
  }

  /**
   * Set OpenAI API key explicitly (used by main process)
   * @param {string} apiKey - The OpenAI API key
   */
  setOpenAIApiKey(apiKey) {
    if (apiKey && typeof apiKey === 'string' && apiKey.trim()) {
      this.openaiApiKey = apiKey.trim();
      process.env.OPENAI_API_KEY = this.openaiApiKey;
      logger.info('[ConfigLoader] OpenAI API key set explicitly');
    } else {
      logger.warn('[ConfigLoader] Invalid API key provided to setOpenAIApiKey');
    }
  }

  /**
   * Get configuration value
   * @param {string} key - Configuration key
   * @param {*} defaultValue - Default value if key not found
   * @returns {*} Configuration value
   */
  get(key, defaultValue = null) {
    return this.config[key] || process.env[key] || defaultValue;
  }

  /**
   * Set configuration value
   * @param {string} key - Configuration key
   * @param {*} value - Configuration value
   */
  set(key, value) {
    this.config[key] = value;
    process.env[key] = value;
  }

  /**
   * Check if OpenAI API key is available
   * @returns {boolean} True if API key is available
   */
  hasOpenAIApiKey() {
    return !!this.getOpenAIApiKey();
  }
}

// Create singleton instance
const configLoader = new ConfigLoader();

module.exports = configLoader;
