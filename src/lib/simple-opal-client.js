/**
 * Simple OPAL Client - Pure JavaScript
 * 
 * A lightweight client for connecting to the OPAL server without TypeScript complications.
 * This can be easily imported and used in any React component.
 */

import { v4 as uuidv4 } from 'uuid';
import authService from './auth-service'; // Import the auth service instance
import AppConfig from '../config/AppConfig';
import TokenManager from '../auth/TokenManager';
import { getWsUrl, isTauri } from './tauri-bridge.ts';

/**
 * Safely decode a token - handles both JWT and UUID formats
 * @param {string} token - The token to decode (JWT or UUID)
 * @returns {object|null} The decoded payload or a default payload for UUID tokens
 */
function safeDecodeJwt(token) {
  if (!token || typeof token !== 'string') {
    console.warn('[OPAL] Invalid token format: token is null or not a string');
    return null;
  }
  
  // Check if token has the expected JWT format (3 parts separated by dots)
  const parts = token.split('.');
  if (parts.length !== 3) {
    // Not a JWT - check if it's a UUID format (for Electron app)
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidPattern.test(token)) {
      console.log('[OPAL] UUID format token detected, using default payload');
      // Return a default payload for UUID tokens
      return {
        userId: 'admin',
        username: 'admin',
        role: 'admin',
        // Add a long expiration to prevent refresh attempts
        exp: Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60) // 1 year
      };
    } else {
      console.warn('[OPAL] Invalid token format: not a valid JWT or UUID');
      return null;
    }
  }
  
  try {
    // Get the payload (middle part)
    const base64Payload = parts[1];
    
    // Convert from base64url to base64 by replacing characters
    // JWT uses base64url encoding which replaces + with - and / with _
    const normalizedBase64 = base64Payload.replace(/-/g, '+').replace(/_/g, '/');
    
    // Add padding if needed
    let paddedBase64 = normalizedBase64;
    switch (normalizedBase64.length % 4) {
      case 0: break; // No padding needed
      case 2: paddedBase64 += '=='; break;
      case 3: paddedBase64 += '='; break;
      default: console.warn('[OPAL] Invalid base64 length'); return null;
    }
    
    // Decode and parse
    const jsonStr = atob(paddedBase64);
    return JSON.parse(jsonStr);
  } catch (error) {
    console.warn('[OPAL] Error decoding JWT token:', error);
    return null;
  }
}

class SimpleOPALClient {
  constructor() {
    this.ws = null;
    // Initialize with fallback URL
    this.baseUrl = AppConfig.wsUrl || 'ws://localhost:3000';
    this.baseUrlPromise = null;
    
    // If in Tauri, eagerly load the actual URL
    if (isTauri()) {
      this.initializeBaseUrl();
    }
    
    this.token = null;
    this.isConnected = false;
    this.isReady = false;
    this.sessionId = null;
    this.tools = [];
    this.requestId = 1;
    this.pendingRequests = new Map();
    this.listeners = new Map();
    this.autoReconnect = true;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = null;

    // Auto-initialize from stored token
    this.initFromStorage();
    
    // Set up auth service event listeners
    this.setupAuthListeners();
  }
  
  async initializeBaseUrl() {
    if (!this.baseUrlPromise) {
      this.baseUrlPromise = getWsUrl();
    }
    try {
      this.baseUrl = await this.baseUrlPromise;
      console.log('[SimpleOPAL] Initialized WebSocket URL:', this.baseUrl);
    } catch (error) {
      console.warn('[SimpleOPAL] Failed to initialize WebSocket URL from Tauri:', error);
    }
  }
  
  async getBaseUrl() {
    if (isTauri()) {
      if (!this.baseUrlPromise) {
        this.baseUrlPromise = getWsUrl();
      }
      return await this.baseUrlPromise;
    }
    return this.baseUrl;
  }
  
