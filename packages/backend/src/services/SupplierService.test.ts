import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource } from '../config/database';
import { SupplierService } from './SupplierService';
import { Supplier } from '../entities/Supplier';
import { User } from '../entities/User';

describe('SupplierService', () => {
  let supplierService: SupplierService;
  let testUser: User;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }
    supplierService = new SupplierService();

    // Create a test user
    const userRepo = AppDataSource.getRepository(User);
    testUser = userRepo.create({
      email: 'supplier-test@example.com',
      firstName: 'Test',
      lastName: 'User',
      idpUserId: 'test-idp-supplier-user',
    });
    testUser = await userRepo.save(testUser);
  });

  afterAll(async () => {
    // Clean up test data
    const supplierRepo = AppDataSource.getRepository(Supplier);
    await supplierRepo.delete({ ownerId: testUser.id });

    const userRepo = AppDataSource.getRepository(User);
    await userRepo.delete({ id: testUser.id });

    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Clean up suppliers before each test
    const supplierRepo = AppDataSource.getRepository(Supplier);
    await supplierRepo.delete({ ownerId: testUser.id });
  });

  describe('createSupplier', () => {
    it('should create a supplier with all fields', async () => {
      const supplierData = {
        name: 'ABC Supplies',
        contactName: 'John Doe',
        email: 'john@abcsupplies.com',
        phone: '555-1234',
        address: '123 Main St',
        notes: 'Preferred supplier',
        ownerId: testUser.id,
      };

      const supplier = await supplierService.createSupplier(supplierData);

      expect(supplier.id).toBeDefined();
      expect(supplier.name).toBe(supplierData.name);
      expect(supplier.contactName).toBe(supplierData.contactName);
      expect(supplier.email).toBe(supplierData.email);
      expect(supplier.phone).toBe(supplierData.phone);
      expect(supplier.address).toBe(supplierData.address);
      expect(supplier.notes).toBe(supplierData.notes);
      expect(supplier.ownerId).toBe(testUser.id);
      expect(supplier.createdAt).toBeDefined();
      expect(supplier.updatedAt).toBeDefined();
    });

    it('should create a supplier with only required fields', async () => {
      const supplierData = {
        name: 'XYZ Materials',
        ownerId: testUser.id,
      };

      const supplier = await supplierService.createSupplier(supplierData);

      expect(supplier.id).toBeDefined();
      expect(supplier.name).toBe(supplierData.name);
      expect(supplier.ownerId).toBe(testUser.id);
      expect(supplier.contactName).toBeNull();
      expect(supplier.email).toBeNull();
      expect(supplier.phone).toBeNull();
      expect(supplier.address).toBeNull();
      expect(supplier.notes).toBeNull();
    });
  });

  describe('getSupplier', () => {
    it('should retrieve a supplier by id', async () => {
      const created = await supplierService.createSupplier({
        name: 'Test Supplier',
        ownerId: testUser.id,
      });

      const retrieved = await supplierService.getSupplier(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe(created.name);
    });

    it('should retrieve a supplier by id and ownerId', async () => {
      const created = await supplierService.createSupplier({
        name: 'Test Supplier',
        ownerId: testUser.id,
      });

      const retrieved = await supplierService.getSupplier(created.id, testUser.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe(created.name);
    });

    it('should throw error for non-existent supplier', async () => {
      await expect(
        supplierService.getSupplier('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Supplier not found');
    });

    it('should throw error for invalid UUID', async () => {
      await expect(supplierService.getSupplier('invalid-id')).rejects.toThrow(
        'Supplier not found'
      );
    });

    it('should throw error when ownerId does not match', async () => {
      const created = await supplierService.createSupplier({
        name: 'Test Supplier',
        ownerId: testUser.id,
      });

      await expect(
        supplierService.getSupplier(created.id, '00000000-0000-0000-0000-000000000001')
      ).rejects.toThrow('Supplier not found');
    });
  });

  describe('updateSupplier', () => {
    it('should update supplier fields', async () => {
      const created = await supplierService.createSupplier({
        name: 'Original Name',
        contactName: 'Original Contact',
        ownerId: testUser.id,
      });

      const updated = await supplierService.updateSupplier(created.id, {
        name: 'Updated Name',
        email: 'updated@example.com',
      });

      expect(updated.id).toBe(created.id);
      expect(updated.name).toBe('Updated Name');
      expect(updated.contactName).toBe('Original Contact');
      expect(updated.email).toBe('updated@example.com');
    });

    it('should update supplier with ownerId validation', async () => {
      const created = await supplierService.createSupplier({
        name: 'Test Supplier',
        ownerId: testUser.id,
      });

      const updated = await supplierService.updateSupplier(
        created.id,
        { name: 'Updated Name' },
        testUser.id
      );

      expect(updated.name).toBe('Updated Name');
    });

    it('should throw error when updating non-existent supplier', async () => {
      await expect(
        supplierService.updateSupplier('00000000-0000-0000-0000-000000000000', {
          name: 'Updated',
        })
      ).rejects.toThrow('Supplier not found');
    });
  });

  describe('deleteSupplier', () => {
    it('should delete a supplier', async () => {
      const created = await supplierService.createSupplier({
        name: 'To Delete',
        ownerId: testUser.id,
      });

      await supplierService.deleteSupplier(created.id);

      await expect(supplierService.getSupplier(created.id)).rejects.toThrow(
        'Supplier not found'
      );
    });

    it('should delete supplier with ownerId validation', async () => {
      const created = await supplierService.createSupplier({
        name: 'To Delete',
        ownerId: testUser.id,
      });

      await supplierService.deleteSupplier(created.id, testUser.id);

      await expect(supplierService.getSupplier(created.id)).rejects.toThrow(
        'Supplier not found'
      );
    });

    it('should throw error when deleting non-existent supplier', async () => {
      await expect(
        supplierService.deleteSupplier('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Supplier not found');
    });
  });

  describe('listSuppliers', () => {
    it('should list all suppliers for an owner', async () => {
      await supplierService.createSupplier({
        name: 'Supplier A',
        ownerId: testUser.id,
      });
      await supplierService.createSupplier({
        name: 'Supplier B',
        ownerId: testUser.id,
      });
      await supplierService.createSupplier({
        name: 'Supplier C',
        ownerId: testUser.id,
      });

      const suppliers = await supplierService.listSuppliers(testUser.id);

      expect(suppliers).toHaveLength(3);
      expect(suppliers.map((s) => s.name)).toEqual([
        'Supplier A',
        'Supplier B',
        'Supplier C',
      ]);
    });

    it('should return empty array when no suppliers exist', async () => {
      const suppliers = await supplierService.listSuppliers(testUser.id);

      expect(suppliers).toHaveLength(0);
    });

    it('should sort suppliers by name in ascending order', async () => {
      await supplierService.createSupplier({
        name: 'Zebra Supplies',
        ownerId: testUser.id,
      });
      await supplierService.createSupplier({
        name: 'Alpha Materials',
        ownerId: testUser.id,
      });
      await supplierService.createSupplier({
        name: 'Beta Vendors',
        ownerId: testUser.id,
      });

      const suppliers = await supplierService.listSuppliers(testUser.id);

      expect(suppliers.map((s) => s.name)).toEqual([
        'Alpha Materials',
        'Beta Vendors',
        'Zebra Supplies',
      ]);
    });

    it('should throw error for invalid ownerId', async () => {
      await expect(supplierService.listSuppliers('invalid-id')).rejects.toThrow(
        'Invalid owner ID'
      );
    });
  });
});
