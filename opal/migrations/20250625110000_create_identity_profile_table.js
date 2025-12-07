/**
 * Migration for creating the identity_profile table.
 */
exports.up = function(knex) {
  return knex.schema.createTable('identity_profile', function(table) {
    table.increments('id').primary();
    table.integer('user_id').unsigned().notNullable().references('id').inTable('users').onDelete('CASCADE');
    
    // Biographical information
    table.json('biographical').notNullable().defaultTo(JSON.stringify({
      name: '',
      preferred_name: '',
      pronouns: '',
      age: null,
      location: '',
      cultural_background: '',
      spiritual_orientation: '',
      education_level: '',
      occupation: '',
      identity_labels: []
    }));
    
    // Personality profile
    table.json('personality_profile').notNullable().defaultTo(JSON.stringify({
      big_five: {
        openness: null,
        conscientiousness: null,
        extraversion: null,
        agreeableness: null,
        neuroticism: null
      },
      cognitive_style: {
        thinking_mode: null,
        decision_making: null,
        response_tendency: null
      },
      emotional_regulation: {
        expression: null,
        coping_style: null,
        volatility: null
      },
      attachment_style: null,
      locus_of_control: null,
      motivational_orientation: [],
      self_concept: {
        self_esteem: null,
        identity_coherence: null,
        core_narratives: []
      }
    }));
    
    // Meta information
    table.json('meta').notNullable().defaultTo(JSON.stringify({
      confidence_levels: {
        big_five: null,
        attachment_style: null,
        motivational_orientation: null
      },
      inference_sources: [],
      last_updated: new Date().toISOString()
    }));
    
    table.timestamps(true, true);
    
    // Add a unique constraint to ensure one profile per user
    table.unique(['user_id']);
  });
};

/**
 * Migration for dropping the identity_profile table.
 */
exports.down = function(knex) {
  return knex.schema.dropTable('identity_profile');
};
