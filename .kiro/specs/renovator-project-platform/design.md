# Design Document: Renovator Project Management Platform

## Overview

The Renovator Project Management Platform is a web-based application designed to provide independent renovators and small interior building companies with a comprehensive project management solution. The platform consolidates project timelines, budgets, documents, photos, tasks, and resources into a unified workspace accessible from desktop and mobile devices.

### Core Design Principles

1. **Simplicity First**: Interface designed for renovators with intuitive design and experience to retrieve and populate project information
2. **Data Integrity**: Ensure all project data is consistent and recoverable
3. **Security by Default**: All data encrypted in transit and at rest
4. **OAuth 2.0 Authentication**: Leverage third-party Identity Provider (Keycloak or Google) for secure user authentication
5. **Monorepo Structure**: Organize frontend and backend code in a single repository for easier development and deployment

### Technology Stack Considerations

The platform will be built as a modern web application with:
- **Frontend**: React application with React Router and Tailwind CSS, featuring a Linear-inspired interface with clean, minimalist aesthetics
- **Backend**: RESTful API with authentication and authorization built on Node.js/TypeScript
- **Database**: PostgreSQL relational database for structured project data
- **ORM**: TypeORM for data access layer
- **File Storage**: Cloud object storage for documents and photos
- **Authentication**: OAuth 2.0 with third-party Identity Provider (Keycloak or Google)
- **Logging & Monitoring**: Sentry for error tracking, logging, and traceability
- **Containerization**: Docker containers for frontend, backend, database, and Keycloak
- **Orchestration**: Docker Compose for local development environment

## Architecture

### System Architecture

The platform follows a three-tier architecture:


```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                    │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │   Web UI     │  │  Mobile UI   │                     │
│  │  (Desktop)   │  │ (Responsive) │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    Application Layer                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Project    │  │   Budget     │  │   Document   │  │
│  │   Service    │  │   Service    │  │   Service    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                     │
│  │     Task     │  │     Auth     │                     │
│  │   Service    │  │   Service    │                     │
│  └──────────────┘  └──────────────┘                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                      Data Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  Relational  │  │    Object    │  │    Cache     │  │
│  │   Database   │  │   Storage    │  │    Layer     │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Component Interaction Flow

1. **User Request**: User interacts with React web UI
2. **Direct API Call**: Frontend makes HTTP requests directly to backend API
3. **Service Layer**: Business logic processes request
4. **Data Layer**: TypeORM handles database operations
5. **Response**: Data flows back through layers to UI

## Components and Interfaces

### 1. Project Management Component

**Responsibilities**:
- Create, read, update, delete (CRUD) operations for projects
- Project search and filtering
- Project archival and restoration
- Project status tracking

**Key Interfaces**:

```typescript
interface Project {
  id: string;
  name: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  description: string;
  startDate: Date;
  estimatedEndDate: Date;
  actualEndDate?: Date;
  status: ProjectStatus;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

enum ProjectStatus {
  PLANNING = "planning",
  ACTIVE = "active",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  ARCHIVED = "archived"
}

interface ProjectService {
  createProject(data: CreateProjectInput): Promise<Project>;
  getProject(id: string): Promise<Project>;
  updateProject(id: string, data: UpdateProjectInput): Promise<Project>;
  deleteProject(id: string): Promise<void>;
  listProjects(filters: ProjectFilters): Promise<Project[]>;
  searchProjects(query: string): Promise<Project[]>;
  archiveProject(id: string): Promise<Project>;
}
```

### 2. Timeline and Milestone Component

**Responsibilities**:
- Manage project timelines
- Create and track milestones
- Calculate project progress
- Send milestone notifications

**Key Interfaces**:

```typescript
interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string;
  targetDate: Date;
  completedDate?: Date;
  status: MilestoneStatus;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

enum MilestoneStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  OVERDUE = "overdue"
}

interface Timeline {
  projectId: string;
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  progressPercentage: number;
}

interface TimelineService {
  createMilestone(data: CreateMilestoneInput): Promise<Milestone>;
  updateMilestone(id: string, data: UpdateMilestoneInput): Promise<Milestone>;
  deleteMilestone(id: string): Promise<void>;
  getTimeline(projectId: string): Promise<Timeline>;
  calculateProgress(projectId: string): Promise<number>;
  checkOverdueMilestones(): Promise<Milestone[]>;
}
```



### 3. Task Management Component

**Responsibilities**:
- CRUD operations for tasks
- Task assignment and status tracking
- Predefined work items library management
- Task filtering and sorting
- Progress calculation

**Key Interfaces**:

```typescript
interface Task {
  id: string;
  projectId: string;
  milestoneId?: string;
  name: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  completedDate?: Date;
  estimatedPrice?: number;
  actualPrice?: number;
  perUnit?: string; // Unit of measurement (e.g., "sq ft", "linear ft", "each")
  assignedTo?: string;
  notes: string[];
  createdAt: Date;
  updatedAt: Date;
}
  updatedAt: Date;
}

