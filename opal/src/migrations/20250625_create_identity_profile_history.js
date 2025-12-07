/**
 * Migration to create the identity_profile_history table for tracking changes to the identity profile
 */
exports.up = function(knex) {
  return knex.schema.createTable('identity_profile_history', function(table) {
    table.increments('id').primary();
    table.string('user_id').notNullable();
    table.text('profile_data').notNullable(); // JSON stringified profile data
    table.string('section_changed').notNullable(); // 'biographical', 'personality_profile', or 'all'
    table.text('change_description').nullable();
    table.timestamp('created_at').defaultTo(knex.fn.now());
    
    // Foreign key to user table
    table.foreign('user_id').references('id').inTable('users');
    
    // Index for faster lookups
    table.index('user_id');
    table.index('created_at');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('identity_profile_history');
};
