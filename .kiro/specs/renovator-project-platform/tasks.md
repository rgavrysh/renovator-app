# Implementation Plan: Renovator Project Management Platform

## Overview

This implementation plan breaks down the development of the Renovator Project Management Platform into discrete, manageable tasks. The platform will be built using a monorepo structure with React/TypeScript frontend, Node.js/TypeScript backend, PostgreSQL database, and OAuth 2.0 authentication via Keycloak or Google.

## Tasks

- [x] 1. Project Setup and Infrastructure
  - Set up monorepo structure with frontend and backend workspaces
  - Configure TypeScript for both frontend and backend
  - Set up Docker Compose with containers for frontend, backend, PostgreSQL, and Keycloak
  - Configure Sentry for error tracking and logging
  - Set up environment variables and configuration management
  - _Requirements: 8.1, 8.7_

- [ ] 2. Database Schema and TypeORM Setup
  - [x] 2.1 Configure TypeORM with PostgreSQL connection
    - Set up TypeORM configuration
    - Create database connection module
    - _Requirements: All data requirements_
  
  - [x] 2.2 Create TypeORM entities for core models
    - Create User, Session, Project, Milestone, Task entities
    - Create WorkItemTemplate, Budget, BudgetItem entities
    - Create Document, Resource, Supplier entities
    - Define relationships between entities
    - _Requirements: 1.1, 2.2, 3.1, 4.2, 5.2, 6.1, 7.1_
  
  - [x] 2.3 Create and run database migrations
    - Generate initial migration from entities
    - Create seeds for main entities User, Project, Task 
    - Test migration up and down
    - _Requirements: All data requirements_

- [ ] 3. OAuth 2.0 Authentication Setup
  - [x] 3.1 Configure Keycloak container
    - Set up Keycloak in Docker Compose
    - Create realm and client configuration
    - Configure redirect URIs and scopes
    - _Requirements: 8.1_
  
  - [x] 3.2 Implement OAuth 2.0 authorization code flow in backend
    - Create AuthService with OAuth methods
    - Implement authorization URL generation
    - Implement code-to-token exchange
    - Implement token validation and refresh
    - _Requirements: 8.1, 8.4, 8.5, 8.6_
  
  - [ ]* 3.3 Write property tests for OAuth flow
    - **Property 34: OAuth Authorization URL Generation**
    - **Property 35: Authorization Code Exchange**
    - **Property 36: Access Token Validation**
    - **Property 37: Token Refresh**
    - **Validates: Requirements 8.1, 8.4, 8.5, 8.6**
  
  - [x] 3.4 Implement session management
    - Create SessionService for CRUD operations
    - Implement session creation and deletion
    - _Requirements: 8.4, 8.8_
  
  - [ ]* 3.5 Write property tests for session management
    - **Property 38: Session Creation**
    - **Property 39: Token Revocation**
    - **Validates: Requirements 8.4, 8.8**
  
  - [x] 3.6 Create authentication middleware
    - Implement token validation middleware
    - Add middleware to protect routes
    - _Requirements: 8.5_

- [x] 4. Checkpoint - Ensure authentication works
  - Test OAuth login flow end-to-end
  - Verify token validation and refresh
  - Ensure all tests pass



