/**
 * Configuration Validation
 * Validates app configuration on startup and provides health checks
 */
import AppConfig from './AppConfig';
import TokenManager from '../auth/TokenManager';

class ConfigValidator {
  static _validationResults = null;

  // Validate configuration on startup - fail fast approach
  static async validateOnStartup() {
    console.log('[ConfigValidator] Starting configuration validation...');
    
    const results = {
      timestamp: new Date().toISOString(),
      isValid: true,
      errors: [],
      warnings: [],
      checks: {}
    };

    try {
      // 1. Validate AppConfig
      const configValidation = AppConfig.validate();
      results.checks.appConfig = configValidation;
      
      if (!configValidation.isValid) {
        results.isValid = false;
        results.errors.push(...configValidation.errors);
      }

      // 2. Validate Token Management
      const tokenValidation = ConfigValidator._validateTokens();
      results.checks.tokens = tokenValidation;
      
      if (!tokenValidation.isValid) {
        results.warnings.push(...tokenValidation.warnings);
      }

      // 3. Validate Environment
      const envValidation = ConfigValidator._validateEnvironment();
      results.checks.environment = envValidation;
      
      if (!envValidation.isValid) {
        results.warnings.push(...envValidation.warnings);
      }

      // 4. Test Connectivity (non-blocking)
      try {
        const connectivityCheck = await ConfigValidator._testConnectivity();
        results.checks.connectivity = connectivityCheck;
        
        if (!connectivityCheck.isValid) {
          results.warnings.push(...connectivityCheck.warnings);
        }
      } catch (error) {
        results.checks.connectivity = {
          isValid: false,
          error: error.message
        };
        results.warnings.push(`Connectivity test failed: ${error.message}`);
      }

      ConfigValidator._validationResults = results;

      // Log results
      if (results.isValid) {
        console.log('[ConfigValidator] ✅ Configuration validation passed');
        if (results.warnings.length > 0) {
          console.warn('[ConfigValidator] ⚠️ Warnings:', results.warnings);
        }
      } else {
        console.error('[ConfigValidator] ❌ Configuration validation failed:', results.errors);
        throw new Error(`Configuration validation failed: ${results.errors.join(', ')}`);
      }

      return results;

    } catch (error) {
      results.isValid = false;
      results.errors.push(error.message);
      ConfigValidator._validationResults = results;
      
      console.error('[ConfigValidator] ❌ Validation error:', error);
      throw error;
    }
  }

  static _validateTokens() {
    const results = {
      isValid: true,
      warnings: [],
      hasToken: false,
      tokenType: null,
      isValidFormat: false
    };

    try {
      const hasToken = TokenManager.hasToken();
      const tokenType = TokenManager.getTokenType();
      const isValidFormat = TokenManager.isValidToken();

      results.hasToken = hasToken;
      results.tokenType = tokenType;
      results.isValidFormat = isValidFormat;

      if (!hasToken) {
        results.warnings.push('No authentication token found - some features may not work');
      } else if (!isValidFormat) {
        results.warnings.push('Authentication token format appears invalid');
      }

    } catch (error) {
      results.isValid = false;
      results.warnings.push(`Token validation error: ${error.message}`);
    }

    return results;
  }

  static _validateEnvironment() {
    const results = {
      isValid: true,
      warnings: [],
      environment: process.env.NODE_ENV || 'unknown',
      isTauri: AppConfig.isTauri
    };

    // Check if we're in expected environment
    if (results.environment === 'unknown') {
      results.warnings.push('NODE_ENV not set - defaulting to development mode');
    }

    // Check for development vs production consistency
    if (results.environment === 'production' && AppConfig.isDevelopment) {
      results.warnings.push('Environment mismatch: NODE_ENV is production but AppConfig shows development');
    }

    return results;
  }

  static async _testConnectivity() {
    const results = {
      isValid: true,
      warnings: [],
      apiReachable: false,
      apiResponseTime: null
    };

    try {
      const startTime = Date.now();
      const apiUrl = AppConfig.apiUrl.replace('/journal', '');
      
      // Test with a simple health check or root endpoint
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        timeout: 5000,
        headers: {
          'Accept': 'application/json'
        }
      }).catch(() => {
        // Try root endpoint if health endpoint doesn't exist
        return fetch(apiUrl, {
          method: 'GET',
          timeout: 5000
        });
      });

      results.apiResponseTime = Date.now() - startTime;
      results.apiReachable = response.ok;

      if (!response.ok) {
        results.warnings.push(`API server returned status ${response.status}`);
      }

    } catch (error) {
      results.isValid = false;
      results.warnings.push(`Cannot reach API server: ${error.message}`);
    }

    return results;
  }

  // Get last validation results
  static getLastValidation() {
    return ConfigValidator._validationResults;
  }

  // Run a quick health check without full validation
  static async quickHealthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      status: 'unknown',
      checks: {}
    };

    try {
      // Quick config check
      const configCheck = AppConfig.validate();
      results.checks.config = configCheck.isValid;

      // Quick token check
      results.checks.token = TokenManager.hasToken();

      // Quick connectivity check
      try {
        const connectivityCheck = await ConfigValidator._testConnectivity();
        results.checks.connectivity = connectivityCheck.apiReachable;
      } catch (error) {
        results.checks.connectivity = false;
      }

      // Determine overall status
      if (results.checks.config && results.checks.connectivity) {
        results.status = 'healthy';
      } else if (results.checks.config) {
        results.status = 'degraded';
      } else {
        results.status = 'error';
      }

    } catch (error) {
      results.status = 'error';
      results.error = error.message;
    }

    return results;
  }

  // Force re-validation
  static async revalidate() {
    ConfigValidator._validationResults = null;
    return await ConfigValidator.validateOnStartup();
  }
}

export default ConfigValidator;
