/**
 * Migration for creating the journal_entries table.
 */
exports.up = function(knex) {
  return knex.schema.createTable('journal_entries', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('content').notNullable();
    table.string('persona_id');
    table.text('feedback');
    table.string('module_id');
    table.string('module_step');
    table.boolean('is_complete').defaultTo(false);
    table.timestamps(true, true);
  });
};

/**
 * Migration for dropping the journal_entries table.
 */
exports.down = function(knex) {
  return knex.schema.dropTable('journal_entries');
}; 