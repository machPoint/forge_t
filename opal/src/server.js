/**
 * OPAL Server
 * Implementation of the Model Context Protocol (March 2025 Specification)
 */

// Load environment variables
require('dotenv').config();

// Initialize configuration loader
const configLoader = require('./config-loader');
configLoader.init();

// Initialize database connection
const db = require('./config/database');
const { safelyCloseDatabase } = require('./config/database-shutdown');

// Run database migrations on startup
async function runMigrations() {
  try {
    logger.info('🔧 Running database migrations...');
    await db.migrate.latest();
    logger.info('✅ Database migrations completed successfully');
  } catch (error) {
    logger.error('❌ Database migration failed:', error);
    throw error;
  }
}

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const net = require('net');
const { JSONRPCServer } = require('json-rpc-2.0');
const constants = require('./config/constants');
const { MCP_VERSION, PROTOCOL_VERSION, SERVER_INFO, HEARTBEAT_INTERVAL, ERROR_CODES } = require('./config/constants');
const opalConfig = require('./config/opalConfig'); // Import OPAL configuration

// Dynamic port selection function
async function findAvailablePort(startPort = 3000, maxAttempts = 100) {
  return new Promise((resolve, reject) => {
    const tryPort = (port, attempts) => {
      if (attempts > maxAttempts) {
        reject(new Error(`Could not find available port after ${maxAttempts} attempts`));
        return;
      }
      
      const server = net.createServer();
      server.listen(port, () => {
        server.once('close', () => resolve(port));
        server.close();
      });
      
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          tryPort(port + 1, attempts + 1);
        } else {
          reject(err);
        }
      });
    };
    
    tryPort(startPort, 0);
  });
}

// Server Port - use environment variable or find available port
let MCP_PORT = process.env.MCP_PORT ? parseInt(process.env.MCP_PORT) : null;

// Load handlers and utilities
const logger = require('./logger');
const { loadApiIntegrationsFromEnv } = require('./config/apiConfig');
const { executeApiTool } = require('./services/apiService'); // Corrected path
const { summarizeContent } = require('./services/summarizationService'); // Add summarization service
const memoryService = require('./services/memoryService'); // Memory service for Phase 2
const authService = require('./services/authService'); // Auth service for Phase 2
const auditService = require('./services/auditService'); // Audit service for Phase 2
const backupService = require('./services/backupService'); // Backup service for Phase 2
const appInterfaceService = require('./services/appInterfaceService'); // App interface service for Phase 2.10
const toolsService = require('./services/toolsService'); // Tools service for MCP compliance
const resourcesService = require('./services/resourcesService'); // Resources service for MCP compliance
const promptsService = require('./services/promptsService'); // Prompts service for MCP compliance
const metricsService = require('./services/metricsService'); // Metrics service for health monitoring
const { validateAndSanitize } = require('./utils/validation');
const { applyRateLimit } = require('./utils/rateLimit');
const { 
  getResourceTemplateCompletions, 
  getResourceTemplateFields,
  getPromptArgumentCompletions,
  getPromptArguments
} = require('./utils/completion'); // Completion utilities
const { paginateItems } = require('./utils/pagination'); // Pagination utility
const { injectIdentityProfile, injectIdentityProfileWs } = require('./middleware'); // Identity profile context injection

// Load API integrations and tools
const configs = loadApiIntegrationsFromEnv();

// Ensure we have at least one API integration for our tools
if (configs.apiIntegrations.length === 0) {
  logger.info('No API integrations found, adding default MCP integration');
  configs.apiIntegrations.push({
    id: 'mcp',
    name: 'MCP Core',
    baseUrl: 'http://localhost:3000',
    authType: 'none',
    authValue: null,
    endpoints: []
  });
}


// Initialize tools object if not exists
configs.tools = configs.tools || {};

// Register example MCP tools first
const registerExampleTools = require('./examples/create-mcp-tools');
registerExampleTools(configs, null); // Pass null for wss since it's not created yet

// Register module progress tools
const registerModuleProgressTools = require('./tools/moduleProgressTools');

// Register identity profile tools
const registerIdentityProfileTools = require('./tools/registerIdentityProfileTools');

