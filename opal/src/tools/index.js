const { registerJournalTools } = require('./journalTools');
const moduleProgressTools = require('./moduleProgressTools');
const identityProfileTools = require('./identityProfileTools');
const { registerPersonaTools } = require('./personaTools');
const terrainTools = require('./terrainTools');
const toolsService = require('../services/toolsService');

/**
 * Register all tools with the MCP server
 * 
 * @param {Object} configs - The global configs object
 * @param {WebSocketServer} wss - The WebSocket server instance
 */
function registerTools(configs, wss) {
  // Register all tool sets
  registerJournalTools(configs, wss);
  registerPersonaTools(configs, wss);
  
  // Register TERRAIN integration tools
  terrainTools.forEach(tool => {
    toolsService.updateTool(configs, wss, tool.name, tool);
  });
}

module.exports = {
  ...moduleProgressTools,
  ...identityProfileTools,
  registerTools
};
