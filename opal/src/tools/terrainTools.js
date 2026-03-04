/**
 * TERRAIN Integration Tools
 * MCP tools for importing and managing TERRAIN behavioral data snapshots
 */

const terrainService = require('../services/terrainService');
const logger = require('../logger');

const terrainTools = [
  {
    name: 'import_terrain_snapshot',
    description: 'Import a TERRAIN behavioral data snapshot from JSON file. The snapshot contains fasting protocols, behavioral reps, sentry triggers, accomplishments, and core psychological frameworks.',
    inputSchema: {
      type: 'object',
      properties: {
        snapshot: {
          type: 'object',
          description: 'Parsed TERRAIN JSON snapshot object'
        }
      },
      required: ['snapshot']
    },
    processor: async (params, context) => {
      try {
        const userId = context.userId || 'admin';
        
        logger.info('[TerrainTools] Importing TERRAIN snapshot for user:', userId);
        
        const result = await terrainService.importTerrainSnapshot(userId, params.snapshot);
        
        return {
          success: true,
          message: `TERRAIN data imported successfully — exported ${params.snapshot.exported_at.slice(0, 10)}`,
          data: result
        };
      } catch (error) {
        logger.error('[TerrainTools] Error importing TERRAIN snapshot:', error);
        throw new Error(`Failed to import TERRAIN snapshot: ${error.message}`);
      }
    }
  },
  
  {
    name: 'get_terrain_snapshots',
    description: 'Get all TERRAIN snapshots for the current user, ordered by export date (most recent first)',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    processor: async (params, context) => {
      try {
        const userId = context.userId || 'admin';
        
        const snapshots = await terrainService.getAllSnapshots(userId);
        
        return {
          success: true,
          snapshots
        };
      } catch (error) {
        logger.error('[TerrainTools] Error fetching TERRAIN snapshots:', error);
        throw new Error(`Failed to fetch TERRAIN snapshots: ${error.message}`);
      }
    }
  },
  
  {
    name: 'get_latest_terrain_snapshot',
    description: 'Get the most recent TERRAIN snapshot for the current user',
    inputSchema: {
      type: 'object',
      properties: {}
    },
    processor: async (params, context) => {
      try {
        const userId = context.userId || 'admin';
        
        const snapshot = await terrainService.getLatestSnapshot(userId);
        
        if (!snapshot) {
          return {
            success: true,
            message: 'No TERRAIN data imported yet',
            snapshot: null
          };
        }
        
        return {
          success: true,
          snapshot
        };
      } catch (error) {
        logger.error('[TerrainTools] Error fetching latest TERRAIN snapshot:', error);
        throw new Error(`Failed to fetch latest TERRAIN snapshot: ${error.message}`);
      }
    }
  }
];

module.exports = terrainTools;
