# Quick Start Guide

## Initial Setup

Run the setup script to configure your environment:

```bash
# Make the script executable (if not already)
chmod +x scripts/setup.sh

# Run the setup
./scripts/setup.sh
```

Or manually:

```bash
# 1. Copy environment files
cp .env.example .env
cp packages/backend/.env.example packages/backend/.env
cp packages/frontend/.env.example packages/frontend/.env

# 2. Install dependencies
npm install
```

## Development Options

### Option 1: Docker (Recommended)

Start all services with Docker Compose:

```bash
# Start all containers
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

Access:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Keycloak: http://localhost:8080
- PostgreSQL: localhost:5432

### Option 2: Local Development

```bash
# Start both frontend and backend
npm run dev

# Or start separately
npm run dev:backend  # Backend on port 4000
npm run dev:frontend # Frontend on port 3000
```

Note: You'll need to run PostgreSQL and Keycloak separately if not using Docker.

## Keycloak Configuration

1. Access Keycloak admin console: http://localhost:8080
2. Login with admin credentials (from `.env`, default: admin/admin123)
3. Create a new realm: `renovator`
4. Create a client: `renovator-app`
   - Client Protocol: `openid-connect`
   - Access Type: `confidential`
   - Valid Redirect URIs: `http://localhost:3000/*`
   - Web Origins: `http://localhost:3000`
5. Go to Credentials tab and copy the Client Secret
6. Update `KEYCLOAK_CLIENT_SECRET` in both `.env` files

## Sentry Configuration (Optional)

1. Create account at https://sentry.io
2. Create projects for frontend and backend
3. Add DSN values to `.env` files:
   - `SENTRY_DSN` (backend)
   - `VITE_SENTRY_DSN` (frontend)

## Verify Setup

```bash
# Check backend health
curl http://localhost:4000/health

# Expected response:
# {"status":"ok","timestamp":"..."}
```

## Useful Commands

```bash
# Using Makefile
make help          # Show all available commands
make install       # Install dependencies
make dev           # Start development servers
make docker-up     # Start Docker containers
make docker-down   # Stop Docker containers
make docker-logs   # View container logs
make test          # Run tests
make clean         # Clean build artifacts

# Using npm
npm run dev        # Start both frontend and backend
npm run build      # Build all workspaces
npm run test       # Run all tests
```

## Troubleshooting

### Port Already in Use

If ports 3000, 4000, 5432, or 8080 are already in use, update the port numbers in `.env` and `docker-compose.yml`.

### Docker Issues

```bash
# Rebuild containers
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# View container logs
docker-compose logs backend
docker-compose logs frontend
```

### Database Connection Issues

Ensure PostgreSQL is running and credentials in `.env` match the database configuration.

## Next Steps

After setup is complete:

1. Review the spec documents in `.kiro/specs/renovator-project-platform/`
2. Proceed to Task 2: Database Schema and TypeORM Setup
3. Follow the implementation plan in `tasks.md`