  // Set up listeners for authentication events
  setupAuthListeners() {
    // Listen for login events
    authService.on('login', (user) => {
      console.log('[OPAL] Auth login event received, updating token and connection');
      const token = authService.getAccessToken();
      if (token) {
        this.setToken(token);
        // Reconnect with new token if not already connected
        if (!this.isConnected) {
          this.connect().catch(err => {
            console.error('[OPAL] Failed to connect after login:', err);
          });
        } else {
          // Update authentication on existing connection
          this.authenticate(token);
        }
      }
    });
    
    // Listen for logout events
    authService.on('logout', () => {
      console.log('[OPAL] Auth logout event received, disconnecting');
      // Disconnect on logout
      this.disconnect();
      // Clear token from storage
      localStorage.removeItem('opal-token');
      this.token = null;
    });
    
    // Listen for token refresh events
    authService.on('tokenRefresh', (token) => {
      console.log('[OPAL] Auth token refresh event received, updating authentication');
      if (token) {
        this.setToken(token);
        // Update authentication on existing connection
        if (this.isConnected) {
          this.authenticate(token);
        }
      }
    });
    
    // Listen for token update events
    authService.on('tokenUpdate', (token) => {
      console.log('[OPAL] Auth token update event received');
      if (token) {
        console.log('[OPAL] Token update received, format:', token ? token.substring(0, 10) + '...' : 'null');
        
        // Use the safe JWT decoder to parse the token
        const payload = safeDecodeJwt(token);
        
        if (payload) {
          console.log('[OPAL] Successfully parsed payload:', payload);
          
          if (payload.role === 'user') {
            console.log('[OPAL] Updating user token');
            this.setToken(token);
            if (this.isConnected) {
              this.authenticate(token);
            }
          } else {
            console.log('[OPAL] Not updating token - admin session detected');
          }
        } else {
          console.warn('[OPAL] Could not parse token payload - invalid token format');
        }
      }
    });
  }

  // Initialize from TokenManager
  initFromStorage() {
    try {
      const storedToken = TokenManager.getToken();
      if (storedToken) {
        this.token = storedToken;
        // Auto-connect after a brief delay to allow components to set up listeners
        setTimeout(() => {
          this.autoConnect();
        }, 100);
      }
    } catch (error) {
      console.warn('Failed to load stored OPAL token:', error);
    }
  }

  // Auto-connect with stored token
  async autoConnect() {
    // Use centralized token management
    const token = TokenManager.getToken();
    
    if (token) {
      this.token = token;
      console.log('[OPAL] Using token from TokenManager for connection');
      
      if (!this.isConnected && !this.isReady) {
        try {
          console.log('[OPAL] Auto-connecting with token...');
          await this.connect();
        } catch (error) {
          console.warn('[OPAL] Auto-connect failed:', error);
          // Let TokenManager handle token cleanup
          if (!TokenManager.isValidToken()) {
            TokenManager.clearToken();
            this.token = null;
          }
        }
      }
    }
  }

  // Set authentication token
  setToken(token) {
    console.log('[OPAL] Setting token via TokenManager');
    
    // Use centralized token management
    TokenManager.setToken(token);
    this.token = TokenManager.getToken();
  }

  // Set server URL
  setServerUrl(url) {
    this.baseUrl = url;
  }

  // Set preferred port
  setPreferredPort(port) {
    console.log(`[OPAL] Setting preferred port to: ${port}`);
    const host = 'localhost'; // Or extract from current baseUrl if needed
    this.baseUrl = `ws://${host}:${port}`;
    console.log(`[OPAL] Updated baseUrl to: ${this.baseUrl}`);
  }