enum TaskStatus {
  TODO = "todo",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  BLOCKED = "blocked"
}

enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  URGENT = "urgent"
}

interface WorkItemTemplate {
  id: string;
  name: string;
  description: string;
  category: WorkItemCategory;
  estimatedDuration?: number;
  defaultPrice?: number;
  unit?: string; // Unit of measurement (e.g., "sq ft", "linear ft", "each")
  isDefault: boolean;
  ownerId?: string;
  createdAt: Date;
  updatedAt: Date;
}

enum WorkItemCategory {
  DEMOLITION = "demolition",
  FRAMING = "framing",
  ELECTRICAL = "electrical",
  PLUMBING = "plumbing",
  HVAC = "hvac",
  DRYWALL = "drywall",
  PAINTING = "painting",
  FLOORING = "flooring",
  FINISHING = "finishing",
  CLEANUP = "cleanup",
  INSPECTION = "inspection",
  OTHER = "other"
}

interface TaskService {
  createTask(data: CreateTaskInput): Promise<Task>;
  updateTask(id: string, data: UpdateTaskInput): Promise<Task>;
  updateTaskStatus(id: string, status: TaskStatus): Promise<Task>;
  deleteTask(id: string): Promise<void>;
  listTasks(projectId: string, filters: TaskFilters): Promise<Task[]>;
  assignTask(taskId: string, userId: string): Promise<Task>;
  addTaskNote(taskId: string, note: string): Promise<Task>;
  calculateTotalTaskCosts(projectId: string): Promise<{ estimated: number; actual: number }>;
  
  // Work items library
  getWorkItemTemplates(ownerId: string, category?: WorkItemCategory): Promise<WorkItemTemplate[]>;
  getWorkItemTemplate(id: string): Promise<WorkItemTemplate>;
  createWorkItemTemplate(data: CreateWorkItemTemplateInput): Promise<WorkItemTemplate>;
  updateWorkItemTemplate(id: string, data: UpdateWorkItemTemplateInput): Promise<WorkItemTemplate>;
  deleteWorkItemTemplate(id: string): Promise<void>;
  bulkCreateTasksFromTemplates(projectId: string, templateIds: string[]): Promise<Task[]>;
}
```



### 4. Budget Management Component

**Responsibilities**:
- Budget creation and tracking
- Cost variance calculation
- Budget alerts and warnings
- Category-based budget organization
- Automatic aggregation of task actual prices into budget totals

**Key Interfaces**:

```typescript
interface Budget {
  id: string;
  projectId: string;
  totalEstimated: number;
  totalActual: number; // Includes budget items + task actual prices
  totalActualFromItems: number; // Only from budget items
  totalActualFromTasks: number; // Only from task actual prices
  variance: number;
  variancePercentage: number;
  items: BudgetItem[];
  createdAt: Date;
  updatedAt: Date;
}

