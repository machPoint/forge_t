/**
 * Register Identity Profile Tools
 * 
 * This file registers the MCP tools for identity profile management.
 */

const logger = require('../logger');
const { 
  getIdentityProfile, 
  updateIdentityProfile, 
  updateProfileSection, 
  getProfileVersionHistory 
} = require('./identityProfileTools');
const identityProfileService = require('../services/identityProfileService');
const identityProfileHistoryService = require('../services/identityProfileHistoryService');
const { createTool } = require('../utils/toolCreator');
const { updateTool } = require('../services/toolsService');

/**
 * Register identity profile tools
 * 
 * @param {Object} configs - The global configs object
 * @param {WebSocketServer} wss - The WebSocket server instance
 */
function registerIdentityProfileTools(configs, wss) {
  logger.info('Registering identity profile tools...');
  
  // Register all identity profile tools
  updateTool(configs, wss, 'getIdentityProfile', getIdentityProfile);
  updateTool(configs, wss, 'updateIdentityProfile', updateIdentityProfile);
  updateTool(configs, wss, 'updateProfileSection', updateProfileSection);
  updateTool(configs, wss, 'getProfileVersionHistory', getProfileVersionHistory);
  
  logger.info('Identity profile tools registration completed');
}

module.exports = registerIdentityProfileTools;
