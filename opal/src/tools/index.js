const { registerJournalTools } = require('./journalTools');
const moduleProgressTools = require('./moduleProgressTools');
const identityProfileTools = require('./identityProfileTools');

/**
 * Register all tools with the server
 * 
 * @param {Object} configs - The global configs object
 * @param {WebSocketServer} wss - The WebSocket server instance
 */
function registerTools(configs, wss) {
  // Register all tool sets
  registerJournalTools(configs, wss);
}

module.exports = {
  ...moduleProgressTools,
  ...identityProfileTools,
  registerTools
};