interface BudgetItem {
  id: string;
  budgetId: string;
  name: string;
  category: BudgetCategory;
  estimatedCost: number;
  actualCost: number;
  variance: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

enum BudgetCategory {
  LABOR = "labor",
  MATERIALS = "materials",
  EQUIPMENT = "equipment",
  SUBCONTRACTORS = "subcontractors",
  PERMITS = "permits",
  CONTINGENCY = "contingency",
  OTHER = "other"
}

interface BudgetService {
  createBudget(projectId: string): Promise<Budget>;
  getBudget(projectId: string): Promise<Budget>;
  addBudgetItem(budgetId: string, data: CreateBudgetItemInput): Promise<BudgetItem>;
  updateBudgetItem(itemId: string, data: UpdateBudgetItemInput): Promise<BudgetItem>;
  deleteBudgetItem(itemId: string): Promise<void>;
  calculateVariance(budgetId: string): Promise<Budget>;
  calculateTotalsWithTasks(projectId: string): Promise<{ totalActualFromItems: number; totalActualFromTasks: number; totalActual: number }>;
  checkBudgetAlerts(budgetId: string): Promise<BudgetAlert[]>;
  exportBudgetToPDF(projectId: string): Promise<Buffer>;
}

interface BudgetAlert {
  budgetId: string;
  type: "warning" | "critical";
  message: string;
  variancePercentage: number;
}
```

**Budget Calculation Logic**:

The budget totals are calculated as follows:
- `totalEstimated`: Sum of all budget item estimated costs
- `totalActualFromItems`: Sum of all budget item actual costs
- `totalActualFromTasks`: Sum of all task actual prices for the project (from TaskService.calculateTotalTaskCosts)
- `totalActual`: `totalActualFromItems` + `totalActualFromTasks`
- `variance`: `totalActual` - `totalEstimated`
- `variancePercentage`: `(variance / totalEstimated) × 100`

This ensures that all project costs, whether tracked as budget items or task actual prices, are included in the budget totals.

**Budget Export Format**:

The PDF export includes:
1. **Header Section**:
   - Project name
   - Client name, email, and phone
   - Total budget amount (totalEstimated)
   - Export date

2. **Items Table**:
   - Columns: ID, Name, Quantity, Per Unit, Price
   - Rows for all tasks (with pricing information)
   - Rows for all budget items
   - Each row clearly labeled with type (Task/Budget Item)

3. **Footer Section**:
   - Subtotal by category:
     - Tasks (sum of all task actual prices)
     - Labor (sum of budget items in LABOR category)
     - Materials (sum of budget items in MATERIALS category)
     - Equipment (sum of budget items in EQUIPMENT category)
     - Subcontractors (sum of budget items in SUBCONTRACTORS category)
     - Permits (sum of budget items in PERMITS category)
     - Contingency (sum of budget items in CONTINGENCY category)
     - Other (sum of budget items in OTHER category)
   - Total Estimated: totalEstimated
   - Total Actual: totalActual
   - Variance: variance (with percentage)



### 5. Document Management Component

**Responsibilities**:
- File upload and storage
- Document categorization and tagging
- Document search and retrieval
- Secure file access control
- Soft delete with trash management

**Key Interfaces**:

```typescript
interface Document {
  id: string;
  projectId: string;
  name: string;
  type: DocumentType;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: Date;
  deletedAt?: Date;
  metadata: DocumentMetadata;
}

enum DocumentType {
  CONTRACT = "contract",
  INVOICE = "invoice",
  RECEIPT = "receipt",
  PHOTO = "photo",
  PERMIT = "permit",
  WARRANTY = "warranty",
  OTHER = "other"
}

interface DocumentMetadata {
  tags?: string[];
  description?: string;
  captureDate?: Date;
  associatedMilestoneId?: string;
}

interface DocumentService {
  uploadDocument(projectId: string, file: File, metadata: DocumentMetadata): Promise<Document>;
  getDocument(id: string): Promise<Document>;
  listDocuments(projectId: string, filters: DocumentFilters): Promise<Document[]>;
  searchDocuments(projectId: string, query: string): Promise<Document[]>;
  deleteDocument(id: string): Promise<void>;
  restoreDocument(id: string): Promise<Document>;
  permanentlyDeleteDocument(id: string): Promise<void>;
  generatePresignedUrl(id: string): Promise<string>;
}
```

### 6. Photo Management Component

**Responsibilities**:
- Photo upload with metadata extraction
- Chronological organization
- Milestone association
- Thumbnail generation
- Batch upload support

**Key Interfaces**:

```typescript
interface Photo extends Document {
  type: DocumentType.PHOTO;
  captureDate: Date;
  milestoneId?: string;
  caption?: string;
  location?: GeoLocation;
  dimensions: ImageDimensions;
}

interface ImageDimensions {
  width: number;
  height: number;
}

interface GeoLocation {
  latitude: number;
  longitude: number;
}

interface PhotoService {
  uploadPhoto(projectId: string, file: File, metadata: PhotoMetadata): Promise<Photo>;
  uploadPhotoBatch(projectId: string, files: File[], metadata: PhotoMetadata): Promise<Photo[]>;
  getPhotos(projectId: string, filters: PhotoFilters): Promise<Photo[]>;
  getPhotosByMilestone(milestoneId: string): Promise<Photo[]>;
  addCaption(photoId: string, caption: string): Promise<Photo>;
  extractMetadata(file: File): Promise<PhotoMetadata>;
}

interface PhotoMetadata {
  captureDate?: Date;
  milestoneId?: string;
  caption?: string;
  location?: GeoLocation;
}
```



### 7. Resource Management Component

**Responsibilities**:
- Track materials, equipment, and subcontractors
- Manage resource status (needed, ordered, received)
- Supplier and vendor management
- Delivery tracking and alerts

**Key Interfaces**:

```typescript
interface Resource {
  id: string;
  projectId: string;
  type: ResourceType;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  status: ResourceStatus;
  supplierId?: string;
  orderDate?: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
  attachments: string[];
  createdAt: Date;
  updatedAt: Date;
}

enum ResourceType {
  MATERIAL = "material",
  EQUIPMENT = "equipment",
  SUBCONTRACTOR = "subcontractor",
  OTHER = "other"
}

enum ResourceStatus {
  NEEDED = "needed",
  ORDERED = "ordered",
  RECEIVED = "received",
  CANCELLED = "cancelled"
}

interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  ownerId: string;
}

