/**
 * Module Progress MCP Tools
 * 
 * This file implements MCP tools for guided journal module progress persistence.
 * It provides tools to save, retrieve, and manage module progress data.
 */

const toolCreator = require('../utils/toolCreator');
const logger = require('../logger');
const moduleProgressService = require('../services/moduleProgressService');

/**
 * Register module progress tools
 * 
 * @param {Object} configs - The global configs object
 * @param {WebSocketServer} wss - The WebSocket server instance
 */
function registerModuleProgressTools(configs, wss) {
  logger.info('Registering module progress tools...');
  
  // Register saveModuleProgress tool
  toolCreator.createTool(configs, wss, {
    name: 'saveModuleProgress',
    description: 'Save or update progress for a guided journal module',
    inputSchema: {
      type: 'object',
      properties: {
        moduleId: { 
          type: 'string', 
          description: 'ID of the module to save progress for' 
        },
        currentStep: { 
          type: 'integer', 
          description: 'Current step index in the module' 
        },
        isComplete: { 
          type: 'boolean', 
          description: 'Whether the module is complete' 
        },
        entries: { 
          type: 'object', 
          description: 'Step entries data for the module' 
        }
      },
      required: ['moduleId', 'entries']
    },
    _internal: {
      method: 'POST',
      path: '/module-progress',
      processor: async (params, session) => {
        logger.info('[module_progress_save] Processing request with session:', { 
          hasSession: !!session, 
          hasUser: !!(session && session.user),
          userId: session?.user?.id
        });
        
        if (!session || !session.user || !session.user.id) {
          logger.error('[module_progress_save] Authentication failed - missing user in session');
          throw new Error('User not authenticated');
        }
        
        const userId = session.user.id;
        logger.info(`[module_progress_save] Saving progress for module ${params.moduleId} for user ${userId}`);
        
        try {
          const progressData = {
            currentStep: params.currentStep,
            isComplete: params.isComplete,
            entries: params.entries
          };
          
          const savedProgress = await moduleProgressService.saveModuleProgress(
            userId, 
            params.moduleId, 
            progressData
          );
          
          logger.info(`[module_progress_save] Successfully saved progress for module: ${params.moduleId}`);
          return savedProgress;
        } catch (err) {
          logger.error('[module_progress_save] Error:', err);
          throw err;
        }
      }
    }
  });

  // Register getModuleProgress tool (alias for getAllModuleProgress)
  toolCreator.createTool(configs, wss, {
    name: 'getModuleProgress',
    description: 'Get all module progress for the current user',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    _internal: {
      method: 'GET',
      path: '/module-progress',
      processor: async (params, session) => {
        logger.info('[module_progress_get_all] Processing request with session:', { 
          hasSession: !!session, 
          hasUser: !!(session && session.user),
          userId: session?.user?.id
        });
        
        if (!session || !session.user || !session.user.id) {
          logger.error('[module_progress_get_all] Authentication failed - missing user in session');
          throw new Error('User not authenticated');
        }
        
        const userId = session.user.id;
        logger.info(`[module_progress_get_all] Fetching all module progress for user ${userId}`);
        
        try {
          const allProgress = await moduleProgressService.getAllModuleProgress(userId);
          logger.info(`[module_progress_get_all] Successfully fetched ${allProgress.length} module progress items`);
          return allProgress;
        } catch (err) {
          logger.error('[module_progress_get_all] Error:', err);
          throw err;
        }
      }
    }
  });

  // Register getAllModuleProgress tool (same as getModuleProgress)
  toolCreator.createTool(configs, wss, {
    name: 'getAllModuleProgress',
    description: 'Get all module progress for the current user',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    },
    _internal: {
      method: 'GET',
      path: '/module-progress',
      processor: async (params, session) => {
        logger.info('[getAllModuleProgress] Processing request with session:', { 
          hasSession: !!session, 
          hasUser: !!(session && session.user),
          userId: session?.user?.id
        });
        
        if (!session || !session.user || !session.user.id) {
          logger.error('[getAllModuleProgress] Authentication failed - missing user in session');
          throw new Error('User not authenticated');
        }
        
        const userId = session.user.id;
        logger.info(`[getAllModuleProgress] Fetching all module progress for user ${userId}`);
        
        try {
          const allProgress = await moduleProgressService.getAllModuleProgress(userId);
          logger.info(`[getAllModuleProgress] Successfully fetched ${allProgress.length} module progress items`);
          return allProgress;
        } catch (err) {
          logger.error('[getAllModuleProgress] Error:', err);
          throw err;
        }
      }
    }
  });

  // Register getModuleProgressById tool
  toolCreator.createTool(configs, wss, {
    name: 'getModuleProgressById',
    description: 'Get progress for a specific module',
    inputSchema: {
      type: 'object',
      properties: {
        moduleId: { 
          type: 'string', 
          description: 'ID of the module to get progress for' 
        }
      },
      required: ['moduleId']
    },
    _internal: {
      method: 'GET',
      path: '/module-progress/:moduleId',
      processor: async (params, session) => {
        logger.info('[module_progress_get_by_id] Processing request with session:', { 
          hasSession: !!session, 
          hasUser: !!(session && session.user),
          userId: session?.user?.id
        });
        
        if (!session || !session.user || !session.user.id) {
          logger.error('[module_progress_get_by_id] Authentication failed - missing user in session');
          throw new Error('User not authenticated');
        }
        
        const userId = session.user.id;
        logger.info(`[module_progress_get_by_id] Fetching progress for module ${params.moduleId} for user ${userId}`);
        
        try {
          const progress = await moduleProgressService.getModuleProgressById(userId, params.moduleId);
          
          if (!progress) {
            logger.info(`[module_progress_get_by_id] No progress found for module ${params.moduleId}`);
            return null;
          }
          
          logger.info(`[module_progress_get_by_id] Successfully fetched progress for module: ${params.moduleId}`);
          return progress;
        } catch (err) {
          logger.error('[module_progress_get_by_id] Error:', err);
          throw err;
        }
      }
    }
  });

  // Register deleteModuleProgress tool
  toolCreator.createTool(configs, wss, {
    name: 'deleteModuleProgress',
    description: 'Delete progress for a specific module',
    inputSchema: {
      type: 'object',
      properties: {
        moduleId: { 
          type: 'string', 
          description: 'ID of the module to delete progress for' 
        }
      },
      required: ['moduleId']
    },
    _internal: {
      method: 'DELETE',
      path: '/module-progress/:moduleId',
      processor: async (params, session) => {
        logger.info('[module_progress_delete] Processing request with session:', { 
          hasSession: !!session, 
          hasUser: !!(session && session.user),
          userId: session?.user?.id
        });
        
        if (!session || !session.user || !session.user.id) {
          logger.error('[module_progress_delete] Authentication failed - missing user in session');
          throw new Error('User not authenticated');
        }
        
        const userId = session.user.id;
        logger.info(`[module_progress_delete] Deleting progress for module ${params.moduleId} for user ${userId}`);
        
        try {
          const deletedCount = await moduleProgressService.deleteModuleProgress(userId, params.moduleId);
          
          logger.info(`[module_progress_delete] Successfully deleted progress for module: ${params.moduleId}`);
          return { 
            success: true, 
            message: 'Module progress deleted successfully', 
            moduleId: params.moduleId,
            deletedCount
          };
        } catch (err) {
          logger.error('[module_progress_delete] Error:', err);
          throw err;
        }
      }
    }
  });
  
  logger.info('Module progress tools registration completed');
}

module.exports = registerModuleProgressTools;
