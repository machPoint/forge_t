/**
 * Migration for adding starred and archived fields to journal_entries table.
 */
exports.up = function(knex) {
  return knex.schema.alterTable('journal_entries', function(table) {
    table.boolean('starred').defaultTo(false);
    table.boolean('archived').defaultTo(false);
  });
};

/**
 * Migration for removing starred and archived fields from journal_entries table.
 */
exports.down = function(knex) {
  return knex.schema.alterTable('journal_entries', function(table) {
    table.dropColumn('starred');
    table.dropColumn('archived');
  });
};


