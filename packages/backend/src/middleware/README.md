# Authentication Middleware

This directory contains Express middleware for handling authentication in the Renovator Project Management Platform.

## Overview

The authentication middleware validates OAuth 2.0 access tokens and attaches authenticated user information to Express requests.

## Middleware Functions

### `authenticate`

Required authentication middleware that validates access tokens and rejects requests without valid authentication.

**Usage:**
```typescript
import { authenticate } from './middleware';

// Protect a single route
app.get('/api/projects', authenticate, (req, res) => {
  // req.user and req.userId are available here
  res.json({ projects: [] });
});

// Protect multiple routes
const router = express.Router();
router.use(authenticate); // All routes in this router require authentication
router.get('/projects', (req, res) => { /* ... */ });
router.post('/projects', (req, res) => { /* ... */ });
```

**Behavior:**
- Extracts Bearer token from `Authorization` header
- Validates token with Keycloak
- Fetches user from database
- Attaches `user` and `userId` to request object
- Returns 401 if authentication fails

**Error Responses:**
- `401` - No authorization header provided
- `401` - Invalid authorization header format
- `401` - Invalid or expired access token
- `401` - User not found
- `401` - Authentication failed (general error)

### `optionalAuthenticate`

Optional authentication middleware that attempts to authenticate but doesn't fail if no token is provided.

**Usage:**
```typescript
import { optionalAuthenticate } from './middleware';

// Route that works for both authenticated and unauthenticated users
app.get('/api/public-data', optionalAuthenticate, (req, res) => {
  if (req.user) {
    // User is authenticated, return personalized data
    res.json({ data: 'personalized', user: req.user });
  } else {
    // User is not authenticated, return public data
    res.json({ data: 'public' });
  }
});
```

**Behavior:**
- Attempts to extract and validate Bearer token
- If successful, attaches `user` and `userId` to request
- If unsuccessful or no token provided, continues without error
- Never returns 401 errors

## Request Extensions

The middleware extends the Express `Request` type with the following properties:

```typescript
interface Request {
  user?: User;      // Full user object from database
  userId?: string;  // User ID for quick access
}
```

## Token Format

The middleware expects tokens in the standard Bearer token format:

```
Authorization: Bearer <access_token>
```

## Example Protected Route

```typescript
import express from 'express';
import { authenticate } from './middleware';

const app = express();

// Public route - no authentication required
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Protected route - authentication required
app.get('/api/me', authenticate, (req, res) => {
  res.json({
    id: req.userId,
    email: req.user!.email,
    name: `${req.user!.firstName} ${req.user!.lastName}`,
  });
});

// Protected routes group
const projectRouter = express.Router();
projectRouter.use(authenticate); // All routes require authentication

projectRouter.get('/', (req, res) => {
  // Get projects for authenticated user
  res.json({ projects: [], userId: req.userId });
});

projectRouter.post('/', (req, res) => {
  // Create project for authenticated user
  res.json({ created: true, userId: req.userId });
});

app.use('/api/projects', projectRouter);
```

## Testing

The middleware includes comprehensive unit tests covering:
- Missing authorization header
- Invalid header format
- Invalid/expired tokens
- User not found scenarios
- Successful authentication
- Error handling

Run tests with:
```bash
npm test auth.test.ts --run
```

## Security Considerations

1. **Token Validation**: All tokens are validated with Keycloak's introspection endpoint
2. **User Lookup**: User existence is verified in the database
3. **Error Handling**: Authentication errors are logged but don't expose sensitive information
4. **HTTPS Required**: In production, always use HTTPS to protect tokens in transit
5. **Token Expiration**: Expired tokens are automatically rejected by Keycloak

## Requirements

This middleware implements:
- **Requirement 8.5**: Token validation on each API request
- **Requirement 8.1**: OAuth 2.0 integration with Keycloak
