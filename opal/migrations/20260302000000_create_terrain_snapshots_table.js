/**
 * Create terrain_snapshots table for TERRAIN mobile app integration
 * Stores behavioral health data snapshots imported from TERRAIN
 */

exports.up = async function(knex) {
  await knex.schema.createTable('terrain_snapshots', table => {
    table.increments('id').primary();
    table.string('user_id', 36).references('id').inTable('users').onDelete('CASCADE');
    table.timestamp('exported_at').notNullable(); // When TERRAIN exported the data
    table.timestamp('imported_at').notNullable(); // When Forge imported it
    table.text('snapshot').notNullable(); // Full JSON blob
    table.timestamps(true, true);
    
    // Index for quick lookup of latest snapshot per user
    table.index(['user_id', 'exported_at']);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('terrain_snapshots');
};
