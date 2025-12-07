/**
 * Notes routes for OPAL server
 * Handles note creation, retrieval, updates, and deletion
 */
const express = require('express');
const router = express.Router();
const notesService = require('../services/notesService'); 
const { authenticateJWT } = require('../middleware/auth');
const logger = require('../logger');

/**
 * @route   GET /notes
 * @desc    Get all notes for a user
 * @access  Private
 */
router.get('/', authenticateJWT, async (req, res) => {
  try {
    const notes = await notesService.getNotes(req.user.id);
    res.json(notes);
  } catch (error) {
    logger.error('Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to retrieve notes.' });
  }
});

/**
 * @route   POST /notes
 * @desc    Create a new note
 * @access  Private
 */
router.post('/', authenticateJWT, async (req, res) => {
  try {
    const newNote = await notesService.createNote(req.user.id, req.body);
    res.status(201).json(newNote);
  } catch (error) {
    logger.error('Error creating note:', error);
    res.status(500).json({ error: 'Failed to create note.' });
  }
});

/**
 * @route   PUT /notes/:id
 * @desc    Update a note
 * @access  Private
 */
router.put('/:id', authenticateJWT, async (req, res) => {
  try {
    const updatedNote = await notesService.updateNote(req.params.id, req.user.id, req.body);
    res.json(updatedNote);
  } catch (error) {
    logger.error(`Error updating note ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to update note.' });
  }
});

/**
 * @route   DELETE /notes/:id
 * @desc    Delete a note
 * @access  Private
 */
router.delete('/:id', authenticateJWT, async (req, res) => {
  try {
    const deletedCount = await notesService.deleteNote(req.params.id, req.user.id);
    if (deletedCount === 0) {
      res.status(404).json({ error: 'Note not found.' });
    } else {
      res.json({ message: 'Note deleted successfully.' });
    }
  } catch (error) {
    logger.error(`Error deleting note ${req.params.id}:`, error);
    res.status(500).json({ error: 'Failed to delete note.' });
  }
});

module.exports = router;

