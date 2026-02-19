/**
 * Create AI personas table for storing user-specific AI personas
 */

exports.up = async function(knex) {
  await knex.schema.createTable('ai_personas', table => {
    table.string('id', 36).primary();
    table.string('user_id', 36).references('id').inTable('users').onDelete('CASCADE');
    table.string('name').notNullable();
    table.text('description').notNullable();
    table.string('icon').notNullable();
    table.text('prompt').notNullable();
    table.string('accent_color').notNullable();
    table.boolean('is_default').defaultTo(false);
    table.timestamps(true, true);
    
    // Index for faster lookups by user
    table.index('user_id');
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('ai_personas');
};