// Register identity profile history tools
const registerIdentityProfileHistoryTools = require('./tools/registerIdentityProfileHistoryTools');

// Import tools registration function
const { registerTools } = require('./tools/index');

// Add summarization tool to the tools list
const summarizationToolId = 'summarizeContent';
const summarizationTool = {
  name: 'summarizeContent',
  description: 'Summarize content using AI',
  inputSchema: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'Content to summarize'
      },
      type: {
        type: 'string',
        description: 'Type of summary (headline, paragraph, full)',
        enum: ['headline', 'paragraph', 'full'],
        default: 'headline'
      }
    },
    required: ['content']
  },
  // Internal properties for execution (not part of MCP schema)
  _internal: {
    method: 'POST',
    path: '/summarize',
    apiIntegrationId: configs.apiIntegrations[0].id
  }
};

// Add the summarization tool to the configs using the toolsService
toolsService.updateTool(configs, null, summarizationToolId, summarizationTool);

logger.info('Loaded API integrations and tools', {
  apiIntegrationCount: configs.apiIntegrations.length,
  toolCount: Object.keys(configs.tools).length,
  toolNames: Object.keys(configs.tools)
});

// --- Server Setup ---
const app = express();
const httpServer = http.createServer(app); // Single HTTP server instance
const wss = new WebSocket.Server({ server: httpServer }); // Attach WS server

// Create the JSON-RPC server
const rpcServer = new JSONRPCServer();

// Add middleware to ensure each RPC method has the most up-to-date session
rpcServer.applyMiddleware(async (next, request, serverParams) => {
  // Only process if we have serverParams with a session that has a WebSocket
  if (serverParams?.session?.ws) {
    // Get the WebSocket from the initial session
    const ws = serverParams.session.ws;
    
    // Use the WebSocket to find the most up-to-date session from the global sessions map
    const freshSession = findSessionByWs(ws);
    
    if (freshSession) {
      // Replace the serverParams.session with the fresh session from the global map
      serverParams.session = freshSession;
      logger.info(`[RPC Middleware] Refreshed session for ${request.method}, user: ${freshSession.user ? freshSession.user.username : 'anonymous'}`);
    } else {
      logger.warn(`[RPC Middleware] Could not find fresh session for WebSocket in ${request.method} call`);
    }
  }
  
  // Continue to the next middleware or the method handler
  return await next(request, serverParams);
});

// --- Global State ---
global.sessions = new Map(); // WebSocket session state: Map<sessionId, SessionState>
const sessions = global.sessions; // Local reference for convenience

// Now that we have the WebSocket server,
registerExampleTools(configs, wss);
// Register module progress tools with WebSocket server
registerModuleProgressTools(configs, wss);

// Register identity profile tools with WebSocket server
registerIdentityProfileTools(configs, wss);

// Register identity profile history tools with WebSocket server
registerIdentityProfileHistoryTools(configs, wss);

// Register journal tools with WebSocket server (includes AI feedback and insights)
registerTools(configs, wss);

toolsService.updateTool(configs, wss, summarizationToolId, summarizationTool);

// Import RPC methods registration function
const { registerRpcMethods } = require('./rpc-methods');

// Register RPC methods
registerRpcMethods(rpcServer, configs, wss, findSessionByWs, {
  toolsService,
  resourcesService,
  promptsService,
  auditService,
  getResourceTemplateCompletions,
  getResourceTemplateFields,
  getPromptArgumentCompletions,
  getPromptArguments,
  paginateItems
});

// --- Express Middleware ---
// CORS Middleware (Simple Example)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Accept, Mcp-Session-Id, Authorization, X-API-Token');
  res.header('Access-Control-Expose-Headers', 'Mcp-Session-Id');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// JSON Body Parsing Middleware
app.use(express.json());

// Load routes
const apiRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');
const journalRoutes = require('./routes/journal'); // Import journal routes
const notesRoutes = require('./routes/notes'); // Import notes routes
const memoryRoutes = require('./routes/memory'); // Import memory routes

// Use routes
app.use('/api', apiRoutes);
app.use('/admin', adminRoutes);
app.use('/journal', journalRoutes); // Use journal routes
app.use('/notes', notesRoutes); // Use notes routes
app.use('/core', memoryRoutes); // Use memory routes for /core endpoint

