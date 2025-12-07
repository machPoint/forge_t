/**
 * Journal routes for OPAL server
 * Handles journal entry creation, retrieval, updates, and deletion
 */
const express = require('express');
const router = express.Router();
const journalService = require('../services/journalService'); 
const { authenticateJWT } = require('../middleware/auth');
const logger = require('../logger');

/**
 * @route   GET /journal
 * @desc    Get all journal entries for a user
 * @access  Private
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const entries = await journalService.getJournalEntries(req.user.id);
    res.json(entries);
  } catch (error) {
    logger.error('Error fetching journal entries:', error);
    res.status(500).json({ error: 'Failed to retrieve journal entries.' });
  }
});

/**
 * @route   POST /journal
 * @desc    Create a new journal entry
 * @access  Private
 */
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const newEntry = await journalService.createJournalEntry(req.user.id, req.body);
    res.status(201).json(newEntry);
  } catch (error) {
    logger.error('Error creating journal entry:', error);
    res.status(500).json({ error: 'Failed to create journal entry.' });
  }
});

/**
 * @route   PUT /journal/:id
 * @desc    Update a journal entry
 * @access  Private
 */
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const updatedEntry = await journalService.updateJournalEntry(req.params.id, req.user.id, req.body);
    res.json(updatedEntry);
  } catch (error) {
    logger.error(`Error updating journal entry ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update journal entry.' });
  }
});

/**
 * @route   DELETE /journal/:id
 * @desc    Delete a journal entry
 * @access  Private
 */
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    await journalService.deleteJournalEntry(req.params.id, req.user.id);
    res.json({ message: 'Journal entry deleted successfully' });
  } catch (error) {
    logger.error(`Error deleting journal entry ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete journal entry.' });
  }
});

module.exports = router; 