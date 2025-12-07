/**
 * Backup routes for OPAL server
 * Handles database backup and restore operations
 */

const express = require('express');
const router = express.Router();
const backupService = require('../services/backupService');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const logger = require('../logger');

/**
 * @route POST /backup
 * @desc Create a database backup
 * @access Private (admin only)
 */
router.post('/', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const { name } = req.body;
    
    const backup = await backupService.createBackup(name);
    
    res.status(201).json(backup);
  } catch (error) {
    logger.error('Backup creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route GET /backup
 * @desc List available backups
 * @access Private (admin only)
 */
router.get('/', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const backups = await backupService.listBackups();
    
    res.json(backups);
  } catch (error) {
    logger.error('Backup listing error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route POST /backup/restore
 * @desc Restore database from backup
 * @access Private (admin only)
 */
router.post('/restore', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const { filename } = req.body;
    
    if (!filename) {
      return res.status(400).json({ error: 'Backup filename is required' });
    }
    
    await backupService.restoreBackup(filename);
    
    res.json({ message: 'Database restored successfully' });
  } catch (error) {
    logger.error('Backup restoration error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @route DELETE /backup/:filename
 * @desc Delete a backup
 * @access Private (admin only)
 */
router.delete('/:filename', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const { filename } = req.params;
    
    await backupService.deleteBackup(filename);
    
    res.json({ message: 'Backup deleted successfully' });
  } catch (error) {
    logger.error('Backup deletion error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
