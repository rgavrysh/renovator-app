import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource } from '../config/database';
import { ProjectService } from '../services/ProjectService';
import { ProjectStatus } from '../entities/Project';
import { User } from '../entities/User';
import { Project } from '../entities/Project';

describe('Project Routes Integration', () => {
  let projectService: ProjectService;
  let testUserId: string;

  beforeAll(async () => {
    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Create test user
    const userRepo = AppDataSource.getRepository(User);
    const testUser = userRepo.create({
      email: 'test-project-routes@example.com',
      firstName: 'Test',
      lastName: 'User',
      idpUserId: 'test-idp-user-routes',
    });
    const savedUser = await userRepo.save(testUser);
    testUserId = savedUser.id;

    projectService = new ProjectService();
  });

  afterAll(async () => {
    // Clean up test user
    if (testUserId) {
      const userRepo = AppDataSource.getRepository(User);
      await userRepo.delete({ id: testUserId });
    }

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Clean up projects before each test
    const projectRepo = AppDataSource.getRepository(Project);
    await projectRepo.delete({ ownerId: testUserId });
  });

  describe('Project CRUD Operations', () => {
    it('should create a new project with valid data', async () => {
      const projectData = {
        name: 'Kitchen Renovation',
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        clientPhone: '555-1234',
        description: 'Complete kitchen remodel',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUserId,
      };

      const project = await projectService.createProject(projectData);

      expect(project).toMatchObject({
        name: projectData.name,
        clientName: projectData.clientName,
        clientEmail: projectData.clientEmail,
        clientPhone: projectData.clientPhone,
        description: projectData.description,
        status: ProjectStatus.PLANNING,
      });
      expect(project.id).toBeDefined();
    });

    it('should list all projects for a user', async () => {
      await projectService.createProject({
        name: 'Project 1',
        clientName: 'Client 1',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUserId,
      });

      await projectService.createProject({
        name: 'Project 2',
        clientName: 'Client 2',
        startDate: new Date('2024-02-01'),
        estimatedEndDate: new Date('2024-04-01'),
        ownerId: testUserId,
      });

      const projects = await projectService.listProjects({ ownerId: testUserId });

      expect(projects).toHaveLength(2);
      expect(projects[0].name).toBeDefined();
    });

    it('should filter projects by status', async () => {
      await projectService.createProject({
        name: 'Active Project',
        clientName: 'Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUserId,
        status: ProjectStatus.ACTIVE,
      });

      await projectService.createProject({
        name: 'Planning Project',
        clientName: 'Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUserId,
        status: ProjectStatus.PLANNING,
      });

      const projects = await projectService.listProjects({ 
        ownerId: testUserId,
        status: ProjectStatus.ACTIVE 
      });

      expect(projects).toHaveLength(1);
      expect(projects[0].status).toBe(ProjectStatus.ACTIVE);
    });

    it('should search projects by name', async () => {
      await projectService.createProject({
        name: 'Kitchen Renovation',
        clientName: 'Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUserId,
      });

      await projectService.createProject({
        name: 'Bathroom Remodel',
        clientName: 'Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUserId,
      });

      const projects = await projectService.searchProjects('Kitchen', testUserId);

      expect(projects).toHaveLength(1);
      expect(projects[0].name).toContain('Kitchen');
    });

    it('should get a specific project by ID', async () => {
      const created = await projectService.createProject({
        name: 'Test Project',
        clientName: 'Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUserId,
      });

      const project = await projectService.getProject(created.id, testUserId);

      expect(project.id).toBe(created.id);
      expect(project.name).toBe('Test Project');
    });

    it('should update a project', async () => {
      const created = await projectService.createProject({
        name: 'Original Name',
        clientName: 'Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUserId,
      });

      const updated = await projectService.updateProject(
        created.id,
        { name: 'Updated Name' },
        testUserId
      );

      expect(updated.name).toBe('Updated Name');
    });

    it('should delete a project', async () => {
      const created = await projectService.createProject({
        name: 'To Delete',
        clientName: 'Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUserId,
      });

      await projectService.deleteProject(created.id, testUserId);

      await expect(projectService.getProject(created.id, testUserId)).rejects.toThrow('Project not found');
    });

    it('should archive a project', async () => {
      const created = await projectService.createProject({
        name: 'To Archive',
        clientName: 'Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUserId,
      });

      const archived = await projectService.archiveProject(created.id, testUserId);

      expect(archived.status).toBe(ProjectStatus.ARCHIVED);
    });

    it('should throw error when project does not exist', async () => {
      await expect(
        projectService.getProject('00000000-0000-0000-0000-000000000000', testUserId)
      ).rejects.toThrow('Project not found');
    });
  });
});
