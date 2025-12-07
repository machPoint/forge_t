/**
 * Database Persistence Fix Script
 * 
 * This script is used during server startup to ensure database persistence
 * and fix any issues with the database structure or data.
 */

const logger = require('../../src/logger');

/**
 * Main function to fix database persistence issues
 * @param {Object} db - Database connection object
 */
async function fixDatabasePersistence(db) {
  try {
    logger.info('Running database persistence fixes...');
    
    // Check if the memories table exists, create it if not
    const hasMemoriesTable = await db.schema.hasTable('memories');
    if (!hasMemoriesTable) {
      logger.info('Creating memories table...');
      await db.schema.createTable('memories', table => {
        table.increments('id').primary();
        table.integer('user_id').notNullable();
        table.string('title').notNullable();
        table.text('text').notNullable();
        table.string('type').defaultTo('summary');
        table.text('tags');
        table.string('source');
        table.string('source_entry_id');
        table.text('metadata');
        table.text('embedding');
        table.timestamps(true, true);
      });
      logger.info('Memories table created successfully');
    }
    
    logger.info('Database persistence fixes completed');
    return true;
  } catch (error) {
    logger.error('Error fixing database persistence:', error);
    return false;
  }
}

module.exports = fixDatabasePersistence;
