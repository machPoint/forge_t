/**
 * Persona Tools
 * MCP tools for managing AI personas
 */

const logger = require('../logger');
const personaService = require('../services/personaService');
const toolCreator = require('../utils/toolCreator');

/**
 * Register persona tools
 * @param {Object} configs - The global configs object
 * @param {Object} wss - The WebSocket server instance
 */
function registerPersonaTools(configs, wss) {
  // Get all personas for a user
  toolCreator.createTool(
    configs,
    wss,
    {
      name: 'get_personas',
      description: 'Get all AI personas for the current user',
      inputSchema: {
        type: 'object',
        properties: {}
      },
      _internal: {
        processor: async (params, session) => {
          try {
            const userId = session?.user?.id || 'default';
            logger.info(`[get_personas] Fetching personas for user: ${userId}`);
            
            const personas = await personaService.getPersonasByUserId(userId);
            
            return { personas };
          } catch (error) {
            logger.error('[get_personas] Error:', error);
            throw error;
          }
        }
      }
    }
  );

  // Get a single persona by ID
  toolCreator.createTool(
    configs,
    wss,
    {
      name: 'get_persona',
      description: 'Get a specific AI persona by ID',
      inputSchema: {
        type: 'object',
        properties: {
          personaId: {
            type: 'string',
            description: 'The ID of the persona to retrieve'
          }
        },
        required: ['personaId']
      },
      _internal: {
        processor: async (params, session) => {
          try {
            const userId = session?.user?.id || 'default';
            const { personaId } = params;
            
            logger.info(`[get_persona] Fetching persona ${personaId} for user: ${userId}`);
            
            const persona = await personaService.getPersonaById(personaId, userId);
            
            if (!persona) {
              throw new Error('Persona not found');
            }
            
            return { persona };
          } catch (error) {
            logger.error('[get_persona] Error:', error);
            throw error;
          }
        }
      }
    }
  );

  // Create a new persona
  toolCreator.createTool(
    configs,
    wss,
    {
      name: 'create_persona',
      description: 'Create a new AI persona',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'The name of the persona' },
          description: { type: 'string', description: 'A brief description of the persona' },
          icon: { type: 'string', description: 'The icon identifier for the persona' },
          prompt: { type: 'string', description: 'The system prompt for the persona' },
          accentColor: { type: 'string', description: 'The accent color for the persona (RGB format)' }
        },
        required: ['name', 'description', 'icon', 'prompt', 'accentColor']
      },
      _internal: {
        processor: async (params, session) => {
          try {
            const userId = session?.user?.id || 'default';
            
            logger.info(`[create_persona] Creating persona for user: ${userId}`);
            
            const persona = await personaService.createPersona(userId, params);
            
            return { persona };
          } catch (error) {
            logger.error('[create_persona] Error:', error);
            throw error;
          }
        }
      }
    }
  );

  // Update a persona
  toolCreator.createTool(
    configs,
    wss,
    {
      name: 'update_persona',
      description: 'Update an existing AI persona',
      inputSchema: {
        type: 'object',
        properties: {
          personaId: { type: 'string', description: 'The ID of the persona to update' },
          name: { type: 'string', description: 'The name of the persona' },
          description: { type: 'string', description: 'A brief description of the persona' },
          icon: { type: 'string', description: 'The icon identifier for the persona' },
          prompt: { type: 'string', description: 'The system prompt for the persona' },
          accentColor: { type: 'string', description: 'The accent color for the persona (RGB format)' }
        },
        required: ['personaId', 'name', 'description', 'icon', 'prompt', 'accentColor']
      },
      _internal: {
        processor: async (params, session) => {
          try {
            const userId = session?.user?.id || 'default';
            const { personaId, ...personaData } = params;
            
            logger.info(`[update_persona] Updating persona ${personaId} for user: ${userId}`);
            
            const persona = await personaService.updatePersona(personaId, userId, personaData);
            
            return { persona };
          } catch (error) {
            logger.error('[update_persona] Error:', error);
            throw error;
          }
        }
      }
    }
  );

  // Delete a persona
  toolCreator.createTool(
    configs,
    wss,
    {
      name: 'delete_persona',
      description: 'Delete an AI persona',
      inputSchema: {
        type: 'object',
        properties: {
          personaId: {
            type: 'string',
            description: 'The ID of the persona to delete'
          }
        },
        required: ['personaId']
      },
      _internal: {
        processor: async (params, session) => {
          try {
            const userId = session?.user?.id || 'default';
            const { personaId } = params;
            
            logger.info(`[delete_persona] Deleting persona ${personaId} for user: ${userId}`);
            
            const deleted = await personaService.deletePersona(personaId, userId);
            
            if (!deleted) {
              throw new Error('Persona not found or already deleted');
            }
            
            return { success: true };
          } catch (error) {
            logger.error('[delete_persona] Error:', error);
            throw error;
          }
        }
      }
    }
  );

  logger.info('Persona tools registered successfully');
}

module.exports = { registerPersonaTools };
