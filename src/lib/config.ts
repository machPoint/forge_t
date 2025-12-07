// Minimal opalConfig for frontend API URL management
// Uses Tauri bridge for desktop app, falls back to environment variables for web

import { getServerPort, isTauri } from './tauri-bridge';

let cachedPort: number | null = null;
const host = 'localhost'; // Always localhost for desktop app

export const opalConfig = {
  async getApiUrl(): Promise<string> {
    const port = await this.getPort();
    return `http://${host}:${port}/api`;
  },
  
  async getPort(): Promise<number> {
    if (cachedPort !== null) {
      return cachedPort;
    }
    
    if (isTauri()) {
      try {
        cachedPort = await getServerPort();
        console.log(`[opalConfig] API configured to use port: ${cachedPort} (from Tauri)`);
        return cachedPort;
      } catch (error) {
        console.warn('[opalConfig] Failed to get port from Tauri, using fallback');
      }
    }
    
    // Fallback to environment variable
    const envPort = import.meta.env.VITE_API_PORT;
    cachedPort = envPort ? parseInt(envPort, 10) : 3000;
    console.log(`[opalConfig] API configured to use port: ${cachedPort} (from env)`);
    return cachedPort;
  },
  
  setPort(newPort: number) {
    cachedPort = newPort;
  }
};
