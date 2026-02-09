import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource } from '../config/database';
import { ProjectService } from './ProjectService';
import { Project, ProjectStatus } from '../entities/Project';
import { User } from '../entities/User';

describe('ProjectService', () => {
  let projectService: ProjectService;
  let testUser: User;

  beforeAll(async () => {
    await AppDataSource.initialize();
    projectService = new ProjectService();

    // Create a test user
    const userRepository = AppDataSource.getRepository(User);
    testUser = userRepository.create({
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      idpUserId: 'test-idp-user-id',
    });
    testUser = await userRepository.save(testUser);
  });

  afterAll(async () => {
    // Clean up test data
    const projectRepository = AppDataSource.getRepository(Project);
    await projectRepository.delete({ ownerId: testUser.id });

    const userRepository = AppDataSource.getRepository(User);
    await userRepository.delete({ id: testUser.id });

    await AppDataSource.destroy();
  });

  beforeEach(async () => {
    // Clean up projects before each test
    const projectRepository = AppDataSource.getRepository(Project);
    await projectRepository.delete({ ownerId: testUser.id });
  });

  describe('createProject', () => {
    it('should create a project with all required fields', async () => {
      const projectData = {
        name: 'Kitchen Renovation',
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        clientPhone: '555-1234',
        description: 'Complete kitchen remodel',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      };

      const project = await projectService.createProject(projectData);

      expect(project.id).toBeDefined();
      expect(project.name).toBe(projectData.name);
      expect(project.clientName).toBe(projectData.clientName);
      expect(project.clientEmail).toBe(projectData.clientEmail);
      expect(project.clientPhone).toBe(projectData.clientPhone);
      expect(project.description).toBe(projectData.description);
      expect(project.startDate).toEqual(projectData.startDate);
      expect(project.estimatedEndDate).toEqual(projectData.estimatedEndDate);
      expect(project.ownerId).toBe(testUser.id);
      expect(project.status).toBe(ProjectStatus.PLANNING);
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
    });

    it('should create a project with optional fields omitted', async () => {
      const projectData = {
        name: 'Bathroom Renovation',
        clientName: 'Jane Smith',
        startDate: new Date('2024-02-01'),
        estimatedEndDate: new Date('2024-04-01'),
        ownerId: testUser.id,
      };

      const project = await projectService.createProject(projectData);

      expect(project.id).toBeDefined();
      expect(project.name).toBe(projectData.name);
      expect(project.clientName).toBe(projectData.clientName);
      expect(project.clientEmail).toBeNull();
      expect(project.clientPhone).toBeNull();
      expect(project.description).toBeNull();
      expect(project.status).toBe(ProjectStatus.PLANNING);
    });

    it('should create a project with custom status', async () => {
      const projectData = {
        name: 'Office Renovation',
        clientName: 'Bob Johnson',
        startDate: new Date('2024-03-01'),
        estimatedEndDate: new Date('2024-05-01'),
        ownerId: testUser.id,
        status: ProjectStatus.ACTIVE,
      };

      const project = await projectService.createProject(projectData);

      expect(project.status).toBe(ProjectStatus.ACTIVE);
    });
  });

  describe('getProject', () => {
    it('should retrieve a project by id', async () => {
      const created = await projectService.createProject({
        name: 'Test Project',
        clientName: 'Test Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      const project = await projectService.getProject(created.id);

      expect(project.id).toBe(created.id);
      expect(project.name).toBe('Test Project');
    });

    it('should retrieve a project with owner validation', async () => {
      const created = await projectService.createProject({
        name: 'Test Project',
        clientName: 'Test Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      const project = await projectService.getProject(created.id, testUser.id);

      expect(project.id).toBe(created.id);
    });

    it('should throw error when project not found', async () => {
      await expect(
        projectService.getProject('non-existent-id')
      ).rejects.toThrow('Project not found');
    });

    it('should throw error when owner does not match', async () => {
      const created = await projectService.createProject({
        name: 'Test Project',
        clientName: 'Test Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      await expect(
        projectService.getProject(created.id, 'different-owner-id')
      ).rejects.toThrow('Project not found');
    });
  });

  describe('updateProject', () => {
    it('should update project fields', async () => {
      const created = await projectService.createProject({
        name: 'Original Name',
        clientName: 'Original Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      const updated = await projectService.updateProject(created.id, {
        name: 'Updated Name',
        description: 'New description',
        status: ProjectStatus.ACTIVE,
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('New description');
      expect(updated.status).toBe(ProjectStatus.ACTIVE);
      expect(updated.clientName).toBe('Original Client');
    });

    it('should update project with owner validation', async () => {
      const created = await projectService.createProject({
        name: 'Test Project',
        clientName: 'Test Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      const updated = await projectService.updateProject(
        created.id,
        { name: 'Updated Name' },
        testUser.id
      );

      expect(updated.name).toBe('Updated Name');
    });

    it('should throw error when updating non-existent project', async () => {
      await expect(
        projectService.updateProject('non-existent-id', { name: 'New Name' })
      ).rejects.toThrow('Project not found');
    });

    it('should throw error when owner does not match on update', async () => {
      const created = await projectService.createProject({
        name: 'Test Project',
        clientName: 'Test Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      await expect(
        projectService.updateProject(
          created.id,
          { name: 'Updated Name' },
          'different-owner-id'
        )
      ).rejects.toThrow('Project not found');
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      const created = await projectService.createProject({
        name: 'Test Project',
        clientName: 'Test Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      await projectService.deleteProject(created.id);

      await expect(projectService.getProject(created.id)).rejects.toThrow(
        'Project not found'
      );
    });

    it('should delete project with owner validation', async () => {
      const created = await projectService.createProject({
        name: 'Test Project',
        clientName: 'Test Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      await projectService.deleteProject(created.id, testUser.id);

      await expect(projectService.getProject(created.id)).rejects.toThrow(
        'Project not found'
      );
    });

    it('should throw error when deleting non-existent project', async () => {
      await expect(
        projectService.deleteProject('non-existent-id')
      ).rejects.toThrow('Project not found');
    });

    it('should throw error when owner does not match on delete', async () => {
      const created = await projectService.createProject({
        name: 'Test Project',
        clientName: 'Test Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      await expect(
        projectService.deleteProject(created.id, 'different-owner-id')
      ).rejects.toThrow('Project not found');
    });
  });

  describe('listProjects', () => {
    it('should list all projects without filters', async () => {
      await projectService.createProject({
        name: 'Project 1',
        clientName: 'Client 1',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      await projectService.createProject({
        name: 'Project 2',
        clientName: 'Client 2',
        startDate: new Date('2024-02-01'),
        estimatedEndDate: new Date('2024-04-01'),
        ownerId: testUser.id,
      });

      const projects = await projectService.listProjects();

      expect(projects.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter projects by owner', async () => {
      await projectService.createProject({
        name: 'Project 1',
        clientName: 'Client 1',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      const projects = await projectService.listProjects({ ownerId: testUser.id });

      expect(projects.length).toBeGreaterThanOrEqual(1);
      expect(projects.every((p) => p.ownerId === testUser.id)).toBe(true);
    });

    it('should filter projects by status', async () => {
      await projectService.createProject({
        name: 'Active Project',
        clientName: 'Client 1',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
        status: ProjectStatus.ACTIVE,
      });

      await projectService.createProject({
        name: 'Planning Project',
        clientName: 'Client 2',
        startDate: new Date('2024-02-01'),
        estimatedEndDate: new Date('2024-04-01'),
        ownerId: testUser.id,
        status: ProjectStatus.PLANNING,
      });

      const activeProjects = await projectService.listProjects({
        ownerId: testUser.id,
        status: ProjectStatus.ACTIVE,
      });

      expect(activeProjects.length).toBe(1);
      expect(activeProjects[0].status).toBe(ProjectStatus.ACTIVE);
    });

    it('should filter projects by multiple statuses', async () => {
      await projectService.createProject({
        name: 'Active Project',
        clientName: 'Client 1',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
        status: ProjectStatus.ACTIVE,
      });

      await projectService.createProject({
        name: 'Planning Project',
        clientName: 'Client 2',
        startDate: new Date('2024-02-01'),
        estimatedEndDate: new Date('2024-04-01'),
        ownerId: testUser.id,
        status: ProjectStatus.PLANNING,
      });

      await projectService.createProject({
        name: 'Archived Project',
        clientName: 'Client 3',
        startDate: new Date('2024-03-01'),
        estimatedEndDate: new Date('2024-05-01'),
        ownerId: testUser.id,
        status: ProjectStatus.ARCHIVED,
      });

      const projects = await projectService.listProjects({
        ownerId: testUser.id,
        status: [ProjectStatus.ACTIVE, ProjectStatus.PLANNING],
      });

      expect(projects.length).toBe(2);
      expect(
        projects.every(
          (p) =>
            p.status === ProjectStatus.ACTIVE || p.status === ProjectStatus.PLANNING
        )
      ).toBe(true);
    });

    it('should filter projects by date range', async () => {
      await projectService.createProject({
        name: 'Early Project',
        clientName: 'Client 1',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      await projectService.createProject({
        name: 'Late Project',
        clientName: 'Client 2',
        startDate: new Date('2024-06-01'),
        estimatedEndDate: new Date('2024-08-01'),
        ownerId: testUser.id,
      });

      const projects = await projectService.listProjects({
        ownerId: testUser.id,
        startDateFrom: new Date('2024-05-01'),
        startDateTo: new Date('2024-12-31'),
      });

      expect(projects.length).toBe(1);
      expect(projects[0].name).toBe('Late Project');
    });
  });

  describe('searchProjects', () => {
    it('should search projects by name', async () => {
      await projectService.createProject({
        name: 'Kitchen Renovation',
        clientName: 'John Doe',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      await projectService.createProject({
        name: 'Bathroom Remodel',
        clientName: 'Jane Smith',
        startDate: new Date('2024-02-01'),
        estimatedEndDate: new Date('2024-04-01'),
        ownerId: testUser.id,
      });

      const results = await projectService.searchProjects('Kitchen');

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((p) => p.name.includes('Kitchen'))).toBe(true);
    });

    it('should search projects by client name', async () => {
      await projectService.createProject({
        name: 'Kitchen Renovation',
        clientName: 'John Doe',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      await projectService.createProject({
        name: 'Bathroom Remodel',
        clientName: 'Jane Smith',
        startDate: new Date('2024-02-01'),
        estimatedEndDate: new Date('2024-04-01'),
        ownerId: testUser.id,
      });

      const results = await projectService.searchProjects('Jane');

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((p) => p.clientName.includes('Jane'))).toBe(true);
    });

    it('should search projects case-insensitively', async () => {
      await projectService.createProject({
        name: 'Kitchen Renovation',
        clientName: 'John Doe',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      const results = await projectService.searchProjects('kitchen');

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some((p) => p.name.toLowerCase().includes('kitchen'))).toBe(
        true
      );
    });

    it('should search projects with owner filter', async () => {
      await projectService.createProject({
        name: 'Kitchen Renovation',
        clientName: 'John Doe',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      const results = await projectService.searchProjects('Kitchen', testUser.id);

      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.every((p) => p.ownerId === testUser.id)).toBe(true);
    });

    it('should return empty array when no matches found', async () => {
      const results = await projectService.searchProjects(
        'NonExistentProject12345'
      );

      expect(results).toEqual([]);
    });
  });

  describe('archiveProject', () => {
    it('should archive a project', async () => {
      const created = await projectService.createProject({
        name: 'Test Project',
        clientName: 'Test Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
        status: ProjectStatus.ACTIVE,
      });

      const archived = await projectService.archiveProject(created.id);

      expect(archived.id).toBe(created.id);
      expect(archived.status).toBe(ProjectStatus.ARCHIVED);
      expect(archived.name).toBe(created.name);
      expect(archived.clientName).toBe(created.clientName);
    });

    it('should archive project with owner validation', async () => {
      const created = await projectService.createProject({
        name: 'Test Project',
        clientName: 'Test Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      const archived = await projectService.archiveProject(created.id, testUser.id);

      expect(archived.status).toBe(ProjectStatus.ARCHIVED);
    });

    it('should throw error when archiving non-existent project', async () => {
      await expect(
        projectService.archiveProject('non-existent-id')
      ).rejects.toThrow('Project not found');
    });

    it('should throw error when owner does not match on archive', async () => {
      const created = await projectService.createProject({
        name: 'Test Project',
        clientName: 'Test Client',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
      });

      await expect(
        projectService.archiveProject(created.id, 'different-owner-id')
      ).rejects.toThrow('Project not found');
    });
  });

  describe('getActiveProjects', () => {
    it('should return only active projects', async () => {
      await projectService.createProject({
        name: 'Planning Project',
        clientName: 'Client 1',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
        status: ProjectStatus.PLANNING,
      });

      await projectService.createProject({
        name: 'Active Project',
        clientName: 'Client 2',
        startDate: new Date('2024-02-01'),
        estimatedEndDate: new Date('2024-04-01'),
        ownerId: testUser.id,
        status: ProjectStatus.ACTIVE,
      });

      await projectService.createProject({
        name: 'Archived Project',
        clientName: 'Client 3',
        startDate: new Date('2024-03-01'),
        estimatedEndDate: new Date('2024-05-01'),
        ownerId: testUser.id,
        status: ProjectStatus.ARCHIVED,
      });

      await projectService.createProject({
        name: 'Completed Project',
        clientName: 'Client 4',
        startDate: new Date('2024-04-01'),
        estimatedEndDate: new Date('2024-06-01'),
        ownerId: testUser.id,
        status: ProjectStatus.COMPLETED,
      });

      const activeProjects = await projectService.getActiveProjects(testUser.id);

      expect(activeProjects.length).toBe(2);
      expect(
        activeProjects.every(
          (p) =>
            p.status === ProjectStatus.PLANNING ||
            p.status === ProjectStatus.ACTIVE ||
            p.status === ProjectStatus.ON_HOLD
        )
      ).toBe(true);
      expect(
        activeProjects.every(
          (p) =>
            p.status !== ProjectStatus.ARCHIVED &&
            p.status !== ProjectStatus.COMPLETED
        )
      ).toBe(true);
    });

    it('should return empty array when no active projects exist', async () => {
      await projectService.createProject({
        name: 'Archived Project',
        clientName: 'Client 1',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-03-01'),
        ownerId: testUser.id,
        status: ProjectStatus.ARCHIVED,
      });

      const activeProjects = await projectService.getActiveProjects(testUser.id);

      expect(activeProjects).toEqual([]);
    });
  });
});
