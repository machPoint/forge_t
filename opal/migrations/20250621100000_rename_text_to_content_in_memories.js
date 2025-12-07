/**
 * Migration to rename the 'text' column to 'content' in the 'memories' table.
 */
exports.up = function(knex) {
  return knex.schema.raw('PRAGMA table_info(memories)').
  then(function(info) {
    // Check if 'text' column exists
    const textColumnExists = info.some(column => column.name === 'text');
    
    if (textColumnExists) {
      return knex.schema.alterTable('memories', function(table) {
        // Rename the 'text' column to 'content'.
        table.renameColumn('text', 'content');
      });
    } else {
      console.log('Column "text" does not exist in "memories" table, skipping rename operation');
      return Promise.resolve();
    }
  });
};

/**
 * Migration to roll back the column rename.
 */
exports.down = function(knex) {
  return knex.schema.alterTable('memories', function(table) {
    // Rename 'content' back to 'text'.
    table.renameColumn('content', 'text');
  });
}; 