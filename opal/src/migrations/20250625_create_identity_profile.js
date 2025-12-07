/**
 * Migration to create the identity_profile table for storing user identity profiles
 */
exports.up = function(knex) {
  return knex.schema.createTable('identity_profile', function(table) {
    table.increments('id').primary();
    table.string('user_id').notNullable().unique(); // Each user has only one profile
    table.text('profile_data').notNullable(); // JSON stringified profile data
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Foreign key to user table
    table.foreign('user_id').references('id').inTable('users');
    
    // Index for faster lookups
    table.index('user_id');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('identity_profile');
};