- [ ] 5. Project Management Backend Implementation
  - [x] 5.1 Create ProjectService with CRUD operations
    - Implement create, read, update, delete, list, search methods
    - Implement project archival
    - Add user ownership validation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [ ]* 5.2 Write property tests for project management
    - **Property 1: Project Creation Completeness**
    - **Property 2: Project Search Accuracy**
    - **Property 3: Project Archival Preservation**
    - **Property 4: Active Projects Visibility**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5**
  
  - [x] 5.3 Create REST API endpoints for projects
    - POST /api/projects - Create project
    - GET /api/projects - List projects
    - GET /api/projects/:id - Get project
    - PUT /api/projects/:id - Update project
    - DELETE /api/projects/:id - Delete project
    - POST /api/projects/:id/archive - Archive project
    - GET /api/projects/search - Search projects
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [ ] 6. Timeline and Milestone Backend Implementation
  - [x] 6.1 Create MilestoneService with CRUD operations
    - Implement create, update, delete milestone methods
    - Implement progress calculation
    - Implement overdue detection
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 6.2 Write property tests for milestones
    - **Property 5: Milestone Creation Completeness**
    - **Property 6: Milestone Chronological Ordering**
    - **Property 7: Milestone Completion Updates Progress**
    - **Property 8: Overdue Milestone Detection**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
  
  - [x] 6.3 Create REST API endpoints for milestones
    - POST /api/projects/:projectId/milestones - Create milestone
    - GET /api/projects/:projectId/milestones - List milestones
    - PUT /api/milestones/:id - Update milestone
    - DELETE /api/milestones/:id - Delete milestone
    - POST /api/milestones/:id/complete - Mark complete
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [ ] 7. Task Management Backend Implementation
  - [x] 7.1 Create WorkItemTemplateService
    - Implement CRUD for work item templates
    - Seed database with default templates by category
    - Implement template retrieval by category
    - _Requirements: 3.3, 3.4, 3.5, 3.7_
  
  - [x] 7.2 Create TaskService with CRUD operations
    - Implement create, update, delete task methods
    - Implement bulk task creation from templates
    - Implement task filtering
    - Implement task cost aggregation
    - Ensure task price updates trigger budget total recalculation
    - _Requirements: 3.1, 3.2, 3.6, 3.8, 3.9, 3.10, 3.11, 3.12, 3.14, 4.10_
  
  - [ ]* 7.3 Write property tests for tasks
    - **Property 10: Task Creation Completeness**
    - **Property 11: Work Items Library Organization**
    - **Property 12: Bulk Task Creation from Templates**
    - **Property 13: Task Filtering Accuracy**
    - **Property 14: Task Status Transitions**
    - **Property 15: Task Deletion Impact**
    - **Property 16: Overdue Task Detection**
    - **Property 17: Task Note Persistence**
    - **Property 18: Task Cost Aggregation**
    - **Validates: Requirements 3.1-3.14**
  
  - [x] 7.4 Create REST API endpoints for tasks
    - POST /api/projects/:projectId/tasks - Create task
    - POST /api/projects/:projectId/tasks/bulk - Bulk create from templates
    - GET /api/projects/:projectId/tasks - List/filter tasks
    - PUT /api/tasks/:id - Update task
    - PATCH /api/tasks/:id/status - Update task status
    - DELETE /api/tasks/:id - Delete task
    - POST /api/tasks/:id/notes - Add note
    - GET /api/work-items - Get work item templates (with optional ownerId filter)
    - GET /api/work-items/:id - Get specific work item template
    - POST /api/work-items - Create custom template
    - PUT /api/work-items/:id - Update work item template
    - DELETE /api/work-items/:id - Delete work item template
    - _Requirements: 3.1, 3.3, 3.4, 3.6, 3.7, 3.8, 3.10, 3.11, 3.15, 3.16, 3.17, 3.18_

- [x] 8. Checkpoint - Ensure core project features work
  - Test project, milestone, and task creation
  - Verify filtering and search functionality
  - Ensure all tests pass



