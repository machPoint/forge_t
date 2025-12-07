/**
 * Migration to add is_starred and is_archived columns to the memories table
 */
exports.up = function(knex) {
  return knex.schema.alterTable('memories', function(table) {
    // Add is_starred column with default value of false
    table.boolean('is_starred').defaultTo(false);
    
    // Add is_archived column with default value of false
    table.boolean('is_archived').defaultTo(false);
  });
};

/**
 * Migration to roll back the column additions
 */
exports.down = function(knex) {
  return knex.schema.alterTable('memories', function(table) {
    // Drop the columns if rolling back
    table.dropColumn('is_starred');
    table.dropColumn('is_archived');
  });
};
