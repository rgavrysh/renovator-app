import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource } from '../config/database';
import { MilestoneService } from './MilestoneService';
import { ProjectService } from './ProjectService';
import { Milestone, MilestoneStatus } from '../entities/Milestone';
import { Project, ProjectStatus } from '../entities/Project';
import { Task, TaskStatus, TaskPriority } from '../entities/Task';
import { User } from '../entities/User';
import { Supplier } from '../entities/Supplier';

describe('MilestoneService', () => {
  let milestoneService: MilestoneService;
  let projectService: ProjectService;
  let testUser: User;
  let testProject: Project;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Clean up test data in correct order (child tables first)
    await AppDataSource.createQueryBuilder().delete().from(Task).execute();
    await AppDataSource.createQueryBuilder().delete().from(Milestone).execute();
    await AppDataSource.createQueryBuilder().delete().from(Project).execute();
    await AppDataSource.createQueryBuilder().delete().from(Supplier).execute();
    await AppDataSource.createQueryBuilder().delete().from(User).execute();

    // Create test user
    const userRepo = AppDataSource.getRepository(User);
    testUser = userRepo.create({
      email: 'milestone-test@example.com',
      firstName: 'Test',
      lastName: 'User',
      idpUserId: 'test-idp-milestone',
    });
    testUser = await userRepo.save(testUser);

    // Create test project
    projectService = new ProjectService();
    testProject = await projectService.createProject({
      name: 'Test Project',
      clientName: 'Test Client',
      startDate: new Date('2024-01-01'),
      estimatedEndDate: new Date('2024-12-31'),
      ownerId: testUser.id,
    });

    milestoneService = new MilestoneService();
  });

  describe('createMilestone', () => {
    test('should create milestone with all required fields', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'Foundation Complete',
        description: 'Complete foundation work',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      expect(milestone.id).toBeDefined();
      expect(milestone.projectId).toBe(testProject.id);
      expect(milestone.name).toBe('Foundation Complete');
      expect(milestone.description).toBe('Complete foundation work');
      expect(milestone.targetDate).toEqual(new Date('2024-03-01'));
      expect(milestone.orderIndex).toBe(1);
      expect(milestone.status).toBe(MilestoneStatus.NOT_STARTED);
      expect(milestone.completedDate).toBeNull();
    });

    test('should create milestone with custom status', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'Framing',
        targetDate: new Date('2024-04-01'),
        orderIndex: 2,
        status: MilestoneStatus.IN_PROGRESS,
      });

      expect(milestone.status).toBe(MilestoneStatus.IN_PROGRESS);
    });

    test('should reject invalid project ID', async () => {
      await expect(
        milestoneService.createMilestone({
          projectId: 'invalid-id',
          name: 'Test',
          targetDate: new Date(),
          orderIndex: 1,
        })
      ).rejects.toThrow('Invalid project ID');
    });
  });

  describe('getMilestone', () => {
    test('should retrieve existing milestone', async () => {
      const created = await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'Test Milestone',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      const retrieved = await milestoneService.getMilestone(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('Test Milestone');
    });

    test('should throw error for non-existent milestone', async () => {
      await expect(
        milestoneService.getMilestone('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Milestone not found');
    });

    test('should throw error for invalid ID format', async () => {
      await expect(milestoneService.getMilestone('invalid-id')).rejects.toThrow(
        'Milestone not found'
      );
    });
  });

  describe('updateMilestone', () => {
    test('should update milestone fields', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'Original Name',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      const updated = await milestoneService.updateMilestone(milestone.id, {
        name: 'Updated Name',
        description: 'New description',
        status: MilestoneStatus.IN_PROGRESS,
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('New description');
      expect(updated.status).toBe(MilestoneStatus.IN_PROGRESS);
      // Date fields are returned as strings from database, compare as strings
      expect(String(updated.targetDate)).toBe('2024-03-01');
    });
  });

  describe('deleteMilestone', () => {
    test('should delete milestone', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'To Delete',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      await milestoneService.deleteMilestone(milestone.id);

      await expect(milestoneService.getMilestone(milestone.id)).rejects.toThrow(
        'Milestone not found'
      );
    });
  });

  describe('listMilestones', () => {
    test('should return milestones in chronological order', async () => {
      await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'Third',
        targetDate: new Date('2024-05-01'),
        orderIndex: 3,
      });

      await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'First',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'Second',
        targetDate: new Date('2024-04-01'),
        orderIndex: 2,
      });

      const milestones = await milestoneService.listMilestones(testProject.id);

      expect(milestones).toHaveLength(3);
      expect(milestones[0].name).toBe('First');
      expect(milestones[1].name).toBe('Second');
      expect(milestones[2].name).toBe('Third');
    });

    test('should return empty array for project with no milestones', async () => {
      const milestones = await milestoneService.listMilestones(testProject.id);
      expect(milestones).toEqual([]);
    });
  });

  describe('calculateProgress', () => {
    test('should calculate progress based on completed milestones', async () => {
      await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'M1',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
        status: MilestoneStatus.COMPLETED,
      });

      await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'M2',
        targetDate: new Date('2024-04-01'),
        orderIndex: 2,
        status: MilestoneStatus.IN_PROGRESS,
      });

      await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'M3',
        targetDate: new Date('2024-05-01'),
        orderIndex: 3,
        status: MilestoneStatus.NOT_STARTED,
      });

      const progress = await milestoneService.calculateProgress(testProject.id);

      expect(progress).toBe(33); // 1 out of 3 = 33.33% rounded to 33
    });

    test('should return 0 for project with no milestones', async () => {
      const progress = await milestoneService.calculateProgress(testProject.id);
      expect(progress).toBe(0);
    });

    test('should return 100 when all milestones completed', async () => {
      await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'M1',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
        status: MilestoneStatus.COMPLETED,
      });

      await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'M2',
        targetDate: new Date('2024-04-01'),
        orderIndex: 2,
        status: MilestoneStatus.COMPLETED,
      });

      const progress = await milestoneService.calculateProgress(testProject.id);
      expect(progress).toBe(100);
    });
  });

  describe('checkOverdueMilestones', () => {
    test('should identify overdue milestones', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'Overdue',
        targetDate: pastDate,
        orderIndex: 1,
        status: MilestoneStatus.IN_PROGRESS,
      });

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 5);

      await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'Not Overdue',
        targetDate: futureDate,
        orderIndex: 2,
        status: MilestoneStatus.NOT_STARTED,
      });

      const overdue = await milestoneService.checkOverdueMilestones();

      expect(overdue).toHaveLength(1);
      expect(overdue[0].name).toBe('Overdue');
    });

    test('should not include completed milestones as overdue', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);

      await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'Completed Late',
        targetDate: pastDate,
        orderIndex: 1,
        status: MilestoneStatus.COMPLETED,
      });

      const overdue = await milestoneService.checkOverdueMilestones();

      expect(overdue).toHaveLength(0);
    });
  });

  describe('completeMilestone', () => {
    test('should mark milestone as completed with date', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'To Complete',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      const completed = await milestoneService.completeMilestone(milestone.id);

      expect(completed.status).toBe(MilestoneStatus.COMPLETED);
      expect(completed.completedDate).toBeDefined();
      expect(completed.completedDate).toBeInstanceOf(Date);
    });
  });

  describe('getTimeline', () => {
    test('should return timeline with milestones and progress', async () => {
      await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'First',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
        status: MilestoneStatus.COMPLETED,
      });

      await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'Second',
        targetDate: new Date('2024-06-01'),
        orderIndex: 2,
        status: MilestoneStatus.IN_PROGRESS,
      });

      const timeline = await milestoneService.getTimeline(testProject.id);

      expect(timeline.projectId).toBe(testProject.id);
      expect(timeline.milestones).toHaveLength(2);
      // Date fields are returned as strings from database, compare as strings
      expect(String(timeline.startDate)).toBe('2024-03-01');
      expect(String(timeline.endDate)).toBe('2024-06-01');
      expect(timeline.progressPercentage).toBe(50);
    });

    test('should handle project with no milestones', async () => {
      const timeline = await milestoneService.getTimeline(testProject.id);

      expect(timeline.projectId).toBe(testProject.id);
      expect(timeline.milestones).toEqual([]);
      expect(timeline.progressPercentage).toBe(0);
    });
  });

  describe('calculateMilestoneProgress', () => {
    test('should calculate progress based on completed tasks', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'Test Milestone',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      const taskRepo = AppDataSource.getRepository(Task);

      await taskRepo.save(
        taskRepo.create({
          projectId: testProject.id,
          milestoneId: milestone.id,
          name: 'Task 1',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.MEDIUM,
        })
      );

      await taskRepo.save(
        taskRepo.create({
          projectId: testProject.id,
          milestoneId: milestone.id,
          name: 'Task 2',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
        })
      );

      await taskRepo.save(
        taskRepo.create({
          projectId: testProject.id,
          milestoneId: milestone.id,
          name: 'Task 3',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
        })
      );

      const progress = await milestoneService.calculateMilestoneProgress(
        milestone.id
      );

      expect(progress).toBe(33); // 1 out of 3 = 33.33% rounded to 33
    });

    test('should return 0 for milestone with no tasks', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'Empty Milestone',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      const progress = await milestoneService.calculateMilestoneProgress(
        milestone.id
      );

      expect(progress).toBe(0);
    });
  });
});
