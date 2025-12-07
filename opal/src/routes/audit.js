/**
 * Audit routes for OPAL server
 * Handles tool run auditing and log retrieval
 */

const express = require('express');
const router = express.Router();
const auditService = require('../services/auditService');
const { authenticateJWT, requireRole } = require('../middleware/auth');
const logger = require('../logger');

/**
 * @route GET /audit/tool-runs
 * @desc Get audit logs for the user
 * @access Private
 */
router.get('/tool-runs', authenticateJWT, async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const logs = await auditService.getUserAuditLogs(userId, limit, offset);
    
    res.json(logs);
  } catch (error) {
    logger.error('Audit log retrieval error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /audit/tool/:name
 * @desc Get audit logs for a specific tool
 * @access Private (admin only)
 */
router.get('/tool/:name', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const toolName = req.params.name;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const logs = await auditService.getToolAuditLogs(toolName, limit, offset);
    
    res.json(logs);
  } catch (error) {
    logger.error('Tool audit log retrieval error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /audit/stats
 * @desc Get audit statistics
 * @access Private (admin only)
 */
router.get('/stats', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const { userId, toolName, startDate, endDate } = req.query;
    
    // Parse dates if provided
    const parsedStartDate = startDate ? new Date(startDate) : null;
    const parsedEndDate = endDate ? new Date(endDate) : null;
    
    const stats = await auditService.getAuditStats(
      userId,
      toolName,
      parsedStartDate,
      parsedEndDate
    );
    
    res.json(stats);
  } catch (error) {
    logger.error('Audit stats retrieval error:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @route GET /audit/user/:userId
 * @desc Get audit logs for a specific user (admin only)
 * @access Private (admin only)
 */
router.get('/user/:userId', authenticateJWT, requireRole('admin'), async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    
    const logs = await auditService.getUserAuditLogs(userId, limit, offset);
    
    res.json(logs);
  } catch (error) {
    logger.error('User audit log retrieval error:', error);
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