// Setup complete
// Static files middleware for the root path
app.use(express.static(path.join(__dirname, 'public')));

// --- HTTP Route Handlers ---

// Simple health check / info page
app.get('/', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('OPAL Server is running.');
});

// Health check endpoint for Electron app
app.get('/health', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: process.env.MCP_PORT || 3000
  }));
});

// Factory function for the MCP POST handler middleware
const createMcpPostHandler = (configs) => {
  return async (req, res, next) => {
    logger.info('[MCP HTTP] Incoming POST /mcp request');
    const requestData = req.body; // Thanks to express.json() middleware
    console.log(`[MCP HTTP] Request body: ${JSON.stringify(requestData).substring(0, 200)}...`);
    
    // Check if this is a batch request
    const isBatch = Array.isArray(requestData);
    const requests = isBatch ? requestData : [requestData];
    
    // Check if this contains any JSON-RPC requests (vs. only notifications/responses)
    const hasRequests = requests.some(req => req.id !== undefined && req.method !== undefined);
    
    // Get the session ID from the header if present
    const sessionId = req.headers['mcp-session-id'];
    
    // Check Accept header to determine if client supports SSE
    const acceptHeader = req.headers['accept'] || '';
    const clientSupportsSSE = acceptHeader.includes('text/event-stream');
    const clientSupportsJSON = acceptHeader.includes('application/json');
    
    // If neither supported content type is accepted, return 406 Not Acceptable
    if (!clientSupportsSSE && !clientSupportsJSON) {
      return res.status(406).send('Not Acceptable: Client must accept application/json or text/event-stream');
    }

    try {
      // Track API request for metrics
      const requestStartTime = Date.now();
      
      // If only notifications or responses, return 202 Accepted with no body
      if (!hasRequests) {
        return res.status(202).end();
      }
      
      // Process each request and collect results
      const results = [];
      
      for (const request of requests) {
        const { jsonrpc, method, params, id } = request;
        
        // Track each method call for metrics
        metricsService.trackRequest(req, method);

        if (jsonrpc !== '2.0') {
          // Use error constants
          throw { code: ERROR_CODES.INVALID_REQUEST, message: 'Invalid JSON-RPC version', id: id || null };
        }

        // Skip processing for notifications (no id)
        if (id === undefined) {
          continue;
        }

        let resultData;

        switch (method) {
          case 'initialize':
            console.log(`[MCP HTTP] Session ${id || '(no id)'} received initialize`);
            
            // Generate a new session ID for initialization requests
            const newSessionId = uuidv4();
            
            // Respond with server info, protocol version, and capabilities
            resultData = { 
              protocolVersion: PROTOCOL_VERSION, 
              serverInfo: SERVER_INFO,
              capabilities: constants.SERVER_CAPABILITIES
            };
            
            // Set the session ID header for the response
            res.setHeader('Mcp-Session-Id', newSessionId);
            console.log(`[MCP HTTP] Generated new session ID: ${newSessionId}`);
            break;
          case 'ping':
            console.log(`[MCP HTTP] Received ping request (ID: ${id})`);
            resultData = {}; // Success response is enough for pong
            break;
          case 'shutdown':
             console.log(`[MCP HTTP] Received shutdown request (ID: ${id})`);
             resultData = {}; // Acknowledge shutdown
             break;
          case 'listTools':
          case 'getTools':
            console.log(`[MCP HTTP] Received ${method} request (ID: ${id})`);
            // Get cursor from params if available
            const toolCursor = params?.cursor || null;
            
            // Get the full list of tools
            const httpToolList = Object.values(configs.tools || {});
            
            // Apply pagination
            const { items: paginatedHttpTools, nextCursor: toolNextCursor } = paginateItems(httpToolList, toolCursor);
            
            console.log(`[MCP HTTP] Returning ${paginatedHttpTools.length} tools with details (page cursor: ${toolCursor || 'initial'})`);
            
            resultData = { 
                tools: paginatedHttpTools,
                nextCursor: toolNextCursor
            };
            break;
          case 'listResources':
          case 'getResources':
            console.log(`[MCP HTTP] Received ${method} request (ID: ${id})`);
            // Get cursor from params if available
            const resourceCursor = params?.cursor || null;
            
            // Get paginated resources
            const { resources: paginatedResources, nextCursor: resourceNextCursor } = resourcesService.listResources(paginateItems, resourceCursor);
            
            console.log(`[MCP HTTP] Returning ${paginatedResources.length} resources with details (page cursor: ${resourceCursor || 'initial'})`);
            
            resultData = { 
                resources: paginatedResources,
                nextCursor: resourceNextCursor
            };
            break;
          case 'listPrompts':
          case 'getPrompts':
            console.log(`[MCP HTTP] Received ${method} request (ID: ${id})`);
            // Get cursor from params if available
            const promptCursor = params?.cursor || null;
            
            // Get paginated prompts
            const { prompts: paginatedPrompts, nextCursor: promptNextCursor } = promptsService.listPrompts(paginateItems, promptCursor);
            
            console.log(`[MCP HTTP] Returning ${paginatedPrompts.length} prompts with details (page cursor: ${promptCursor || 'initial'})`);
            
            resultData = { 
                prompts: paginatedPrompts,
                nextCursor: promptNextCursor
            };
            break;
          case 'tools/call': // MCP compliant method name
          case 'CallTool': // Add case for CallTool
          case 'runTool': { // Keep runTool for compatibility if needed
            // Extract parameters based on method name
            let toolName, toolArgs;
            
            if (method === 'tools/call') {
              toolName = params?.name;
              toolArgs = params?.arguments || {};
            } else {
              toolName = params?.toolName;
              toolArgs = params?.arguments ?? params?.params ?? {}; // Accept 'arguments' or 'params'
            }
            
            logger.info(`[MCP HTTP] ${method} invoked for tool: ${toolName}`);
            
            // Define validation schema for tools/call
            const validationSchema = {
              required: ['name'],
              types: {
                name: 'string',
                arguments: 'object'
              }
            };
            
            // Create a properly formatted params object for validation
            const validationParams = {
              name: toolName,
              arguments: toolArgs
            };
            
            // Validate and sanitize parameters
            try {
              const validatedParams = validateAndSanitize(validationParams, validationSchema, method);
              toolName = validatedParams.name;
              toolArgs = validatedParams.arguments || {};
            } catch (validationError) {
              logger.warn(`[MCP HTTP] Validation error in ${method}:`, validationError);
              throw validationError;
            }
            
            // Apply rate limiting
            try {
              const userId = req.user?.id || 'anonymous';
              const rateLimitHeaders = applyRateLimit(userId, method, 'default');
              
              // Add rate limit headers to the response
              for (const [header, value] of Object.entries(rateLimitHeaders)) {
                res.setHeader(header, value);
              }
            } catch (rateLimitError) {
              logger.warn(`[MCP HTTP] Rate limit exceeded for ${method}:`, rateLimitError);
              throw rateLimitError;
            }
            
            // Check if the tool exists
            if (!configs.tools[toolName]) {
              throw { 
                code: ERROR_CODES.NOT_FOUND, 
                message: `Tool not found: ${toolName}` 
              };
            }
            
            // Execute the tool
            try {
              // Get the tool definition
              const tool = configs.tools[toolName];
              
              // Execute the tool
              let result;
              
              if (toolName === summarizationToolId) {
                // Special handling for summarization tool
                result = await summarizeContent(toolArgs.content, toolArgs.type);
              } else if (tool._internal) {
                // Execute API tool
                result = await executeApiTool(configs, toolName, toolArgs);
              } else {
                throw { 
                  code: ERROR_CODES.INTERNAL_ERROR, 
                  message: `Cannot execute tool: ${toolName}` 
                };
              }
              
              // Format the result according to MCP spec
              resultData = {
                content: Array.isArray(result) ? result : [result],
                isError: false
              };
              
              // Log the action
              if (req.user) {
                await auditService.logToolExecution(
                  req.user.id,
                  method,
                  { name: toolName, arguments: toolArgs },
                  { success: true }
                );
              }
            } catch (error) {
              logger.error(`[MCP HTTP] Error executing tool ${toolName}:`, error);
              
              // Log the failure
              if (req.user) {
                await auditService.logToolExecution(
                  req.user.id,
                  method,
                  { name: toolName, arguments: toolArgs },
                  { success: false, error: error.message }
                );
              }
              
              // Format error according to MCP spec
              resultData = {
                content: [{
                  type: 'text',
                  text: `Error executing tool ${toolName}: ${error.message || 'Unknown error'}`
                }],
                isError: true
              };
            }
            break;
          }
          // Add other HTTP method handlers here
          default:
             // Use error constants
            throw { code: ERROR_CODES.METHOD_NOT_FOUND, message: `Method not found: ${method}`, id: id };
        }

        // Add the result to the results array
        results.push({
          jsonrpc: '2.0',
          id,
          result: resultData
        });
      }

      // Calculate response time for metrics
      const responseTime = Date.now() - requestStartTime;
      
      // Track response time in metrics service
      for (const request of requests) {
        if (request.method) {
          metricsService.trackResponse(responseTime, request.method, false);
        }
      }
      
      // Return the results
      if (isBatch) {
        res.json(results);
      } else {
        res.json(results[0]);
      }
    } catch (error) {
      logger.error('[MCP HTTP] Error processing request:', error);
      
      // Format the error response according to JSON-RPC 2.0
      const errorResponse = {
        jsonrpc: '2.0',
        id: error.id || null,
        error: {
          code: error.code || ERROR_CODES.INTERNAL_ERROR,
          message: error.message || 'Internal server error'
        }
      };
      
      // Return the error response
      res.status(200).json(errorResponse);
    }
  };
};

