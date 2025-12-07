/**
 * Migration for creating the module_progress table.
 */
exports.up = function(knex) {
  return knex.schema.createTable('module_progress', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('module_id').notNullable();
    table.integer('current_step').defaultTo(0);
    table.boolean('is_complete').defaultTo(false);
    table.json('entries').notNullable(); // Store step entries as JSON
    table.timestamps(true, true);
    
    // Add a unique constraint to ensure one progress record per user per module
    table.unique(['user_id', 'module_id']);
  });
};

/**
 * Migration for dropping the module_progress table.
 */
exports.down = function(knex) {
  return knex.schema.dropTable('module_progress');
};
