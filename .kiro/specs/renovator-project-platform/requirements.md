# Requirements Document

## Introduction

The Renovator Project Management Platform is an all-in-one digital workspace designed to empower independent renovators and small interior building companies. The platform transforms fragmented project management approaches (spreadsheets, scattered photos, loose invoices) into a unified, organized system that enables renovators to manage timelines, budgets, documentation, and client communication while maintaining focus on their craftsmanship.

## Glossary

- **Platform**: The Renovator Project Management Platform system
- **Renovator**: A user who is an independent contractor or small business owner in the renovation/interior building industry
- **Project**: A renovation job with defined scope, timeline, budget, and deliverables
- **Client**: The property owner or entity commissioning the renovation work
- **Milestone**: A significant checkpoint or deliverable within a project timeline
- **Task**: A discrete unit of work that contributes to project completion
- **Budget_Item**: A line item in the project budget representing costs or revenue
- **Document**: Any file uploaded to the platform (photo, invoice, contract, receipt, etc.)
- **Resource**: Materials, equipment, or subcontractors needed for project execution
- **Timeline**: The scheduled sequence of tasks and milestones for a project
- **Financial_Report**: Analytics showing project profitability, costs, and revenue

## Requirements

### Requirement 1: Project Creation and Management

**User Story:** As a renovator, I want to create and manage multiple renovation projects, so that I can organize all my active and completed jobs in one place.

#### Acceptance Criteria

1. WHEN a renovator creates a new project, THE Platform SHALL capture project name, client information, start date, estimated end date, and project description
2. WHEN a renovator views their dashboard, THE Platform SHALL display all active projects with current status indicators
3. WHEN a renovator searches for a project, THE Platform SHALL return matching results based on project name, client name, or date range
4. WHEN a renovator archives a completed project, THE Platform SHALL move it to archived status while preserving all project data
5. THE Platform SHALL allow renovators to assign a unique identifier to each project

### Requirement 2: Timeline and Milestone Management

**User Story:** As a renovator, I want to create and track project timelines with milestones, so that I can ensure projects stay on schedule and clients know what to expect.

#### Acceptance Criteria

1. WHEN a renovator creates a timeline, THE Platform SHALL allow definition of start date, end date, and multiple milestones
2. WHEN a renovator adds a milestone, THE Platform SHALL capture milestone name, target date, description, and completion status
3. WHEN a renovator marks a milestone as complete, THE Platform SHALL record the completion date and update project progress
4. WHEN viewing a project timeline, THE Platform SHALL display milestones in chronological order with visual progress indicators
5. IF a milestone is overdue, THEN THE Platform SHALL highlight it with a visual warning indicator

### Requirement 3: Task Management

**User Story:** As a renovator, I want to create and track individual tasks within my projects, so that I can break down work into manageable pieces and monitor daily progress.

#### Acceptance Criteria

1. WHEN a renovator creates a task, THE Platform SHALL capture task name, description, assigned milestone, priority level, due date, estimated price, actual price, and per unit measurement
2. WHERE a task has pricing information, THE Platform SHALL allow estimated price, actual price, and per unit to be optional fields
3. WHEN a renovator clicks on a task row in the task list, THE Platform SHALL open the task detail view for editing
4. WHEN a renovator edits a task, THE Platform SHALL allow updating milestone, priority, due date, estimated price, actual price, and per unit measurement
3. THE Platform SHALL provide a predefined library of common renovation work items that renovators can select and add to their projects
4. WHEN a renovator views the work items library, THE Platform SHALL display tasks organized by category (demolition, framing, electrical, plumbing, drywall, painting, finishing, etc.)
5. WHERE a work item template includes a default price, THE Platform SHALL populate the estimated price when creating a task from that template
6. WHEN a renovator selects work items from the library, THE Platform SHALL allow bulk addition of multiple tasks to the project
7. THE Platform SHALL allow renovators to customize work item templates including default prices and save them for future use
8. WHEN a renovator views tasks, THE Platform SHALL allow filtering by status, priority, milestone, or due date
9. WHEN a renovator completes a task, THE Platform SHALL update the task status and recalculate milestone progress
10. WHEN a renovator changes a task status, THE Platform SHALL allow transitions between todo, in_progress, completed, and blocked states
11. WHEN a renovator deletes a task, THE Platform SHALL remove the task and recalculate any affected milestone progress and budget totals
12. WHEN a task is overdue, THE Platform SHALL display it prominently in the renovator's task list
13. THE Platform SHALL allow renovators to add notes and comments to individual tasks
14. WHEN calculating project costs, THE Platform SHALL aggregate actual prices from all tasks with pricing information
15. WHEN a renovator accesses the user menu dropdown, THE Platform SHALL provide a "Work Items Library" option to manage custom work item templates
16. WHEN a renovator opens the Work Items Library management interface, THE Platform SHALL display all custom work item templates with options to create, edit, and delete templates
17. WHEN a renovator creates or edits a work item template, THE Platform SHALL allow specification of name, description, category, estimated duration, default price per unit, and unit of measurement
18. WHEN a renovator deletes a work item template, THE Platform SHALL remove it from the library while preserving any tasks already created from that template

### Requirement 4: Budget Creation and Tracking

