#!/bin/bash

set -e

echo "🚀 Setting up Renovator Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Copy environment files if they don't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ Created .env file"
else
    echo "ℹ️  .env file already exists"
fi

if [ ! -f packages/backend/.env ]; then
    echo "📝 Creating backend .env file..."
    cp packages/backend/.env.example packages/backend/.env
    echo "✅ Created backend .env file"
else
    echo "ℹ️  Backend .env file already exists"
fi

if [ ! -f packages/frontend/.env ]; then
    echo "📝 Creating frontend .env file..."
    cp packages/frontend/.env.example packages/frontend/.env
    echo "✅ Created frontend .env file"
else
    echo "ℹ️  Frontend .env file already exists"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Review and update .env files with your configuration"
echo "2. Start the development environment:"
echo "   - With Docker: make docker-up"
echo "   - Without Docker: npm run dev"
echo ""
echo "3. Configure Keycloak:"
echo "   - Access http://localhost:8080"
echo "   - Login with admin credentials from .env"
echo "   - Create 'renovator' realm and 'renovator-app' client"
echo "   - Update KEYCLOAK_CLIENT_SECRET in .env files"
echo ""
echo "For more information, see README.md"
