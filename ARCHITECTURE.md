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
- **File Storage**: Local filesystem (default) or Google Drive (per-user opt-in)
- **Google Drive**: `googleapis` + `google-auth-library` for Drive API v3
- **Error Tracking**: Sentry

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Authentication**: Keycloak (OAuth 2.0), with Google as Identity Provider
- **Cloud Storage**: Google Drive API v3 (per-user personal Drive)
- **Development**: Hot reload for both frontend and backend

## Monorepo Structure

```
renovator-platform/
├── packages/
│   ├── frontend/              # React application
│   │   ├── src/
│   │   │   ├── config/        # Environment configuration
│   │   │   ├── contexts/      # React contexts (AuthContext)
│   │   │   ├── hooks/         # Custom hooks (useGoogleDrive)
│   │   │   ├── utils/         # Utility functions (api.ts, currency.ts)
│   │   │   ├── components/    # UI components
│   │   │   ├── pages/         # Page components
│   │   │   ├── i18n/          # Internationalization (en, uk)
│   │   │   ├── App.tsx        # Root component
│   │   │   └── main.tsx       # Entry point
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── backend/               # Express API
│       ├── src/
│       │   ├── config/        # Environment and database configuration
│       │   ├── entities/      # TypeORM entities
│       │   ├── services/      # Business logic services
│       │   │   ├── AuthService.ts
│       │   │   ├── FileStorageService.ts       # Local file storage
│       │   │   ├── GoogleDriveAuthService.ts    # Google OAuth for Drive
│       │   │   ├── GoogleDriveStorageProvider.ts # Drive API operations
│       │   │   ├── StorageResolver.ts           # Routes local vs Drive
│       │   │   ├── TokenEncryptionService.ts    # AES-256-GCM token encryption
│       │   │   ├── DocumentService.ts
│       │   │   ├── PhotoService.ts
│       │   │   └── ...
│       │   ├── routes/        # API routes (auth, google, projects, documents, photos, ...)
│       │   ├── middleware/    # Express middleware (auth)
│       │   ├── migrations/    # TypeORM migrations
│       │   └── index.ts       # Entry point
│       ├── Dockerfile
│       └── package.json
│
├── keycloak/                  # Keycloak realm configuration
│   └── renovator-realm.json
├── docker-compose.yml         # Container orchestration
├── package.json               # Root workspace configuration
└── ARCHITECTURE.md
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

### Login via Keycloak (with Google as Identity Provider)

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
     │ 3. User authenticates (directly or via Google IdP)   │
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

### Google Drive Linking (Separate OAuth Flow)

Google Drive access uses a **separate, opt-in OAuth 2.0 consent flow**, distinct from Keycloak login. This requests only the `drive.file` scope for personal Drive access. The same Google Cloud project and OAuth client are reused, so users see the same app name.

Since users typically log in via Google through Keycloak, they already have an active Google session. The Drive consent flow passes `login_hint` (user's email) so Google skips account selection and only shows the Drive scope consent screen.

```
┌─────────┐                ┌──────────┐                ┌──────────┐
│ Browser │                │ Backend  │                │  Google  │
└────┬────┘                └────┬─────┘                └────┬─────┘
     │                          │                           │
     │ 1. Click "Connect Drive" │                           │
     ├─────────────────────────>│                           │
     │                          │                           │
     │ 2. Google consent URL    │                           │
     │   (with login_hint,      │                           │
     │    scope=drive.file,     │                           │
     │    access_type=offline)  │                           │
     │<─────────────────────────┤                           │
     │                          │                           │
     │ 3. User consents to      │                           │
     │    Drive access           │                           │
     ├──────────────────────────────────────────────────────>│
     │                          │                           │
     │ 4. Authorization code    │                           │
     │<──────────────────────────────────────────────────────┤
     │                          │                           │
     │ 5. Send code to backend  │                           │
     ├─────────────────────────>│                           │
     │                          │ 6. Exchange code          │
     │                          ├──────────────────────────>│
     │                          │                           │
     │                          │ 7. Access + Refresh tokens│
     │                          │<──────────────────────────┤
     │                          │                           │
     │                          │ 8. Encrypt & store tokens │
     │                          │    in user_google_drive_   │
     │                          │    tokens table            │
     │                          │                           │
     │ 9. Connection confirmed  │                           │
     │<─────────────────────────┤                           │
     │                          │                           │
```

## File Storage Architecture

The platform supports two storage backends for documents and photos:

### Storage Provider Pattern

```
┌──────────────────┐     ┌─────────────────────┐
│ DocumentService  │────>│   StorageResolver    │
│ PhotoService     │     │  (routing layer)     │
└──────────────────┘     └──────────┬───────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼                               ▼
         ┌──────────────────┐            ┌────────────────────┐
         │ FileStorageService│            │ GoogleDriveStorage  │
         │ (local filesystem)│            │ Provider (Drive API)│
         └──────────────────┘            └────────────────────┘
```

- **StorageResolver** checks if the user has linked Google Drive. If yes, routes to `GoogleDriveStorageProvider`; if no, routes to `FileStorageService`.
- Each `Document` record stores `storage_provider` (`local` | `google_drive`) and optionally `drive_file_id`, enabling correct retrieval regardless of backend.
- Existing local files remain accessible. New uploads go to Google Drive only when the user has opted in.

### Project Folder Mapping

When uploading to Google Drive:
1. Check `project_drive_folders` for an explicit folder mapping
2. If no mapping exists, auto-create `"Renovator - {Project Name}"` in Drive root
3. Save the mapping for reuse on subsequent uploads

### Token Security

- Google OAuth refresh tokens are encrypted at rest using AES-256-GCM (`TokenEncryptionService`)
- Access tokens are auto-refreshed when expired
- Tokens never reach the frontend; the backend proxies all Drive file operations
- Disconnect revokes the Google token and permanently deletes stored credentials

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

- **Authentication**: OAuth 2.0 with Keycloak (Google as Identity Provider)
- **Authorization**: Token-based access control via Keycloak access tokens
- **Google Drive Tokens**: Encrypted at rest (AES-256-GCM), auto-refreshed, never exposed to frontend
- **Data Encryption**: TLS for data in transit
- **Environment Variables**: Sensitive data in `.env` files (not committed)
- **CORS**: Configured for frontend-backend communication
- **File Access**: Backend proxies all Google Drive file operations; no direct Drive URLs exposed to clients

## Next Steps

See `.kiro/specs/renovator-project-platform/tasks.md` for the full implementation roadmap.
Current focus: Tasks 24-28 (Google Drive Integration).
