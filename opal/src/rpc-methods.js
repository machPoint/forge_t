/**
 * RPC Methods for the OPAL Server
 * Contains all the WebSocket JSON-RPC method handlers
 */

const { ERROR_CODES } = require('./config/constants');
const logger = require('./logger');

/**
 * Register all RPC methods with the server
 * 
 * @param {Object} rpcServer - JSON-RPC server instance
 * @param {Object} configs - Server configuration
 * @param {Object} wss - WebSocket server
 * @param {Function} findSessionByWs - Function to find session by WebSocket
 * @param {Object} services - Service instances
 */
function registerRpcMethods(rpcServer, configs, wss, findSessionByWs, services) {
    const { 
        toolsService, 
        resourcesService, 
        promptsService, 
        auditService,
        getResourceTemplateCompletions,
        getResourceTemplateFields,
        getPromptArgumentCompletions,
        getPromptArguments,
        paginateItems
    } = services;

    // Core MCP Protocol Methods
    rpcServer.addMethod('initialize', async (params, serverParams) => {
        const { protocolVersion, clientInfo, capabilities } = params;
        const session = serverParams?.session;
        
        logger.info(`[MCP WS] Initialize request from ${clientInfo?.name || 'unknown client'}`);
        
        if (session) {
            session.initialized = true;
            session.clientInfo = clientInfo;
            session.capabilities = capabilities;
        }
        
        return {
            protocolVersion: require('./config/constants').PROTOCOL_VERSION,
            serverInfo: require('./config/constants').SERVER_INFO,
            capabilities: require('./config/constants').SERVER_CAPABILITIES
        };
    });

    rpcServer.addMethod('authenticate', async (params, serverParams) => {
        const session = serverParams?.session;
        if (!session) {
            throw { code: ERROR_CODES.INTERNAL_ERROR, message: "Session not found" };
        }

        const { token } = params;
        if (!token) {
            throw { code: ERROR_CODES.INVALID_PARAMS, message: "Authentication token is required" };
        }

        try {
            const authService = require('./services/authService');
            const decoded = await authService.verifyToken(token);
            if (!decoded) {
                throw new Error("Invalid token");
            }

            // Explicitly construct the user object to ensure id is present
            session.user = {
                id: decoded.id || decoded.userId, // Support both new and old tokens
                username: decoded.username,
                role: decoded.role
            };
            logger.info(`[MCP WS] Session authenticated for user: ${session.user.username}, ID: ${session.user.id}`);

            return { status: 'authenticated', user: { id: session.user.id, username: session.user.username, role: session.user.role } };
        } catch (error) {
            logger.error(`[MCP WS] Authentication failed: ${error.message}`);
            throw { code: ERROR_CODES.INVALID_REQUEST, message: `Authentication failed: ${error.message}` };
        }
    });

    rpcServer.addMethod('tools/list', async (params, serverParams) => {
        const session = serverParams?.session;
        if (!session || !session.initialized) {
            throw { 
                code: ERROR_CODES.SERVER_NOT_INITIALIZED, 
                message: "Session not initialized" 
            };
        }

        const cursor = params?.cursor || null;
        const toolList = Object.values(configs.tools || {});
        const { items: paginatedTools, nextCursor } = paginateItems(toolList, cursor);
        
        logger.info(`[MCP WS] Returning ${paginatedTools.length} tools`);
        
        return { 
            tools: paginatedTools,
            nextCursor: nextCursor
        };
    });

    rpcServer.addMethod('tools/call', async (params, serverParams) => {
        // Get the initial session from serverParams
        const initialSession = serverParams?.session;
        
        if (!initialSession) {
            throw { 
                code: ERROR_CODES.SERVER_NOT_INITIALIZED, 
                message: "Session not initialized" 
            };
        }
        
        // Get the WebSocket from the initial session
        const ws = initialSession.ws;
        if (!ws) {
            throw { 
                code: ERROR_CODES.INTERNAL_ERROR, 
                message: "WebSocket instance not available" 
            };
        }
        
        // Use the WebSocket to find the most up-to-date session
        const session = findSessionByWs(ws) || initialSession;
        logger.info(`[tools/call] Session info: ${JSON.stringify({sessionId: session?.id, hasUser: !!session?.user, username: session?.user?.username})}`);
        
        if (!session.initialized) {
            throw { 
                code: ERROR_CODES.SERVER_NOT_INITIALIZED, 
                message: "Session not initialized" 
            };
        }

        const { name, arguments: args } = params;
        logger.info(`[tools/call] Requested tool: ${name}`);
        logger.info(`[tools/call] Arguments:`, args);
        logger.info(`[tools/call] Registered tools:`, Object.keys(configs.tools || {}));
        logger.info(`[tools/call] Tool object:`, configs.tools[name]);
        if (!name) {
            throw { 
                code: ERROR_CODES.INVALID_PARAMS, 
                message: "Tool name is required" 
            };
        }

        // Find the tool in configs
        const tool = configs.tools[name];
        if (!tool) {
            throw { 
                code: ERROR_CODES.METHOD_NOT_FOUND, 
                message: `Tool '${name}' not found` 
            };
        }

        try {
            // Handle different tool types
            let result;
            if (name === 'summarizeContent') {
                const { summarizeContent } = require('./services/summarizationService');
                result = await summarizeContent(args.content || args.text || '');
            } else if (tool._internal && tool._internal.apiIntegrationId) {
                // API tool
                const { executeApiTool } = require('./services/apiService');
                result = await executeApiTool(configs, name, args);
            } else if (typeof tool._internal?.processor === 'function') {
                // Custom/server tool with processor (e.g., memory_list, memory_create)
                result = await tool._internal.processor(args, session);
            } else {
                throw {
                    code: ERROR_CODES.INTERNAL_ERROR,
                    message: `Cannot execute tool: ${name}`
                };
            }

            // Log the tool execution
            logger.debug(`[tools/call] Session user: ${session.user ? JSON.stringify(session.user) : 'undefined'}`);
            
            // Get user ID from session, JWT token in request, or mark as anonymous
            const userId = session.user?.id || 'anonymous';
            if (auditService) {
                await auditService.logToolExecution(
                    userId,
                    name,
                    args,
                    { success: true, result }
                );
            }

            // Use formatToolResult for proper MCP formatting (prevents double-encoding)
            const formatted = await toolsService.formatToolResult(result);
            return formatted;
        } catch (error) {
            logger.error(`[MCP WS] Error executing tool ${name}:`, error);
            
            // Log the failure
            if (auditService && session.user) {
                await auditService.logToolExecution(
                    session.user.id,
                    name,
                    args,
                    { success: false, error: error.message }
                );
            }

            throw { 
                code: ERROR_CODES.INTERNAL_ERROR, 
                message: `Error executing tool: ${error.message}` 
            };
        }
    });

    // Register methods for tool management
    rpcServer.addMethod('tools/register', async (params, serverParams) => {
        const ws = serverParams?.ws;
        if (!ws) {
            throw { 
                code: ERROR_CODES.INTERNAL_ERROR, 
                message: "WebSocket instance not available" 
            };
        }
        
        const session = findSessionByWs(ws);
        if (!session) {
            throw { 
                code: ERROR_CODES.SERVER_NOT_INITIALIZED, 
                message: "Session not found" 
            };
        }
        
        // Check if the user is authenticated and has admin privileges
        if (!session.user || session.user.role !== 'admin') {
            throw { 
                code: ERROR_CODES.INVALID_REQUEST, 
                message: "Admin privileges required to register tools" 
            };
        }
        
        // Validate tool definition
        const { name, definition } = params;
        if (!name || !definition) {
            throw { 
                code: ERROR_CODES.INVALID_PARAMS, 
                message: "Tool name and definition are required" 
            };
        }
        
        // Register the tool
        try {
            const tool = toolsService.updateTool(configs, wss, name, definition);
            logger.info(`Tool registered: ${name}`);
            
            // Log the action
            await auditService.logToolExecution(
                session.user.id,
                'tools/register',
                { name, definition },
                { success: true }
            );
            
            return { tool };
        } catch (error) {
            logger.error(`Error registering tool ${name}:`, error);
            
            // Log the failure
            await auditService.logToolExecution(
                session.user.id,
                'tools/register',
                { name, definition },
                { success: false, error: error.message }
            );
            
            throw { 
                code: ERROR_CODES.INTERNAL_ERROR, 
                message: `Error registering tool: ${error.message}` 
            };
        }
    });

    // Register method to remove tools
    rpcServer.addMethod('tools/remove', async (params, serverParams) => {
        const ws = serverParams?.ws;
        if (!ws) {
            throw { 
                code: ERROR_CODES.INTERNAL_ERROR, 
                message: "WebSocket instance not available" 
            };
        }
        
        const session = findSessionByWs(ws);
        if (!session) {
            throw { 
                code: ERROR_CODES.SERVER_NOT_INITIALIZED, 
                message: "Session not found" 
            };
        }
        
        // Check if the user is authenticated and has admin privileges
        if (!session.user || session.user.role !== 'admin') {
            throw { 
                code: ERROR_CODES.INVALID_REQUEST, 
                message: "Admin privileges required to remove tools" 
            };
        }
        
        // Validate tool name
        const { name } = params;
        if (!name) {
            throw { 
                code: ERROR_CODES.INVALID_PARAMS, 
                message: "Tool name is required" 
            };
        }
        
        // Remove the tool
        try {
            const removed = toolsService.removeTool(configs, wss, name);
            logger.info(`Tool removed: ${name}`);
            
            // Log the action
            await auditService.logToolExecution(
                session.user.id,
                'tools/remove',
                { name },
                { success: removed }
            );
            
            return { success: removed };
        } catch (error) {
            logger.error(`Error removing tool ${name}:`, error);
            
            // Log the failure
            await auditService.logToolExecution(
                session.user.id,
                'tools/remove',
                { name },
                { success: false, error: error.message }
            );
            
            throw { 
                code: ERROR_CODES.INTERNAL_ERROR, 
                message: `Error removing tool: ${error.message}` 
            };
        }
    });

    // Add other RPC methods here...
    // These will be registered when the server starts
}

module.exports = {
    registerRpcMethods
};
