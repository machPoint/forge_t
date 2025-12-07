/**
 * Fix user ID script
 * This script updates users with null IDs to have valid UUIDs
 */

const { v4: uuidv4 } = require('uuid');
const db = require('../../src/config/database');
const logger = require('../../src/logger');

async function fixUserIds() {
  try {
    logger.info('Starting user ID fix script...');
    
    // Find users with null IDs
    const usersWithNullIds = await db('users')
      .whereNull('id')
      .select('username', 'email');
    
    logger.info(`Found ${usersWithNullIds.length} users with null IDs`);
    
    // Update each user with a new UUID
    for (const user of usersWithNullIds) {
      const newId = uuidv4();
      logger.info(`Updating user ${user.username} (${user.email}) with new ID: ${newId}`);
      
      await db('users')
        .whereNull('id')
        .where({ username: user.username })
        .update({ id: newId });
      
      logger.info(`Updated user ${user.username}`);
    }
    
    logger.info('User ID fix completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Error fixing user IDs:', error);
    process.exit(1);
  }
}

// Run the fix
fixUserIds();
