/**
 * AI Config Service
 * Centralizes provider resolution and API key management.
 */

const logger = require('../logger');
const configLoader = require('../config-loader');

const PROVIDER_ENV_KEYS = {
  openai: ['OPENAI_API_KEY', 'OPENAI_KEY', 'API_KEY_OPENAI'],
  anthropic: ['ANTHROPIC_API_KEY', 'ANTHROPIC_KEY', 'API_KEY_ANTHROPIC']
};

function getProviderFromModel(model, fallback = 'openai') {
  const normalized = (model || '').toLowerCase();
  if (normalized.startsWith('claude-') || normalized.includes('claude')) {
    return 'anthropic';
  }
  return fallback;
}

function getApiKey(provider) {
  const envKeys = PROVIDER_ENV_KEYS[provider] || [];

  for (const envKey of envKeys) {
    const value = process.env[envKey];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  if (provider === 'anthropic') {
    return configLoader.getAnthropicApiKey();
  }

  return configLoader.getOpenAIApiKey();
}

function getApiKeyOrThrow(provider, useCase = 'AI request') {
  const apiKey = getApiKey(provider);
  if (apiKey) {
    return apiKey;
  }

  if (provider === 'anthropic') {
    throw new Error(`${useCase} failed: Anthropic API key not configured. Please configure it in Settings.`);
  }

  throw new Error(`${useCase} failed: OpenAI API key not configured. Please configure it in Settings.`);
}

function setApiKey(provider, rawApiKey) {
  if (!rawApiKey || typeof rawApiKey !== 'string' || !rawApiKey.trim()) {
    throw new Error(`Invalid ${provider} API key`);
  }

  const apiKey = rawApiKey.trim();
  const envKeys = PROVIDER_ENV_KEYS[provider] || [];

  envKeys.forEach((envKey) => {
    process.env[envKey] = apiKey;
  });

  if (provider === 'anthropic') {
    configLoader.setAnthropicApiKey(apiKey);
  } else {
    configLoader.setOpenAIApiKey(apiKey);
  }

  logger.info(`[aiConfigService] Updated ${provider} API key in runtime config`);
  return apiKey;
}

module.exports = {
  getProviderFromModel,
  getApiKey,
  getApiKeyOrThrow,
  setApiKey
};