- [ ] 9. Budget Management Backend Implementation
  - [x] 9.1 Create BudgetService with CRUD operations
    - Implement budget and budget item CRUD
    - Implement variance calculations
    - Implement budget alert detection
    - Implement totals aggregation including task actual prices
    - Add calculateTotalsWithTasks method to aggregate from TaskService
    - Ensure budget totals update when tasks are modified
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_
  
  - [ ]* 9.2 Write property tests for budgets
    - **Property 19: Budget Item Creation Completeness**
    - **Property 20: Budget Variance Calculation**
    - **Property 21: Budget Totals Aggregation (including task prices)**
    - **Property 22: Budget Alert Threshold**
    - **Property 23: Budget Export Completeness**
    - **Validates: Requirements 4.1-4.12**
  
  - [x] 9.3 Create REST API endpoints for budgets
    - POST /api/projects/:projectId/budget - Create budget
    - GET /api/projects/:projectId/budget - Get budget
    - POST /api/budgets/:budgetId/items - Add budget item
    - PUT /api/budget-items/:id - Update budget item
    - DELETE /api/budget-items/:id - Delete budget item
    - GET /api/budgets/:budgetId/alerts - Get budget alerts
    - GET /api/projects/:projectId/budget/export - Export budget to PDF
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.11, 4.12_
  
  - [x] 9.4 Implement PDF generation for budget export
    - Install PDF generation library (e.g., pdfkit, puppeteer, or jsPDF)
    - Create PDF template with header, table, and footer sections
    - Implement data aggregation by category for footer
    - Generate PDF buffer for download
    - _Requirements: 4.11, 4.12_
  
  - [x] 9.5 Implement milestone-based budget decomposition
    - Add milestone_id column to budget_items table (migration)
    - Update BudgetItem entity with milestoneId and Milestone relation
    - Update Milestone entity with budgetItems back-relation
    - Update BudgetService to accept milestoneId on create/update budget items
    - Update budget API routes to accept milestoneId in POST/PUT item requests
    - _Requirements: 4.2, 4.13, 4.14, 4.15_
  
  - [x] 9.6 Implement milestone-filtered budget PDF export
    - Update BudgetService.exportBudgetToPDF to accept optional milestoneId filter
    - Filter tasks and budget items by milestone when milestoneId is provided
    - Recalculate totals from filtered subset
    - Include milestone name in PDF header when filtering
    - Update export API route to accept milestoneId query parameter
    - Add milestone translation key to PDF translations (en/uk)
    - _Requirements: 4.16, 4.17, 4.18_

- [ ] 10. Document and Photo Management Backend Implementation
  - [x] 10.1 Set up file storage service
    - Configure cloud storage (AWS S3 or similar)
    - Implement file upload with presigned URLs
    - Implement file deletion
    - _Requirements: 5.1, 5.2, 5.6_
  
  - [x] 10.2 Create DocumentService
    - Implement document upload with metadata
    - Implement document search and filtering
    - Implement soft delete (trash)
    - Implement document categorization
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7_
  
  - [x] 10.3 Create PhotoService
    - Implement photo upload with EXIF extraction
    - Implement thumbnail generation
    - Implement batch upload
    - Implement chronological sorting
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [ ]* 10.4 Write property tests for documents and photos
    - **Property 22: Document Upload Completeness**
    - **Property 23: Document Format Validation**
    - **Property 24: Document Search Accuracy**
    - **Property 25: Document Soft Delete**
    - **Property 26: Photo Metadata Extraction**
    - **Property 27: Photo Chronological Ordering**
    - **Property 28: Photo Batch Upload**
    - **Property 29: Photo Thumbnail Generation**
    - **Validates: Requirements 5.1-5.7, 6.1-6.7**
  
  - [x] 10.5 Create REST API endpoints for documents and photos
    - POST /api/projects/:projectId/documents - Upload document
    - GET /api/projects/:projectId/documents - List documents
    - GET /api/documents/:id - Get document
    - DELETE /api/documents/:id - Delete document
    - POST /api/projects/:projectId/photos - Upload photo(s)
    - GET /api/projects/:projectId/photos - List photos
    - PUT /api/photos/:id - Update photo caption
    - _Requirements: 5.1, 5.2, 5.4, 5.5, 5.7, 6.1, 6.2, 6.4, 6.6_

