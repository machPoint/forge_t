/**
 * Utility functions for converting object keys between camelCase and snake_case
 * This helps bridge the gap between frontend (camelCase) and database (snake_case) conventions
 */

const logger = require('../logger');

/**
 * Converts a string from camelCase to snake_case
 * @param {string} str - The camelCase string to convert
 * @returns {string} - The snake_case version of the string
 */
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

/**
 * Converts a string from snake_case to camelCase
 * @param {string} str - The snake_case string to convert
 * @returns {string} - The camelCase version of the string
 */
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

/**
 * Recursively converts all keys in an object from camelCase to snake_case
 * @param {Object} obj - The object with camelCase keys
 * @returns {Object} - A new object with snake_case keys
 */
function convertKeysToSnakeCase(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToSnakeCase(item));
  }

  const result = {};
  Object.keys(obj).forEach(key => {
    const snakeKey = camelToSnake(key);
    result[snakeKey] = convertKeysToSnakeCase(obj[key]);
  });

  return result;
}

/**
 * Recursively converts all keys in an object from snake_case to camelCase
 * @param {Object} obj - The object with snake_case keys
 * @returns {Object} - A new object with camelCase keys
 */
function convertKeysToCamelCase(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToCamelCase(item));
  }

  const result = {};
  Object.keys(obj).forEach(key => {
    const camelKey = snakeToCamel(key);
    result[camelKey] = convertKeysToCamelCase(obj[key]);
  });

  return result;
}

/**
 * Converts an array of objects from snake_case to camelCase
 * @param {Array<Object>} arr - Array of objects with snake_case keys
 * @returns {Array<Object>} - Array of objects with camelCase keys
 */
function convertArrayToCamelCase(arr) {
  if (!Array.isArray(arr)) {
    return arr;
  }
  return arr.map(item => convertKeysToCamelCase(item));
}

/**
 * Converts an array of objects from camelCase to snake_case
 * @param {Array<Object>} arr - Array of objects with camelCase keys
 * @returns {Array<Object>} - Array of objects with snake_case keys
 */
function convertArrayToSnakeCase(arr) {
  if (!Array.isArray(arr)) {
    return arr;
  }
  return arr.map(item => convertKeysToSnakeCase(item));
}

/**
 * Safe wrapper for converting data to snake_case
 * Logs any errors but doesn't throw them
 */
function toSnakeCase(data) {
  try {
    if (Array.isArray(data)) {
      return convertArrayToSnakeCase(data);
    }
    return convertKeysToSnakeCase(data);
  } catch (error) {
    logger.error('Error converting to snake_case:', error);
    return data; // Return original data on error
  }
}

/**
 * Safe wrapper for converting data to camelCase
 * Logs any errors but doesn't throw them
 */
function toCamelCase(data) {
  try {
    if (Array.isArray(data)) {
      return convertArrayToCamelCase(data);
    }
    return convertKeysToCamelCase(data);
  } catch (error) {
    logger.error('Error converting to camelCase:', error);
    return data; // Return original data on error
  }
}

module.exports = {
  toSnakeCase,
  toCamelCase,
  camelToSnake,
  snakeToCamel
};
