import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource } from '../config/database';
import { TaskService } from '../services/TaskService';
import { WorkItemTemplateService } from '../services/WorkItemTemplateService';
import { ProjectService } from '../services/ProjectService';
import { Task, TaskStatus, TaskPriority } from '../entities/Task';
import { Project } from '../entities/Project';
import { User } from '../entities/User';
import { WorkItemTemplate, WorkItemCategory } from '../entities/WorkItemTemplate';

describe('Task Routes', () => {
  let taskService: TaskService;
  let workItemService: WorkItemTemplateService;
  let projectService: ProjectService;
  let testUser: User;
  let testProject: Project;
  let testTemplate: WorkItemTemplate;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    taskService = new TaskService();
    workItemService = new WorkItemTemplateService();
    projectService = new ProjectService();

    // Create test user or find existing one
    const userRepo = AppDataSource.getRepository(User);
    const existingUser = await userRepo.findOne({
      where: { email: 'task-test@example.com' },
    });

    if (existingUser) {
      testUser = existingUser;
    } else {
      testUser = userRepo.create({
        email: 'task-test@example.com',
        firstName: 'Task',
        lastName: 'Tester',
        idpUserId: 'task-test-idp-123',
      });
      testUser = await userRepo.save(testUser);
    }

    // Create test project
    testProject = await projectService.createProject({
      name: 'Task Test Project',
      clientName: 'Task Test Client',
      startDate: new Date('2024-01-01'),
      estimatedEndDate: new Date('2024-12-31'),
      ownerId: testUser.id,
    });

    // Create test work item template
    testTemplate = await workItemService.createTemplate({
      name: 'Test Template',
      description: 'Test template description',
      category: WorkItemCategory.PAINTING,
      defaultPrice: 500,
      isDefault: false,
      ownerId: testUser.id,
    });
  });

  afterAll(async () => {
    // Cleanup - delete in correct order to avoid foreign key violations
    if (testTemplate && testTemplate.id) {
      try {
        await workItemService.deleteTemplate(testTemplate.id, testUser.id);
      } catch (error) {
        // Template may already be deleted
      }
    }
    if (testProject && testProject.id) {
      try {
        await projectService.deleteProject(testProject.id, testUser.id);
      } catch (error) {
        // Project may already be deleted
      }
    }
    // Don't delete test user - it may be used by other tests

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  describe('POST /api/projects/:projectId/tasks', () => {
    it('should create a task with all fields', async () => {
      const taskData = {
        name: 'Paint living room',
        description: 'Paint the living room walls',
        priority: TaskPriority.HIGH,
        dueDate: new Date('2024-06-01'),
        estimatedPrice: 1000,
        actualPrice: 950,
      };

      const task = await taskService.createTask({
        projectId: testProject.id,
        ...taskData,
      });

      expect(task).toBeDefined();
      expect(task.id).toBeDefined();
      expect(task.name).toBe(taskData.name);
      expect(task.description).toBe(taskData.description);
      expect(task.priority).toBe(taskData.priority);
      expect(task.status).toBe(TaskStatus.TODO);
      expect(task.estimatedPrice).toBe(taskData.estimatedPrice);
      expect(task.actualPrice).toBe(taskData.actualPrice);
      expect(task.projectId).toBe(testProject.id);

      // Cleanup
      await taskService.deleteTask(task.id);
    });

    it('should create a task with minimal fields', async () => {
      const task = await taskService.createTask({
        projectId: testProject.id,
        name: 'Minimal task',
      });

      expect(task).toBeDefined();
      expect(task.name).toBe('Minimal task');
      expect(task.status).toBe(TaskStatus.TODO);
      expect(task.priority).toBe(TaskPriority.MEDIUM);
      expect(task.estimatedPrice).toBeNull();
      expect(task.actualPrice).toBeNull();

      // Cleanup
      await taskService.deleteTask(task.id);
    });

    it('should reject task creation with invalid project ID', async () => {
      await expect(
        taskService.createTask({
          projectId: 'invalid-id',
          name: 'Test task',
        })
      ).rejects.toThrow('Invalid project ID');
    });
  });

  describe('POST /api/projects/:projectId/tasks/bulk', () => {
    it('should bulk create tasks from templates', async () => {
      const tasks = await taskService.bulkCreateTasksFromTemplates(
        testProject.id,
        [testTemplate.id]
      );

      expect(tasks).toHaveLength(1);
      expect(tasks[0].name).toBe(testTemplate.name);
      expect(tasks[0].description).toBe(testTemplate.description);
      expect(Number(tasks[0].estimatedPrice)).toBe(testTemplate.defaultPrice);
      expect(tasks[0].status).toBe(TaskStatus.TODO);

      // Cleanup
      for (const task of tasks) {
        await taskService.deleteTask(task.id);
      }
    });

    it('should reject bulk creation with invalid template IDs', async () => {
      await expect(
        taskService.bulkCreateTasksFromTemplates(testProject.id, ['invalid-id'])
      ).rejects.toThrow('Invalid template ID');
    });

    it('should reject bulk creation with non-existent template', async () => {
      await expect(
        taskService.bulkCreateTasksFromTemplates(testProject.id, [
          '00000000-0000-0000-0000-000000000000',
        ])
      ).rejects.toThrow('One or more templates not found');
    });
  });

  describe('GET /api/projects/:projectId/tasks', () => {
    let task1: Task;
    let task2: Task;
    let task3: Task;

    beforeEach(async () => {
      // Create test tasks
      task1 = await taskService.createTask({
        projectId: testProject.id,
        name: 'Task 1',
        status: TaskStatus.TODO,
        priority: TaskPriority.HIGH,
        dueDate: new Date('2024-06-01'),
      });

      task2 = await taskService.createTask({
        projectId: testProject.id,
        name: 'Task 2',
        status: TaskStatus.IN_PROGRESS,
        priority: TaskPriority.MEDIUM,
        dueDate: new Date('2024-07-01'),
      });

      task3 = await taskService.createTask({
        projectId: testProject.id,
        name: 'Task 3',
        status: TaskStatus.COMPLETED,
        priority: TaskPriority.LOW,
      });
    });

    afterAll(async () => {
      // Cleanup
      if (task1) await taskService.deleteTask(task1.id);
      if (task2) await taskService.deleteTask(task2.id);
      if (task3) await taskService.deleteTask(task3.id);
    });

    it('should list all tasks for a project', async () => {
      const tasks = await taskService.listTasks(testProject.id);

      expect(tasks.length).toBeGreaterThanOrEqual(3);
      expect(tasks.some((t) => t.id === task1.id)).toBe(true);
      expect(tasks.some((t) => t.id === task2.id)).toBe(true);
      expect(tasks.some((t) => t.id === task3.id)).toBe(true);
    });

    it('should filter tasks by status', async () => {
      const tasks = await taskService.listTasks(testProject.id, {
        status: TaskStatus.TODO,
      });

      expect(tasks.every((t) => t.status === TaskStatus.TODO)).toBe(true);
      expect(tasks.some((t) => t.id === task1.id)).toBe(true);
    });

    it('should filter tasks by multiple statuses', async () => {
      const tasks = await taskService.listTasks(testProject.id, {
        status: [TaskStatus.TODO, TaskStatus.IN_PROGRESS],
      });

      expect(
        tasks.every(
          (t) => t.status === TaskStatus.TODO || t.status === TaskStatus.IN_PROGRESS
        )
      ).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const tasks = await taskService.listTasks(testProject.id, {
        priority: TaskPriority.HIGH,
      });

      expect(tasks.every((t) => t.priority === TaskPriority.HIGH)).toBe(true);
      expect(tasks.some((t) => t.id === task1.id)).toBe(true);
    });

    it('should filter tasks by due date range', async () => {
      const tasks = await taskService.listTasks(testProject.id, {
        dueDateFrom: new Date('2024-05-01'),
        dueDateTo: new Date('2024-06-30'),
      });

      expect(tasks.some((t) => t.id === task1.id)).toBe(true);
      expect(tasks.some((t) => t.id === task2.id)).toBe(false);
    });
  });

  describe('PUT /api/tasks/:id', () => {
    let task: Task;

    beforeEach(async () => {
      task = await taskService.createTask({
        projectId: testProject.id,
        name: 'Update test task',
        status: TaskStatus.TODO,
      });
    });

    afterAll(async () => {
      if (task) {
        try {
          await taskService.deleteTask(task.id);
        } catch (error) {
          // Task may already be deleted
        }
      }
    });

    it('should update task fields', async () => {
      const updatedTask = await taskService.updateTask(task.id, {
        name: 'Updated task name',
        description: 'Updated description',
        priority: TaskPriority.URGENT,
      });

      expect(updatedTask.name).toBe('Updated task name');
      expect(updatedTask.description).toBe('Updated description');
      expect(updatedTask.priority).toBe(TaskPriority.URGENT);
    });

    it('should set completedDate when status changes to COMPLETED', async () => {
      const updatedTask = await taskService.updateTask(task.id, {
        status: TaskStatus.COMPLETED,
      });

      expect(updatedTask.status).toBe(TaskStatus.COMPLETED);
      expect(updatedTask.completedDate).toBeDefined();
    });

    it('should update pricing fields', async () => {
      const updatedTask = await taskService.updateTask(task.id, {
        estimatedPrice: 1500,
        actualPrice: 1400,
      });

      expect(updatedTask.estimatedPrice).toBe(1500);
      expect(updatedTask.actualPrice).toBe(1400);
    });

    it('should reject update with invalid task ID', async () => {
      await expect(
        taskService.updateTask('invalid-id', { name: 'Test' })
      ).rejects.toThrow('Task not found');
    });
  });

  describe('DELETE /api/tasks/:id', () => {
    it('should delete a task', async () => {
      const task = await taskService.createTask({
        projectId: testProject.id,
        name: 'Task to delete',
      });

      await taskService.deleteTask(task.id);

      await expect(taskService.getTask(task.id)).rejects.toThrow('Task not found');
    });

    it('should reject deletion with invalid task ID', async () => {
      await expect(taskService.deleteTask('invalid-id')).rejects.toThrow(
        'Task not found'
      );
    });
  });

  describe('POST /api/tasks/:id/notes', () => {
    let task: Task;

    beforeEach(async () => {
      task = await taskService.createTask({
        projectId: testProject.id,
        name: 'Task with notes',
      });
    });

    afterAll(async () => {
      if (task) {
        await taskService.deleteTask(task.id);
      }
    });

    it('should add a note to a task', async () => {
      const note = 'This is a test note';
      const updatedTask = await taskService.addTaskNote(task.id, note);

      expect(updatedTask.notes).toContain(note);
      expect(updatedTask.notes).toHaveLength(1);
    });

    it('should add multiple notes to a task', async () => {
      await taskService.addTaskNote(task.id, 'First note');
      const updatedTask = await taskService.addTaskNote(task.id, 'Second note');

      expect(updatedTask.notes).toHaveLength(2);
      expect(updatedTask.notes[0]).toBe('First note');
      expect(updatedTask.notes[1]).toBe('Second note');
    });

    it('should reject adding note to invalid task ID', async () => {
      await expect(
        taskService.addTaskNote('invalid-id', 'Test note')
      ).rejects.toThrow('Task not found');
    });
  });

  describe('GET /api/work-items', () => {
    it('should list work item templates', async () => {
      const templates = await workItemService.listTemplates(undefined, testUser.id);

      expect(templates.length).toBeGreaterThan(0);
      expect(templates.some((t) => t.id === testTemplate.id)).toBe(true);
    });

    it('should filter templates by category', async () => {
      const templates = await workItemService.listTemplates(
        WorkItemCategory.PAINTING,
        testUser.id
      );

      expect(templates.every((t) => t.category === WorkItemCategory.PAINTING)).toBe(
        true
      );
      expect(templates.some((t) => t.id === testTemplate.id)).toBe(true);
    });

    it('should include default templates', async () => {
      const templates = await workItemService.listTemplates(undefined, testUser.id);

      const hasDefaultTemplates = templates.some((t) => t.isDefault === true);
      expect(hasDefaultTemplates).toBe(true);
    });
  });

  describe('POST /api/work-items', () => {
    it('should create a custom work item template', async () => {
      const templateData = {
        name: 'Custom Template',
        description: 'Custom template description',
        category: WorkItemCategory.ELECTRICAL,
        estimatedDuration: 8,
        defaultPrice: 1200,
      };

      const template = await workItemService.createTemplate({
        ...templateData,
        isDefault: false,
        ownerId: testUser.id,
      });

      expect(template).toBeDefined();
      expect(template.id).toBeDefined();
      expect(template.name).toBe(templateData.name);
      expect(template.category).toBe(templateData.category);
      expect(template.defaultPrice).toBe(templateData.defaultPrice);
      expect(template.isDefault).toBe(false);
      expect(template.ownerId).toBe(testUser.id);

      // Cleanup
      await workItemService.deleteTemplate(template.id, testUser.id);
    });

    it('should create template with minimal fields', async () => {
      const template = await workItemService.createTemplate({
        name: 'Minimal Template',
        category: WorkItemCategory.OTHER,
        isDefault: false,
        ownerId: testUser.id,
      });

      expect(template).toBeDefined();
      expect(template.name).toBe('Minimal Template');
      expect(template.category).toBe(WorkItemCategory.OTHER);
      expect(template.defaultPrice).toBeNull();

      // Cleanup
      await workItemService.deleteTemplate(template.id, testUser.id);
    });
  });

  describe('Task Cost Aggregation', () => {
    it('should calculate total task costs for a project', async () => {
      // Create a fresh project for this test to avoid interference
      const costTestProject = await projectService.createProject({
        name: 'Cost Test Project',
        clientName: 'Cost Test Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-12-31'),
        ownerId: testUser.id,
      });

      const task1 = await taskService.createTask({
        projectId: costTestProject.id,
        name: 'Task 1',
        estimatedPrice: 1000,
        actualPrice: 950,
      });

      const task2 = await taskService.createTask({
        projectId: costTestProject.id,
        name: 'Task 2',
        estimatedPrice: 500,
        actualPrice: 600,
      });

      const task3 = await taskService.createTask({
        projectId: costTestProject.id,
        name: 'Task 3',
        // No pricing
      });

      const costs = await taskService.calculateTotalTaskCosts(costTestProject.id);

      expect(costs.estimated).toBe(1500);
      expect(costs.actual).toBe(1550);

      // Cleanup
      await taskService.deleteTask(task1.id);
      await taskService.deleteTask(task2.id);
      await taskService.deleteTask(task3.id);
      await projectService.deleteProject(costTestProject.id, testUser.id);
    });

    it('should return zero costs for project with no tasks', async () => {
      const emptyProject = await projectService.createProject({
        name: 'Empty Project',
        clientName: 'Test Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-12-31'),
        ownerId: testUser.id,
      });

      const costs = await taskService.calculateTotalTaskCosts(emptyProject.id);

      expect(costs.estimated).toBe(0);
      expect(costs.actual).toBe(0);

      // Cleanup
      await projectService.deleteProject(emptyProject.id, testUser.id);
    });
  });
});
