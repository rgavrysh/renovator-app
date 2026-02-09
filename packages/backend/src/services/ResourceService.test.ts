import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource } from '../config/database';
import { ResourceService, CreateResourceInput, UpdateResourceInput } from './ResourceService';
import { Resource, ResourceStatus, ResourceType } from '../entities/Resource';
import { Project, ProjectStatus } from '../entities/Project';
import { User } from '../entities/User';
import { Supplier } from '../entities/Supplier';

describe('ResourceService', () => {
  let resourceService: ResourceService;
  let testUser: User;
  let testProject: Project;
  let testSupplier: Supplier;

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
    // Clean up tables in correct order (children first due to foreign keys)
    let resourceRepo = AppDataSource.getRepository(Resource);
    const resources = await resourceRepo.find();
    if (resources.length > 0) {
      await resourceRepo.remove(resources);
    }

    let supplierRepo = AppDataSource.getRepository(Supplier);
    const suppliers = await supplierRepo.find();
    if (suppliers.length > 0) {
      await supplierRepo.remove(suppliers);
    }

    let projectRepo = AppDataSource.getRepository(Project);
    const projects = await projectRepo.find();
    if (projects.length > 0) {
      await projectRepo.remove(projects);
    }

    let userRepo = AppDataSource.getRepository(User);
    const users = await userRepo.find();
    if (users.length > 0) {
      await userRepo.remove(users);
    }

    // Create test user
    userRepo = AppDataSource.getRepository(User);
    testUser = userRepo.create({
      email: 'resource-test@example.com',
      firstName: 'Resource',
      lastName: 'Tester',
      idpUserId: 'resource-test-idp-123',
    });
    testUser = await userRepo.save(testUser);

    // Create test project
    projectRepo = AppDataSource.getRepository(Project);
    testProject = projectRepo.create({
      name: 'Test Resource Project',
      clientName: 'Test Client',
      clientEmail: 'client@example.com',
      description: 'Test project for resources',
      startDate: new Date('2024-01-01'),
      estimatedEndDate: new Date('2024-12-31'),
      status: ProjectStatus.ACTIVE,
      ownerId: testUser.id,
    });
    testProject = await projectRepo.save(testProject);

    // Create test supplier
    supplierRepo = AppDataSource.getRepository(Supplier);
    testSupplier = supplierRepo.create({
      name: 'Test Supplier',
      contactName: 'John Supplier',
      email: 'supplier@example.com',
      phone: '555-0100',
      ownerId: testUser.id,
    });
    testSupplier = await supplierRepo.save(testSupplier);

    resourceService = new ResourceService();
  });

  describe('createResource', () => {
    it('should create a resource with all required fields', async () => {
      const input: CreateResourceInput = {
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Lumber',
        quantity: 100,
        unit: 'board feet',
        cost: 500.00,
        supplierId: testSupplier.id,
        notes: 'Premium grade lumber',
      };

      const resource = await resourceService.createResource(input);

      expect(resource.id).toBeDefined();
      expect(resource.projectId).toBe(testProject.id);
      expect(resource.type).toBe(ResourceType.MATERIAL);
      expect(resource.name).toBe('Lumber');
      expect(resource.quantity).toBe(100);
      expect(resource.unit).toBe('board feet');
      expect(resource.cost).toBe(500.00);
      expect(resource.status).toBe(ResourceStatus.NEEDED);
      expect(resource.supplierId).toBe(testSupplier.id);
      expect(resource.notes).toBe('Premium grade lumber');
      expect(resource.createdAt).toBeDefined();
      expect(resource.updatedAt).toBeDefined();
    });

    it('should create a resource without optional fields', async () => {
      const input: CreateResourceInput = {
        projectId: testProject.id,
        type: ResourceType.EQUIPMENT,
        name: 'Excavator',
        quantity: 1,
        unit: 'unit',
        cost: 2000.00,
      };

      const resource = await resourceService.createResource(input);

      expect(resource.id).toBeDefined();
      expect(resource.name).toBe('Excavator');
      expect(resource.status).toBe(ResourceStatus.NEEDED);
      expect(resource.supplierId).toBeNull();
      expect(resource.notes).toBeNull();
    });

    it('should throw error for invalid project ID', async () => {
      const input: CreateResourceInput = {
        projectId: 'invalid-id',
        type: ResourceType.MATERIAL,
        name: 'Test',
        quantity: 1,
        unit: 'unit',
        cost: 100,
      };

      await expect(resourceService.createResource(input)).rejects.toThrow('Invalid project ID');
    });

    it('should throw error for invalid supplier ID', async () => {
      const input: CreateResourceInput = {
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Test',
        quantity: 1,
        unit: 'unit',
        cost: 100,
        supplierId: 'invalid-id',
      };

      await expect(resourceService.createResource(input)).rejects.toThrow('Invalid supplier ID');
    });
  });

  describe('getResource', () => {
    it('should retrieve a resource by ID', async () => {
      const created = await resourceService.createResource({
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Concrete',
        quantity: 50,
        unit: 'bags',
        cost: 300,
      });

      const retrieved = await resourceService.getResource(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('Concrete');
    });

    it('should throw error for non-existent resource', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await expect(resourceService.getResource(fakeId)).rejects.toThrow('Resource not found');
    });

    it('should throw error for invalid ID format', async () => {
      await expect(resourceService.getResource('invalid-id')).rejects.toThrow('Resource not found');
    });
  });

  describe('updateResource', () => {
    it('should update resource fields', async () => {
      const resource = await resourceService.createResource({
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Paint',
        quantity: 10,
        unit: 'gallons',
        cost: 200,
      });

      const updateData: UpdateResourceInput = {
        name: 'Premium Paint',
        quantity: 15,
        cost: 300,
        notes: 'High quality paint',
      };

      const updated = await resourceService.updateResource(resource.id, updateData);

      expect(updated.name).toBe('Premium Paint');
      expect(updated.quantity).toBe(15);
      expect(updated.cost).toBe(300);
      expect(updated.notes).toBe('High quality paint');
    });

    it('should throw error for invalid supplier ID in update', async () => {
      const resource = await resourceService.createResource({
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Test',
        quantity: 1,
        unit: 'unit',
        cost: 100,
      });

      await expect(
        resourceService.updateResource(resource.id, { supplierId: 'invalid-id' })
      ).rejects.toThrow('Invalid supplier ID');
    });
  });

  describe('deleteResource', () => {
    it('should delete a resource', async () => {
      const resource = await resourceService.createResource({
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Temporary Item',
        quantity: 1,
        unit: 'unit',
        cost: 50,
      });

      await resourceService.deleteResource(resource.id);

      await expect(resourceService.getResource(resource.id)).rejects.toThrow('Resource not found');
    });
  });

  describe('listResources', () => {
    beforeEach(async () => {
      // Create multiple resources
      await resourceService.createResource({
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Lumber',
        quantity: 100,
        unit: 'board feet',
        cost: 500,
        supplierId: testSupplier.id,
      });

      await resourceService.createResource({
        projectId: testProject.id,
        type: ResourceType.EQUIPMENT,
        name: 'Drill',
        quantity: 2,
        unit: 'units',
        cost: 300,
      });

      await resourceService.createResource({
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Nails',
        quantity: 1000,
        unit: 'pieces',
        cost: 50,
      });
    });

    it('should list all resources for a project', async () => {
      const resources = await resourceService.listResources(testProject.id);

      expect(resources).toHaveLength(3);
      expect(resources.map(r => r.name)).toContain('Lumber');
      expect(resources.map(r => r.name)).toContain('Drill');
      expect(resources.map(r => r.name)).toContain('Nails');
    });

    it('should filter resources by type', async () => {
      const materials = await resourceService.listResources(testProject.id, {
        type: ResourceType.MATERIAL,
      });

      expect(materials).toHaveLength(2);
      expect(materials.every(r => r.type === ResourceType.MATERIAL)).toBe(true);
    });

    it('should filter resources by status', async () => {
      const resources = await resourceService.listResources(testProject.id, {
        status: ResourceStatus.NEEDED,
      });

      expect(resources).toHaveLength(3);
      expect(resources.every(r => r.status === ResourceStatus.NEEDED)).toBe(true);
    });

    it('should filter resources by supplier', async () => {
      const supplierResources = await resourceService.listResources(testProject.id, {
        supplierId: testSupplier.id,
      });

      expect(supplierResources).toHaveLength(1);
      expect(supplierResources[0].name).toBe('Lumber');
    });

    it('should throw error for invalid project ID', async () => {
      await expect(resourceService.listResources('invalid-id')).rejects.toThrow('Invalid project ID');
    });
  });

  describe('markAsOrdered', () => {
    it('should mark resource as ordered with dates', async () => {
      const resource = await resourceService.createResource({
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Tiles',
        quantity: 200,
        unit: 'sq ft',
        cost: 1000,
      });

      const orderDate = new Date('2024-06-01');
      const expectedDelivery = new Date('2024-06-10');

      const updated = await resourceService.markAsOrdered(
        resource.id,
        orderDate,
        expectedDelivery
      );

      expect(updated.status).toBe(ResourceStatus.ORDERED);
      expect(updated.orderDate).toEqual(orderDate);
      expect(updated.expectedDeliveryDate).toEqual(expectedDelivery);
    });
  });

  describe('markAsReceived', () => {
    it('should mark resource as received with actual delivery date', async () => {
      const resource = await resourceService.createResource({
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Windows',
        quantity: 5,
        unit: 'units',
        cost: 2500,
      });

      // First mark as ordered
      await resourceService.markAsOrdered(
        resource.id,
        new Date('2024-06-01'),
        new Date('2024-06-10')
      );

      // Then mark as received
      const actualDelivery = new Date('2024-06-12');
      const updated = await resourceService.markAsReceived(resource.id, actualDelivery);

      expect(updated.status).toBe(ResourceStatus.RECEIVED);
      expect(updated.actualDeliveryDate).toEqual(actualDelivery);
    });
  });

  describe('checkOverdueDeliveries', () => {
    it('should identify resources overdue by more than 2 days', async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Create resource ordered 5 days ago, expected 4 days ago (overdue by 4 days)
      const resource1 = await resourceService.createResource({
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Overdue Item 1',
        quantity: 1,
        unit: 'unit',
        cost: 100,
      });

      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const fourDaysAgo = new Date(today);
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      await resourceService.markAsOrdered(resource1.id, fiveDaysAgo, fourDaysAgo);

      // Create resource ordered 3 days ago, expected 3 days ago (overdue by 3 days)
      const resource2 = await resourceService.createResource({
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Overdue Item 2',
        quantity: 1,
        unit: 'unit',
        cost: 100,
      });

      const threeDaysAgo = new Date(today);
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      await resourceService.markAsOrdered(resource2.id, threeDaysAgo, threeDaysAgo);

      // Create resource expected 1 day ago (not overdue yet - needs >2 days)
      const resource3 = await resourceService.createResource({
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Not Overdue Yet',
        quantity: 1,
        unit: 'unit',
        cost: 100,
      });

      const twoDaysAgo = new Date(today);
      twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
      const oneDayAgo = new Date(today);
      oneDayAgo.setDate(oneDayAgo.getDate() - 1);

      await resourceService.markAsOrdered(resource3.id, twoDaysAgo, oneDayAgo);

      // Check overdue deliveries
      const overdueResources = await resourceService.checkOverdueDeliveries();

      expect(overdueResources).toHaveLength(2);
      expect(overdueResources.map(r => r.name)).toContain('Overdue Item 1');
      expect(overdueResources.map(r => r.name)).toContain('Overdue Item 2');
      expect(overdueResources.map(r => r.name)).not.toContain('Not Overdue Yet');
    });

    it('should not include received resources in overdue list', async () => {
      const today = new Date();
      const fiveDaysAgo = new Date(today);
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
      const fourDaysAgo = new Date(today);
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);

      const resource = await resourceService.createResource({
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Received Item',
        quantity: 1,
        unit: 'unit',
        cost: 100,
      });

      await resourceService.markAsOrdered(resource.id, fiveDaysAgo, fourDaysAgo);
      await resourceService.markAsReceived(resource.id, new Date());

      const overdueResources = await resourceService.checkOverdueDeliveries();

      expect(overdueResources.map(r => r.name)).not.toContain('Received Item');
    });
  });

  describe('groupResourcesByStatus', () => {
    it('should group resources by their status', async () => {
      // Create resources with different statuses
      const resource1 = await resourceService.createResource({
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Needed Item',
        quantity: 1,
        unit: 'unit',
        cost: 100,
      });

      const resource2 = await resourceService.createResource({
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Ordered Item',
        quantity: 1,
        unit: 'unit',
        cost: 200,
      });
      await resourceService.markAsOrdered(resource2.id, new Date(), new Date());

      const resource3 = await resourceService.createResource({
        projectId: testProject.id,
        type: ResourceType.MATERIAL,
        name: 'Received Item',
        quantity: 1,
        unit: 'unit',
        cost: 300,
      });
      await resourceService.markAsOrdered(resource3.id, new Date(), new Date());
      await resourceService.markAsReceived(resource3.id, new Date());

      const grouped = await resourceService.groupResourcesByStatus(testProject.id);

      expect(grouped[ResourceStatus.NEEDED]).toHaveLength(1);
      expect(grouped[ResourceStatus.NEEDED][0].name).toBe('Needed Item');

      expect(grouped[ResourceStatus.ORDERED]).toHaveLength(1);
      expect(grouped[ResourceStatus.ORDERED][0].name).toBe('Ordered Item');

      expect(grouped[ResourceStatus.RECEIVED]).toHaveLength(1);
      expect(grouped[ResourceStatus.RECEIVED][0].name).toBe('Received Item');

      expect(grouped[ResourceStatus.CANCELLED]).toHaveLength(0);
    });

    it('should throw error for invalid project ID', async () => {
      await expect(resourceService.groupResourcesByStatus('invalid-id')).rejects.toThrow('Invalid project ID');
    });
  });
});
