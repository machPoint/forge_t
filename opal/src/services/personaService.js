/**
 * Persona Service
 * Handles CRUD operations for AI personas
 */

const db = require('../config/database');
const logger = require('../logger');
const { v4: uuidv4 } = require('uuid');

/**
 * Get all personas for a user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} Array of personas
 */
async function getPersonasByUserId(userId) {
  try {
    const personas = await db('ai_personas')
      .where({ user_id: userId })
      .orderBy('created_at', 'asc');
    
    // Convert snake_case to camelCase for frontend
    return personas.map(persona => ({
      id: persona.id,
      name: persona.name,
      description: persona.description,
      icon: persona.icon,
      prompt: persona.prompt,
      accentColor: persona.accent_color,
      isDefault: persona.is_default
    }));
  } catch (error) {
    logger.error('Error fetching personas:', error);
    throw error;
  }
}

/**
 * Get a single persona by ID
 * @param {string} personaId - The persona ID
 * @param {string} userId - The user ID
 * @returns {Promise<Object|null>} The persona or null
 */
async function getPersonaById(personaId, userId) {
  try {
    const persona = await db('ai_personas')
      .where({ id: personaId, user_id: userId })
      .first();
    
    if (!persona) return null;
    
    return {
      id: persona.id,
      name: persona.name,
      description: persona.description,
      icon: persona.icon,
      prompt: persona.prompt,
      accentColor: persona.accent_color,
      isDefault: persona.is_default
    };
  } catch (error) {
    logger.error('Error fetching persona:', error);
    throw error;
  }
}

/**
 * Create a new persona
 * @param {string} userId - The user ID
 * @param {Object} personaData - The persona data
 * @returns {Promise<Object>} The created persona
 */
async function createPersona(userId, personaData) {
  try {
    const personaId = uuidv4();
    const now = new Date().toISOString();
    
    await db('ai_personas').insert({
      id: personaId,
      user_id: userId,
      name: personaData.name,
      description: personaData.description,
      icon: personaData.icon,
      prompt: personaData.prompt,
      accent_color: personaData.accentColor,
      is_default: personaData.isDefault || false,
      created_at: now,
      updated_at: now
    });
    
    return {
      id: personaId,
      name: personaData.name,
      description: personaData.description,
      icon: personaData.icon,
      prompt: personaData.prompt,
      accentColor: personaData.accentColor,
      isDefault: personaData.isDefault || false
    };
  } catch (error) {
    logger.error('Error creating persona:', error);
    throw error;
  }
}

/**
 * Update a persona
 * @param {string} personaId - The persona ID
 * @param {string} userId - The user ID
 * @param {Object} personaData - The updated persona data
 * @returns {Promise<Object>} The updated persona
 */
async function updatePersona(personaId, userId, personaData) {
  try {
    const now = new Date().toISOString();
    
    await db('ai_personas')
      .where({ id: personaId, user_id: userId })
      .update({
        name: personaData.name,
        description: personaData.description,
        icon: personaData.icon,
        prompt: personaData.prompt,
        accent_color: personaData.accentColor,
        is_default: personaData.isDefault || false,
        updated_at: now
      });
    
    return {
      id: personaId,
      name: personaData.name,
      description: personaData.description,
      icon: personaData.icon,
      prompt: personaData.prompt,
      accentColor: personaData.accentColor,
      isDefault: personaData.isDefault || false
    };
  } catch (error) {
    logger.error('Error updating persona:', error);
    throw error;
  }
}

/**
 * Delete a persona
 * @param {string} personaId - The persona ID
 * @param {string} userId - The user ID
 * @returns {Promise<boolean>} True if deleted
 */
async function deletePersona(personaId, userId) {
  try {
    const deleted = await db('ai_personas')
      .where({ id: personaId, user_id: userId })
      .del();
    
    return deleted > 0;
  } catch (error) {
    logger.error('Error deleting persona:', error);
    throw error;
  }
}

/**
 * Initialize default personas for a new user
 * @param {string} userId - The user ID
 * @returns {Promise<Array>} The created personas
 */
async function initializeDefaultPersonas(userId) {
  const defaultPersonas = [
    {
      name: "Jungian Guide",
      description: "Provides feedback based on Jungian psychology and archetypes",
      icon: "psychology",
      prompt: "Analyze this journal entry from a Jungian perspective, focusing on archetypes, the shadow, and the collective unconscious.",
      accentColor: "rgb(74, 134, 232)"
    },
    {
      name: "CBT Coach",
      description: "Offers cognitive behavioral therapy insights",
      icon: "brain",
      prompt: "Analyze this journal entry using cognitive behavioral therapy principles. Identify cognitive distortions and suggest alternative thought patterns.",
      accentColor: "rgb(52, 168, 83)"
    },
    {
      name: "Supportive Friend",
      description: "Provides empathetic and encouraging feedback",
      icon: "heart",
      prompt: "Respond to this journal entry with empathy, validation, and gentle encouragement, as a supportive friend would.",
      accentColor: "rgb(234, 67, 53)"
    },
    {
      name: "Stern Mentor",
      description: "Gives direct, challenging feedback to promote growth",
      icon: "target",
      prompt: "Analyze this journal entry with direct, challenging feedback. Point out blind spots and suggest actionable steps for growth.",
      accentColor: "rgb(251, 188, 5)"
    }
  ];
  
  const createdPersonas = [];
  for (const personaData of defaultPersonas) {
    const persona = await createPersona(userId, personaData);
    createdPersonas.push(persona);
  }
  
  return createdPersonas;
}

module.exports = {
  getPersonasByUserId,
  getPersonaById,
  createPersona,
  updatePersona,
  deletePersona,
  initializeDefaultPersonas
};
