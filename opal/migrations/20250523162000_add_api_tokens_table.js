/**
 * Migration to create the api_tokens table
 */
exports.up = function(knex) {
  return knex.schema.hasTable('api_tokens').then(function(exists) {
    if (!exists) {
      return knex.schema.createTable('api_tokens', function(table) {
        table.uuid('id').primary().defaultTo(knex.raw('(uuid_generate_v4())'));
        table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
        table.string('name').notNullable();
        table.string('token').notNullable().unique();
        table.jsonb('permissions').notNullable().defaultTo('{}');
        table.timestamp('expires_at').nullable();
        table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
        table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());
        
        // Add index on token for faster lookups
        table.index(['token'], 'idx_api_tokens_token');
        // Add index on user_id for faster queries by user
        table.index(['user_id'], 'idx_api_tokens_user_id');
      });
    } else {
      console.log('api_tokens table already exists, skipping creation');
      return Promise.resolve();
    }
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('api_tokens');
};