- [ ] 11. Resource Management Backend Implementation
  - [x] 11.1 Create SupplierService
    - Implement supplier CRUD operations
    - _Requirements: 7.4_
  
  - [x] 11.2 Create ResourceService
    - Implement resource CRUD operations
    - Implement status transitions (ordered, received)
    - Implement overdue delivery detection
    - Implement resource grouping by status
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7_
  
  - [ ]* 11.3 Write property tests for resources
    - **Property 30: Resource Creation Completeness**
    - **Property 31: Resource Status Transitions**
    - **Property 32: Resource Grouping by Status**
    - **Property 33: Overdue Delivery Detection**
    - **Validates: Requirements 7.1-7.7**
  
  - [x] 11.4 Create REST API endpoints for resources
    - POST /api/projects/:projectId/resources - Create resource
    - GET /api/projects/:projectId/resources - List resources
    - PUT /api/resources/:id - Update resource
    - DELETE /api/resources/:id - Delete resource
    - POST /api/resources/:id/order - Mark as ordered
    - POST /api/resources/:id/receive - Mark as received
    - POST /api/suppliers - Create supplier
    - GET /api/suppliers - List suppliers
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 12. Checkpoint - Ensure all backend features work
  - Test budget, document, photo, and resource management
  - Verify all calculations and aggregations
  - Ensure all tests pass



- [ ] 13. Frontend Setup and Authentication
  - [x] 13.1 Set up React application with TypeScript
    - Initialize React app with Vite or Create React App
    - Configure TypeScript
    - Set up React Router
    - Configure Tailwind CSS
    - _Requirements: All frontend requirements_
  
  - [x] 13.2 Create Linear-inspired UI components library
    - Create base components (Button, Input, Card, Modal, etc.)
    - Implement clean, minimalist design system
    - Create layout components (Header, Sidebar, Container)
    - Add user dropdown menu in header with username display
    - _Requirements: All UI requirements_
  
  - [x] 13.3 Implement OAuth 2.0 login flow
    - Create login page with OAuth redirect
    - Implement callback handler for authorization code
    - Store tokens in secure storage
    - Create authentication context/provider
    - _Requirements: 8.1, 8.4_
  
  - [x] 13.4 Implement protected routes and auth guards
    - Create ProtectedRoute component
    - Implement token refresh logic
    - Handle logout and token revocation
    - _Requirements: 8.5, 8.6, 8.8_

- [ ] 14. Frontend - Project Management UI
  - [x] 14.1 Create project dashboard
    - Display list of active projects
    - Implement project status indicators
    - Add search functionality
    - _Requirements: 1.2, 1.3_
  
  - [x] 14.2 Create project creation/edit form
    - Build form with all project fields
    - Implement form validation
    - Handle project creation and updates
    - _Requirements: 1.1, 1.5_
  
  - [x] 14.3 Create project detail view
    - Display project information
    - Show project timeline and milestones
    - Display project tasks and budget summary
    - Add archive functionality
    - _Requirements: 1.4, 2.5_

- [ ] 15. Frontend - Timeline and Milestone UI
  - [x] 15.1 Create milestone list component
    - Display milestones in chronological order
    - Show progress indicators
    - Highlight overdue milestones
    - _Requirements: 2.5_
  
  - [x] 15.2 Create milestone creation/edit form
    - Build form for milestone details
    - Implement date picker
    - Handle milestone creation and updates
    - _Requirements: 2.1, 2.2_
  
  - [x] 15.3 Implement milestone completion
    - Add complete button/action
    - Update UI to reflect completion
    - Recalculate project progress
    - _Requirements: 2.3, 2.4_

