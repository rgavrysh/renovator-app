# Renovator Project Management Platform

A comprehensive project management platform designed for independent renovators and small interior building companies.

## Architecture

This is a monorepo containing:
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + TypeORM
- **Database**: PostgreSQL
- **Authentication**: OAuth 2.0 with Keycloak
- **Monitoring**: Sentry for error tracking

## Prerequisites

- Node.js 20+
- Docker and Docker Compose
- npm or yarn

## Getting Started

### 1. Clone and Install Dependencies

```bash
# Install dependencies for all workspaces
npm install
```

### 2. Environment Configuration

Copy the example environment files and configure them:

```bash
# Root environment (for Docker Compose)
cp .env.example .env

# Backend environment
cp packages/backend/.env.example packages/backend/.env

# Frontend environment
cp packages/frontend/.env.example packages/frontend/.env
```

Edit the `.env` files with your configuration values.

### 3. Start with Docker Compose

```bash
# Start all services (PostgreSQL, Keycloak, Backend, Frontend)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

Services will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:4000
- Keycloak: http://localhost:8080
- PostgreSQL: localhost:5432

### 4. Local Development (without Docker)

```bash
# Start backend and frontend in development mode
npm run dev

# Or start them separately
npm run dev:backend
npm run dev:frontend
```

## Keycloak Setup

After starting Keycloak for the first time:

1. Access Keycloak admin console at http://localhost:8080
2. Login with credentials from `.env` (default: admin/admin123)
3. Create a new realm called "renovator"
4. Create a client called "renovator-app"
5. Configure the client:
   - Client Protocol: openid-connect
   - Access Type: confidential
   - Valid Redirect URIs: http://localhost:3000/*
   - Web Origins: http://localhost:3000
6. Copy the client secret to your `.env` files

## Project Structure

```
renovator-platform/
├── packages/
│   ├── frontend/          # React frontend application
│   │   ├── src/
│   │   │   ├── config/    # Configuration management
│   │   │   ├── utils/     # Utility functions (Sentry, etc.)
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── Dockerfile
│   │   └── package.json
│   └── backend/           # Express backend API
│       ├── src/
│       │   ├── config/    # Configuration management
│       │   ├── utils/     # Utility functions (Sentry, etc.)
│       │   └── index.ts
│       ├── Dockerfile
│       └── package.json
├── docker-compose.yml     # Docker orchestration
├── package.json           # Root package.json (workspaces)
└── README.md
```

## Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build all workspaces
- `npm run test` - Run tests in all workspaces

### Frontend (packages/frontend)
- `npm run dev` - Start Vite dev server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run test` - Run tests

### Backend (packages/backend)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript
- `npm run start` - Start production server
- `npm run test` - Run tests

## Sentry Configuration

To enable error tracking:

1. Create a Sentry account at https://sentry.io
2. Create projects for frontend and backend
3. Add the DSN values to your `.env` files:
   - `SENTRY_DSN` for backend
   - `VITE_SENTRY_DSN` for frontend

## Database Migrations

Database migrations will be handled by TypeORM (to be configured in Task 2).

## Contributing

This project follows the spec-driven development methodology. See `.kiro/specs/renovator-project-platform/` for requirements, design, and tasks.

## License

Private - All rights reserved
