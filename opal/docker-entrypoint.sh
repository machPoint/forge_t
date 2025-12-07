#!/bin/sh
set -e

# Ensure data directory permissions
chmod -R 755 /data

echo "Running database migrations..."
npx knex migrate:latest

echo "Running database seeds..."
npx knex seed:run

echo "Starting OPAL server..."
exec node src/server.js