- [ ] 16. Frontend - Task Management UI
  - [x] 16.1 Create task list component
    - Display tasks with filtering options
    - Show task status, priority, and due dates
    - Highlight overdue tasks
    - _Requirements: 3.8, 3.10, 3.12_
  
  - [x] 16.2 Create work items library modal
    - Display work items by category
    - Allow selection of multiple items
    - Implement bulk add functionality
    - _Requirements: 3.3, 3.4, 3.6_
  
  - [x] 16.3 Create task creation/edit form
    - Build form with all task fields including pricing and per unit (optional)
    - Implement milestone association
    - Handle task creation and updates
    - Enable click on task row to open task detail/edit view
    - Allow editing of milestone, priority, due date, price, and per unit
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 16.4 Implement task notes feature
    - Add notes section to task detail
    - Allow adding new notes
    - Display note history
    - _Requirements: 3.13_
  
  - [x] 16.5 Implement task status management
    - Add status dropdown/buttons to task list and detail views
    - Allow status transitions (todo, in_progress, completed, blocked)
    - Update UI to reflect status changes
    - _Requirements: 3.9, 3.10_
  
  - [x] 16.6 Implement task deletion
    - Add delete button to task detail view
    - Show confirmation dialog before deletion
    - Update UI after successful deletion
    - _Requirements: 3.11_
  
  - [x] 16.7 Create Work Items Library management page
    - Add "Work Items Library" option to user dropdown menu
    - Create dedicated page/modal for managing work item templates
    - Display all custom work item templates in a list/grid view
    - Show template details: name, description, category, default price, unit
    - _Requirements: 3.15, 3.16_
  
  - [x] 16.8 Create work item template creation/edit form
    - Build form with fields: name, description, category, estimated duration, default price, unit
    - Implement form validation
    - Handle template creation and updates via API
    - _Requirements: 3.7, 3.17_
  
  - [x] 16.9 Implement work item template deletion
    - Add delete button to template list/detail view
    - Show confirmation dialog before deletion
    - Update UI after successful deletion
    - Display message that existing tasks created from template are preserved
    - _Requirements: 3.18_

- [x] 17. Checkpoint - Ensure core UI features work
  - Test project, milestone, and task UI flows
  - Verify responsive design
  - Ensure all tests pass



- [ ] 18. Frontend - Budget Management UI
  - [x] 18.1 Create budget overview component
    - Display budget totals including separate breakdown of budget items vs task costs
    - Show total actual from budget items
    - Show total actual from tasks (auto-calculated)
    - Show combined total actual costs
    - Display variance and percentage spent
    - Show budget alerts when over threshold
    - _Requirements: 4.4, 4.5, 4.6, 4.7_
  
  - [x] 18.2 Create budget items list
    - Display budget items by category
    - Show estimated vs actual costs for each item
    - Display variance for each item
    - Clearly separate budget items from task-based costs
    - Group items by milestone when milestones exist, with expand/collapse sections and subtotals
    - Show items without a milestone under "General" section
    - _Requirements: 4.1, 4.2, 4.3, 4.6, 4.13, 4.14_
  
  - [x] 18.3 Create budget item creation/edit form
    - Build form for budget item details
    - Allow category selection
    - Allow optional milestone selection (loaded from project milestones)
    - Handle creation and updates with milestoneId
    - Trigger immediate recalculation of budget totals
    - _Requirements: 4.1, 4.2, 4.8, 4.9, 4.15_
  
  - [x] 18.4 Display task costs in budget view
    - Show aggregated task actual prices in budget overview
    - Display task costs separately from budget items
    - Link to task list for detailed breakdown
    - Update automatically when task prices change
    - _Requirements: 3.14, 4.5, 4.6, 4.10_
  
  - [x] 18.5 Implement budget export UI
    - Add "Export to PDF" button to budget overview
    - Show milestone selection modal when milestones exist, allowing choice of specific milestone or entire project
    - Pass selected milestoneId to export API endpoint
    - Show loading state during PDF generation
    - Trigger download of generated PDF file with milestone name in filename when filtered
    - Display success/error messages
    - _Requirements: 4.11, 4.12, 4.16, 4.17, 4.18_

- [x] 19. Frontend - Document and Photo Management UI
  - [x] 19.1 Create document upload component
    - Implement file picker with format validation
    - Show upload progress
    - Handle document categorization
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 19.2 Create document list and search
    - Display documents with filters
    - Implement search functionality
    - Add document preview/download
    - _Requirements: 5.4, 5.5_
  
  - [x] 19.3 Implement document trash/restore
    - Add delete functionality
    - Create trash view
    - Implement restore from trash
    - _Requirements: 5.7_
  
  - [x] 19.4 Create photo gallery component
    - Display photos in chronological order
    - Show thumbnails with date stamps
    - Implement photo viewer/lightbox
    - _Requirements: 6.3, 6.7_
  
  - [x] 19.5 Create photo upload component
    - Implement batch photo upload
    - Extract and display capture dates
    - Allow milestone association
    - Add caption functionality
    - _Requirements: 6.1, 6.2, 6.4, 6.6_