**User Story:** As a renovator, I want to create detailed project budgets and track actual costs against estimates, so that I can maintain profitability and avoid cost overruns.

#### Acceptance Criteria

1. WHEN a renovator creates a project budget, THE Platform SHALL allow entry of estimated costs by category (labor, materials, equipment, subcontractors, permits, contingency)
2. WHEN a renovator adds a budget item, THE Platform SHALL capture item name, category, estimated cost, and actual cost
3. WHEN actual costs are entered, THE Platform SHALL calculate variance between estimated and actual costs
4. WHEN viewing budget status, THE Platform SHALL display total estimated budget, total actual costs, remaining budget, and percentage spent
5. WHEN calculating budget totals, THE Platform SHALL automatically aggregate actual prices from all project tasks and include them in the total actual costs
6. WHEN viewing budget breakdown, THE Platform SHALL display budget items separately from task-based costs with clear categorization
7. IF actual costs exceed estimated budget by more than 10%, THEN THE Platform SHALL display a budget warning alert
8. THE Platform SHALL allow renovators to update budget estimates during project execution
9. WHEN a budget item is added or modified, THE Platform SHALL immediately update all budget totals and calculations
10. WHEN a task actual price is added or modified, THE Platform SHALL immediately update budget totals to reflect the change
11. WHEN a renovator exports a budget, THE Platform SHALL generate a PDF document containing project header with name and client details, a table of all tasks and budget items with columns for ID, name, quantity, per unit, and price, and a footer with aggregated sums by type (tasks, labor, subcontractors, materials, etc.)
12. THE Platform SHALL allow renovators to download the exported budget PDF to their local device

### Requirement 5: Document Management

**User Story:** As a renovator, I want to upload, organize, and access project documents, so that all contracts, photos, invoices, and receipts are stored in one secure location.

#### Acceptance Criteria

1. WHEN a renovator uploads a document, THE Platform SHALL accept common file formats (PDF, JPG, PNG, HEIC, DOC, DOCX, XLS, XLSX)
2. WHEN a renovator uploads a document, THE Platform SHALL capture document type, upload date, and associated project
3. WHEN a renovator organizes documents, THE Platform SHALL allow categorization by type (contract, invoice, receipt, photo, permit, warranty)
4. WHEN a renovator searches for documents, THE Platform SHALL return results based on document name, type, date range, or project
5. THE Platform SHALL allow renovators to view documents directly within the platform without downloading
6. THE Platform SHALL store documents securely with encryption at rest and in transit
7. WHEN a renovator deletes a document, THE Platform SHALL move it to a trash folder for 30 days before permanent deletion

### Requirement 6: Photo Documentation and Progress Tracking

**User Story:** As a renovator, I want to capture and organize project photos by date and milestone, so that I can document progress, showcase my work, and resolve disputes.

#### Acceptance Criteria

1. WHEN a renovator uploads photos, THE Platform SHALL automatically extract and store the capture date from photo metadata
2. WHEN a renovator uploads photos, THE Platform SHALL allow association with specific milestones or project phases
3. WHEN viewing project photos, THE Platform SHALL display them in chronological order with date stamps
4. THE Platform SHALL allow renovators to add captions and notes to individual photos
5. WHEN a renovator creates a progress report, THE Platform SHALL allow selection of photos to include in the report
6. THE Platform SHALL support batch upload of multiple photos simultaneously
7. THE Platform SHALL automatically create thumbnail previews for efficient browsing

### Requirement 7: Resource and Material Management

**User Story:** As a renovator, I want to track materials, equipment, and subcontractors needed for projects, so that I can ensure resources are available when needed and avoid delays.

#### Acceptance Criteria

1. WHEN a renovator adds a resource to a project, THE Platform SHALL capture resource type, name, quantity needed, cost, and supplier information
2. WHEN a renovator marks a resource as ordered, THE Platform SHALL record the order date and expected delivery date
3. WHEN a renovator marks a resource as received, THE Platform SHALL update the resource status and record the actual delivery date
4. THE Platform SHALL allow renovators to create a master list of frequently used suppliers and subcontractors
5. WHEN viewing project resources, THE Platform SHALL display resources grouped by status (needed, ordered, received)
6. THE Platform SHALL allow renovators to attach supplier invoices and receipts to resource entries
7. IF a resource delivery is overdue by more than 2 days, THEN THE Platform SHALL display a delivery warning

### Requirement 8: User Authentication and Security

**User Story:** As a renovator, I want my project data to be secure and accessible only to authorized users, so that I can protect sensitive client and financial information.

#### Acceptance Criteria

1. THE Platform SHALL implement OAuth 2.0 authorization code flow for user authentication
2. THE Platform SHALL integrate with a third-party Identity Provider (Keycloak or Google) for user management
3. WHEN a renovator logs in, THE Platform SHALL redirect to the Identity Provider for authentication
4. WHEN authentication is successful, THE Platform SHALL receive an authorization code and exchange it for access and refresh tokens
5. THE Platform SHALL validate access tokens on each API request to ensure user authorization
6. THE Platform SHALL automatically refresh expired access tokens using refresh tokens
7. THE Platform SHALL encrypt all data transmissions using TLS 1.2 or higher
8. WHEN a renovator logs out, THE Platform SHALL revoke the access token and clear the session
