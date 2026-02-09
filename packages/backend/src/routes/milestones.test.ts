import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource } from '../config/database';
import { MilestoneService } from '../services/MilestoneService';
import { ProjectService } from '../services/ProjectService';
import { MilestoneStatus } from '../entities/Milestone';
import { User } from '../entities/User';
import { Project } from '../entities/Project';
import { Milestone } from '../entities/Milestone';

describe('Milestone Routes Integration', () => {
  let milestoneService: MilestoneService;
  let projectService: ProjectService;
  let testUserId: string;
  let testProjectId: string;

  beforeAll(async () => {
    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Create test user (or find existing one)
    const userRepo = AppDataSource.getRepository(User);
    let testUser = await userRepo.findOne({
      where: { email: 'test-milestone-routes@example.com' },
    });

    if (!testUser) {
      testUser = userRepo.create({
        email: 'test-milestone-routes@example.com',
        firstName: 'Test',
        lastName: 'User',
        idpUserId: 'test-idp-user-milestone-routes',
      });
      testUser = await userRepo.save(testUser);
    }
    
    testUserId = testUser.id;

    milestoneService = new MilestoneService();
    projectService = new ProjectService();
  });

  afterAll(async () => {
    // Clean up projects first, then test user
    if (testUserId) {
      const projectRepo = AppDataSource.getRepository(Project);
      await projectRepo.delete({ ownerId: testUserId });
      
      const userRepo = AppDataSource.getRepository(User);
      await userRepo.delete({ id: testUserId });
    }

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Clean up projects before each test (milestones will cascade delete)
    const projectRepo = AppDataSource.getRepository(Project);
    await projectRepo.delete({ ownerId: testUserId });

    // Create a test project for milestone tests
    const project = await projectService.createProject({
      name: 'Test Project',
      clientName: 'Test Client',
      startDate: new Date('2024-01-01'),
      estimatedEndDate: new Date('2024-12-31'),
      ownerId: testUserId,
    });
    testProjectId = project.id;
  });

  describe('Milestone CRUD Operations', () => {
    it('should create a new milestone with valid data', async () => {
      const milestoneData = {
        projectId: testProjectId,
        name: 'Foundation Complete',
        description: 'Complete foundation work',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      };

      const milestone = await milestoneService.createMilestone(milestoneData);

      expect(milestone).toMatchObject({
        name: milestoneData.name,
        description: milestoneData.description,
        orderIndex: milestoneData.orderIndex,
        status: MilestoneStatus.NOT_STARTED,
      });
      expect(milestone.id).toBeDefined();
      expect(milestone.projectId).toBe(testProjectId);
    });

    it('should list all milestones for a project', async () => {
      await milestoneService.createMilestone({
        projectId: testProjectId,
        name: 'Milestone 1',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      await milestoneService.createMilestone({
        projectId: testProjectId,
        name: 'Milestone 2',
        targetDate: new Date('2024-06-01'),
        orderIndex: 2,
      });

      const milestones = await milestoneService.listMilestones(testProjectId);

      expect(milestones).toHaveLength(2);
      expect(milestones[0].name).toBe('Milestone 1');
      expect(milestones[1].name).toBe('Milestone 2');
    });

    it('should list milestones in chronological order', async () => {
      await milestoneService.createMilestone({
        projectId: testProjectId,
        name: 'Later Milestone',
        targetDate: new Date('2024-06-01'),
        orderIndex: 2,
      });

      await milestoneService.createMilestone({
        projectId: testProjectId,
        name: 'Earlier Milestone',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      const milestones = await milestoneService.listMilestones(testProjectId);

      expect(milestones).toHaveLength(2);
      expect(milestones[0].name).toBe('Earlier Milestone');
      expect(milestones[1].name).toBe('Later Milestone');
    });

    it('should get a specific milestone by ID', async () => {
      const created = await milestoneService.createMilestone({
        projectId: testProjectId,
        name: 'Test Milestone',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      const milestone = await milestoneService.getMilestone(created.id);

      expect(milestone.id).toBe(created.id);
      expect(milestone.name).toBe('Test Milestone');
    });

    it('should update a milestone', async () => {
      const created = await milestoneService.createMilestone({
        projectId: testProjectId,
        name: 'Original Name',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      const updated = await milestoneService.updateMilestone(created.id, {
        name: 'Updated Name',
        description: 'New description',
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('New description');
    });

    it('should delete a milestone', async () => {
      const created = await milestoneService.createMilestone({
        projectId: testProjectId,
        name: 'To Delete',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      await milestoneService.deleteMilestone(created.id);

      await expect(milestoneService.getMilestone(created.id)).rejects.toThrow('Milestone not found');
    });

    it('should complete a milestone', async () => {
      const created = await milestoneService.createMilestone({
        projectId: testProjectId,
        name: 'To Complete',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      const completed = await milestoneService.completeMilestone(created.id);

      expect(completed.status).toBe(MilestoneStatus.COMPLETED);
      expect(completed.completedDate).toBeDefined();
    });

    it('should throw error when milestone does not exist', async () => {
      await expect(
        milestoneService.getMilestone('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Milestone not found');
    });

    it('should throw error when updating non-existent milestone', async () => {
      await expect(
        milestoneService.updateMilestone('00000000-0000-0000-0000-000000000000', {
          name: 'Updated',
        })
      ).rejects.toThrow('Milestone not found');
    });

    it('should throw error when deleting non-existent milestone', async () => {
      await expect(
        milestoneService.deleteMilestone('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Milestone not found');
    });
  });

  describe('Milestone Status and Progress', () => {
    it('should create milestone with default NOT_STARTED status', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProjectId,
        name: 'New Milestone',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      expect(milestone.status).toBe(MilestoneStatus.NOT_STARTED);
    });

    it('should allow creating milestone with specific status', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProjectId,
        name: 'In Progress Milestone',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
        status: MilestoneStatus.IN_PROGRESS,
      });

      expect(milestone.status).toBe(MilestoneStatus.IN_PROGRESS);
    });

    it('should update milestone status', async () => {
      const created = await milestoneService.createMilestone({
        projectId: testProjectId,
        name: 'Milestone',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      const updated = await milestoneService.updateMilestone(created.id, {
        status: MilestoneStatus.IN_PROGRESS,
      });

      expect(updated.status).toBe(MilestoneStatus.IN_PROGRESS);
    });

    it('should set completedDate when completing milestone', async () => {
      const created = await milestoneService.createMilestone({
        projectId: testProjectId,
        name: 'Milestone',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      const beforeComplete = new Date();
      const completed = await milestoneService.completeMilestone(created.id);
      const afterComplete = new Date();

      expect(completed.completedDate).toBeDefined();
      expect(completed.completedDate!.getTime()).toBeGreaterThanOrEqual(beforeComplete.getTime());
      expect(completed.completedDate!.getTime()).toBeLessThanOrEqual(afterComplete.getTime());
    });
  });

  describe('Project Timeline', () => {
    it('should calculate project progress based on completed milestones', async () => {
      await milestoneService.createMilestone({
        projectId: testProjectId,
        name: 'Milestone 1',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
        status: MilestoneStatus.COMPLETED,
      });

      await milestoneService.createMilestone({
        projectId: testProjectId,
        name: 'Milestone 2',
        targetDate: new Date('2024-06-01'),
        orderIndex: 2,
      });

      const progress = await milestoneService.calculateProgress(testProjectId);

      expect(progress).toBe(50);
    });

    it('should return 0 progress when no milestones exist', async () => {
      const progress = await milestoneService.calculateProgress(testProjectId);

      expect(progress).toBe(0);
    });

    it('should return 100 progress when all milestones are completed', async () => {
      await milestoneService.createMilestone({
        projectId: testProjectId,
        name: 'Milestone 1',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
        status: MilestoneStatus.COMPLETED,
      });

      await milestoneService.createMilestone({
        projectId: testProjectId,
        name: 'Milestone 2',
        targetDate: new Date('2024-06-01'),
        orderIndex: 2,
        status: MilestoneStatus.COMPLETED,
      });

      const progress = await milestoneService.calculateProgress(testProjectId);

      expect(progress).toBe(100);
    });
  });
});
