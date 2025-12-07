/**
 * Authentication Service for Forge Frontend
 * Integrates with OPAL backend's JWT authentication system
 */
import { getApiUrl, isTauri } from './tauri-bridge';

export interface User {
  id: string;
  username: string;
  email?: string;
  role: string;
  created_at?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

class AuthService {
  private baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private user: User | null = null;
  private listeners: Map<string, ((data?: unknown) => void)[]> = new Map();
  private baseUrlPromise: Promise<string> | null = null;

  constructor() {
    // Initialize with fallback, will be updated on first API call
    this.baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    this.loadTokensFromStorage();
    // Eagerly load the actual URL
    this.initializeBaseUrl();
  }

  private async initializeBaseUrl(): Promise<void> {
    if (!this.baseUrlPromise) {
      this.baseUrlPromise = this.getApiBaseUrl();
    }
    try {
      this.baseUrl = await this.baseUrlPromise;
    } catch (error) {
      console.warn('[AuthService] Failed to initialize base URL:', error);
    }
  }

  private async getApiBaseUrl(): Promise<string> {
    // Use Tauri bridge if in Tauri environment
    if (isTauri()) {
      try {
        return await getApiUrl();
      } catch (error) {
        console.error('[AuthService] Failed to get API URL from Tauri:', error);
      }
    }
    
    // Fallback to environment variable or default
    return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  }
  
  // Runtime URL resolution - async to support Tauri invoke
  private async getApiUrl(): Promise<string> {
    if (!this.baseUrlPromise) {
      this.baseUrlPromise = this.getApiBaseUrl();
    }
    return await this.baseUrlPromise;
  }

  // Event system
  on(event: string, callback: (data?: unknown) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (data?: unknown) => void) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  private emit(event: string, data?: unknown) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }

  // Token management
  private loadTokensFromStorage() {
    try {
      const storedTokens = localStorage.getItem('auth-tokens');
      if (storedTokens) {
        const tokens: AuthTokens = JSON.parse(storedTokens);
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
        this.validateAndDecodeToken();
      }
    } catch (error) {
      console.warn('Failed to load tokens from storage:', error);
      this.clearTokens();
    }
  }

  private saveTokensToStorage(tokens: AuthTokens) {
    try {
      // Save tokens in standard location
      localStorage.setItem('auth-tokens', JSON.stringify(tokens));
      
      // Don't overwrite opal-token directly as it may be used for admin sessions
      // Instead, emit an event that the OPAL client can listen for
      this.emit('tokenUpdate', tokens.accessToken);
    } catch (error) {
      console.warn('Failed to save tokens to storage:', error);
    }
  }

