const identityProfileService = require('../services/identityProfileService');
const logger = require('../logger');

/**
 * Middleware to inject identity profile into the context for AI agents
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
async function injectIdentityProfile(req, res, next) {
  try {
    // Skip if no user or if this is not an AI agent request
    if (!req.user || !req.body.messages) {
      return next();
    }

    const userId = req.user.id;
    logger.info(`[contextInjection] Injecting identity profile for user ${userId}`);
    
    // Get the user's identity profile
    const profile = await identityProfileService.getIdentityProfile(userId);
    
    // If no profile exists, continue without injection
    if (!profile) {
      logger.info(`[contextInjection] No identity profile found for user ${userId}`);
      return next();
    }
    
    // Add identity profile to the context
    if (!req.body.context) {
      req.body.context = {};
    }
    
    req.body.context.identityProfile = profile;
    
    logger.info(`[contextInjection] Successfully injected identity profile for user ${userId}`);
    next();
  } catch (error) {
    logger.error(`[contextInjection] Error injecting identity profile: ${error.message}`);
    // Continue without injection in case of error
    next();
  }
}

/**
 * Middleware to inject identity profile into WebSocket messages for AI agents
 * @param {object} message - WebSocket message
 * @param {object} session - WebSocket session
 * @returns {Promise<object>} - Modified message with identity profile
 */
async function injectIdentityProfileWs(message, session) {
  try {
    // Skip if no user in the session
    if (!session || !session.user || !session.user.id) {
      logger.warn(`[contextInjection] Skipping identity injection - no valid user in session`);
      return message;
    }

    const userId = session.user.id;
    logger.info(`[contextInjection] Injecting identity profile for WebSocket user ${userId}`);
    
    // Get the user's identity profile
    const profile = await identityProfileService.getIdentityProfile(userId);
    
    // If no profile exists, return original message but log it
    if (!profile) {
      logger.info(`[contextInjection] No identity profile found for WebSocket user ${userId}`);
      return message;
    }
    
    // Ensure message has proper structure
    if (!message.params) {
      message.params = {};
    }
    
    // Add identity profile to the context for all message types
    if (!message.params.context) {
      message.params.context = {};
    }
    
    message.params.context.identityProfile = profile;
    
    // Debug log the method and injected context
    logger.info(`[contextInjection] Successfully injected identity profile for user ${userId} on method: ${message.method || 'unknown'}`);
    logger.debug(`[contextInjection] Context keys after injection: ${Object.keys(message.params.context).join(', ')}`);
    
    return message;
  } catch (error) {
    logger.error(`[contextInjection] Error injecting identity profile in WebSocket: ${error.message}`);
    // Return original message in case of error
    return message;
  }
}

module.exports = {
  injectIdentityProfile,
  injectIdentityProfileWs
};
