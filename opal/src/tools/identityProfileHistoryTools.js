/**
 * Identity Profile History Tools
 * 
 * Tools for managing identity profile history
 */

const logger = require('../logger');
const historyService = require('../services/identityProfileHistoryService');

/**
 * Get profile history for the current user
 */
const getProfileHistory = {
  name: 'getProfileHistory',
  description: 'Get the history of changes for the current user\'s identity profile',
  inputSchema: {
    type: 'object',
    properties: {
      limit: {
        type: 'number',
        description: 'Maximum number of history entries to return',
        default: 10
      },
      offset: {
        type: 'number',
        description: 'Offset for pagination',
        default: 0
      }
    },
    additionalProperties: false
  },
  outputSchema: {
    type: 'object',
    properties: {
      history: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            section_changed: { type: 'string' },
            change_description: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' }
          }
        }
      },
      total: { type: 'number' }
    }
  },
  handler: async (params, context) => {
    try {
      const { limit = 10, offset = 0 } = params;
      
      // Use context.user.id for consistency with other tools
      // Add fallback to context.session.userId if context.user is undefined
      const userId = context.user?.id || context.session?.userId;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Debug log to help diagnose context issues
      logger.info(`[getProfileHistory] Using userId: ${userId}, context.user: ${!!context.user}, context.session: ${!!context.session}`);
      
      const history = await historyService.getProfileHistory(userId, limit, offset);
      
      // Get total count for pagination
      const [{ count }] = await historyService.getProfileHistoryCount(userId);
      
      return {
        history,
        total: parseInt(count, 10)
      };
    } catch (error) {
      logger.error(`[getProfileHistory] Error: ${error.message}`, { error });
      throw error;
    }
  }
};

/**
 * Get a specific version of the profile from history
 */
const getProfileVersion = {
  name: 'getProfileVersion',
  description: 'Get a specific version of the identity profile from history',
  inputSchema: {
    type: 'object',
    properties: {
      historyId: {
        type: 'number',
        description: 'The history entry ID'
      }
    },
    required: ['historyId'],
    additionalProperties: false
  },
  outputSchema: {
    type: 'object',
    properties: {
      profile: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          biographical: { type: 'object' },
          personality_profile: { type: 'object' },
          meta: { type: 'object' }
        }
      },
      timestamp: { type: 'string', format: 'date-time' }
    }
  },
  handler: async (params, context) => {
    try {
      const { historyId } = params;
      const userId = context.session.userId;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const result = await historyService.getProfileVersion(userId, historyId);
      
      if (!result) {
        throw new Error('Profile version not found');
      }
      
      const { profile, timestamp } = result;
      
      return {
        profile,
        timestamp
      };
    } catch (error) {
      logger.error(`[getProfileVersion] Error: ${error.message}`, { error });
      throw error;
    }
  }
};

/**
 * Compare two versions of a profile
 */
const compareProfileVersions = {
  name: 'compareProfileVersions',
  description: 'Compare two versions of the identity profile and generate a diff summary',
  inputSchema: {
    type: 'object',
    properties: {
      historyId1: {
        type: 'number',
        description: 'The first history entry ID'
      },
      historyId2: {
        type: 'number',
        description: 'The second history entry ID'
      }
    },
    required: ['historyId1', 'historyId2'],
    additionalProperties: false
  },
  outputSchema: {
    type: 'object',
    properties: {
      historyId1: { type: 'number' },
      historyId2: { type: 'number' },
      date1: { type: 'string', format: 'date-time' },
      date2: { type: 'string', format: 'date-time' },
      changes: {
        type: 'object',
        properties: {
          biographical: { type: 'object' },
          personality_profile: { type: 'object' },
          meta: { type: 'object' }
        }
      }
    }
  },
  handler: async (params, context) => {
    try {
      const { historyId1, historyId2 } = params;
      
      // Use context.user.id for consistency with other tools
      // Add fallback to context.session.userId if context.user is undefined
      const userId = context.user?.id || context.session?.userId;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Debug log to help diagnose context issues
      logger.info(`[compareProfileVersions] Using userId: ${userId}, context.user: ${!!context.user}, context.session: ${!!context.session}`);
      
      // Verify both history entries belong to this user
      const [version1, version2] = await Promise.all([
        historyService.getProfileVersion(userId, historyId1),
        historyService.getProfileVersion(userId, historyId2)
      ]);
      
      if (!version1 || !version2) {
        throw new Error('One or both profile versions not found');
      }
      
      const comparison = await historyService.compareVersions(historyId1, historyId2);
      
      return comparison;
    } catch (error) {
      logger.error(`[compareProfileVersions] Error: ${error.message}`, { error });
      throw error;
    }
  }
};

/**
 * Restore a previous version of the profile
 */
const restoreProfileVersion = {
  name: 'restoreProfileVersion',
  description: 'Restore the identity profile to a previous version',
  inputSchema: {
    type: 'object',
    properties: {
      historyId: {
        type: 'number',
        description: 'The history entry ID to restore'
      }
    },
    required: ['historyId'],
    additionalProperties: false
  },
  outputSchema: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      profile: {
        type: 'object',
        properties: {
          userId: { type: 'string' },
          biographical: { type: 'object' },
          personality_profile: { type: 'object' },
          meta: { type: 'object' }
        }
      }
    }
  },
  handler: async (params, context) => {
    try {
      const { historyId } = params;
      const userId = context.session.userId;
      
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Get the profile version to restore
      const result = await historyService.getProfileVersion(userId, historyId);
      
      if (!result) {
        throw new Error('Profile version not found');
      }
      
      const { profile } = result;
      
      // Save this version as the current profile
      const identityProfileService = require('../services/identityProfileService');
      await identityProfileService.saveIdentityProfile(
        userId, 
        profile, 
        'all', 
        `Restored from version at ${result.timestamp}`
      );
      
      return {
        success: true,
        profile
      };
    } catch (error) {
      logger.error(`[restoreProfileVersion] Error: ${error.message}`, { error });
      throw error;
    }
  }
};

module.exports = {
  getProfileHistory,
  getProfileVersion,
  compareProfileVersions,
  restoreProfileVersion
};