- [x] 20. Frontend - Resource Management UI
  - [x] 20.1 Create resource list component
    - Display resources grouped by status
    - Show overdue delivery warnings
    - _Requirements: 7.5, 7.7_
  
  - [x] 20.2 Create resource creation/edit form
    - Build form for resource details
    - Allow supplier selection
    - Handle status transitions
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 20.3 Create supplier management UI
    - Create supplier list
    - Build supplier creation/edit form
    - _Requirements: 7.4_

- [ ] 21. Error Handling and Logging Integration
  - [ ] 21.1 Integrate Sentry in backend
    - Configure Sentry SDK
    - Add error tracking middleware
    - Implement context logging
    - _Requirements: 8.7_
  
  - [ ] 21.2 Integrate Sentry in frontend
    - Configure Sentry SDK for React
    - Add error boundary components
    - Track user actions and errors
    - _Requirements: 8.7_
  
  - [ ] 21.3 Implement comprehensive error handling
    - Add validation error responses
    - Implement authentication error handling
    - Add user-friendly error messages in UI
    - _Requirements: All error scenarios_

- [ ] 22. Final Integration and Testing
  - [ ] 22.1 End-to-end testing
    - Test complete user workflows
    - Verify OAuth login flow
    - Test project creation to completion
    - _Requirements: All requirements_
  
  - [ ]* 22.2 Run all property-based tests
    - Execute all 39 property tests
    - Verify 100+ iterations per test
    - Fix any failing tests
    - _Requirements: All requirements_
  
  - [ ] 22.3 Docker deployment testing
    - Build all Docker images
    - Test Docker Compose orchestration
    - Verify container networking
    - Test database persistence
    - _Requirements: Infrastructure_

- [ ] 23. Final checkpoint - Production readiness
  - Ensure all tests pass
  - Verify all features work end-to-end
  - Check error handling and logging
  - Confirm Docker deployment works



