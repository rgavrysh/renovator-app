# Renovator Platform - Frontend

React application for the Renovator Project Management Platform.

## Technology Stack

- **React 18** - UI library with modern JSX transform
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool and dev server
- **React Router v6** - Client-side routing
- **Tailwind CSS** - Utility-first CSS framework
- **Vitest** - Unit testing framework
- **React Testing Library** - Component testing utilities
- **Sentry** - Error tracking and monitoring

## Project Structure

```
src/
├── App.tsx              # Root layout component with Outlet
├── main.tsx             # Application entry point
├── router.tsx           # Route configuration
├── index.css            # Global styles with Tailwind directives
├── config/              # Configuration files
├── utils/               # Utility functions (Sentry, etc.)
└── test/                # Test setup and utilities
```

## Available Scripts

- `npm run dev` - Start development server on port 3000
- `npm run build` - Build for production (TypeScript check + Vite build)
- `npm run preview` - Preview production build
- `npm test` - Run tests with Vitest

## Development

### Running the Application

```bash
npm install
npm run dev
```

The application will be available at `http://localhost:3000`.

### API Proxy

The Vite dev server is configured to proxy `/api` requests to the backend at `http://backend:4000`.

### Building for Production

```bash
npm run build
```

This will:
1. Run TypeScript compiler to check for type errors
2. Build optimized production bundle with Vite
3. Output to `dist/` directory

## Routing

The application uses React Router v6 with the following structure:

- `/` - Redirects to `/dashboard`
- `/dashboard` - Main dashboard (placeholder)
- `/login` - OAuth login page (placeholder)
- `*` - 404 Not Found page

Routes are defined in `src/router.tsx` using `createBrowserRouter`.

## Styling

Tailwind CSS is configured with:
- PostCSS for processing
- Autoprefixer for browser compatibility
- Custom configuration in `tailwind.config.js`

Global styles and Tailwind directives are in `src/index.css`.

## Testing

Tests use Vitest with React Testing Library:

```bash
npm test
```

Test configuration:
- `vitest.config.ts` - Vitest configuration
- `src/test/setup.ts` - Global test setup

## TypeScript Configuration

- `tsconfig.json` - Main TypeScript config for source files
- `tsconfig.node.json` - Config for Node.js files (Vite config, etc.)

Strict mode is enabled with additional checks for unused locals and parameters.

## Next Steps

The following features will be implemented in subsequent tasks:

1. **Authentication UI** (Task 13.3-13.4)
   - OAuth 2.0 login flow
   - Protected routes
   - Token management

2. **UI Components Library** (Task 13.2)
   - Base components (Button, Input, Card, Modal)
   - Layout components (Header, Sidebar)
   - Linear-inspired design system

3. **Feature Pages** (Tasks 14-20)
   - Project management
   - Timeline and milestones
   - Task management
   - Budget tracking
   - Document and photo management
   - Resource management
