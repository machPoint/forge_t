/**
 * Tauri Bridge
 * 
 * Centralized wrapper for all Tauri invoke calls.
 * This provides a consistent API for accessing Tauri backend functionality.
 */

import { invoke } from '@tauri-apps/api/core';

// Cache for configuration values to avoid repeated invokes
const configCache = {
  apiUrl: null as string | null,
  wsUrl: null as string | null,
  journalApiUrl: null as string | null,
  notesApiUrl: null as string | null,
  serverPort: null as number | null,
  appVersion: null as string | null,
  lastUpdated: 0,
};

const CACHE_DURATION = 5000; // 5 seconds

/**
 * Check if running in Tauri environment
 */
export function isTauri(): boolean {
  return '__TAURI_INTERNALS__' in window;
}

/**
 * Clear the configuration cache
 */
export function clearCache(): void {
  configCache.apiUrl = null;
  configCache.wsUrl = null;
  configCache.journalApiUrl = null;
  configCache.notesApiUrl = null;
  configCache.serverPort = null;
  configCache.appVersion = null;
  configCache.lastUpdated = 0;
}

/**
 * Check if cache is valid
 */
function isCacheValid(): boolean {
  return Date.now() - configCache.lastUpdated < CACHE_DURATION;
}

/**
 * Get the base API URL (http://localhost:PORT/api)
 */
export async function getApiUrl(): Promise<string> {
  if (!isTauri()) {
    return import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  }

  if (configCache.apiUrl && isCacheValid()) {
    return configCache.apiUrl;
  }

  try {
    const url = await invoke<string>('get_api_url');
    configCache.apiUrl = url;
    configCache.lastUpdated = Date.now();
    return url;
  } catch (error) {
    console.error('[TauriBridge] Failed to get API URL:', error);
    return 'http://localhost:3000/api';
  }
}

/**
 * Get the WebSocket URL (ws://localhost:PORT)
 */
export async function getWsUrl(): Promise<string> {
  if (!isTauri()) {
    return import.meta.env.VITE_WS_URL || 'ws://localhost:3000';
  }

  if (configCache.wsUrl && isCacheValid()) {
    return configCache.wsUrl;
  }

  try {
    const url = await invoke<string>('get_ws_url');
    configCache.wsUrl = url;
    configCache.lastUpdated = Date.now();
    return url;
  } catch (error) {
    console.error('[TauriBridge] Failed to get WebSocket URL:', error);
    return 'ws://localhost:3000';
  }
}

/**
 * Get the Journal API URL (http://localhost:PORT/journal)
 */
export async function getJournalApiUrl(): Promise<string> {
  if (!isTauri()) {
    return import.meta.env.VITE_API_URL?.replace('/api', '/journal') || 'http://localhost:3000/journal';
  }

  if (configCache.journalApiUrl && isCacheValid()) {
    return configCache.journalApiUrl;
  }

  try {
    const url = await invoke<string>('get_journal_api_url');
    configCache.journalApiUrl = url;
    configCache.lastUpdated = Date.now();
    return url;
  } catch (error) {
    console.error('[TauriBridge] Failed to get Journal API URL:', error);
    return 'http://localhost:3000/journal';
  }
}

/**
 * Get the Notes API URL (http://localhost:PORT/notes)
 */
export async function getNotesApiUrl(): Promise<string> {
  if (!isTauri()) {
    return 'http://localhost:3000/notes';
  }

  if (configCache.notesApiUrl && isCacheValid()) {
    return configCache.notesApiUrl;
  }

  try {
    const url = await invoke<string>('get_notes_api_url');
    configCache.notesApiUrl = url;
    configCache.lastUpdated = Date.now();
    return url;
  } catch (error) {
    console.error('[TauriBridge] Failed to get Notes API URL:', error);
    return 'http://localhost:3000/notes';
  }
}

/**
 * Get the server port
 */
export async function getServerPort(): Promise<number> {
  if (!isTauri()) {
    const envPort = import.meta.env.VITE_API_PORT;
    return envPort ? parseInt(envPort, 10) : 3000;
  }

  if (configCache.serverPort && isCacheValid()) {
    return configCache.serverPort;
  }

  try {
    const port = await invoke<number>('get_server_port');
    configCache.serverPort = port;
    configCache.lastUpdated = Date.now();
    return port;
  } catch (error) {
    console.error('[TauriBridge] Failed to get server port:', error);
    return 3000;
  }
}

/**
 * Get the app version
 */
export async function getAppVersion(): Promise<string> {
  if (!isTauri()) {
    return '1.0.0';
  }

  if (configCache.appVersion && isCacheValid()) {
    return configCache.appVersion;
  }

  try {
    const version = await invoke<string>('get_app_version');
    configCache.appVersion = version;
    configCache.lastUpdated = Date.now();
    return version;
  } catch (error) {
    console.error('[TauriBridge] Failed to get app version:', error);
    return '1.0.0';
  }
}

/**
 * Restart the OPAL server
 */
export async function restartOpalServer(): Promise<void> {
  if (!isTauri()) {
    console.warn('[TauriBridge] Cannot restart server in web mode');
    return;
  }

  try {
    await invoke('restart_opal_server');
    // Clear cache after restart
    clearCache();
  } catch (error) {
    console.error('[TauriBridge] Failed to restart OPAL server:', error);
    throw error;
  }
}

// Export a default object for convenience
const tauriBridge = {
  isTauri,
  getApiUrl,
  getWsUrl,
  getJournalApiUrl,
  getNotesApiUrl,
  getServerPort,
  getAppVersion,
  restartOpalServer,
  clearCache,
};

export default tauriBridge;
