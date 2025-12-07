/**
 * OPAL MCP Client for React/TypeScript Applications
 * 
 * This client provides a complete interface to connect the Forge app
 * to the OPAL server using the Model Context Protocol (MCP).
 */
import { getWsUrl, isTauri } from './tauri-bridge';

interface MCPMessage {
  jsonrpc: '2.0';
  id?: number | string;
  method?: string;
  params?: any;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

interface OPALState {
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'initialized';
  sessionId: string | null;
  tools: Tool[];
  isReady: boolean;
}

export type ConnectionStatus = OPALState['connectionStatus'];

export class OPALClient {
  private ws: WebSocket | null = null;
  private baseUrl: string;
  private baseUrlPromise: Promise<string> | null = null;
  private token: string | null = null;
  private state: OPALState = {
    connectionStatus: 'disconnected',
    sessionId: null,
    tools: [],
    isReady: false
  };
  private requestId = 1;
  private pendingRequests = new Map<number, {
    resolve: (value: any) => void;
    reject: (reason: any) => void;
  }>();
  private eventListeners = new Map<string, Set<Function>>();

  constructor(baseUrl?: string) {
    // Use provided URL or initialize with fallback
    this.baseUrl = baseUrl || 'ws://localhost:3000';
    
    // If no URL provided and in Tauri, eagerly load the actual URL
    if (!baseUrl && isTauri()) {
      this.initializeBaseUrl();
    }
  }
  
  private async initializeBaseUrl(): Promise<void> {
    if (!this.baseUrlPromise) {
      this.baseUrlPromise = getWsUrl();
    }
    try {
      this.baseUrl = await this.baseUrlPromise;
      console.log('[OPALClient] Initialized WebSocket URL:', this.baseUrl);
    } catch (error) {
      console.warn('[OPALClient] Failed to initialize WebSocket URL from Tauri:', error);
    }
  }
  
  private async getBaseUrl(): Promise<string> {
    if (isTauri()) {
      if (!this.baseUrlPromise) {
        this.baseUrlPromise = getWsUrl();
      }
      return await this.baseUrlPromise;
    }
    return this.baseUrl;
  }

  /**
   * Set the authentication token
   */
  setToken(token: string) {
    // Clean the token of any accidental prefixes
    this.token = token.replace(/^Bearer\s+/i, '').trim();
  }

  /**
   * Get the current connection status
   */
  getStatus(): ConnectionStatus {
    return this.state.connectionStatus;
  }

  /**
   * Check if the client is ready to make tool calls
   */
  isReady(): boolean {
    return this.state.isReady;
  }

  /**
   * Get the current session ID
   */
  getSessionId(): string | null {
    return this.state.sessionId;
  }

  /**
   * Get available tools
   */
  getTools(): Tool[] {
    return this.state.tools;
  }

  /**
   * Add an event listener
   */
  addEventListener(event: string, callback: Function): string {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(callback);
    return `${event}_${Date.now()}_${Math.random()}`;
  }

  /**
   * Remove an event listener
   */
  removeEventListener(event: string, callback: Function) {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.delete(callback);
    }
  }

