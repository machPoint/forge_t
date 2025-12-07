/**
 * Tools Service
 * Handles tool management and notifications
 */

const logger = require('../logger');
const { sendNotificationToAll } = require('../utils/notifications');
const fs = require('fs').promises;
const path = require('path');
const mime = require('mime-types');

/**
 * Add or update a tool in the tools registry
 * 
 * @param {Object} configs - The global configs object
 * @param {WebSocketServer} wss - The WebSocket server instance
 * @param {String} toolName - The name of the tool
 * @param {Object} toolDefinition - The tool definition object
 * @returns {Object} The updated tool
 */
function updateTool(configs, wss, toolName, toolDefinition) {
  if (!configs.tools) {
    configs.tools = {};
  }
  
  // Check if tool already exists
  const isNewTool = !configs.tools[toolName];
  
  // Ensure the tool has the required MCP properties
  const mcpTool = {
    name: toolName,
    description: toolDefinition.description || `Tool: ${toolName}`,
    inputSchema: toolDefinition.inputSchema || {
      type: 'object',
      properties: {}
    },
    // Store internal properties for execution
    _internal: {
      ...(toolDefinition._internal || {}),
      method: toolDefinition.method || toolDefinition._internal?.method || 'GET',
      path: toolDefinition.path || toolDefinition._internal?.path || '/',
      apiIntegrationId: toolDefinition.apiIntegrationId || toolDefinition._internal?.apiIntegrationId,
      // Map handler function to processor for execution
      processor: toolDefinition.handler || toolDefinition._internal?.processor
    }
  };
  
  // Add or update the tool
  configs.tools[toolName] = mcpTool;
  
  logger.info(`${isNewTool ? 'Added' : 'Updated'} tool: ${toolName}`);
  
  // Send notification if WebSocket server is available
  if (wss) {
    sendNotificationToAll(wss, 'notifications/tools/list_changed');
    logger.info('Sent tools/list_changed notification');
  }
  
  return mcpTool;
}

/**
 * Remove a tool from the tools registry
 * 
 * @param {Object} configs - The global configs object
 * @param {WebSocketServer} wss - The WebSocket server instance
 * @param {String} toolName - The name of the tool to remove
 * @returns {Boolean} True if the tool was removed, false if it didn't exist
 */
function removeTool(configs, wss, toolName) {
  if (!configs.tools || !configs.tools[toolName]) {
    return false;
  }
  
  // Remove the tool
  delete configs.tools[toolName];
  
  logger.info(`Removed tool: ${toolName}`);
  
  // Send notification if WebSocket server is available
  if (wss) {
    sendNotificationToAll(wss, 'notifications/tools/list_changed');
    logger.info('Sent tools/list_changed notification');
  }
  
  return true;
}

/**
 * Format a tool result with different content types
 * 
 * @param {any} result - The result data from the tool execution
 * @param {Object} options - Options for formatting
 * @returns {Object} MCP-compliant tool result object
 */
async function formatToolResult(result, options = {}) {
  const content = [];
  let isError = false;
  
  try {
    // Handle error results
    if (result && result.error) {
      return {
        content: [{
          type: 'text',
          text: typeof result.error === 'string' ? result.error : 
                (result.error.message || JSON.stringify(result.error))
        }],
        isError: true
      };
    }
    
    // Handle different result types
    if (result === null || result === undefined) {
      // Handle null/undefined
      content.push({
        type: 'text',
        text: 'Operation completed successfully with no result.'
      });
    } else if (typeof result === 'string') {
      // Handle string result
      content.push({
        type: 'text',
        text: result
      });
    } else if (Buffer.isBuffer(result)) {
      // Handle binary data
      const mimeType = options.mimeType || 'application/octet-stream';
      content.push({
        type: getMcpTypeFromMime(mimeType),
        data: result.toString('base64'),
        mimeType: mimeType
      });
    } else if (typeof result === 'object') {
      // Handle special content types
      if (result.type && ['text', 'image', 'audio', 'resource'].includes(result.type)) {
        // Already in MCP format
        content.push(result);
      } else if (result.filePath && await fileExists(result.filePath)) {
        // Handle file reference
        const filePath = result.filePath;
        const mimeType = result.mimeType || mime.lookup(filePath) || 'application/octet-stream';
        const fileData = await fs.readFile(filePath);
        const mcpType = getMcpTypeFromMime(mimeType);
        
        content.push({
          type: mcpType,
          data: fileData.toString('base64'),
          mimeType: mimeType
        });
      } else if (result.uri && result.mimeType) {
        // Handle resource reference
        content.push({
          type: 'resource',
          resource: {
            uri: result.uri,
            mimeType: result.mimeType,
            ...(result.text ? { text: result.text } : {}),
            ...(result.blob ? { blob: result.blob } : {})
          }
        });
      } else {
        // Handle regular object
        content.push({
          type: 'text',
          text: JSON.stringify(result, null, 2)
        });
      }
    } else {
      // Handle other types (number, boolean, etc.)
      content.push({
        type: 'text',
        text: String(result)
      });
    }
  } catch (error) {
    logger.error('Error formatting tool result:', error);
    content.push({
      type: 'text',
      text: `Error formatting result: ${error.message}`
    });
    isError = true;
  }
  
  return {
    content,
    isError
  };
}

/**
 * Get MCP content type from MIME type
 * 
 * @param {string} mimeType - The MIME type
 * @returns {string} The corresponding MCP content type
 */
function getMcpTypeFromMime(mimeType) {
  if (!mimeType) return 'text';
  
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.startsWith('audio/')) {
    return 'audio';
  } else if (mimeType.startsWith('text/')) {
    return 'text';
  } else {
    return 'resource';
  }
}

/**
 * Check if a file exists
 * 
 * @param {string} filePath - Path to the file
 * @returns {Promise<boolean>} True if the file exists
 */
async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

module.exports = {
  updateTool,
  removeTool,
  formatToolResult,
  getMcpTypeFromMime
};
