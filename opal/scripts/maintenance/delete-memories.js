/**
 * Maintenance script to delete all memories from the database
 * Run with: node scripts/maintenance/delete-memories.js
 */

const db = require('../../src/config/database');
const logger = require('../../src/logger');

async function deleteAllMemories() {
  try {
    logger.info('Starting deletion of all memories...');
    
    // Count memories before deletion
    const [{ count: beforeCount }] = await db('memories').count('* as count');
    logger.info(`Found ${beforeCount} memories in the database`);
    
    if (beforeCount === 0) {
      logger.info('No memories to delete. Exiting.');
      process.exit(0);
    }
    
    // Delete all memories
    const deleted = await db('memories').del();
    
    logger.info(`Successfully deleted ${deleted} memories from the database`);
    
    // Verify deletion
    const [{ count: afterCount }] = await db('memories').count('* as count');
    logger.info(`Verification: ${afterCount} memories remain in the database`);
    
    process.exit(0);
  } catch (error) {
    logger.error('Error deleting memories:', error);
    process.exit(1);
  }
}

// Run the deletion
deleteAllMemories();