  /**
   * Connect to the OPAL server
   */
  async connect(): Promise<boolean> {
    if (this.state.connectionStatus === 'connecting' || this.state.connectionStatus === 'connected') {
      return this.state.isReady;
    }

    if (!this.token) {
      throw new Error('Authentication token is required. Call setToken() first.');
    }

    return new Promise(async (resolve, reject) => {
      try {
        this.state.connectionStatus = 'connecting';
        this._notifyListeners('statusChange', this.state.connectionStatus);

        // Get the WebSocket URL (may be async in Tauri)
        const baseUrl = await this.getBaseUrl();
        
        // Construct WebSocket URL with token
        const wsUrl = `${baseUrl}?token=${this.token}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = async () => {
          try {
            this.state.connectionStatus = 'connected';
            this._notifyListeners('statusChange', this.state.connectionStatus);

            // Initialize MCP session
            await this._initialize();
            
            this.state.connectionStatus = 'initialized';
            this.state.isReady = true;
            this._notifyListeners('statusChange', this.state.connectionStatus);
            this._notifyListeners('ready', true);

            resolve(true);
          } catch (error) {
            console.error('Failed to initialize MCP session:', error);
            this._handleConnectionError(error);
            reject(error);
          }
        };

        this.ws.onmessage = (event) => {
          this._handleMessage(JSON.parse(event.data));
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this._handleConnectionError(error);
          reject(error);
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket connection closed:', event.code, event.reason);
          this._handleDisconnection();
          if (event.code !== 1000) {
            reject(new Error(`Connection closed unexpectedly: ${event.reason}`));
          }
        };

      } catch (error) {
        this._handleConnectionError(error);
        reject(error);
      }
    });
  }

  /**
   * Disconnect from the OPAL server
   */
  async disconnect() {
    if (this.ws && this.state.connectionStatus !== 'disconnected') {
      // Send shutdown notification if connected
      if (this.state.isReady) {
        try {
          await this._sendRequest('notifications/shutdown');
        } catch (error) {
          console.warn('Failed to send shutdown notification:', error);
        }
      }

      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }

    this._handleDisconnection();
  }

  /**
   * Call an MCP tool
   */
  async callTool(name: string, args: Record<string, any> = {}): Promise<any> {
    if (!this.state.isReady) {
      throw new Error('OPAL connection not ready. Current status: ' + this.state.connectionStatus);
    }

    try {
      const result = await this._sendRequest('tools/call', {
        name,
        arguments: args
      });

      this._notifyListeners('toolCall', { name, args, result });
      return result;
    } catch (error) {
      this._notifyListeners('error', { 
        type: 'tool', 
        toolName: name, 
        message: (error as Error).message,
        details: error
      });
      throw error;
    }
  }

  /**
   * List available tools
   */
  async listTools(): Promise<Tool[]> {
    if (!this.state.isReady) {
      throw new Error('OPAL connection not ready. Current status: ' + this.state.connectionStatus);
    }

    try {
      const result = await this._sendRequest('tools/list');
      this.state.tools = result.tools || [];
      this._notifyListeners('toolsUpdated', this.state.tools);
      return this.state.tools;
    } catch (error) {
      this._notifyListeners('error', { 
        type: 'tools', 
        message: (error as Error).message,
        details: error
      });
      throw error;
    }
  }

  /**
   * Initialize MCP session
   */
  private async _initialize(): Promise<void> {
    const initResult = await this._sendRequest('initialize', {
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
    });

    this.state.sessionId = initResult.sessionId;

    // Send initialized notification
    await this._sendNotification('notifications/initialized');

    // Load available tools
    await this.listTools();
  }

  /**
   * Send a request and wait for response
   */
  private async _sendRequest(method: string, params?: any): Promise<any> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not open');
    }

    const id = this.requestId++;
    const message: MCPMessage = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.pendingRequests.set(id, { resolve, reject });
      
      // Set timeout for request
      setTimeout(() => {
        if (this.pendingRequests.has(id)) {
          this.pendingRequests.delete(id);
          reject(new Error(`Request timeout for method: ${method}`));
        }
      }, 30000); // 30 second timeout

      this.ws!.send(JSON.stringify(message));
    });
  }

  /**
   * Send a notification (no response expected)
   */
  private async _sendNotification(method: string, params?: any): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket connection not open');
    }

    const message: MCPMessage = {
      jsonrpc: '2.0',
      method,
      params
    };

    this.ws.send(JSON.stringify(message));
  }

  /**
   * Handle incoming messages
   */
  private _handleMessage(message: MCPMessage) {
    // Handle responses to requests
    if (message.id !== undefined && typeof message.id === 'number' && this.pendingRequests.has(message.id)) {
      const { resolve, reject } = this.pendingRequests.get(message.id)!;
      this.pendingRequests.delete(message.id);

      if (message.error) {
        reject(new Error(`${message.error.message} (Code: ${message.error.code})`));
      } else {
        resolve(message.result);
      }
      return;
    }

    // Handle notifications
    if (message.method) {
      this._notifyListeners('notification', message);
      
      // Handle specific notifications
      switch (message.method) {
        case 'notifications/tools/list_changed':
          this.listTools().catch(console.error);
          break;
      }
    }
  }

  /**
   * Handle connection errors
   */
  private _handleConnectionError(error: any) {
    this.state.connectionStatus = 'disconnected';
    this.state.isReady = false;
    this._notifyListeners('statusChange', this.state.connectionStatus);
    this._notifyListeners('error', { 
      type: 'connection', 
      message: (error as Error).message || 'Connection error',
      details: error
    });
  }

  /**
   * Handle disconnection
   */
  private _handleDisconnection() {
    this.state.connectionStatus = 'disconnected';
    this.state.isReady = false;
    this.state.sessionId = null;
    this.state.tools = [];
    
    // Reject all pending requests
    for (const [id, { reject }] of this.pendingRequests) {
      reject(new Error('Connection closed'));
    }
    this.pendingRequests.clear();

    this._notifyListeners('statusChange', this.state.connectionStatus);
    this._notifyListeners('ready', false);
  }

  /**
   * Notify event listeners
   */
  private _notifyListeners(event: string, data: any) {
    const listeners = this.eventListeners.get(event);
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
}

// Singleton instance for the app
export const opalClient = new OPALClient(); 