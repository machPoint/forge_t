/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('memories', table => {
    // Drop the problematic column first
    table.dropColumn('title');
  }).then(() => {
    return knex.schema.alterTable('memories', table => {
      // Add it back, ensuring it's the correct type
      table.string('title').notNullable();
    });
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('memories', table => {
    // Reverting this is tricky, but we can attempt to restore a previous state
    // For simplicity, we'll just drop and recreate it as nullable
    table.dropColumn('title');
  }).then(() => {
    return knex.schema.alterTable('memories', table => {
      table.string('title').nullable();
    });
  });
};