interface ResourceService {
  createResource(data: CreateResourceInput): Promise<Resource>;
  updateResource(id: string, data: UpdateResourceInput): Promise<Resource>;
  deleteResource(id: string): Promise<void>;
  listResources(projectId: string, filters: ResourceFilters): Promise<Resource[]>;
  markAsOrdered(id: string, orderDate: Date, expectedDelivery: Date): Promise<Resource>;
  markAsReceived(id: string, actualDelivery: Date): Promise<Resource>;
  checkOverdueDeliveries(): Promise<Resource[]>;
  
  // Supplier management
  createSupplier(data: CreateSupplierInput): Promise<Supplier>;
  listSuppliers(ownerId: string): Promise<Supplier[]>;
  updateSupplier(id: string, data: UpdateSupplierInput): Promise<Supplier>;
}
```



### 8. Authentication and Authorization Component

**Responsibilities**:
- OAuth 2.0 authorization code flow implementation
- Integration with third-party Identity Provider (Keycloak or Google)
- Token management (access and refresh tokens)
- Token validation and refresh
- Session management

**Key Interfaces**:

```typescript
interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  idpUserId: string; // User ID from Identity Provider
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  expiresIn: number;
  tokenType: string;
}

interface AuthService {
  // OAuth 2.0 Authorization Code Flow
  getAuthorizationUrl(redirectUri: string): string;
  exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthTokens>;
  refreshAccessToken(refreshToken: string): Promise<OAuthTokens>;
  revokeToken(token: string): Promise<void>;
  
  // Token validation
  validateAccessToken(token: string): Promise<TokenValidationResult>;
  getUserFromToken(token: string): Promise<User>;
  
  // Session management
  createSession(userId: string, tokens: OAuthTokens): Promise<Session>;
  getSession(sessionId: string): Promise<Session>;
  deleteSession(sessionId: string): Promise<void>;
}

interface TokenValidationResult {
  valid: boolean;
  userId?: string;
  expiresAt?: Date;
  scopes?: string[];
}

interface Session {
  id: string;
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
  createdAt: Date;
}

interface IdPConfig {
  provider: "keycloak" | "google";
  clientId: string;
  clientSecret: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  userInfoEndpoint: string;
  redirectUri: string;
}
```

## Data Models

### Database Schema

The platform uses a relational database with the following core tables:

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  company VARCHAR(255),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Sessions Table
```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  client_name VARCHAR(255) NOT NULL,
  client_email VARCHAR(255),
  client_phone VARCHAR(20),
  description TEXT,
  start_date DATE NOT NULL,
  estimated_end_date DATE NOT NULL,
  actual_end_date DATE,
  status VARCHAR(50) NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Milestones Table
