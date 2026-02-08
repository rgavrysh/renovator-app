# Architecture Overview

## System Architecture

The Renovator Platform follows a three-tier architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│                                                          │
│  React + TypeScript + Tailwind CSS                      │
│  - Component-based UI                                   │
│  - OAuth 2.0 authentication flow                        │
│  - Responsive design                                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  Application Layer                       │
│                                                          │
│  Express + TypeScript                                   │
│  - RESTful API endpoints                                │
│  - Business logic services                              │
│  - OAuth 2.0 token validation                           │
│  - Sentry error tracking                                │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                     Data Layer                           │
│                                                          │
│  PostgreSQL + TypeORM                                   │
│  - Relational data storage                              │
│  - Entity relationships                                 │
│  - Database migrations                                  │
└─────────────────────────────────────────────────────────┘
```

## Technology Stack

### Frontend
- **Framework**: React 18
- **Language**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router
- **HTTP Client**: Axios
- **Error Tracking**: Sentry

### Backend
- **Runtime**: Node.js 20
- **Framework**: Express
- **Language**: TypeScript
- **ORM**: TypeORM
- **Database**: PostgreSQL 16
- **Error Tracking**: Sentry

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Authentication**: Keycloak (OAuth 2.0)
- **Development**: Hot reload for both frontend and backend

## Monorepo Structure

```
renovator-platform/
├── packages/
│   ├── frontend/              # React application
│   │   ├── src/
│   │   │   ├── config/        # Environment configuration
│   │   │   ├── utils/         # Utility functions
│   │   │   ├── components/    # React components (to be added)
│   │   │   ├── pages/         # Page components (to be added)
│   │   │   ├── services/      # API services (to be added)
│   │   │   ├── App.tsx        # Root component
│   │   │   └── main.tsx       # Entry point
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── backend/               # Express API
│       ├── src/
│       │   ├── config/        # Environment configuration
│       │   ├── utils/         # Utility functions
│       │   ├── entities/      # TypeORM entities (to be added)
│       │   ├── services/      # Business logic (to be added)
│       │   ├── routes/        # API routes (to be added)
│       │   ├── middleware/    # Express middleware (to be added)
│       │   └── index.ts       # Entry point
│       ├── Dockerfile
│       └── package.json
│
├── scripts/                   # Setup and utility scripts
├── docker-compose.yml         # Container orchestration
├── package.json               # Root workspace configuration
└── README.md
```

## Docker Services

### PostgreSQL
- **Image**: postgres:16-alpine
- **Port**: 5432
- **Purpose**: Primary database for application data
- **Volume**: Persistent storage for database files

### Keycloak
- **Image**: quay.io/keycloak/keycloak:23.0
- **Port**: 8080
- **Purpose**: OAuth 2.0 Identity Provider
- **Database**: Uses PostgreSQL for configuration storage

### Backend
- **Build**: Custom Node.js image
- **Port**: 4000
- **Purpose**: RESTful API server
- **Dependencies**: PostgreSQL, Keycloak

### Frontend
- **Build**: Custom Node.js image
- **Port**: 3000
- **Purpose**: React development server
- **Dependencies**: Backend API

## Authentication Flow

```
┌─────────┐                ┌──────────┐                ┌──────────┐
│ Browser │                │ Backend  │                │ Keycloak │
└────┬────┘                └────┬─────┘                └────┬─────┘
     │                          │                           │
     │ 1. Request login         │                           │
     ├─────────────────────────>│                           │
     │                          │                           │
     │ 2. Redirect to Keycloak  │                           │
     │<─────────────────────────┤                           │
     │                          │                           │
     │ 3. User authenticates    │                           │
     ├──────────────────────────────────────────────────────>│
     │                          │                           │
     │ 4. Authorization code    │                           │
     │<──────────────────────────────────────────────────────┤
     │                          │                           │
     │ 5. Exchange code         │                           │
     ├─────────────────────────>│                           │
     │                          │ 6. Validate code          │
     │                          ├──────────────────────────>│
     │                          │                           │
     │                          │ 7. Access + Refresh tokens│
     │                          │<──────────────────────────┤
     │                          │                           │
     │ 8. Session + tokens      │                           │
     │<─────────────────────────┤                           │
     │                          │                           │
```

## Configuration Management

### Environment Variables

Configuration is managed through environment variables at three levels:

1. **Root `.env`**: Docker Compose configuration
2. **Backend `.env`**: Backend-specific configuration
3. **Frontend `.env`**: Frontend-specific configuration (prefixed with `VITE_`)

### Configuration Files

- **TypeScript**: Centralized config objects in `src/config/index.ts`
- **Type Safety**: Full TypeScript support for configuration values
- **Validation**: Runtime validation of required configuration

## Error Tracking

Sentry is integrated at both frontend and backend:

- **Backend**: Captures server errors, API failures, database issues
- **Frontend**: Captures client errors, React errors, network failures
- **Context**: Includes user information, request details, and environment

## Development Workflow

1. **Local Development**: Hot reload for both frontend and backend
2. **Docker Development**: Full stack with all services
3. **Testing**: Vitest for unit and integration tests
4. **Building**: TypeScript compilation and Vite bundling

## Security Considerations

- **Authentication**: OAuth 2.0 with Keycloak
- **Authorization**: Token-based access control
- **Data Encryption**: TLS for data in transit
- **Environment Variables**: Sensitive data in `.env` files (not committed)
- **CORS**: Configured for frontend-backend communication

## Next Steps

See `tasks.md` for the implementation roadmap:
- Task 2: Database Schema and TypeORM Setup
- Task 3: OAuth 2.0 Authentication Setup
- Task 4+: Feature implementation