  // Add event listener
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
  }

  // Remove event listener
  off(event, callback) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  // Emit event to listeners
  emit(event, data) {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in event listener:', error);
        }
      });
    }
  }

  // Connect to OPAL server
  async connect() {
    if (!this.token) {
      throw new Error('Authentication token is required. Call setToken() first.');
    }

    console.log('[OPAL] Starting connection process...');
    
    // For UUID tokens, we don't need to validate - just use as-is
    // For JWT tokens, we'll validate the format
    if (this.token.includes('.')) {
      // Only try to validate JWT tokens
      const payload = safeDecodeJwt(this.token);
      if (!payload) {
        console.warn('[OPAL] Invalid JWT format detected before connection attempt');
        // Continue anyway, but log the warning
      } else {
        console.log('[OPAL] JWT token validated successfully before connection');
      }
    } else {
      console.log('[OPAL] UUID token detected, skipping JWT validation');
    }
    
    return new Promise(async (resolve, reject) => {
      try {
        // Get the base URL (may be async in Tauri)
        const baseUrl = await this.getBaseUrl();
        
        // Pass token as query parameter
        const wsUrl = `${baseUrl}?authorization=Bearer%20${encodeURIComponent(this.token)}`;
        console.log('[OPAL] Connecting to:', wsUrl);
        this.ws = new WebSocket(wsUrl);

        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 10000);

        this.ws.onopen = async () => {
          console.log('[OPAL] WebSocket connection opened');
          clearTimeout(timeout);
          this.isConnected = true;
          this.clearReconnectTimer(); // Clear any pending reconnection attempts
          this.emit('statusChange', 'connected');
          
          // Authenticate the connection
          const token = authService.getAccessToken();
          if (token) {
            this.authenticate(token);
          }
          
          try {
            console.log('[OPAL] Starting MCP initialization...');
            await this.initialize();
            console.log('[OPAL] MCP initialization completed');
            this.isReady = true;
            this.emit('statusChange', 'ready');
            this.emit('ready', true);
            resolve(true);
          } catch (error) {
            console.error('[OPAL] Initialization failed:', error);
            this.handleError(error);
            reject(error);
          }
        };

        this.ws.onmessage = (event) => {
          console.log('[OPAL] Received message:', event.data);
          this.handleMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('[OPAL] WebSocket error:', error);
          clearTimeout(timeout);
          this.handleError(error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          this.handleDisconnection();
        };

      } catch (error) {
        this.handleError(error);
        reject(error);
      }
    });
  }

  // Initialize MCP session
  async initialize() {
    const initRequest = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        clientInfo: {
          name: 'ForgeApp',
          version: '1.0.0'
        },
        capabilities: {
          tools: { listChanged: true },
          resources: { listChanged: true, subscribe: true },
          prompts: { listChanged: true }
        }
      }
    };

    const result = await this.sendRequest(initRequest);
    this.sessionId = result.sessionId;

    // Send initialized notification
    this.ws.send(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }));

    // Load tools
    await this.loadTools();
  }

  // Load available tools
  async loadTools() {
    try {
      const result = await this.sendRequest({
        jsonrpc: '2.0',
        id: this.requestId++,
        method: 'tools/list'
      });

      this.tools = result.tools || [];
      this.emit('toolsUpdated', this.tools);
    } catch (error) {
      console.error('Failed to load tools:', error);
    }
  }

  // Call a tool
  async callTool(name, args = {}) {
    if (!this.isReady) {
      throw new Error('OPAL connection not ready');
    }

    const result = await this.sendRequest({
      jsonrpc: '2.0',
      id: this.requestId++,
      method: 'tools/call',
      params: {
        name,
        arguments: args
      }
    });

    this.emit('toolCall', { name, args, result });
    
    // Handle MCP response format - extract and parse the content
    if (result && result.content && Array.isArray(result.content)) {
      // Look for text content
      const textContent = result.content.find(item => item.type === 'text');
      if (textContent && textContent.text) {
        try {
          // Try to parse as JSON first (for structured data like journal entries)
          const parsed = JSON.parse(textContent.text);
          return parsed;
        } catch (e) {
          // If not JSON, return the text as-is
          return textContent.text;
        }
      }
    }
    
    // Fallback to returning the result as-is
    return result;
  }

  // Send request and wait for response
  async sendRequest(request, customTimeout = null) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not open');
    }

    console.log('[OPAL] Sending request:', JSON.stringify(request, null, 2));

    // Use longer timeout for AI-related calls (2 minutes), default 30s for others
    const isAICall = request.params?.name?.includes('ai_') || 
                     request.params?.name?.includes('get_ai_') ||
                     request.params?.name === 'get_ai_feedback' ||
                     request.params?.name === 'get_ai_insights';
    const timeoutMs = customTimeout || (isAICall ? 120000 : 30000);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('[OPAL] Request timeout for method:', request.method, 'after', timeoutMs, 'ms');
        this.pendingRequests.delete(request.id);
        reject(new Error(`Request timeout for method: ${request.method}`));
      }, timeoutMs);

      this.pendingRequests.set(request.id, { resolve, reject, timeout });
      this.ws.send(JSON.stringify(request));
    });
  }

  // Handle incoming messages
  handleMessage(message) {
    if (message.id !== undefined && this.pendingRequests.has(message.id)) {
      const { resolve, reject, timeout } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);
      clearTimeout(timeout);

      if (message.error) {
        reject(new Error(`${message.error.message} (Code: ${message.error.code})`));
      } else {
        resolve(message.result);
      }
    } else if (message.method) {
      this.emit('notification', message);
    }
  }

  // Handle errors
  handleError(error) {
    this.emit('error', {
      type: 'connection',
      message: error.message || 'Connection error',
      details: error
    });
  }

  // Handle disconnection
  handleDisconnection() {
    console.log('[OPAL] Connection lost');
    this.isConnected = false;
    this.isReady = false;
    this.sessionId = null;
    this.tools = [];

    // Reject pending requests
    for (const [id, { reject }] of this.pendingRequests) {
      reject(new Error('Connection closed'));
    }
    this.pendingRequests.clear();

    this.emit('statusChange', 'disconnected');
    this.emit('ready', false);

    // Attempt reconnection if auto-reconnect is enabled and we have a token
    if (this.autoReconnect && this.token && this.reconnectAttempts < this.maxReconnectAttempts) {
      this.scheduleReconnect();
    }
  }

  // Schedule reconnection attempt
  scheduleReconnect() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
    }

    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000); // Exponential backoff, max 30s

    console.log(`[OPAL] Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    this.reconnectInterval = setTimeout(async () => {
      try {
        console.log(`[OPAL] Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
        await this.connect();
        this.reconnectAttempts = 0; // Reset on successful connection
      } catch (error) {
        console.warn(`[OPAL] Reconnection attempt ${this.reconnectAttempts} failed:`, error);
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('[OPAL] Max reconnection attempts reached');
          this.emit('maxReconnectAttemptsReached');
        }
      }
    }, delay);
  }

  // Clear reconnection timer
  clearReconnectTimer() {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    this.reconnectAttempts = 0;
  }

  // Disconnect
  async disconnect() {
    this.autoReconnect = false; // Disable auto-reconnect when manually disconnecting
    this.clearReconnectTimer();
    
    if (this.ws && this.isConnected) {
      this.ws.close(1000, 'Client disconnecting');
    }
  }

  // Enable/disable auto-reconnect
  setAutoReconnect(enabled) {
    this.autoReconnect = enabled;
    if (!enabled) {
      this.clearReconnectTimer();
    }
  }

  // Get current status
  getStatus() {
    if (this.isReady) return 'ready';
    if (this.isConnected) return 'connected';
    return 'disconnected';
  }

  // Get tools
  getTools() {
    return this.tools;
  }

  // Check if ready
  ready() {
    return this.isReady;
  }

  // Wait for ready state with timeout
  async waitForReady(timeoutMs = 10000) {
    console.log('[OPAL] Waiting for ready state...');
    
    // If already ready, return immediately
    if (this.isReady) {
      console.log('[OPAL] Already in ready state');
      return true;
    }
    
    // Create a promise that resolves when the client is ready
    return new Promise((resolve, reject) => {
      // Set timeout
      const timeout = setTimeout(() => {
        console.warn(`[OPAL] Timeout waiting for ready state after ${timeoutMs}ms`);
        this.off('ready', readyHandler);
        reject(new Error('Timeout waiting for OPAL client to be ready'));
      }, timeoutMs);
      
      // Create handler for ready event
      const readyHandler = (isReady) => {
        if (isReady) {
          clearTimeout(timeout);
          this.off('ready', readyHandler);
          console.log('[OPAL] Ready state achieved');
          resolve(true);
        }
      };
      
      // Listen for ready event
      this.on('ready', readyHandler);
      
      // Check current state again in case it changed
      if (this.isReady) {
        clearTimeout(timeout);
        this.off('ready', readyHandler);
        console.log('[OPAL] Already in ready state (rechecked)');
        resolve(true);
      }
    });
  }

  // Get session ID
  getSessionId() {
    return this.sessionId;
  }

  authenticate(token) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn('[OPAL] WebSocket not open, cannot authenticate.');
      return;
    }
    
    // For UUID tokens, we don't need to validate - just use as-is
    // For JWT tokens, we'll validate the format
    if (token && token.includes('.')) {
      // Only try to validate JWT tokens
      const payload = safeDecodeJwt(token);
      if (!payload) {
        console.warn('[OPAL] Invalid JWT format detected during authentication');
        // Continue anyway, but log the warning
      } else {
        console.log('[OPAL] JWT token validated successfully during authentication');
      }
    } else {
      console.log('[OPAL] UUID token detected during authentication, skipping JWT validation');
    }
    
    // Remove Bearer prefix if present
    const cleanToken = token.replace(/^Bearer\s+/i, '').trim();
    
    const authRequest = {
      jsonrpc: '2.0',
      id: this.requestId++,
      method: 'authenticate',
      params: { token: cleanToken },
    };
    this.ws.send(JSON.stringify(authRequest));
    console.log('[OPAL] Sent authentication request.');
  }

  async summarize(content, type = 'paragraph') {
    if (!this.isReady) {
      throw new Error('OPAL not ready for summarization.');
    }
  }
}

// Export singleton instance
const opal = new SimpleOPALClient();
export default opal;

// Also export the class for custom instances
export { SimpleOPALClient }; 