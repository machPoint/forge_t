/**
 * Memory routes for OPAL server
 * Handles memory creation, search, and management
 */

const express = require('express');
const router = express.Router();
const memoryService = require('../services/memoryService');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const logger = require('../logger');

/**
 * @route POST /memory
 * @desc Create a new memory
 * @access Private
 */
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const { title, content, type, tags, source, sourceEntryId, metadata } = req.body;
    const userId = req.user.id;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }
    
    // Build options object with all the additional fields
    const options = {};
    if (type) options.type = type;
    if (tags) options.tags = tags;
    if (source) options.source = source;
    if (sourceEntryId) options.sourceEntryId = sourceEntryId;
    if (metadata) options.metadata = metadata;
    
    const memory = await memoryService.createMemory(userId, title, content, options);
    
    res.status(201).json(memory);
  } catch (error) {
    logger.error('Memory creation error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /memory
 * @desc Get all memories for the user
 * @access Private
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    // Build filter object from query parameters
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    if (req.query.source) filter.source = req.query.source;
    if (req.query.sourceEntryId) filter.sourceEntryId = req.query.sourceEntryId;
    if (req.query.tags) {
      // Handle both single tag and multiple tags
      filter.tags = Array.isArray(req.query.tags) ? req.query.tags : [req.query.tags];
    }
    
    const includeArchived = req.query.includeArchived === 'true';
    const onlyStarred = req.query.onlyStarred === 'true';
    
    const memories = await memoryService.getUserMemories(userId, {
      filter,
      limit,
      offset,
      includeArchived,
      onlyStarred
    });
    
    res.json(memories);
  } catch (error) {
    logger.error('Memory retrieval error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /memory/:id
 * @desc Get a specific memory
 * @access Private
 */
router.get('/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const memoryId = req.params.id;
    
    // Use getUserMemories with a filter to get a specific memory
    const memories = await memoryService.getUserMemories(userId);
    const memory = memories.find(m => m.id === memoryId);
    
    if (!memory) {
      return res.status(404).json({ error: 'Memory not found' });
    }
    
    res.json(memory);
  } catch (error) {
    logger.error('Memory retrieval error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route PUT /memory/:id
 * @desc Update a memory
 * @access Private
 */
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const memoryId = req.params.id;
    const { title, content, type, tags, source, sourceEntryId, starred, archived, metadata } = req.body;
    
    // Build updates object with all the fields
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (type !== undefined) updates.type = type;
    if (tags !== undefined) updates.tags = tags;
    if (source !== undefined) updates.source = source;
    if (sourceEntryId !== undefined) updates.sourceEntryId = sourceEntryId;
    if (starred !== undefined) updates.starred = starred;
    if (archived !== undefined) updates.archived = archived;
    if (metadata !== undefined) updates.metadata = metadata;
    
    const memory = await memoryService.updateMemory(memoryId, userId, updates);
    
    res.json(memory);
  } catch (error) {
    logger.error('Memory update error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route DELETE /memory/:id
 * @desc Delete a memory
 * @access Private
 */
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const memoryId = req.params.id;
    
    await memoryService.deleteMemory(memoryId, userId);
    
    res.json({ message: 'Memory deleted successfully' });
  } catch (error) {
    logger.error('Memory deletion error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route POST /memory/search
 * @desc Search memories by content
 * @access Private
 */
router.post('/search', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const { query, limit, threshold } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const memories = await memoryService.searchMemories(
      userId,
      query,
      limit || 10,
      threshold || 0.7
    );
    
    res.json(memories);
  } catch (error) {
    logger.error('Memory search error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
