/**
 * Migration for creating notes table.
 */
exports.up = function(knex) {
  return knex.schema.createTable('notes', function(table) {
    table.increments('id').primary();
    table.string('user_id', 36).notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('title').notNullable();
    table.text('content').notNullable();
    table.json('tags').defaultTo('[]');
    table.boolean('is_pinned').defaultTo(false);
    table.boolean('is_archived').defaultTo(false);
    table.timestamps(true, true);
  });
};

/**
 * Migration for removing notes table.
 */
exports.down = function(knex) {
  return knex.schema.dropTable('notes');
};

