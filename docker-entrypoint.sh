#!/bin/sh

# Wait for database to be ready (though depends_on with healthcheck handles this, 
# it's good practice to have some internal resilience)
echo "Waiting for database..."

# Run migrations/seeding
echo "Ensuring admin account exists..."
npm run seed

# Start the application
echo "Starting server..."
npm start