- [ ] 24. Google Drive Integration - Phase 1: Foundation
  - [ ] 24.1 Google Cloud Console setup
    - Enable Google Drive API in existing project (`renovator-489414`)
    - Add backend redirect URIs to existing OAuth client (`http://localhost:4000/api/google/callback`, production URL)
    - Add `drive.file` scope to OAuth consent screen
    - _Requirements: 9.1_

  - [ ] 24.2 Environment variables and configuration
    - Add `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` to backend config
    - Generate `TOKEN_ENCRYPTION_KEY` (32-byte hex via `openssl rand -hex 32`)
    - Update `packages/backend/src/config/index.ts` with google and tokenEncryption sections
    - Update `.env` files for local dev and production
    - _Requirements: 9.1, 9.3_

  - [ ] 24.3 Database migration for Google Drive tables
    - Create `user_google_drive_tokens` table (encrypted token storage per user)
    - Create `project_drive_folders` table (project-to-folder mapping)
    - Alter `documents` table: add `storage_provider` (default 'local') and `drive_file_id` columns
    - Generate and test TypeORM migration
    - _Requirements: 9.3, 9.6, 9.12_

  - [ ] 24.4 Create new TypeORM entities
    - Create `UserGoogleDriveToken` entity mapping to `user_google_drive_tokens`
    - Create `ProjectDriveFolder` entity mapping to `project_drive_folders`
    - Update `Document` entity with `storageProvider` and `driveFileId` columns
    - Update `User` entity with `googleDriveToken` relation
    - _Requirements: 9.3, 9.6, 9.12_

  - [ ] 24.5 Implement TokenEncryptionService
    - Create `packages/backend/src/services/TokenEncryptionService.ts`
    - Implement AES-256-GCM encrypt/decrypt using `TOKEN_ENCRYPTION_KEY`
    - Format: `iv:authTag:ciphertext` base64 encoded
    - _Requirements: 9.3_

  - [ ] 24.6 Implement GoogleDriveAuthService
    - Create `packages/backend/src/services/GoogleDriveAuthService.ts`
    - Implement `getAuthorizationUrl()` with `login_hint`, `access_type: 'offline'`, `prompt: 'consent'`, scope `drive.file`
    - Implement `handleCallback()` to exchange code for tokens, encrypt, store in DB
    - Implement `getAccessToken()` with automatic refresh of expired tokens
    - Implement `disconnect()` to revoke token and delete from DB
    - Implement `isConnected()` and `getConnectionInfo()`
    - _Requirements: 9.1, 9.2, 9.3, 9.4_

  - [ ] 24.7 Create Google auth API routes
    - Create `packages/backend/src/routes/google.ts`
    - `GET /api/google/connect` - returns Google OAuth consent URL (with login_hint from user's email)
    - `GET /api/google/callback` - handles OAuth callback, stores tokens, redirects to frontend
    - `GET /api/google/status` - returns `{ connected, email }`
    - `POST /api/google/disconnect` - revokes access and deletes tokens
    - Register routes in Express app
    - _Requirements: 9.1, 9.2, 9.4_

- [ ] 25. Google Drive Integration - Phase 2: Storage Backend
  - [ ] 25.1 Install Google Drive dependencies
    - Add `googleapis` and `google-auth-library` to backend package.json
    - _Requirements: 9.5_

  - [ ] 25.2 Implement GoogleDriveStorageProvider
    - Create `packages/backend/src/services/GoogleDriveStorageProvider.ts`
    - Implement `uploadFile()` - upload buffer to specified Drive folder
    - Implement `downloadFile()` - download file content by Drive file ID
    - Implement `deleteFile()` - delete file from Drive
    - Implement `createFolder()` - create folder in user's Drive
    - Implement `listFolders()` - list folders for folder picker
    - _Requirements: 9.5, 9.6, 9.7_

  - [ ] 25.3 Implement StorageResolver
    - Create `packages/backend/src/services/StorageResolver.ts`
    - Implement `getStorageMode()` - check if user has linked Google Drive
    - Implement `resolveProjectFolder()` - get or auto-create project folder in Drive
    - Implement `uploadFile()` - route to local or Drive based on user config
    - Implement `readFile()` - handle both local and Drive retrieval
    - Implement `getDownloadUrl()` - handle both storage providers
    - Implement `deleteFile()` - handle both storage providers
    - _Requirements: 9.5, 9.7, 9.9, 9.10, 9.11_

  - [ ] 25.4 Modify DocumentService to use StorageResolver
    - Replace direct `FileStorageService` usage with `StorageResolver`
    - Set `storageProvider` and `driveFileId` on document entity during upload
    - Update `generatePresignedUrl` to handle both providers
    - Update `permanentlyDeleteDocument` to handle both providers
    - Maintain backward compatibility for existing local documents
    - _Requirements: 9.5, 9.9, 9.10, 9.12_

  - [ ] 25.5 Modify PhotoService to use StorageResolver
    - Replace direct `FileStorageService` usage with `StorageResolver`
    - Upload thumbnails to Drive alongside originals when Drive is active
    - Set `storageProvider` and `driveFileId` on photo document entity
    - Maintain backward compatibility for existing local photos
    - _Requirements: 9.5, 9.9, 9.10, 9.12_

  - [ ] 25.6 Update document/photo API routes for Drive-aware download
    - Modify `GET /api/documents/:id/download` to check `storageProvider`
    - For `google_drive`: proxy file through backend using stored tokens
    - For `local`: use existing presigned URL logic
    - _Requirements: 9.9_

  - [ ] 25.7 Create Drive folder management API routes
    - `GET /api/google/folders` - list root-level Drive folders
    - `GET /api/google/folders/:folderId/children` - list subfolders
    - `GET /api/projects/:projectId/drive-folder` - get project's folder mapping
    - `PUT /api/projects/:projectId/drive-folder` - set/update folder mapping
    - `DELETE /api/projects/:projectId/drive-folder` - remove mapping (revert to auto-create)
    - _Requirements: 9.6, 9.8_

- [ ] 26. Google Drive Integration - Phase 3: Frontend
  - [ ] 26.1 Create useGoogleDrive hook
    - Create `packages/frontend/src/hooks/useGoogleDrive.ts`
    - Expose `isConnected`, `googleEmail`, `loading`, `connect()`, `disconnect()`, `refreshStatus()`
    - Cache status and refetch on mount
    - _Requirements: 9.1, 9.4_

  - [ ] 26.2 Create Google Drive connection UI
    - Add "Google Drive" section to user settings/profile area
    - Disconnected state: "Connect Google Drive" button with explanation text
    - Connected state: show linked email, "Disconnect" button
    - Handle OAuth popup/redirect flow for connecting
    - _Requirements: 9.1, 9.2, 9.4_

  - [ ] 26.3 Create Google OAuth callback page
    - Add `/google/callback` route to frontend router
    - Extract success/error from URL params
    - Show success or error message
    - Auto-close popup or redirect back to settings
    - _Requirements: 9.1_

  - [ ] 26.4 Create project Drive folder selector component
    - Build folder picker modal with Drive folder tree navigation
    - Show current folder mapping or "Auto-create on first upload"
    - "Choose Folder" button, "Create New Folder" option
    - "Reset to Auto" removes explicit mapping
    - Integrate into project Documents/Photos tab header
    - _Requirements: 9.6, 9.8_

  - [ ] 26.5 Update DocumentUpload and PhotoUpload components
    - Show storage destination indicator ("Uploading to Google Drive" / "Uploading to local storage")
    - If Drive connected but no folder selected: show note about auto-creation
    - If Drive token expired/revoked: show "Reconnect Google Drive" error with link
    - _Requirements: 9.5, 9.7, 9.11_

  - [ ] 26.6 Update DocumentList and PhotoGallery components
    - Add small Google Drive icon badge on Drive-stored files
    - Optionally add "Open in Google Drive" link for Drive-stored files
    - Download links continue to work via backend proxy (no change needed)
    - _Requirements: 9.9, 9.12_

  - [ ] 26.7 Add i18n translations
    - Add Google Drive related translation keys to `en` and `uk` locale files
    - Cover: connection UI, folder picker, upload indicators, error messages
    - _Requirements: 9.1-9.12_

- [ ] 27. Google Drive Integration - Phase 4: Polish and Reliability
  - [ ] 27.1 Error handling for expired/revoked tokens
    - Detect Google token failures (401/403 from Google API)
    - Prompt user to reconnect Google Drive
    - Graceful fallback messaging in frontend
    - _Requirements: 9.3_

  - [ ] 27.2 Backward compatibility verification
    - Test that existing documents with `storage_provider = 'local'` are unaffected
    - Test upload and retrieval for both storage providers
    - Test mixed storage within the same project
    - _Requirements: 9.10_

  - [ ] 27.3 Rate limiting and quota management
    - Implement exponential backoff for Google Drive API calls
    - Handle Google API rate limit errors gracefully
    - Monitor request quotas in Google Cloud Console
    - _Requirements: 9.5_

  - [ ]* 27.4 Write property tests for Google Drive integration
    - **Property 42: Google Drive Token Encryption**
    - **Property 43: Google Drive Connection Lifecycle**
    - **Property 44: Storage Provider Routing**
    - **Property 45: Automatic Project Folder Creation**
    - **Property 46: Explicit Folder Mapping**
    - **Property 47: Backward Compatibility**
    - **Property 48: Token Auto-Refresh**
    - **Validates: Requirements 9.1-9.12**

- [ ] 28. Checkpoint - Google Drive integration works end-to-end
  - Test Google Drive connect/disconnect flow
  - Test document upload to Google Drive
  - Test photo upload (with thumbnail) to Google Drive
  - Test file retrieval from Google Drive via backend proxy
  - Test folder auto-creation and explicit folder selection
  - Test backward compatibility with existing local files
  - Test token refresh when access token expires
  - Test error handling when Google Drive is unavailable

## Notes

- Tasks marked with `*` are optional property-based tests that can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- The implementation follows a backend-first approach, then frontend integration
- Docker containers ensure consistent development and deployment environments
