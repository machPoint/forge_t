# Database Scripts

This directory contains scripts for managing, verifying, and troubleshooting the OPAL server database.

## Database Check Scripts

- `check-api-tokens-schema.js` - Verifies the API tokens table schema
- `check-db-schema.js` - Checks the overall database schema
- `check-db-state.js` - Examines the current state of the database
- `check-db.js` - Basic database connectivity test
- `check-knex-db.js` - Tests Knex.js database connection
- `check-sqlite-schema.js` - Validates SQLite schema structure
- `check-token-constraints.js` - Verifies token table constraints
- `check-tokens-data.js` - Examines token data integrity
- `check-tokens-simple.js` - Simple token validation
- `check-tokens-table.js` - Checks token table structure

## Database Utility Scripts

- `db.js` - Database connection utility
- `direct-db-check.js` - Direct database check bypassing ORM
- `direct-query.js` - Executes direct SQL queries
- `dump-db.js` - Creates a database dump for backup
- `verify-db.js` - Comprehensive database verification
- `verify-fix.js` - Verifies database fixes

## Usage

These scripts are primarily used for database maintenance and troubleshooting. Most can be run with Node.js:

```bash
node scripts/database/script-name.js
```

For specific usage instructions, refer to the comments at the top of each script.