// MCP endpoint with identity profile context injection
app.post('/mcp', injectIdentityProfile, createMcpPostHandler(configs));

// --- WebSocket Connection Handling ---
wss.on('connection', async (ws, req) => {
  const sessionId = uuidv4();
  const session = { 
    id: sessionId,
    ws: ws, 
    initialized: false,
    user: null, // Add user to session
    lastHeartbeat: Date.now() 
  };
  
  // Add the session to the sessions map
  sessions.set(sessionId, session);
  
  // Log the connection
  logger.info(`[MCP WS] New connection established, session ID: ${sessionId}`);
  
  // Check for authentication token in headers or query parameters
  const url = new URL(req.url, `http://${req.headers.host}`);
  const authQueryParam = url.searchParams.get('authorization');
  const authHeader = req.headers.authorization;
  
  // Try to authenticate using either the query parameter or header
  const authToken = authQueryParam || authHeader;
  
  if (authToken) {
    try {
      const token = authToken.startsWith('Bearer ') ? authToken.substring(7) : authToken;
      
      const decoded = await authService.verifyToken(token);
      if (decoded) {
        // Explicitly construct the user object to ensure id is present
        session.user = {
          id: decoded.id || decoded.userId, // Support both new and old tokens
          username: decoded.username,
          role: decoded.role
        };
        logger.info(`[MCP WS] Session authenticated for user: ${session.user.username}, ID: ${session.user.id}`);
      }
    } catch (error) {
      logger.error(`[MCP WS] Authentication error for session ${sessionId}:`, error.message);
    }
  }

  // Handle incoming messages from this client
  ws.on('message', async (message) => {
    try {
      // Update last activity timestamp
      session.lastHeartbeat = Date.now();
      
      // Parse the message as JSON
      let jsonMessage;
      try {
        jsonMessage = JSON.parse(message.toString());
      } catch (parseError) {
        logger.error(`[MCP WS] Failed to parse message as JSON:`, parseError);
        throw new Error('Invalid JSON message');
      }
      
      // Log the received message
      logger.debug(`[MCP WS] Received message from session ${sessionId}:`, jsonMessage);
      
      // Handle ping messages directly for better debugging
      if (jsonMessage.method === 'ping' && jsonMessage.id) {
        logger.info(`[MCP WS] Received ping from session ${sessionId}`);
        const pingResponse = {
          jsonrpc: '2.0',
          id: jsonMessage.id,
          result: { timestamp: Date.now() }
        };
        ws.send(JSON.stringify(pingResponse));
        return;
      }
      
      // Inject identity profile into the context
      jsonMessage = await injectIdentityProfileWs(jsonMessage, session);
      
      // Process the message using the JSON-RPC server
      const response = await rpcServer.receive(jsonMessage, { session });
      
      // If there's a response (for methods, not notifications), send it back
      if (response) {
        // Log the response
        logger.debug(`[MCP WS] Sending response to session ${sessionId}:`, response);
        
        // Send the response
        ws.send(JSON.stringify(response));
        
        // Track metrics if service is available
        try {
          if (metricsService && typeof metricsService.recordRpcRequest === 'function') {
            metricsService.recordRpcRequest(jsonMessage.method, Date.now() - session.lastHeartbeat, true);
          }
        } catch (metricsError) {
          logger.debug('Metrics recording failed:', metricsError);
        }
      }
    } catch (error) {
      logger.error(`[MCP WS] Error processing message:`, error);
      
      // Send error response if possible
      try {
        const errorResponse = {
          jsonrpc: '2.0',
          id: jsonMessage?.id || null,
          error: {
            code: ERROR_CODES.INTERNAL_ERROR,
            message: 'Internal server error',
            data: { message: error.message }
          }
        };
        
        ws.send(JSON.stringify(errorResponse));
      } catch (sendError) {
        logger.error(`[MCP WS] Error sending error response:`, sendError);
      }
    }
  });

  // Handle connection close - keep sessionId in scope
  ws.on('close', () => {
    logger.info(`[MCP WS] Connection closed, session ID: ${sessionId}`);
    
    // Remove the session from the sessions map
    sessions.delete(sessionId);
  });
  
  // Handle connection errors - keep sessionId in scope
  ws.on('error', (error) => {
    logger.error(`[MCP WS] Connection error, session ID: ${sessionId}:`, error);
  });
  
  // Set up ping/pong for keeping the connection alive
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    }
  }, HEARTBEAT_INTERVAL);
  
  // Clear the ping interval when the connection is closed
  ws.on('close', () => {
    clearInterval(pingInterval);
  });
});

