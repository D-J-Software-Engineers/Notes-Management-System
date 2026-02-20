#!/bin/bash

echo "Starting Notes Management System Setup..."

# 1. Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file from template..."
    cp .env.example .env 2>/dev/null || cat <<EOT >> .env
PORT=5000
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_NAME=notes_management
DB_USER=notes_admin
DB_PASSWORD=secure_password_123
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_EXPIRE=7d
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
ADMIN_EMAIL=admin@school.com
ADMIN_PASSWORD=Admin@123
EOT
    echo ".env file created."
fi

# 2. Check for Docker
DOCKER_CMD=""
if command -v docker-compose &> /dev/null; then
    DOCKER_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_CMD="docker compose"
fi

if [ -n "$DOCKER_CMD" ]; then
    echo "Docker detected ($DOCKER_CMD)! Starting containers..."
    $DOCKER_CMD up -d --build
    echo "System is starting in Docker."
    echo "Access it at: http://localhost:5000"
    echo "Note: The admin account will be seeded automatically."
else
    echo "Docker Compose not found. Falling back to manual setup..."
    
    # Check for npm
    if ! command -v npm &> /dev/null; then
        echo "Error: npm is not installed. Please install Node.js first."
        exit 1
    fi

    echo "Installing dependencies..."
    npm install

    echo "Setting up database (Requires manual PostgreSQL setup)..."
    echo "Please ensure PostgreSQL is running and credentials in .env match."
    
    echo "Seeding admin account..."
    npm run seed

    echo "Manual setup complete."
    echo "Start the app with: npm run dev"
fi
