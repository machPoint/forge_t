/**
 * Migration for adding pinned field to journal_entries table.
 */
exports.up = function(knex) {
  return knex.schema.alterTable('journal_entries', function(table) {
    table.boolean('pinned').defaultTo(false);
  });
};

/**
 * Migration for removing pinned field from journal_entries table.
 */
exports.down = function(knex) {
  return knex.schema.alterTable('journal_entries', function(table) {
    table.dropColumn('pinned');
  });
};