  private clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.user = null;
    localStorage.removeItem('auth-tokens');
    localStorage.removeItem('opal-token'); // Clear old token format
  }

  private validateAndDecodeToken() {
    if (!this.accessToken) return;

    try {
      // Check if token is in JWT format (contains two periods)
      if (this.accessToken.includes('.')) {
        // JWT format: header.payload.signature
        const payload = JSON.parse(atob(this.accessToken.split('.')[1]));
        const currentTime = Date.now() / 1000;

        if (payload.exp && payload.exp < currentTime) {
          // Token expired, try to refresh
          this.refreshAccessToken();
          return;
        }

        this.user = {
          id: payload.userId,
          username: payload.username,
          role: payload.role
        };
      } else {
        // UUID format token (used in Electron app)
        console.log('[AuthService] Using UUID format token');
        
        // For UUID tokens, we'll use a default admin user
        // This allows the app to function without JWT validation
        this.user = {
          id: 'admin',
          username: 'admin',
          role: 'admin'
        };
        
        // Also set the token in localStorage for OPAL client
        localStorage.setItem('opal-token', this.accessToken);
      }

      this.emit('userChanged', this.user);
    } catch (error) {
      console.warn('Invalid token format:', error);
      // Don't clear tokens for UUID format - just set default user
      if (this.accessToken.includes('.')) {
        this.clearTokens();
      } else {
        // For UUID tokens, use default admin user
        this.user = {
          id: 'admin',
          username: 'admin',
          role: 'admin'
        };
        this.emit('userChanged', this.user);
      }
    }
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken: this.refreshToken }),
      });

      if (response.ok) {
        const data = await response.json();
        this.accessToken = data.accessToken;
        this.saveTokensToStorage({
          accessToken: this.accessToken,
          refreshToken: this.refreshToken!
        });
        this.validateAndDecodeToken();
        this.emit('tokenRefresh', this.accessToken);
        return true;
      } else {
        this.clearTokens();
        this.emit('authError', 'Session expired. Please login again.');
        return false;
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      this.emit('authError', 'Failed to refresh session.');
      return false;
    }
  }

  // API request helper
  private async apiRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    // Add authorization header if we have a token
    if (this.accessToken) {
      options.headers = {
        ...options.headers,
        'Authorization': `Bearer ${this.accessToken}`,
      };
    }

    const response = await fetch(url, options);

    // If we get a 401, try to refresh the token
    if (response.status === 401 && this.refreshToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry the request with the new token
        options.headers = {
          ...options.headers,
          'Authorization': `Bearer ${this.accessToken}`,
        };
        return fetch(url, options);
      }
    }

    return response;
  }

  // Authentication methods
  async login(credentials: LoginCredentials): Promise<User> {
    try {
      const apiUrl = await this.getApiUrl();
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Login failed');
      }

      const data = await response.json();
      this.accessToken = data.accessToken;
      this.refreshToken = data.refreshToken;
      this.user = data.user;

      this.saveTokensToStorage({
        accessToken: this.accessToken,
        refreshToken: this.refreshToken
      });

      this.emit('login', this.user);
      this.emit('userChanged', this.user);

      return this.user;
    } catch (error) {
      this.emit('authError', error instanceof Error ? error.message : 'Login failed');
      throw error;
    }
  }

  async register(userData: RegisterData): Promise<User> {
    try {
      const apiUrl = await this.getApiUrl();
      const response = await fetch(`${apiUrl}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Registration failed');
      }

      const user = await response.json();
      this.emit('register', user);
      return user;
    } catch (error) {
      this.emit('authError', error instanceof Error ? error.message : 'Registration failed');
      throw error;
    }
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      try {
        await fetch(`${this.baseUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken: this.refreshToken }),
        });
      } catch (error) {
        console.warn('Logout request failed:', error);
      }
    }

    this.clearTokens();
    this.emit('logout');
    this.emit('userChanged', null);
  }

  async getCurrentUser(): Promise<User | null> {
    if (!this.accessToken) return null;

    try {
      const response = await this.apiRequest('/auth/me');
      if (response.ok) {
        const user = await response.json();
        this.user = user;
        this.emit('userChanged', user);
        return user;
      }
    } catch (error) {
      console.warn('Failed to get current user:', error);
    }

    return this.user;
  }

  // API token management (for OPAL integration)
  async createApiToken(name: string, permissions: Record<string, boolean> = {}, expiresIn?: number): Promise<{ token: string; id: string; name: string; permissions: Record<string, boolean>; expiresAt?: string }> {
    try {
      const response = await this.apiRequest('/auth/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, permissions, expiresIn }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create API token');
      }

      return await response.json();
    } catch (error) {
      this.emit('authError', error instanceof Error ? error.message : 'Failed to create API token');
      throw error;
    }
  }

  async getApiTokens(): Promise<Array<{ id: string; name: string; permissions: Record<string, boolean>; createdAt: string; expiresAt?: string }>> {
    try {
      const response = await this.apiRequest('/auth/token');
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get API tokens');
      }

      return await response.json();
    } catch (error) {
      this.emit('authError', error instanceof Error ? error.message : 'Failed to get API tokens');
      throw error;
    }
  }

  async deleteApiToken(tokenId: string): Promise<void> {
    try {
      const response = await this.apiRequest(`/auth/token/${tokenId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete API token');
      }
    } catch (error) {
      this.emit('authError', error instanceof Error ? error.message : 'Failed to delete API token');
      throw error;
    }
  }

  // Getters
  getCurrentUserSync(): User | null {
    return this.user;
  }

  isAuthenticated(): boolean {
    return !!this.user && !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  // Initialize auth state
  async initialize(): Promise<void> {
    if (this.accessToken) {
      await this.getCurrentUser();
    }
  }
}

// Create singleton instance
const authService = new AuthService();

export default authService; 