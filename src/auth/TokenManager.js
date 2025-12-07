/**
 * Unified Token Management
 * Single source of truth for authentication tokens across all clients
 */
class TokenManager {
  static _instance = null;
  static _token = null;
  static _tokenType = null;
  static _listeners = [];

  static getInstance() {
    if (!TokenManager._instance) {
      TokenManager._instance = new TokenManager();
      TokenManager._instance._loadToken();
    }
    return TokenManager._instance;
  }

  _loadToken() {
    // Priority order for token loading
    let token = null;
    let source = null;

    // 1. Check if authService exists and has a token
    if (window.authService && typeof window.authService.getAccessToken === 'function') {
      token = window.authService.getAccessToken();
      if (token) source = 'authService';
    }

    // 2. Check localStorage
    if (!token) {
      token = localStorage.getItem('opal-token');
      if (token) source = 'localStorage';
    }

    // 3. Check sessionStorage as fallback
    if (!token) {
      token = sessionStorage.getItem('opal-token');
      if (token) source = 'sessionStorage';
    }

    this._token = token;
    this._tokenType = TokenManager._detectTokenType(token);
    
    // Also update static properties for backward compatibility
    TokenManager._token = token;
    TokenManager._tokenType = this._tokenType;

    console.log(`[TokenManager] Token loaded from ${source}:`, {
      hasToken: !!token,
      tokenType: TokenManager._tokenType,
      tokenLength: token ? token.length : 0
    });
  }

  static _detectTokenType(token) {
    if (!token) return null;
    
    // JWT tokens have 3 parts separated by dots
    if (token.split('.').length === 3) {
      return 'jwt';
    }
    
    // UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(token)) {
      return 'uuid';
    }
    
    // Generic token
    return 'generic';
  }

  // Get current token
  static getToken() {
    const instance = TokenManager.getInstance();
    return TokenManager._token || instance._token;
  }

  // Get token with Bearer prefix if needed
  static getBearerToken() {
    const token = TokenManager.getToken();
    if (!token) return null;
    
    // Don't double-prefix
    if (token.startsWith('Bearer ')) {
      return token;
    }
    
    return `Bearer ${token}`;
  }

  // Set token and sync across all storage mechanisms
  static setToken(token) {
    const instance = TokenManager.getInstance();
    const oldToken = instance._token;
    
    instance._token = token;
    instance._tokenType = TokenManager._detectTokenType(token);

    // Sync to all storage locations
    if (token) {
      localStorage.setItem('opal-token', token);
      sessionStorage.setItem('opal-token', token);
      
      // Update authService if available
      if (window.authService && typeof window.authService.setToken === 'function') {
        window.authService.setToken(token);
      }
    } else {
      // Clear all storage
      localStorage.removeItem('opal-token');
      sessionStorage.removeItem('opal-token');
      
      if (window.authService && typeof window.authService.clearToken === 'function') {
        window.authService.clearToken();
      }
    }

    // Notify listeners of token change
    TokenManager._notifyListeners(token, oldToken);

    console.log(`[TokenManager] Token updated:`, {
      hasToken: !!token,
      tokenType: instance._tokenType,
      tokenLength: token ? token.length : 0
    });
  }

  // Clear token from all locations
  static clearToken() {
    TokenManager.setToken(null);
  }

  // Check if token exists
  static hasToken() {
    return !!TokenManager.getToken();
  }

  // Get token type
  static getTokenType() {
    TokenManager.getInstance();
    return TokenManager._tokenType;
  }

  // Validate token format
  static isValidToken(token = null) {
    const tokenToCheck = token || TokenManager.getToken();
    if (!tokenToCheck) return false;

    const tokenType = TokenManager._detectTokenType(tokenToCheck);
    
    switch (tokenType) {
      case 'jwt':
        // Basic JWT validation - has 3 parts
        return tokenToCheck.split('.').length === 3;
      case 'uuid':
        // UUID format validation
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(tokenToCheck);
      case 'generic':
        // Generic token - just check it's not empty and has reasonable length
        return tokenToCheck.length > 10;
      default:
        return false;
    }
  }

  // Add listener for token changes
  static addTokenChangeListener(callback) {
    if (typeof callback === 'function') {
      TokenManager._listeners.push(callback);
    }
  }

  // Remove listener
  static removeTokenChangeListener(callback) {
    const index = TokenManager._listeners.indexOf(callback);
    if (index > -1) {
      TokenManager._listeners.splice(index, 1);
    }
  }

  // Notify all listeners of token changes
  static _notifyListeners(newToken, oldToken) {
    TokenManager._listeners.forEach(callback => {
      try {
        callback(newToken, oldToken);
      } catch (error) {
        console.error('[TokenManager] Error in token change listener:', error);
      }
    });
  }

  // Force reload token from storage
  static reload() {
    const instance = TokenManager.getInstance();
    instance._loadToken();
    return instance;
  }

  // Get debug info
  static getDebugInfo() {
    const instance = TokenManager.getInstance();
    return {
      hasToken: !!instance._token,
      tokenType: instance._tokenType,
      tokenLength: instance._token ? instance._token.length : 0,
      isValid: TokenManager.isValidToken(),
      listeners: TokenManager._listeners.length,
      storageSync: {
        localStorage: !!localStorage.getItem('opal-token'),
        sessionStorage: !!sessionStorage.getItem('opal-token'),
        authService: !!(window.authService && window.authService.getAccessToken && window.authService.getAccessToken())
      }
    };
  }
}

export default TokenManager;
