/**
 * Delete user script
 * This script deletes a user by username
 */

const db = require('../../src/config/database');
const logger = require('../../src/logger');

// Get username from command line arguments
const username = process.argv[2];

if (!username) {
  console.error('Please provide a username to delete');
  console.error('Usage: node delete-user.js <username>');
  process.exit(1);
}

async function deleteUser(username) {
  try {
    logger.info(`Starting user deletion for username: ${username}`);
    
    // Find user first to confirm it exists
    const user = await db('users')
      .where({ username })
      .first();
    
    if (!user) {
      logger.error(`User not found: ${username}`);
      process.exit(1);
    }
    
    logger.info(`Found user: ${username} (${user.email}), ID: ${user.id || 'null'}`);
    
    // Delete user's sessions
    const deletedSessions = await db('sessions')
      .where({ user_id: user.id })
      .del();
    
    logger.info(`Deleted ${deletedSessions} sessions for user ${username}`);
    
    // Delete user's journal entries
    const deletedJournalEntries = await db('journal_entries')
      .where({ user_id: user.id })
      .del();
    
    logger.info(`Deleted ${deletedJournalEntries} journal entries for user ${username}`);
    
    // Delete user's memories
    const deletedMemories = await db('memories')
      .where({ user_id: user.id })
      .del();
    
    logger.info(`Deleted ${deletedMemories} memories for user ${username}`);
    
    // Delete the user
    await db('users')
      .where({ username })
      .del();
    
    logger.info(`Successfully deleted user: ${username}`);
    process.exit(0);
  } catch (error) {
    logger.error('Error deleting user:', error);
    process.exit(1);
  }
}

// Run the deletion
deleteUser(username);
