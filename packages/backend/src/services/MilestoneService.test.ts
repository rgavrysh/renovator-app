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

    test('should unassign tasks assigned to the deleted milestone', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'To Delete With Tasks',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      const taskRepository = AppDataSource.getRepository(Task);
      const task = taskRepository.create({
        projectId: testProject.id,
        milestoneId: milestone.id,
        name: 'Assigned Task',
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        notes: [],
      });
      const savedTask = await taskRepository.save(task);

      await milestoneService.deleteMilestone(milestone.id);

      const updatedTask = await taskRepository.findOne({ where: { id: savedTask.id } });
      expect(updatedTask).not.toBeNull();
      expect(updatedTask!.milestoneId).toBeNull();
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

  describe('recalculateMilestoneStatus', () => {
    const taskRepo = () => AppDataSource.getRepository(Task);

    test('should leave status untouched for a milestone with no tasks', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'No Tasks',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
        status: MilestoneStatus.IN_PROGRESS,
      });

      const result = await milestoneService.recalculateMilestoneStatus(milestone.id);

      expect(result!.status).toBe(MilestoneStatus.IN_PROGRESS);
    });

    test('should set status to NOT_STARTED when all tasks are TODO', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'All Todo',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
        status: MilestoneStatus.IN_PROGRESS,
      });

      await taskRepo().save(
        taskRepo().create({
          projectId: testProject.id,
          milestoneId: milestone.id,
          name: 'Task 1',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
        })
      );

      const result = await milestoneService.recalculateMilestoneStatus(milestone.id);

      expect(result!.status).toBe(MilestoneStatus.NOT_STARTED);
    });

    test('should set status to IN_PROGRESS when at least one task is in progress', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'Partial Progress',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      await taskRepo().save(
        taskRepo().create({
          projectId: testProject.id,
          milestoneId: milestone.id,
          name: 'Task 1',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
        })
      );
      await taskRepo().save(
        taskRepo().create({
          projectId: testProject.id,
          milestoneId: milestone.id,
          name: 'Task 2',
          status: TaskStatus.IN_PROGRESS,
          priority: TaskPriority.MEDIUM,
        })
      );

      const result = await milestoneService.recalculateMilestoneStatus(milestone.id);

      expect(result!.status).toBe(MilestoneStatus.IN_PROGRESS);
    });

    test('should set status to COMPLETED and stamp completedDate when all tasks are completed', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'All Done',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      await taskRepo().save(
        taskRepo().create({
          projectId: testProject.id,
          milestoneId: milestone.id,
          name: 'Task 1',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.MEDIUM,
        })
      );
      await taskRepo().save(
        taskRepo().create({
          projectId: testProject.id,
          milestoneId: milestone.id,
          name: 'Task 2',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.MEDIUM,
        })
      );

      const result = await milestoneService.recalculateMilestoneStatus(milestone.id);

      expect(result!.status).toBe(MilestoneStatus.COMPLETED);
      expect(result!.completedDate).toBeDefined();
      expect(result!.completedDate).toBeInstanceOf(Date);
    });

    test('should clear completedDate when a completed milestone regresses', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'Regress',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      const task = await taskRepo().save(
        taskRepo().create({
          projectId: testProject.id,
          milestoneId: milestone.id,
          name: 'Task 1',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.MEDIUM,
        })
      );

      const completed = await milestoneService.recalculateMilestoneStatus(milestone.id);
      expect(completed!.status).toBe(MilestoneStatus.COMPLETED);
      expect(completed!.completedDate).toBeDefined();

      task.status = TaskStatus.IN_PROGRESS;
      await taskRepo().save(task);

      const reopened = await milestoneService.recalculateMilestoneStatus(milestone.id);

      expect(reopened!.status).toBe(MilestoneStatus.IN_PROGRESS);
      expect(reopened!.completedDate).toBeFalsy();
    });

    test('should not clobber a manually set completedDate while status stays COMPLETED', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'Manual Override',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      await taskRepo().save(
        taskRepo().create({
          projectId: testProject.id,
          milestoneId: milestone.id,
          name: 'Task 1',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.MEDIUM,
        })
      );

      const autoCompleted = await milestoneService.recalculateMilestoneStatus(milestone.id);
      expect(autoCompleted!.status).toBe(MilestoneStatus.COMPLETED);

      // Manually override the completion date via the update endpoint's code path
      const manualDate = new Date('2024-02-20');
      await milestoneService.updateMilestone(milestone.id, {
        completedDate: manualDate,
      });
      const afterManualUpdate = await milestoneService.getMilestone(milestone.id);
      expect(String(afterManualUpdate.completedDate)).toBe('2024-02-20');

      // Add another already-completed task; status stays COMPLETED, so the
      // manual override should be preserved rather than reset to "now".
      await taskRepo().save(
        taskRepo().create({
          projectId: testProject.id,
          milestoneId: milestone.id,
          name: 'Task 2',
          status: TaskStatus.COMPLETED,
          priority: TaskPriority.MEDIUM,
        })
      );

      const recalculated = await milestoneService.recalculateMilestoneStatus(milestone.id);
      expect(recalculated!.status).toBe(MilestoneStatus.COMPLETED);
      expect(String(recalculated!.completedDate)).toBe('2024-02-20');
    });

    test('should not clear a manually set completedDate when the milestone was never COMPLETED', async () => {
      const milestone = await milestoneService.createMilestone({
        projectId: testProject.id,
        name: 'Manual Date, Not Completed',
        targetDate: new Date('2024-03-01'),
        orderIndex: 1,
      });

      await taskRepo().save(
        taskRepo().create({
          projectId: testProject.id,
          milestoneId: milestone.id,
          name: 'Task 1',
          status: TaskStatus.TODO,
          priority: TaskPriority.MEDIUM,
        })
      );

      // Manually set a completedDate while the milestone is still NOT_STARTED
      const manualDate = new Date('2024-02-15');
      await milestoneService.updateMilestone(milestone.id, {
        completedDate: manualDate,
      });

      // Task starts progressing; milestone should become IN_PROGRESS but the
      // manual completedDate should not be wiped since it was never COMPLETED.
      const task = await taskRepo().findOne({ where: { milestoneId: milestone.id } });
      task!.status = TaskStatus.IN_PROGRESS;
      await taskRepo().save(task!);

      const result = await milestoneService.recalculateMilestoneStatus(milestone.id);
      expect(result!.status).toBe(MilestoneStatus.IN_PROGRESS);
      expect(String(result!.completedDate)).toBe('2024-02-15');
    });

    test('should return null for a non-existent milestone', async () => {
      const result = await milestoneService.recalculateMilestoneStatus(
        '00000000-0000-0000-0000-000000000000'
      );

      expect(result).toBeNull();
    });

    test('should return null for a missing milestone ID', async () => {
      const result = await milestoneService.recalculateMilestoneStatus(undefined);

      expect(result).toBeNull();
    });
  });
});
