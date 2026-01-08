/**
 * Migration to fix journal_entries user_id column type
 * Changes from integer to string(36) to match users table UUID format
 */
exports.up = async function(knex) {
  // Check if the table exists
  const hasTable = await knex.schema.hasTable('journal_entries');
  
  if (hasTable) {
    // SQLite doesn't support ALTER COLUMN, so we need to recreate the table
    // First, backup existing data
    const existingEntries = await knex('journal_entries').select('*');
    
    // Drop the old table
    await knex.schema.dropTable('journal_entries');
    
    // Create the new table with correct user_id type
    await knex.schema.createTable('journal_entries', function(table) {
      table.increments('id').primary();
      table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('title').notNullable();
      table.text('content').notNullable();
      table.string('persona_id');
      table.text('feedback');
      table.string('module_id');
      table.string('module_step');
      table.boolean('is_complete').defaultTo(false);
      table.boolean('pinned').defaultTo(false);
      table.boolean('starred').defaultTo(false);
      table.boolean('archived').defaultTo(false);
      table.timestamps(true, true);
    });
    
    // Restore data if any existed (converting user_id to string if needed)
    if (existingEntries.length > 0) {
      for (const entry of existingEntries) {
        await knex('journal_entries').insert({
          ...entry,
          id: undefined, // Let SQLite auto-generate new IDs
          user_id: String(entry.user_id)
        });
      }
    }
  }
};

exports.down = async function(knex) {
  // This migration is a fix, rolling back would reintroduce the bug
  // So we just leave the table as-is
};
