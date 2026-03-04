/**
 * Retry Utility with Exponential Backoff
 * Handles transient failures for AI API calls
 */

const logger = require('../logger');

/**
 * Retry configuration defaults
 */
const DEFAULT_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  backoffMultiplier: 2,
  maxDelayMs: 8000,
  retryableStatusCodes: [429, 500, 502, 503, 504],
  retryableErrors: ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNREFUSED']
};

/**
 * Check if an error is retryable
 * @param {Error|Object} error - The error to check
 * @param {Array<number>} retryableStatusCodes - HTTP status codes that should be retried
 * @param {Array<string>} retryableErrors - Error codes that should be retried
 * @returns {boolean} True if error is retryable
 */
function isRetryableError(error, retryableStatusCodes, retryableErrors) {
  // Check HTTP status code
  if (error.status && retryableStatusCodes.includes(error.status)) {
    return true;
  }
  
  // Check error code (network errors)
  if (error.code && retryableErrors.includes(error.code)) {
    return true;
  }
  
  // Check error message for common transient patterns
  const errorMessage = error.message || '';
  if (errorMessage.includes('timeout') || 
      errorMessage.includes('ETIMEDOUT') ||
      errorMessage.includes('ECONNRESET') ||
      errorMessage.includes('rate limit')) {
    return true;
  }
  
  return false;
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} config - Retry configuration
 * @returns {Promise<any>} Result of the function
 */
async function retryWithBackoff(fn, config = {}) {
  const {
    maxAttempts,
    initialDelayMs,
    backoffMultiplier,
    maxDelayMs,
    retryableStatusCodes,
    retryableErrors
  } = { ...DEFAULT_CONFIG, ...config };
  
  let lastError;
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    
    try {
      logger.debug(`[RetryWithBackoff] Attempt ${attempt}/${maxAttempts}`);
      const result = await fn();
      
      if (attempt > 1) {
        logger.info(`[RetryWithBackoff] Success on attempt ${attempt}`);
      }
      
      return result;
    } catch (error) {
      lastError = error;
      
      // Check if we should retry
      const shouldRetry = isRetryableError(error, retryableStatusCodes, retryableErrors);
      
      if (!shouldRetry) {
        logger.warn(`[RetryWithBackoff] Non-retryable error on attempt ${attempt}:`, error.message);
        throw error;
      }
      
      // Check if we have attempts left
      if (attempt >= maxAttempts) {
        logger.error(`[RetryWithBackoff] Max attempts (${maxAttempts}) reached`);
        break;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt - 1),
        maxDelayMs
      );
      
      logger.warn(
        `[RetryWithBackoff] Attempt ${attempt} failed (${error.status || error.code || 'unknown'}): ${error.message}. ` +
        `Retrying in ${delay}ms...`
      );
      
      await sleep(delay);
    }
  }
  
  // All retries exhausted
  logger.error(`[RetryWithBackoff] All ${maxAttempts} attempts failed. Last error:`, lastError.message);
  throw lastError;
}

/**
 * Create a fetch wrapper with timeout and retry
 * @param {string} url - URL to fetch
 * @param {Object} options - Fetch options
 * @param {number} timeoutMs - Timeout in milliseconds (default: 45000)
 * @param {Object} retryConfig - Retry configuration
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithTimeoutAndRetry(url, options = {}, timeoutMs = 45000, retryConfig = {}) {
  return retryWithBackoff(async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      // Check for HTTP errors
      if (!response.ok) {
        const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status;
        error.response = response;
        throw error;
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      
      // Handle abort/timeout
      if (error.name === 'AbortError') {
        const timeoutError = new Error(`Request timeout after ${timeoutMs}ms`);
        timeoutError.code = 'ETIMEDOUT';
        throw timeoutError;
      }
      
      throw error;
    }
  }, retryConfig);
}

module.exports = {
  retryWithBackoff,
  fetchWithTimeoutAndRetry,
  isRetryableError,
  DEFAULT_CONFIG
};