// Helper function to find a session by WebSocket
function findSessionByWs(ws) {
  for (const [id, session] of sessions.entries()) {
    if (session.ws === ws) {
      return session;
    }
  }
  return null;
}

// --- Server Startup ---
const startServer = async function startServer() {
  try {
    // Run migrations before starting the server
    await runMigrations();
    
    // Find available port if not specified
    if (!MCP_PORT) {
      MCP_PORT = await findAvailablePort(3000);
      logger.info(`🔍 Found available port: ${MCP_PORT}`);
    }
    
    httpServer.listen(MCP_PORT, () => {
      logger.info(`OPAL Server is running on port ${MCP_PORT}`);
      logger.info(`MCP Protocol Version: ${MCP_VERSION}`);
      logger.info(`Server Info: ${JSON.stringify(SERVER_INFO)}`);
      logger.info(`Server Capabilities: ${JSON.stringify(constants.SERVER_CAPABILITIES)}`);
      
      console.log(`\nOPAL Server is running!`);
      console.log(`- HTTP: http://localhost:${MCP_PORT}/mcp`);
      console.log(`- WebSocket: ws://localhost:${MCP_PORT}`);
      console.log(`\nPress Ctrl+C to stop the server\n`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle port already in use error
httpServer.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${MCP_PORT} is already in use. Please use a different port.`);
    console.error(`\nError: Port ${MCP_PORT} is already in use.`);
    console.error(`Please use a different port by setting the MCP_PORT environment variable.\n`);
    process.exit(1);
  } else {
    logger.error('Server error:', error);
    console.error('\nServer error:', error);
    process.exit(1);
  }
});

// Start the server
startServer().catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

// Handle graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down OPAL server...');
  
  // Close the HTTP server
  httpServer.close(() => {
    logger.info('HTTP server closed');
  });
  
  // Close all WebSocket connections
  wss.clients.forEach(client => {
    client.terminate();
  });
  
  // Close the database connection
  try {
    await safelyCloseDatabase();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
  }
  
  logger.info('OPAL server shutdown complete');
  process.exit(0);
});

// Export for testing
module.exports = {
  app,
  httpServer,
  wss,
  configs
};
