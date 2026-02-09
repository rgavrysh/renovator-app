# API Routes Documentation

All endpoints require authentication via Bearer token in the Authorization header.

## Project Routes

Base path: `/api/projects`

### Endpoints

#### Create Project
- **POST** `/api/projects`
- **Body**:
  ```json
  {
    "name": "Kitchen Renovation",
    "clientName": "John Doe",
    "clientEmail": "john@example.com",
    "clientPhone": "555-1234",
    "description": "Complete kitchen remodel",
    "startDate": "2024-01-01",
    "estimatedEndDate": "2024-03-01",
    "status": "planning" // optional
  }
  ```
- **Response**: `201 Created` with project object
- **Errors**: 
  - `400` - Missing required fields or invalid data
  - `401` - Unauthorized

#### List Projects
- **GET** `/api/projects`
- **Query Parameters**:
  - `status` - Filter by status (single or comma-separated: `active,planning`)
  - `startDateFrom` - Filter by start date (ISO format)
  - `startDateTo` - Filter by start date (ISO format)
  - `estimatedEndDateFrom` - Filter by estimated end date (ISO format)
  - `estimatedEndDateTo` - Filter by estimated end date (ISO format)
- **Response**: `200 OK` with array of projects
- **Errors**: 
  - `400` - Invalid query parameters
  - `401` - Unauthorized

#### Search Projects
- **GET** `/api/projects/search?q=kitchen`
- **Query Parameters**:
  - `q` - Search query (searches name and client name)
- **Response**: `200 OK` with array of matching projects
- **Errors**: 
  - `400` - Missing or invalid search query
  - `401` - Unauthorized

#### Get Project
- **GET** `/api/projects/:id`
- **Response**: `200 OK` with project object
- **Errors**: 
  - `404` - Project not found
  - `401` - Unauthorized

#### Update Project
- **PUT** `/api/projects/:id`
- **Body**: Any subset of project fields
  ```json
  {
    "name": "Updated Name",
    "status": "active"
  }
  ```
- **Response**: `200 OK` with updated project object
- **Errors**: 
  - `400` - Invalid data
  - `404` - Project not found
  - `401` - Unauthorized

#### Delete Project
- **DELETE** `/api/projects/:id`
- **Response**: `204 No Content`
- **Errors**: 
  - `404` - Project not found
  - `401` - Unauthorized

#### Archive Project
- **POST** `/api/projects/:id/archive`
- **Response**: `200 OK` with archived project object
- **Errors**: 
  - `404` - Project not found
  - `401` - Unauthorized

### Project Status Values
- `planning` - Project is in planning phase
- `active` - Project is actively being worked on
- `on_hold` - Project is temporarily paused
- `completed` - Project is finished
- `archived` - Project is archived

### Authentication
All endpoints require a valid Bearer token:
```
Authorization: Bearer <access_token>
```

The authenticated user's ID is automatically used to scope all operations (users can only access their own projects).


## Milestone Routes

Base paths: 
- `/api/projects/:projectId/milestones` - For creating and listing milestones
- `/api/milestones/:id` - For updating, deleting, and completing milestones

### Endpoints

#### Create Milestone
- **POST** `/api/projects/:projectId/milestones`
- **Body**:
  ```json
  {
    "name": "Foundation Complete",
    "description": "Complete foundation work",
    "targetDate": "2024-03-01",
    "orderIndex": 1,
    "status": "not_started" // optional
  }
  ```
- **Response**: `201 Created` with milestone object
- **Errors**: 
  - `400` - Missing required fields or invalid data
  - `404` - Project not found
  - `401` - Unauthorized

#### List Milestones
- **GET** `/api/projects/:projectId/milestones`
- **Response**: `200 OK` with array of milestones (sorted by target date)
- **Errors**: 
  - `404` - Project not found
  - `401` - Unauthorized

#### Update Milestone
- **PUT** `/api/milestones/:id`
- **Body**: Any subset of milestone fields
  ```json
  {
    "name": "Updated Name",
    "description": "Updated description",
    "targetDate": "2024-04-01",
    "status": "in_progress",
    "orderIndex": 2
  }
  ```
- **Response**: `200 OK` with updated milestone object
- **Errors**: 
  - `400` - Invalid data
  - `404` - Milestone or project not found
  - `401` - Unauthorized

#### Delete Milestone
- **DELETE** `/api/milestones/:id`
- **Response**: `204 No Content`
- **Errors**: 
  - `404` - Milestone or project not found
  - `401` - Unauthorized

#### Complete Milestone
- **POST** `/api/milestones/:id/complete`
- **Response**: `200 OK` with completed milestone object (status set to "completed", completedDate set to current date)
- **Errors**: 
  - `404` - Milestone or project not found
  - `401` - Unauthorized

### Milestone Status Values
- `not_started` - Milestone has not been started
- `in_progress` - Milestone is actively being worked on
- `completed` - Milestone is finished
- `overdue` - Milestone is past target date and not completed

### Notes
- Milestones are automatically sorted by target date when listing
- The `orderIndex` field allows manual ordering of milestones with the same target date
- Completing a milestone automatically sets the `completedDate` to the current date
- Users can only access milestones for projects they own
