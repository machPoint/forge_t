const path = require('path');
const knex = require('knex');

// Adjust the path if your DB is elsewhere
const dbPath = path.join(__dirname, '../../database/opal.sqlite3');

const db = knex({
  client: 'sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
});

async function inspectIdentityProfile() {
  try {
    const rows = await db('identity_profile').select('*');
    if (rows.length === 0) {
      console.log('No identity_profile records found.');
    } else {
      console.log('identity_profile table contents:');
      rows.forEach((row, idx) => {
        console.log(`Row ${idx + 1}:`, row);
      });
    }
  } catch (err) {
    console.error('Error querying identity_profile:', err);
  } finally {
    await db.destroy();
  }
}

inspectIdentityProfile(); 