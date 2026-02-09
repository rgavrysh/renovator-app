import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource } from '../config/database';
import { TaskService } from './TaskService';
import { WorkItemTemplateService } from './WorkItemTemplateService';
import { ProjectService } from './ProjectService';
import { MilestoneService } from './MilestoneService';
import { Task, TaskStatus, TaskPriority } from '../entities/Task';
import { WorkItemCategory } from '../entities/WorkItemTemplate';
import { Project, ProjectStatus } from '../entities/Project';
import { MilestoneStatus } from '../entities/Milestone';
import { User } from '../entities/User';

describe('TaskService', () => {
  let taskService: TaskService;
  let templateService: WorkItemTemplateService;
  let projectService: ProjectService;
  let milestoneService: MilestoneService;
  let testProjectId: string;
  let testMilestoneId: string;
  let testUser: User;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    taskService = new TaskService();
    templateService = new WorkItemTemplateService();
    projectService = new ProjectService();
    milestoneService = new MilestoneService();

    // Create or find test user
    const userRepository = AppDataSource.getRepository(User);
    let existingUser = await userRepository.findOne({ 
      where: { email: 'tasktest@example.com' } 
    });
    
    if (existingUser) {
      testUser = existingUser;
    } else {
      testUser = userRepository.create({
        email: 'tasktest@example.com',
        firstName: 'Task',
        lastName: 'Tester',
        idpUserId: 'task-test-idp-user-id',
      });
      testUser = await userRepository.save(testUser);
    }
  });

  afterAll(async () => {
    // Clean up test data - delete in correct order due to foreign key constraints
    if (AppDataSource.isInitialized) {
      // Delete all work item templates created by tests
      const templateRepository = AppDataSource.getRepository('WorkItemTemplate');
      await templateRepository.createQueryBuilder()
        .delete()
        .where('owner_id = :ownerId', { ownerId: testUser.id })
        .execute();
      
      // Delete all tasks created by tests
      const taskRepository = AppDataSource.getRepository(Task);
      await taskRepository.createQueryBuilder()
        .delete()
        .where('projectId IN (SELECT id FROM projects WHERE owner_id = :ownerId)', { ownerId: testUser.id })
        .execute();
      
      // Delete all projects
      const projectRepository = AppDataSource.getRepository(Project);
      await projectRepository.createQueryBuilder()
        .delete()
        .where('owner_id = :ownerId', { ownerId: testUser.id })
        .execute();
      
      // Delete test user
      const userRepository = AppDataSource.getRepository(User);
      await userRepository.delete({ id: testUser.id });
      
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Create a test project
    const project = await projectService.createProject({
      name: 'Test Project',
      clientName: 'Test Client',
      clientEmail: 'client@test.com',
      description: 'Test project for task service',
      startDate: new Date('2024-01-01'),
      estimatedEndDate: new Date('2024-12-31'),
      ownerId: testUser.id,
      status: ProjectStatus.ACTIVE,
    });
    testProjectId = project.id;

    // Create a test milestone
    const milestone = await milestoneService.createMilestone({
      projectId: testProjectId,
      name: 'Test Milestone',
      description: 'Test milestone for tasks',
      targetDate: new Date('2024-06-30'),
      orderIndex: 1,
      status: MilestoneStatus.NOT_STARTED,
    });
    testMilestoneId = milestone.id;
  });

  describe('createTask', () => {
    it('should create a task with all required fields', async () => {
      const taskData = {
        projectId: testProjectId,
        name: 'Install drywall',
        description: 'Install drywall in living room',
        priority: TaskPriority.HIGH,
        dueDate: new Date('2024-03-15'),
        estimatedPrice: 1500,
      };

      const task = await taskService.createTask(taskData);

      expect(task.id).toBeDefined();
      expect(task.projectId).toBe(testProjectId);
      expect(task.name).toBe(taskData.name);
      expect(task.description).toBe(taskData.description);
      expect(task.priority).toBe(taskData.priority);
      expect(task.status).toBe(TaskStatus.TODO);
      expect(task.estimatedPrice).toBe(taskData.estimatedPrice);
      expect(task.notes).toEqual([]);
    });

    it('should create a task with milestone association', async () => {
      const taskData = {
        projectId: testProjectId,
        milestoneId: testMilestoneId,
        name: 'Paint walls',
        priority: TaskPriority.MEDIUM,
      };

      const task = await taskService.createTask(taskData);

      expect(task.milestoneId).toBe(testMilestoneId);
    });

    it('should create a task with optional pricing fields as null', async () => {
      const taskData = {
        projectId: testProjectId,
        name: 'Cleanup',
      };

      const task = await taskService.createTask(taskData);

      expect(task.estimatedPrice).toBeNull();
      expect(task.actualPrice).toBeNull();
    });

    it('should set default status to TODO', async () => {
      const taskData = {
        projectId: testProjectId,
        name: 'Test Task',
      };

      const task = await taskService.createTask(taskData);

      expect(task.status).toBe(TaskStatus.TODO);
    });

    it('should set default priority to MEDIUM', async () => {
      const taskData = {
        projectId: testProjectId,
        name: 'Test Task',
      };

      const task = await taskService.createTask(taskData);

      expect(task.priority).toBe(TaskPriority.MEDIUM);
    });

    it('should throw error for invalid project ID', async () => {
      const taskData = {
        projectId: 'invalid-id',
        name: 'Test Task',
      };

      await expect(taskService.createTask(taskData)).rejects.toThrow('Invalid project ID');
    });

    it('should throw error for invalid milestone ID', async () => {
      const taskData = {
        projectId: testProjectId,
        milestoneId: 'invalid-id',
        name: 'Test Task',
      };

      await expect(taskService.createTask(taskData)).rejects.toThrow('Invalid milestone ID');
    });
  });

  describe('getTask', () => {
    it('should retrieve a task by ID', async () => {
      const created = await taskService.createTask({
        projectId: testProjectId,
        name: 'Test Task',
      });

      const retrieved = await taskService.getTask(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe(created.name);
    });

    it('should throw error for non-existent task', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';
      await expect(taskService.getTask(fakeId)).rejects.toThrow('Task not found');
    });

    it('should throw error for invalid task ID', async () => {
      await expect(taskService.getTask('invalid-id')).rejects.toThrow('Task not found');
    });
  });

  describe('updateTask', () => {
    it('should update task fields', async () => {
      const task = await taskService.createTask({
        projectId: testProjectId,
        name: 'Original Name',
        priority: TaskPriority.LOW,
      });

      const updated = await taskService.updateTask(task.id, {
        name: 'Updated Name',
        priority: TaskPriority.HIGH,
        estimatedPrice: 2000,
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.priority).toBe(TaskPriority.HIGH);
      expect(updated.estimatedPrice).toBe(2000);
    });

    it('should set completedDate when status changes to COMPLETED', async () => {
      const task = await taskService.createTask({
        projectId: testProjectId,
        name: 'Test Task',
        status: TaskStatus.IN_PROGRESS,
      });

      const updated = await taskService.updateTask(task.id, {
        status: TaskStatus.COMPLETED,
      });

      expect(updated.status).toBe(TaskStatus.COMPLETED);
      expect(updated.completedDate).toBeDefined();
    });

    it('should not set completedDate if already completed', async () => {
      const task = await taskService.createTask({
        projectId: testProjectId,
        name: 'Test Task',
        status: TaskStatus.COMPLETED,
      });

      const originalDate = new Date('2024-01-01');
      task.completedDate = originalDate;
      await taskService.updateTask(task.id, { completedDate: originalDate });

      const updated = await taskService.updateTask(task.id, {
        name: 'Updated Name',
      });

      // Compare dates as strings since DB returns date strings
      expect(updated.completedDate?.toString()).toEqual(originalDate.toISOString().split('T')[0]);
    });
  });

  describe('deleteTask', () => {
    it('should delete a task', async () => {
      const task = await taskService.createTask({
        projectId: testProjectId,
        name: 'Task to Delete',
      });

      await taskService.deleteTask(task.id);

      await expect(taskService.getTask(task.id)).rejects.toThrow('Task not found');
    });
  });

  describe('listTasks', () => {
    beforeEach(async () => {
      // Create multiple tasks for filtering tests
      await taskService.createTask({
        projectId: testProjectId,
        name: 'Task 1',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        milestoneId: testMilestoneId,
        dueDate: new Date('2024-03-01'),
      });

      await taskService.createTask({
        projectId: testProjectId,
        name: 'Task 2',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date('2024-04-01'),
      });

      await taskService.createTask({
        projectId: testProjectId,
        name: 'Task 3',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.LOW,
        dueDate: new Date('2024-05-01'),
      });
    });

    it('should list all tasks for a project', async () => {
      const tasks = await taskService.listTasks(testProjectId);

      expect(tasks.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter tasks by status', async () => {
      const tasks = await taskService.listTasks(testProjectId, {
        status: TaskStatus.TODO,
      });

      expect(tasks.length).toBeGreaterThanOrEqual(1);
      tasks.forEach((task) => {
        expect(task.status).toBe(TaskStatus.TODO);
      });
    });

    it('should filter tasks by multiple statuses', async () => {
      const tasks = await taskService.listTasks(testProjectId, {
        status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
      });

      expect(tasks.length).toBeGreaterThanOrEqual(2);
      tasks.forEach((task) => {
        expect([TaskStatus.TODO, TaskStatus.IN_PROGRESS]).toContain(task.status);
      });
    });

    it('should filter tasks by priority', async () => {
      const tasks = await taskService.listTasks(testProjectId, {
        priority: TaskPriority.HIGH,
      });

      expect(tasks.length).toBeGreaterThanOrEqual(1);
      tasks.forEach((task) => {
        expect(task.priority).toBe(TaskPriority.HIGH);
      });
    });

    it('should filter tasks by milestone', async () => {
      const tasks = await taskService.listTasks(testProjectId, {
        milestoneId: testMilestoneId,
      });

      expect(tasks.length).toBeGreaterThanOrEqual(1);
      tasks.forEach((task) => {
        expect(task.milestoneId).toBe(testMilestoneId);
      });
    });

    it('should filter tasks by due date range', async () => {
      const tasks = await taskService.listTasks(testProjectId, {
        dueDateFrom: new Date('2024-03-01'),
        dueDateTo: new Date('2024-04-30'),
      });

      expect(tasks.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('assignTask', () => {
    it('should assign a task to a user', async () => {
      const task = await taskService.createTask({
        projectId: testProjectId,
        name: 'Task to Assign',
      });

      const assigned = await taskService.assignTask(task.id, testUser.id);

      expect(assigned.assignedTo).toBe(testUser.id);
    });

    it('should throw error for invalid user ID', async () => {
      const task = await taskService.createTask({
        projectId: testProjectId,
        name: 'Task to Assign',
      });

      await expect(taskService.assignTask(task.id, 'invalid-id')).rejects.toThrow(
        'Invalid user ID'
      );
    });
  });

  describe('addTaskNote', () => {
    it('should add a note to a task', async () => {
      const task = await taskService.createTask({
        projectId: testProjectId,
        name: 'Task with Notes',
      });

      const updated = await taskService.addTaskNote(task.id, 'First note');

      expect(updated.notes).toContain('First note');
      expect(updated.notes.length).toBe(1);
    });

    it('should append multiple notes', async () => {
      const task = await taskService.createTask({
        projectId: testProjectId,
        name: 'Task with Notes',
      });

      await taskService.addTaskNote(task.id, 'First note');
      const updated = await taskService.addTaskNote(task.id, 'Second note');

      expect(updated.notes).toContain('First note');
      expect(updated.notes).toContain('Second note');
      expect(updated.notes.length).toBe(2);
    });
  });

  describe('calculateTotalTaskCosts', () => {
    it('should calculate total estimated and actual costs', async () => {
      await taskService.createTask({
        projectId: testProjectId,
        name: 'Task 1',
        estimatedPrice: 1000,
        actualPrice: 900,
      });

      await taskService.createTask({
        projectId: testProjectId,
        name: 'Task 2',
        estimatedPrice: 2000,
        actualPrice: 2100,
      });

      const costs = await taskService.calculateTotalTaskCosts(testProjectId);

      expect(costs.estimated).toBe(3000);
      expect(costs.actual).toBe(3000);
    });

    it('should exclude tasks with null pricing', async () => {
      await taskService.createTask({
        projectId: testProjectId,
        name: 'Task 1',
        estimatedPrice: 1000,
        actualPrice: 900,
      });

      await taskService.createTask({
        projectId: testProjectId,
        name: 'Task 2',
      });

      const costs = await taskService.calculateTotalTaskCosts(testProjectId);

      expect(costs.estimated).toBe(1000);
      expect(costs.actual).toBe(900);
    });

    it('should return zero for project with no tasks', async () => {
      const project = await projectService.createProject({
        name: 'Empty Project',
        clientName: 'Test Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-12-31'),
        ownerId: testUser.id,
      });

      const costs = await taskService.calculateTotalTaskCosts(project.id);

      expect(costs.estimated).toBe(0);
      expect(costs.actual).toBe(0);
    });
  });

  describe('bulkCreateTasksFromTemplates', () => {
    it('should create tasks from templates', async () => {
      // Create test templates
      const template1 = await templateService.createTemplate({
        name: 'Template Task 1',
        description: 'Description 1',
        category: WorkItemCategory.PAINTING,
        defaultPrice: 500,
        isDefault: false,
        ownerId: testUser.id,
      });

      const template2 = await templateService.createTemplate({
        name: 'Template Task 2',
        description: 'Description 2',
        category: WorkItemCategory.FLOORING,
        defaultPrice: 1000,
        isDefault: false,
        ownerId: testUser.id,
      });

      const tasks = await taskService.bulkCreateTasksFromTemplates(testProjectId, [
        template1.id,
        template2.id,
      ]);

      expect(tasks.length).toBe(2);
      expect(tasks[0].name).toBe('Template Task 1');
      expect(tasks[0].description).toBe('Description 1');
      expect(Number(tasks[0].estimatedPrice)).toBe(500);
      expect(tasks[1].name).toBe('Template Task 2');
      expect(Number(tasks[1].estimatedPrice)).toBe(1000);
    });

    it('should set default status and priority for bulk created tasks', async () => {
      const template = await templateService.createTemplate({
        name: 'Template Task',
        category: WorkItemCategory.DEMOLITION,
        isDefault: false,
        ownerId: testUser.id,
      });

      const tasks = await taskService.bulkCreateTasksFromTemplates(testProjectId, [
        template.id,
      ]);

      expect(tasks[0].status).toBe(TaskStatus.TODO);
      expect(tasks[0].priority).toBe(TaskPriority.MEDIUM);
    });

    it('should throw error if template not found', async () => {
      const fakeId = '123e4567-e89b-12d3-a456-426614174999';

      await expect(
        taskService.bulkCreateTasksFromTemplates(testProjectId, [fakeId])
      ).rejects.toThrow('One or more templates not found');
    });
  });

  describe('checkOverdueTasks', () => {
    it('should identify overdue tasks', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      await taskService.createTask({
        projectId: testProjectId,
        name: 'Overdue Task',
        status: TaskStatus.TODO,
        dueDate: pastDate,
      });

      const overdueTasks = await taskService.checkOverdueTasks();

      expect(overdueTasks.length).toBeGreaterThanOrEqual(1);
      const overdueTask = overdueTasks.find((t) => t.name === 'Overdue Task');
      expect(overdueTask).toBeDefined();
    });

    it('should not include completed tasks as overdue', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      await taskService.createTask({
        projectId: testProjectId,
        name: 'Completed Overdue Task',
        status: TaskStatus.COMPLETED,
        dueDate: pastDate,
      });

      const overdueTasks = await taskService.checkOverdueTasks();

      const completedTask = overdueTasks.find(
        (t) => t.name === 'Completed Overdue Task'
      );
      expect(completedTask).toBeUndefined();
    });
  });

  describe('completeTask', () => {
    it('should mark task as completed with completion date', async () => {
      const task = await taskService.createTask({
        projectId: testProjectId,
        name: 'Task to Complete',
        status: TaskStatus.IN_PROGRESS,
      });

      const completed = await taskService.completeTask(task.id);

      expect(completed.status).toBe(TaskStatus.COMPLETED);
      expect(completed.completedDate).toBeDefined();
    });
  });
});
