/**
 * Migration to add type, tags, source, and source_entry_id columns to memories table
 */

exports.up = async function(knex) {
  await knex.schema.alterTable('memories', table => {
    table.string('type').defaultTo('summary'); // 'summary' or 'full'
    table.text('tags').defaultTo('[]'); // JSON-encoded array
    table.string('source').nullable(); // e.g., 'journal', 'note'
    table.string('source_entry_id').nullable(); // Link to original entry
  });
};

exports.down = async function(knex) {
  await knex.schema.alterTable('memories', table => {
    table.dropColumn('type');
    table.dropColumn('tags');
    table.dropColumn('source');
    table.dropColumn('source_entry_id');
  });
};
