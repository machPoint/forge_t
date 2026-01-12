declare class TokenManager {
  setToken(token: string): void;
  getToken(): string | null;
  clearToken(): void;
  isAuthenticated(): boolean;
  reload(): void;
  getDebugInfo(): Record<string, any>;
}

declare const tokenManager: TokenManager;
export default tokenManager;
