import { useState, useEffect, useCallback } from 'react';
import authService, { User, LoginCredentials, RegisterData, AuthState } from '@/lib/auth-service';

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        await authService.initialize();
        const user = authService.getCurrentUserSync();
        setAuthState({
          user,
          isAuthenticated: !!user,
          isLoading: false,
          error: null,
        });
      } catch (error) {
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Authentication failed',
        });
      }
    };

    initializeAuth();
  }, []);

  // Listen for auth events
  useEffect(() => {
    const handleUserChanged = (user: User | null) => {
      setAuthState(prev => ({
        ...prev,
        user,
        isAuthenticated: !!user,
        error: null,
      }));
    };

    const handleAuthError = (error: string) => {
      setAuthState(prev => ({
        ...prev,
        error,
      }));
    };

    const handleLogin = (user: User) => {
      setAuthState(prev => ({
        ...prev,
        user,
        isAuthenticated: true,
        error: null,
      }));
    };

    const handleLogout = () => {
      setAuthState(prev => ({
        ...prev,
        user: null,
        isAuthenticated: false,
        error: null,
      }));
    };

    authService.on('userChanged', handleUserChanged);
    authService.on('authError', handleAuthError);
    authService.on('login', handleLogin);
    authService.on('logout', handleLogout);

    return () => {
      authService.off('userChanged', handleUserChanged);
      authService.off('authError', handleAuthError);
      authService.off('login', handleLogin);
      authService.off('logout', handleLogout);
    };
  }, []);

  // Auth methods
  const login = useCallback(async (credentials: LoginCredentials): Promise<User> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authService.login(credentials);
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setAuthState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<User> => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await authService.register(data);
      return user;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setAuthState(prev => ({ ...prev, error: errorMessage }));
      throw error;
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setAuthState(prev => ({ ...prev, isLoading: true }));
    try {
      await authService.logout();
    } catch (error) {
      console.warn('Logout error:', error);
    } finally {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    ...authState,
    login,
    register,
    logout,
    clearError,
  };
} 