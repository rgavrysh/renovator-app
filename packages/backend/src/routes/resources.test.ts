import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource } from '../config/database';
import { ResourceService } from '../services/ResourceService';
import { SupplierService } from '../services/SupplierService';
import { ProjectService } from '../services/ProjectService';
import { ResourceStatus, ResourceType } from '../entities/Resource';
import { User } from '../entities/User';
import { Project } from '../entities/Project';
import { Resource } from '../entities/Resource';
import { Supplier } from '../entities/Supplier';

describe('Resource Routes Integration', () => {
  let resourceService: ResourceService;
  let supplierService: SupplierService;
  let projectService: ProjectService;
  let testUserId: string;
  let testProjectId: string;

  beforeAll(async () => {
    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Clean up any existing test user first
    const userRepo = AppDataSource.getRepository(User);
    const existingUser = await userRepo.findOne({
      where: { email: 'test-resource-routes@example.com' },
    });
    
    if (existingUser) {
      const projectRepo = AppDataSource.getRepository(Project);
      const supplierRepo = AppDataSource.getRepository(Supplier);
      
      await projectRepo.delete({ ownerId: existingUser.id });
      await supplierRepo.delete({ ownerId: existingUser.id });
      await userRepo.delete({ id: existingUser.id });
    }

    // Create test user
    const testUser = userRepo.create({
      email: 'test-resource-routes@example.com',
      firstName: 'Test',
      lastName: 'User',
      idpUserId: 'test-idp-user-resource-routes',
    });
    const savedUser = await userRepo.save(testUser);
    testUserId = savedUser.id;

    resourceService = new ResourceService();
    supplierService = new SupplierService();
    projectService = new ProjectService();
  });

  afterAll(async () => {
    // Clean up test data
    if (testUserId) {
      const projectRepo = AppDataSource.getRepository(Project);
      const supplierRepo = AppDataSource.getRepository(Supplier);
      const userRepo = AppDataSource.getRepository(User);
      
      // Delete projects first (cascades to resources)
      await projectRepo.delete({ ownerId: testUserId });
      // Delete suppliers before user
      await supplierRepo.delete({ ownerId: testUserId });
      // Finally delete user
      await userRepo.delete({ id: testUserId });
    }

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Clean up resources, suppliers, and projects before each test
    const projectRepo = AppDataSource.getRepository(Project);
    const supplierRepo = AppDataSource.getRepository(Supplier);

    // Delete projects first (cascades to resources)
    await projectRepo.delete({ ownerId: testUserId });
    await supplierRepo.delete({ ownerId: testUserId });

    // Create a test project for resource tests
    const project = await projectService.createProject({
      name: 'Test Project',
      clientName: 'Test Client',
      startDate: new Date('2024-01-01'),
      estimatedEndDate: new Date('2024-12-31'),
      ownerId: testUserId,
    });
    testProjectId = project.id;
  });

  describe('Resource CRUD Operations', () => {
    it('should create a new resource with valid data', async () => {
      const resourceData = {
        projectId: testProjectId,
        type: ResourceType.MATERIAL,
        name: 'Lumber',
        quantity: 100,
        unit: 'board feet',
        cost: 500.00,
        notes: 'Premium grade lumber',
      };

      const resource = await resourceService.createResource(resourceData);

      expect(resource).toMatchObject({
        projectId: testProjectId,
        type: ResourceType.MATERIAL,
        name: 'Lumber',
        quantity: 100,
        unit: 'board feet',
        cost: 500.00,
        status: ResourceStatus.NEEDED,
        notes: 'Premium grade lumber',
      });
      expect(resource.id).toBeDefined();
    });

    it('should create a resource with supplier', async () => {
      const supplier = await supplierService.createSupplier({
        name: 'Test Supplier',
        ownerId: testUserId,
      });

      const resourceData = {
        projectId: testProjectId,
        type: ResourceType.MATERIAL,
        name: 'Paint',
        quantity: 10,
        unit: 'gallons',
        cost: 300.00,
        supplierId: supplier.id,
      };

      const resource = await resourceService.createResource(resourceData);

      expect(resource.supplierId).toBe(supplier.id);
    });

    it('should list all resources for a project', async () => {
      await resourceService.createResource({
        projectId: testProjectId,
        type: ResourceType.MATERIAL,
        name: 'Resource 1',
        quantity: 10,
        unit: 'units',
        cost: 100,
      });

      await resourceService.createResource({
        projectId: testProjectId,
        type: ResourceType.EQUIPMENT,
        name: 'Resource 2',
        quantity: 5,
        unit: 'units',
        cost: 200,
      });

      const resources = await resourceService.listResources(testProjectId);

      expect(resources).toHaveLength(2);
    });

    it('should filter resources by status', async () => {
      const resource1 = await resourceService.createResource({
        projectId: testProjectId,
        type: ResourceType.MATERIAL,
        name: 'Resource 1',
        quantity: 10,
        unit: 'units',
        cost: 100,
      });

      await resourceService.createResource({
        projectId: testProjectId,
        type: ResourceType.MATERIAL,
        name: 'Resource 2',
        quantity: 5,
        unit: 'units',
        cost: 200,
      });

      // Mark one as ordered
      await resourceService.markAsOrdered(
        resource1.id,
        new Date('2024-01-15'),
        new Date('2024-01-20')
      );

      const orderedResources = await resourceService.listResources(testProjectId, {
        status: ResourceStatus.ORDERED,
      });

      expect(orderedResources).toHaveLength(1);
      expect(orderedResources[0].status).toBe(ResourceStatus.ORDERED);
    });

    it('should filter resources by type', async () => {
      await resourceService.createResource({
        projectId: testProjectId,
        type: ResourceType.MATERIAL,
        name: 'Material Resource',
        quantity: 10,
        unit: 'units',
        cost: 100,
      });

      await resourceService.createResource({
        projectId: testProjectId,
        type: ResourceType.EQUIPMENT,
        name: 'Equipment Resource',
        quantity: 5,
        unit: 'units',
        cost: 200,
      });

      const materialResources = await resourceService.listResources(testProjectId, {
        type: ResourceType.MATERIAL,
      });

      expect(materialResources).toHaveLength(1);
      expect(materialResources[0].type).toBe(ResourceType.MATERIAL);
    });

    it('should update a resource', async () => {
      const resource = await resourceService.createResource({
        projectId: testProjectId,
        type: ResourceType.MATERIAL,
        name: 'Original Name',
        quantity: 10,
        unit: 'units',
        cost: 100,
      });

      const updated = await resourceService.updateResource(resource.id, {
        name: 'Updated Name',
        quantity: 20,
        cost: 150,
      });

      expect(updated.name).toBe('Updated Name');
      expect(updated.quantity).toBe(20);
      expect(updated.cost).toBe(150);
    });

    it('should delete a resource', async () => {
      const resource = await resourceService.createResource({
        projectId: testProjectId,
        type: ResourceType.MATERIAL,
        name: 'To Delete',
        quantity: 10,
        unit: 'units',
        cost: 100,
      });

      await resourceService.deleteResource(resource.id);

      await expect(resourceService.getResource(resource.id)).rejects.toThrow('Resource not found');
    });
  });

  describe('Resource Status Transitions', () => {
    it('should mark a resource as ordered', async () => {
      const resource = await resourceService.createResource({
        projectId: testProjectId,
        type: ResourceType.MATERIAL,
        name: 'Test Resource',
        quantity: 10,
        unit: 'units',
        cost: 100,
      });

      const orderDate = new Date('2024-01-15');
      const expectedDeliveryDate = new Date('2024-01-20');

      const updated = await resourceService.markAsOrdered(
        resource.id,
        orderDate,
        expectedDeliveryDate
      );

      expect(updated.status).toBe(ResourceStatus.ORDERED);
      expect(updated.orderDate).toEqual(orderDate);
      expect(updated.expectedDeliveryDate).toEqual(expectedDeliveryDate);
    });

    it('should mark a resource as received', async () => {
      const resource = await resourceService.createResource({
        projectId: testProjectId,
        type: ResourceType.MATERIAL,
        name: 'Test Resource',
        quantity: 10,
        unit: 'units',
        cost: 100,
      });

      // First mark as ordered
      await resourceService.markAsOrdered(
        resource.id,
        new Date('2024-01-15'),
        new Date('2024-01-20')
      );

      // Then mark as received
      const actualDeliveryDate = new Date('2024-01-19');
      const updated = await resourceService.markAsReceived(resource.id, actualDeliveryDate);

      expect(updated.status).toBe(ResourceStatus.RECEIVED);
      expect(updated.actualDeliveryDate).toEqual(actualDeliveryDate);
    });
  });

  describe('Supplier CRUD Operations', () => {
    it('should create a new supplier with valid data', async () => {
      const supplierData = {
        name: 'ABC Supplies',
        contactName: 'John Smith',
        email: 'john@abcsupplies.com',
        phone: '555-1234',
        address: '123 Main St',
        notes: 'Reliable supplier',
        ownerId: testUserId,
      };

      const supplier = await supplierService.createSupplier(supplierData);

      expect(supplier).toMatchObject({
        name: 'ABC Supplies',
        contactName: 'John Smith',
        email: 'john@abcsupplies.com',
        phone: '555-1234',
        address: '123 Main St',
        notes: 'Reliable supplier',
        ownerId: testUserId,
      });
      expect(supplier.id).toBeDefined();
    });

    it('should create a supplier with only required fields', async () => {
      const supplier = await supplierService.createSupplier({
        name: 'Minimal Supplier',
        ownerId: testUserId,
      });

      expect(supplier.name).toBe('Minimal Supplier');
      expect(supplier.ownerId).toBe(testUserId);
      expect(supplier.id).toBeDefined();
    });

    it('should list all suppliers for a user', async () => {
      await supplierService.createSupplier({
        name: 'Supplier 1',
        ownerId: testUserId,
      });

      await supplierService.createSupplier({
        name: 'Supplier 2',
        ownerId: testUserId,
      });

      const suppliers = await supplierService.listSuppliers(testUserId);

      expect(suppliers).toHaveLength(2);
      expect(suppliers[0].name).toBeDefined();
    });

    it('should update a supplier', async () => {
      const supplier = await supplierService.createSupplier({
        name: 'Original Name',
        ownerId: testUserId,
      });

      const updated = await supplierService.updateSupplier(
        supplier.id,
        {
          name: 'Updated Name',
          email: 'updated@example.com',
        },
        testUserId
      );

      expect(updated.name).toBe('Updated Name');
      expect(updated.email).toBe('updated@example.com');
    });

    it('should delete a supplier', async () => {
      const supplier = await supplierService.createSupplier({
        name: 'To Delete',
        ownerId: testUserId,
      });

      await supplierService.deleteSupplier(supplier.id, testUserId);

      await expect(supplierService.getSupplier(supplier.id, testUserId)).rejects.toThrow(
        'Supplier not found'
      );
    });
  });

  describe('Resource and Supplier Integration', () => {
    it('should filter resources by supplier', async () => {
      const supplier1 = await supplierService.createSupplier({
        name: 'Supplier 1',
        ownerId: testUserId,
      });

      const supplier2 = await supplierService.createSupplier({
        name: 'Supplier 2',
        ownerId: testUserId,
      });

      await resourceService.createResource({
        projectId: testProjectId,
        type: ResourceType.MATERIAL,
        name: 'Resource from Supplier 1',
        quantity: 10,
        unit: 'units',
        cost: 100,
        supplierId: supplier1.id,
      });

      await resourceService.createResource({
        projectId: testProjectId,
        type: ResourceType.MATERIAL,
        name: 'Resource from Supplier 2',
        quantity: 5,
        unit: 'units',
        cost: 200,
        supplierId: supplier2.id,
      });

      const supplier1Resources = await resourceService.listResources(testProjectId, {
        supplierId: supplier1.id,
      });

      expect(supplier1Resources).toHaveLength(1);
      expect(supplier1Resources[0].supplierId).toBe(supplier1.id);
    });
  });
});
