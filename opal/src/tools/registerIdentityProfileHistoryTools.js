/**
 * Register Identity Profile History Tools
 * 
 * This file registers the MCP tools for identity profile history management.
 */

const logger = require('../logger');
const { 
  getProfileHistory, 
  getProfileVersion, 
  compareProfileVersions, 
  restoreProfileVersion 
} = require('./identityProfileHistoryTools');
const { updateTool } = require('../services/toolsService');

/**
 * Register identity profile history tools
 * 
 * @param {Object} configs - The global configs object
 * @param {WebSocketServer} wss - The WebSocket server instance
 */
function registerIdentityProfileHistoryTools(configs, wss) {
  logger.info('Registering identity profile history tools...');
  
  // Register all identity profile history tools
  updateTool(configs, wss, 'getProfileHistory', getProfileHistory);
  updateTool(configs, wss, 'getProfileVersion', getProfileVersion);
  updateTool(configs, wss, 'compareProfileVersions', compareProfileVersions);
  updateTool(configs, wss, 'restoreProfileVersion', restoreProfileVersion);
  
  logger.info('Identity profile history tools registration completed');
}

module.exports = registerIdentityProfileHistoryTools;
