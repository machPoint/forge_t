/**
 * Model Registry Service
 * Centralized model resolution with deprecation handling and fallback
 */

const logger = require('../logger');

/**
 * Registry of supported AI models by provider
 * Updated as of February 2026
 */
const MODEL_REGISTRY = {
  openai: {
    current: [
      'gpt-4o',
      'gpt-4o-2024-08-06',
      'gpt-4o-mini',
      'gpt-4o-mini-2024-07-18',
      'gpt-4-turbo',
      'gpt-4-turbo-2024-04-09',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-3.5-turbo-0125'
    ],
    deprecated: [
      'gpt-4-0613',
      'gpt-4-32k',
      'gpt-3.5-turbo-0613',
      'gpt-3.5-turbo-16k'
    ],
    fallback: 'gpt-4o'
  },
  anthropic: {
    current: [
      'claude-opus-4-6',
      'claude-opus-4-5-20251101',
      'claude-sonnet-4-5-20250929',
      'claude-haiku-4-5-20251001'
    ],
    deprecated: [
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307'
    ],
    fallback: 'claude-haiku-4-5-20251001'
  }
};

/**
 * Detect provider from model name
 * @param {string} model - The model identifier
 * @returns {string} The provider name ('openai' or 'anthropic')
 */
function detectProvider(model) {
  if (!model) {
    return 'openai'; // Default to OpenAI
  }
  
  const lowerModel = model.toLowerCase();
  
  if (lowerModel.includes('claude') || lowerModel.includes('anthropic')) {
    return 'anthropic';
  }
  
  if (lowerModel.includes('gpt') || lowerModel.includes('openai')) {
    return 'openai';
  }
  
  // Default to OpenAI for unknown models
  return 'openai';
}

/**
 * Validate and resolve a model name
 * @param {string} requestedModel - The model requested by the user/system
 * @param {string} provider - Optional explicit provider override
 * @returns {Object} Resolution result with model, provider, and status
 */
function resolveModel(requestedModel, provider = null) {
  // Detect provider if not explicitly provided
  const detectedProvider = provider || detectProvider(requestedModel);
  
  // Get registry for this provider
  const registry = MODEL_REGISTRY[detectedProvider];
  
  if (!registry) {
    logger.warn(`[ModelRegistry] Unknown provider: ${detectedProvider}, falling back to OpenAI`);
    return {
      model: MODEL_REGISTRY.openai.fallback,
      provider: 'openai',
      status: 'fallback',
      reason: 'unknown_provider',
      message: `Unknown provider "${detectedProvider}". Using fallback model.`
    };
  }
  
  // If no model requested, use fallback
  if (!requestedModel || requestedModel.trim() === '') {
    logger.info(`[ModelRegistry] No model specified, using fallback: ${registry.fallback}`);
    return {
      model: registry.fallback,
      provider: detectedProvider,
      status: 'fallback',
      reason: 'no_model_specified',
      message: 'No model specified. Using default fallback model.'
    };
  }
  
  // Check if model is in current list
  if (registry.current.includes(requestedModel)) {
    logger.debug(`[ModelRegistry] Model ${requestedModel} is current and supported`);
    return {
      model: requestedModel,
      provider: detectedProvider,
      status: 'valid',
      reason: 'current_model',
      message: null
    };
  }
  
  // Check if model is deprecated
  if (registry.deprecated.includes(requestedModel)) {
    logger.warn(`[ModelRegistry] Model ${requestedModel} is deprecated, using fallback: ${registry.fallback}`);
    return {
      model: registry.fallback,
      provider: detectedProvider,
      status: 'fallback',
      reason: 'deprecated_model',
      message: `Model "${requestedModel}" is deprecated. Using current fallback model "${registry.fallback}".`
    };
  }
  
  // Model not in registry - could be new or invalid
  // Log warning but allow it (optimistic validation)
  logger.warn(`[ModelRegistry] Model ${requestedModel} not in registry. Allowing with warning.`);
  return {
    model: requestedModel,
    provider: detectedProvider,
    status: 'unknown',
    reason: 'not_in_registry',
    message: `Model "${requestedModel}" is not in the registry. It may be new or invalid.`
  };
}

/**
 * Get all current models for a provider
 * @param {string} provider - The provider name ('openai' or 'anthropic')
 * @returns {Array<string>} List of current model names
 */
function getCurrentModels(provider) {
  const registry = MODEL_REGISTRY[provider];
  if (!registry) {
    logger.error(`[ModelRegistry] Unknown provider: ${provider}`);
    return [];
  }
  return registry.current;
}

/**
 * Get fallback model for a provider
 * @param {string} provider - The provider name ('openai' or 'anthropic')
 * @returns {string} Fallback model name
 */
function getFallbackModel(provider) {
  const registry = MODEL_REGISTRY[provider];
  if (!registry) {
    logger.error(`[ModelRegistry] Unknown provider: ${provider}, returning OpenAI fallback`);
    return MODEL_REGISTRY.openai.fallback;
  }
  return registry.fallback;
}

/**
 * Check if a model is deprecated
 * @param {string} model - The model to check
 * @param {string} provider - Optional provider override
 * @returns {boolean} True if model is deprecated
 */
function isDeprecated(model, provider = null) {
  const detectedProvider = provider || detectProvider(model);
  const registry = MODEL_REGISTRY[detectedProvider];
  
  if (!registry) {
    return false;
  }
  
  return registry.deprecated.includes(model);
}

module.exports = {
  resolveModel,
  detectProvider,
  getCurrentModels,
  getFallbackModel,
  isDeprecated,
  MODEL_REGISTRY
};