```sql
CREATE TABLE milestones (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  target_date DATE NOT NULL,
  completed_date DATE,
  status VARCHAR(50) NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) NOT NULL,
  priority VARCHAR(50) NOT NULL,
  due_date DATE,
  completed_date DATE,
  estimated_price DECIMAL(12, 2),
  actual_price DECIMAL(12, 2),
  assigned_to UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Work Item Templates Table
```sql
CREATE TABLE work_item_templates (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  estimated_duration INTEGER,
  default_price DECIMAL(12, 2),
  is_default BOOLEAN DEFAULT FALSE,
  owner_id UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Budgets Table
```sql
CREATE TABLE budgets (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  total_estimated DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_actual DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_actual_from_items DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_actual_from_tasks DECIMAL(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Budget Items Table
```sql
CREATE TABLE budget_items (
  id UUID PRIMARY KEY,
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL,
  estimated_cost DECIMAL(12, 2) NOT NULL,
  actual_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Documents Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL,
  file_type VARCHAR(50) NOT NULL,
  file_size BIGINT NOT NULL,
  storage_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP,
  metadata JSONB
);
```

#### Resources Table
```sql
CREATE TABLE resources (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  cost DECIMAL(12, 2) NOT NULL,
  status VARCHAR(50) NOT NULL,
  supplier_id UUID REFERENCES suppliers(id),
  order_date DATE,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### Suppliers Table
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(20),
  address TEXT,
  notes TEXT,
  owner_id UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Data Relationships

```
users (1) ──── (N) sessions
users (1) ──── (N) projects
projects (1) ──── (N) milestones
projects (1) ──── (N) tasks
projects (1) ──── (1) budget
budget (1) ──── (N) budget_items
projects (1) ──── (N) documents
projects (1) ──── (N) resources
users (1) ──── (N) suppliers
milestones (1) ──── (N) tasks
suppliers (1) ──── (N) resources
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

After analyzing all acceptance criteria, I've identified the following areas where properties can be consolidated:

**Consolidation Decisions:**
1. **Field Capture Properties**: Multiple requirements test that creating entities captures all required fields (projects, tasks, milestones, budget items, etc.). These follow the same pattern and can be consolidated into entity-specific properties.

2. **Status Update Properties**: Several requirements test status transitions (milestones, tasks, resources). These can be consolidated into state transition properties.

3. **Calculation Properties**: Budget variance, progress calculation, and report metrics all test mathematical calculations. These are distinct and should remain separate.

4. **Search and Filter Properties**: Multiple requirements test search/filter functionality across different entities. These are similar but operate on different data types, so they should remain separate.

5. **Notification Properties**: Several requirements test notification timing and delivery. These can be consolidated by notification type.

6. **Permission Properties**: Role-based access control tests can be consolidated into permission enforcement properties.

### Core Properties



#### Project Management Properties

**Property 1: Project Creation Completeness**
*For any* valid project input data containing name, client information, start date, estimated end date, and description, creating a project should result in a project entity with all input fields preserved and a unique identifier assigned.
**Validates: Requirements 1.1, 1.5**

**Property 2: Project Search Accuracy**
*For any* collection of projects and any search query, the search results should include all and only those projects where the query matches the project name, client name, or falls within the date range.
**Validates: Requirements 1.3**

**Property 3: Project Archival Preservation**
*For any* project, archiving it should change its status to "archived" while preserving all project data (name, dates, client info, description, and all related entities).
**Validates: Requirements 1.4**

**Property 4: Active Projects Visibility**
*For any* user's project collection, retrieving active projects should return all and only those projects with status not equal to "archived" or "completed".
**Validates: Requirements 1.2**

#### Timeline and Milestone Properties

**Property 5: Milestone Creation Completeness**
*For any* valid milestone input data containing name, target date, description, and project association, creating a milestone should result in a milestone entity with all input fields preserved and initial status set to "not_started".
**Validates: Requirements 2.1, 2.2**

**Property 6: Milestone Chronological Ordering**
*For any* project timeline, retrieving milestones should return them sorted by target date in ascending chronological order.
**Validates: Requirements 2.5**

**Property 7: Milestone Completion Updates Progress**
*For any* milestone, marking it as complete should set its status to "completed", record the completion date, and trigger a recalculation of the project's overall progress percentage.
**Validates: Requirements 2.4**

**Property 8: Overdue Milestone Detection**
*For any* milestone with a target date in the past and status not equal to "completed", the milestone should be identified as overdue.
**Validates: Requirements 2.6**

**Property 9: Milestone Due Date Notifications**
*For any* milestone with a target date exactly 3 days in the future, the notification check should generate a notification for the project owner.
**Validates: Requirements 2.3**

#### Task Management Properties

**Property 10: Task Creation Completeness**
*For any* valid task input data containing name, description, priority, and optional milestone/due date/pricing, creating a task should result in a task entity with all input fields preserved, pricing fields set to provided values or null, and initial status set to "todo".
**Validates: Requirements 3.1, 3.2**

**Property 11: Work Items Library Organization**
*For any* work item template library for a specific user, retrieving templates should return them grouped by category with all templates in each category sharing the same category value, including both system default templates and user-created custom templates.
**Validates: Requirements 3.3, 3.16**

**Property 12: Bulk Task Creation from Templates**
*For any* set of work item template IDs and a target project, bulk creating tasks should result in one task created for each template with the task name and description matching the template, and if the template has a default price and unit, the task's estimated price should be set to that default price.
**Validates: Requirements 3.6, 3.5, 3.17**

**Property 13: Task Filtering Accuracy**
*For any* collection of tasks and any filter criteria (status, priority, milestone, or due date), the filtered results should include all and only those tasks matching the specified criteria.
**Validates: Requirements 3.6**

**Property 14: Task Status Transitions**
*For any* task, updating its status should allow transitions between todo, in_progress, completed, and blocked states, and when transitioning to completed, should record the completion date and trigger milestone progress recalculation.
**Validates: Requirements 3.9, 3.10**

**Property 15: Task Deletion Impact**
*For any* task associated with a milestone or budget, deleting the task should remove it from the system and trigger recalculation of the milestone's progress and the project's budget totals.
**Validates: Requirements 3.11**

**Property 16: Overdue Task Detection**
*For any* task with a due date in the past and status not equal to "completed", the task should be identified as overdue.
**Validates: Requirements 3.12**

**Property 17: Task Note Persistence**
*For any* task and any note text, adding a note should result in the note being appended to the task's notes collection and retrievable in subsequent queries.
**Validates: Requirements 3.13**

**Property 18: Task Cost Aggregation**
*For any* project with tasks, calculating total task costs should return the sum of all estimated prices as the estimated total and the sum of all actual prices as the actual total, excluding tasks where pricing is null.
**Validates: Requirements 3.14**

#### Budget Management Properties

**Property 19: Budget Item Creation Completeness**
*For any* valid budget item input containing name, category, and estimated cost, creating a budget item should result in an item with all fields preserved and actual cost initialized to zero.
**Validates: Requirements 4.1, 4.2**

**Property 20: Budget Variance Calculation**
*For any* budget item with estimated cost E and actual cost A, the variance should equal (A - E) and the percentage variance should equal ((A - E) / E) × 100.
**Validates: Requirements 4.3**

**Property 21: Budget Totals Aggregation**
*For any* budget with items and associated project with tasks, the total estimated should equal the sum of all item estimated costs, total actual from items should equal the sum of all item actual costs, total actual from tasks should equal the sum of all task actual prices, total actual should equal (total actual from items + total actual from tasks), and remaining budget should equal (total estimated - total actual).
**Validates: Requirements 4.4, 4.5, 4.6, 4.9, 4.10**

**Property 22: Budget Alert Threshold**
*For any* budget where actual costs exceed estimated costs by more than 10%, a budget warning alert should be generated.
**Validates: Requirements 4.7**

**Property 23: Budget Export Completeness**
*For any* project with budget items and tasks, exporting the budget to PDF should generate a document containing a header with project name and client details, a table with all tasks and budget items including ID, name, quantity, per unit, and price columns, and a footer with aggregated sums by type (tasks, labor, materials, subcontractors, equipment, permits, contingency, other).
**Validates: Requirements 4.11, 4.12**

#### Document Management Properties

**Property 24: Document Upload Completeness**
*For any* valid document file and metadata containing type and project association, uploading should result in a document entity with file stored, metadata preserved, upload timestamp recorded, and uploader ID captured.
**Validates: Requirements 5.2**

**Property 24: Document Format Validation**
*For any* file upload attempt, files with extensions in the allowed set (PDF, JPG, PNG, HEIC, DOC, DOCX, XLS, XLSX) should succeed, and files with other extensions should be rejected.
**Validates: Requirements 5.1**

**Property 25: Document Search Accuracy**
*For any* collection of documents and search query, results should include all and only those documents where the query matches document name, type, or the upload date falls within the specified date range.
**Validates: Requirements 5.4**

**Property 27: Document Soft Delete**
*For any* document, deleting it should set the deleted_at timestamp to the current time, and the document should remain retrievable from trash for 30 days before permanent deletion.
**Validates: Requirements 5.7**

#### Photo Management Properties

**Property 28: Photo Metadata Extraction**
*For any* photo file with EXIF metadata containing capture date, uploading should result in the capture date being extracted and stored in the photo's metadata.
**Validates: Requirements 6.1**

**Property 28: Photo Chronological Ordering**
*For any* collection of project photos, retrieving them should return photos sorted by capture date in ascending chronological order.
**Validates: Requirements 6.3**

**Property 29: Photo Batch Upload**
*For any* set of N photo files uploaded simultaneously, the operation should result in exactly N photo entities created, each with its own metadata and storage URL.
**Validates: Requirements 6.6**

**Property 31: Photo Thumbnail Generation**
*For any* uploaded photo, a thumbnail image should be automatically generated and its URL stored in the photo entity's thumbnail_url field.
**Validates: Requirements 6.7**

#### Resource Management Properties

**Property 32: Resource Creation Completeness**
*For any* valid resource input containing type, name, quantity, unit, cost, and status, creating a resource should result in an entity with all fields preserved and initial status set to "needed".
**Validates: Requirements 7.1**

**Property 32: Resource Status Transitions**
*For any* resource, marking it as ordered should update status to "ordered" and record order date and expected delivery date; marking it as received should update status to "received" and record actual delivery date.
**Validates: Requirements 7.2, 7.3**

**Property 33: Resource Grouping by Status**
*For any* collection of project resources, retrieving them grouped by status should return resources organized into groups where all resources in each group share the same status value.
**Validates: Requirements 7.5**

**Property 35: Overdue Delivery Detection**
*For any* resource with status "ordered" and expected delivery date more than 2 days in the past, the resource should be identified as having an overdue delivery.
**Validates: Requirements 7.7**

#### Authentication and Security Properties

**Property 36: OAuth Authorization URL Generation**
*For any* valid redirect URI, generating an authorization URL should return a properly formatted OAuth 2.0 authorization endpoint URL with client ID, redirect URI, response type, and state parameters.
**Validates: Requirements 8.1**

**Property 36: Authorization Code Exchange**
*For any* valid authorization code and redirect URI, exchanging the code for tokens should return an access token, refresh token, and expiration time.
**Validates: Requirements 8.4**

**Property 37: Access Token Validation**
*For any* valid access token, validation should return a successful result with user ID and expiration time; for invalid or expired tokens, validation should return a failure result.
**Validates: Requirements 8.5**

**Property 38: Token Refresh**
*For any* valid refresh token, requesting a new access token should return a new access token with updated expiration time.
**Validates: Requirements 8.6**

**Property 39: Session Creation**
*For any* user ID and OAuth tokens, creating a session should store the access token, refresh token, and expiration time, and return a unique session ID.
**Validates: Requirements 8.4**

**Property 41: Token Revocation**
*For any* valid access token, revoking it should invalidate the token and delete the associated session.
**Validates: Requirements 8.8**

## Error Handling

### Error Categories

The platform implements a comprehensive error handling strategy organized by error type:

#### 1. Validation Errors (400 Bad Request)

**Scenarios**:
- Missing required fields in create/update operations
- Invalid data formats (email, phone, dates)
- Invalid enum values (status, priority, category)
- Business rule violations (end date before start date)

**Handling**:
```typescript
interface ValidationError {
  code: "VALIDATION_ERROR";
  message: string;
  fields: {
    field: string;
    error: string;
  }[];
}
```

**Response**: Return detailed field-level errors to help users correct input

#### 2. Authentication Errors (401 Unauthorized)

**Scenarios**:
- Invalid or expired access token
- Missing authentication token
- Failed token validation
- OAuth authorization code exchange failure

**Handling**:
```typescript
interface AuthError {
  code: "AUTH_ERROR";
  message: string;
  reason: "invalid_token" | "expired_token" | "missing_token" | "oauth_error";
}
```

**Response**: Clear error message without revealing security details

#### 3. Authorization Errors (403 Forbidden)

**Scenarios**:
- User attempting to access resources they don't own
- Insufficient permissions for requested operation

**Handling**:
```typescript
interface AuthorizationError {
  code: "AUTHORIZATION_ERROR";
  message: string;
  requiredPermission: string;
}
```

**Response**: Inform user they lack necessary permissions

#### 4. Not Found Errors (404 Not Found)

**Scenarios**:
- Requested resource doesn't exist
- Resource was deleted
- Invalid resource ID

**Handling**:
```typescript
interface NotFoundError {
  code: "NOT_FOUND";
  message: string;
  resourceType: string;
  resourceId: string;
}
```

**Response**: Clear message indicating resource doesn't exist

#### 5. Conflict Errors (409 Conflict)

**Scenarios**:
- Duplicate email during registration
- Concurrent update conflicts
- Business logic conflicts (can't delete project with active tasks)

**Handling**:
```typescript
interface ConflictError {
  code: "CONFLICT";
  message: string;
  conflictType: "duplicate" | "concurrent_update" | "business_rule";
  details?: any;
}
```

**Response**: Explain the conflict and suggest resolution

#### 6. File Upload Errors (413 Payload Too Large / 415 Unsupported Media Type)

**Scenarios**:
- File size exceeds maximum limit
- Unsupported file format
- Corrupted file upload

**Handling**:
```typescript
interface FileUploadError {
  code: "FILE_UPLOAD_ERROR";
  message: string;
  reason: "file_too_large" | "unsupported_format" | "corrupted_file";
  maxSize?: number;
  supportedFormats?: string[];
}
```

**Response**: Inform user of file requirements and limits

#### 7. Server Errors (500 Internal Server Error)

**Scenarios**:
- Unexpected exceptions
- Database connection failures
- External service failures (IdP unavailable)

**Handling**:
```typescript
interface ServerError {
  code: "SERVER_ERROR";
  message: string;
  errorId: string; // For support reference
}
```

**Response**: Generic error message with error ID for support

### Error Handling Patterns

#### API Layer
- All endpoints wrapped in try-catch blocks
- Errors transformed to appropriate HTTP status codes
- Consistent error response format
- Error logging with context

#### Service Layer
- Business logic errors thrown as custom exceptions
- Validation performed before database operations
- Transaction rollback on errors
- Detailed error messages for debugging

#### Client Layer
- Global error handler for API responses
- User-friendly error messages displayed
- Automatic retry for transient errors
- OAuth error handling for authentication flows

### Logging Strategy

**Log Levels**:
- **ERROR**: All errors, exceptions, and failures
- **WARN**: Validation failures, permission denials, retry attempts
- **INFO**: Successful operations, state changes, user actions
- **DEBUG**: Detailed execution flow (development only)

**Log Context**:
- User ID (when authenticated)
- Request ID (for tracing)
- Timestamp
- Operation/endpoint
- Error stack trace (for errors)



## Testing Strategy

### Overview

The platform employs a comprehensive testing strategy combining unit tests, property-based tests, integration tests, and end-to-end tests to ensure correctness, reliability, and maintainability.

### Property-Based Testing

Property-based testing is the primary approach for validating the 56 correctness properties defined in this design. Each property will be implemented as a property-based test that generates random inputs and verifies the property holds across all test cases.

**Testing Library**: The implementation will use a property-based testing library appropriate for the chosen programming language:
- **JavaScript/TypeScript**: fast-check
- **Python**: Hypothesis
- **Java**: jqwik
- **C#**: FsCheck

**Configuration**:
- Minimum 100 iterations per property test
- Each test tagged with: `Feature: renovator-project-platform, Property {N}: {property_text}`
- Shrinking enabled to find minimal failing cases
- Seed-based reproducibility for failed tests

**Property Test Structure**:
```typescript
// Example property test structure
test('Property 1: Project Creation Completeness', () => {
  fc.assert(
    fc.property(
      projectInputGenerator(),
      (input) => {
        const project = createProject(input);
        
        // Verify all fields preserved
        expect(project.name).toBe(input.name);
        expect(project.clientName).toBe(input.clientName);
        expect(project.startDate).toEqual(input.startDate);
        expect(project.estimatedEndDate).toEqual(input.estimatedEndDate);
        expect(project.description).toBe(input.description);
        
        // Verify unique ID assigned
        expect(project.id).toBeDefined();
        expect(typeof project.id).toBe('string');
      }
    ),
    { numRuns: 100 }
  );
});
```

**Generator Strategy**:
- Create custom generators for domain entities (Project, Task, Milestone, etc.)
- Generate valid and edge-case data (empty strings, boundary dates, large numbers)
- Use combinators to create complex scenarios
- Ensure generated data respects business constraints

### Unit Testing

Unit tests complement property-based tests by focusing on specific examples, edge cases, and error conditions.

**Focus Areas**:
- **Specific Examples**: Test known scenarios with concrete data
- **Edge Cases**: Empty collections, null values, boundary conditions
- **Error Conditions**: Invalid inputs, permission denials, not found scenarios
- **Integration Points**: Service interactions, database queries, external APIs

**Balance**: Avoid writing too many unit tests for scenarios already covered by property tests. Unit tests should focus on:
1. Concrete examples that demonstrate correct behavior
2. Error handling and validation
3. Integration between components
4. Scenarios difficult to express as properties

**Example Unit Tests**:
```typescript
describe('Budget Service', () => {
  test('should reject budget item with negative cost', () => {
    expect(() => {
      createBudgetItem({ name: 'Test', category: 'LABOR', estimatedCost: -100 });
    }).toThrow(ValidationError);
  });
  
  test('should handle empty budget gracefully', () => {
    const budget = getBudget(projectId);
    expect(budget.totalEstimated).toBe(0);
    expect(budget.totalActual).toBe(0);
    expect(budget.items).toEqual([]);
  });
});
```

### Integration Testing

Integration tests verify that components work correctly together, focusing on:
- Database operations and transactions
- Service layer interactions
- API endpoint behavior
- Authentication and authorization flows
- File upload and storage
- Email sending
- Notification delivery

**Approach**:
- Use test database with migrations
- Mock external services (email, storage)
- Test complete request/response cycles
- Verify side effects (notifications, logs)

### End-to-End Testing

E2E tests validate critical user workflows from the UI perspective:
- User registration and login
- Project creation and management
- Task and milestone tracking
- Budget management
- Document upload and retrieval
- Offline mode and sync
- Multi-user collaboration

**Tools**: Playwright or Cypress for browser automation

**Focus**: Happy paths and critical business flows, not exhaustive coverage

### Test Organization

```
tests/
├── unit/
│   ├── services/
│   ├── models/
│   └── utils/
├── property/
│   ├── project-properties.test.ts
│   ├── task-properties.test.ts
│   ├── budget-properties.test.ts
│   └── ...
├── integration/
│   ├── api/
│   ├── database/
│   └── services/
└── e2e/
    ├── user-flows/
    └── critical-paths/
```

### Coverage Goals

- **Property Tests**: 100% of defined correctness properties
- **Unit Tests**: 80%+ code coverage for business logic
- **Integration Tests**: All API endpoints and service interactions
- **E2E Tests**: All critical user workflows

### Continuous Integration

All tests run automatically on:
- Every pull request
- Every commit to main branch
- Nightly builds (full test suite including long-running tests)

**CI Pipeline**:
1. Lint and type checking
2. Unit tests (fast feedback)
3. Property-based tests (comprehensive validation)
4. Integration tests (database and services)
5. E2E tests (critical paths only in PR, full suite nightly)

### Test Data Management

**Fixtures**: Predefined test data for consistent unit tests
**Factories**: Generate test entities with sensible defaults
**Generators**: Property-based test generators for random data
**Cleanup**: Automatic cleanup after each test to prevent pollution

### Performance Testing

While not the primary focus, performance tests should validate:
- API response times under load
- Database query performance
- File upload/download speeds
- Sync performance with large queues
- Report generation time

**Tools**: k6 or Artillery for load testing

### Security Testing

Security-focused tests should verify:
- Authentication and authorization enforcement
- SQL injection prevention
- XSS prevention
- CSRF protection
- Password hashing
- Session management
- File upload validation

