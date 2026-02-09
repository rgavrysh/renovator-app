import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource } from '../config/database';
import { WorkItemTemplateService } from './WorkItemTemplateService';
import { WorkItemCategory } from '../entities/WorkItemTemplate';
import { User } from '../entities/User';

describe('WorkItemTemplateService', () => {
  let service: WorkItemTemplateService;
  let testUserId: string;
  let otherUserId: string;

  beforeAll(async () => {
    await AppDataSource.initialize();
    service = new WorkItemTemplateService();

    // Create test users
    const userRepo = AppDataSource.getRepository(User);
    
    // Try to find existing users first
    let user = await userRepo.findOne({ where: { email: 'template-test@example.com' } });
    if (!user) {
      user = userRepo.create({
        email: 'template-test@example.com',
        firstName: 'Template',
        lastName: 'Tester',
        idpUserId: 'idp-template-test',
      });
      user = await userRepo.save(user);
    }
    testUserId = user.id;

    let otherUser = await userRepo.findOne({ where: { email: 'other-user@example.com' } });
    if (!otherUser) {
      otherUser = userRepo.create({
        email: 'other-user@example.com',
        firstName: 'Other',
        lastName: 'User',
        idpUserId: 'idp-other-user',
      });
      otherUser = await userRepo.save(otherUser);
    }
    otherUserId = otherUser.id;
  });

  afterAll(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    // Clean up templates before each test
    const templateRepo = AppDataSource.getRepository('WorkItemTemplate');
    await templateRepo.query('DELETE FROM work_item_templates');
  });

  describe('createTemplate', () => {
    test('should create a custom work item template', async () => {
      const input = {
        name: 'Custom Demolition Task',
        description: 'Custom demolition work',
        category: WorkItemCategory.DEMOLITION,
        estimatedDuration: 8,
        defaultPrice: 1000,
        ownerId: testUserId,
      };

      const template = await service.createTemplate(input);

      expect(template.id).toBeDefined();
      expect(template.name).toBe(input.name);
      expect(template.description).toBe(input.description);
      expect(template.category).toBe(input.category);
      expect(template.estimatedDuration).toBe(input.estimatedDuration);
      expect(template.defaultPrice).toBe(1000);
      expect(template.isDefault).toBe(false);
      expect(template.ownerId).toBe(testUserId);
    });

    test('should create a default template', async () => {
      const input = {
        name: 'Default Framing Task',
        category: WorkItemCategory.FRAMING,
        isDefault: true,
      };

      const template = await service.createTemplate(input);

      expect(template.isDefault).toBe(true);
      expect(template.ownerId).toBeNull();
    });
  });

  describe('getTemplate', () => {
    test('should retrieve a template by id', async () => {
      const created = await service.createTemplate({
        name: 'Test Template',
        category: WorkItemCategory.ELECTRICAL,
        ownerId: testUserId,
      });

      const retrieved = await service.getTemplate(created.id);

      expect(retrieved.id).toBe(created.id);
      expect(retrieved.name).toBe('Test Template');
    });

    test('should throw error for invalid UUID', async () => {
      await expect(service.getTemplate('invalid-id')).rejects.toThrow('Template not found');
    });

    test('should throw error for non-existent template', async () => {
      await expect(
        service.getTemplate('00000000-0000-0000-0000-000000000000')
      ).rejects.toThrow('Template not found');
    });

    test('should allow access to default templates without ownership check', async () => {
      const defaultTemplate = await service.createTemplate({
        name: 'Default Template',
        category: WorkItemCategory.PLUMBING,
        isDefault: true,
      });

      const retrieved = await service.getTemplate(defaultTemplate.id, otherUserId);

      expect(retrieved.id).toBe(defaultTemplate.id);
    });

    test('should deny access to other users custom templates', async () => {
      const customTemplate = await service.createTemplate({
        name: 'Custom Template',
        category: WorkItemCategory.HVAC,
        ownerId: testUserId,
      });

      await expect(
        service.getTemplate(customTemplate.id, otherUserId)
      ).rejects.toThrow('Template not found');
    });
  });

  describe('updateTemplate', () => {
    test('should update a custom template', async () => {
      const created = await service.createTemplate({
        name: 'Original Name',
        category: WorkItemCategory.DRYWALL,
        ownerId: testUserId,
      });

      const updated = await service.updateTemplate(
        created.id,
        { name: 'Updated Name', defaultPrice: 500 },
        testUserId
      );

      expect(updated.name).toBe('Updated Name');
      expect(updated.defaultPrice).toBe(500);
      expect(updated.category).toBe(WorkItemCategory.DRYWALL);
    });

    test('should not allow updating default templates', async () => {
      const defaultTemplate = await service.createTemplate({
        name: 'Default Template',
        category: WorkItemCategory.PAINTING,
        isDefault: true,
      });

      await expect(
        service.updateTemplate(defaultTemplate.id, { name: 'New Name' })
      ).rejects.toThrow('Cannot update default templates');
    });

    test('should not allow updating other users templates', async () => {
      const created = await service.createTemplate({
        name: 'User Template',
        category: WorkItemCategory.FLOORING,
        ownerId: testUserId,
      });

      await expect(
        service.updateTemplate(created.id, { name: 'Hacked Name' }, otherUserId)
      ).rejects.toThrow('Template not found');
    });
  });

  describe('deleteTemplate', () => {
    test('should delete a custom template', async () => {
      const created = await service.createTemplate({
        name: 'To Delete',
        category: WorkItemCategory.FINISHING,
        ownerId: testUserId,
      });

      await service.deleteTemplate(created.id, testUserId);

      await expect(service.getTemplate(created.id)).rejects.toThrow('Template not found');
    });

    test('should not allow deleting default templates', async () => {
      const defaultTemplate = await service.createTemplate({
        name: 'Default Template',
        category: WorkItemCategory.CLEANUP,
        isDefault: true,
      });

      await expect(service.deleteTemplate(defaultTemplate.id)).rejects.toThrow(
        'Cannot delete default templates'
      );
    });

    test('should not allow deleting other users templates', async () => {
      const created = await service.createTemplate({
        name: 'User Template',
        category: WorkItemCategory.INSPECTION,
        ownerId: testUserId,
      });

      await expect(
        service.deleteTemplate(created.id, otherUserId)
      ).rejects.toThrow('Template not found');
    });
  });

  describe('listTemplates', () => {
    beforeEach(async () => {
      // Create some test templates
      await service.createTemplate({
        name: 'Default Demolition',
        category: WorkItemCategory.DEMOLITION,
        isDefault: true,
      });
      await service.createTemplate({
        name: 'Default Framing',
        category: WorkItemCategory.FRAMING,
        isDefault: true,
      });
      await service.createTemplate({
        name: 'Custom Demolition',
        category: WorkItemCategory.DEMOLITION,
        ownerId: testUserId,
      });
      await service.createTemplate({
        name: 'Other User Template',
        category: WorkItemCategory.ELECTRICAL,
        ownerId: otherUserId,
      });
    });

    test('should list all default templates when no ownerId provided', async () => {
      const templates = await service.listTemplates();

      expect(templates.length).toBe(2);
      expect(templates.every((t) => t.isDefault)).toBe(true);
    });

    test('should list default and user templates when ownerId provided', async () => {
      const templates = await service.listTemplates(undefined, testUserId);

      expect(templates.length).toBe(3);
      expect(templates.some((t) => t.name === 'Default Demolition')).toBe(true);
      expect(templates.some((t) => t.name === 'Default Framing')).toBe(true);
      expect(templates.some((t) => t.name === 'Custom Demolition')).toBe(true);
      expect(templates.some((t) => t.name === 'Other User Template')).toBe(false);
    });

    test('should filter templates by category', async () => {
      const templates = await service.listTemplates(WorkItemCategory.DEMOLITION, testUserId);

      expect(templates.length).toBe(2);
      expect(templates.every((t) => t.category === WorkItemCategory.DEMOLITION)).toBe(true);
    });

    test('should return templates sorted by category and name', async () => {
      const templates = await service.listTemplates(undefined, testUserId);

      // Check that templates are sorted
      for (let i = 1; i < templates.length; i++) {
        const prev = templates[i - 1];
        const curr = templates[i];
        
        if (prev.category === curr.category) {
          expect(prev.name.localeCompare(curr.name)).toBeLessThanOrEqual(0);
        } else {
          expect(prev.category.localeCompare(curr.category)).toBeLessThanOrEqual(0);
        }
      }
    });
  });

  describe('getTemplatesByCategory', () => {
    beforeEach(async () => {
      await service.createTemplate({
        name: 'Demolition 1',
        category: WorkItemCategory.DEMOLITION,
        isDefault: true,
      });
      await service.createTemplate({
        name: 'Demolition 2',
        category: WorkItemCategory.DEMOLITION,
        isDefault: true,
      });
      await service.createTemplate({
        name: 'Framing 1',
        category: WorkItemCategory.FRAMING,
        isDefault: true,
      });
    });

    test('should return templates grouped by category', async () => {
      const grouped = await service.getTemplatesByCategory();

      expect(grouped[WorkItemCategory.DEMOLITION].length).toBe(2);
      expect(grouped[WorkItemCategory.FRAMING].length).toBe(1);
      expect(grouped[WorkItemCategory.ELECTRICAL].length).toBe(0);
      expect(grouped[WorkItemCategory.PLUMBING].length).toBe(0);
    });

    test('should include all categories even if empty', async () => {
      const grouped = await service.getTemplatesByCategory();

      expect(Object.keys(grouped)).toContain(WorkItemCategory.DEMOLITION);
      expect(Object.keys(grouped)).toContain(WorkItemCategory.FRAMING);
      expect(Object.keys(grouped)).toContain(WorkItemCategory.ELECTRICAL);
      expect(Object.keys(grouped)).toContain(WorkItemCategory.PLUMBING);
      expect(Object.keys(grouped)).toContain(WorkItemCategory.HVAC);
      expect(Object.keys(grouped)).toContain(WorkItemCategory.DRYWALL);
      expect(Object.keys(grouped)).toContain(WorkItemCategory.PAINTING);
      expect(Object.keys(grouped)).toContain(WorkItemCategory.FLOORING);
      expect(Object.keys(grouped)).toContain(WorkItemCategory.FINISHING);
      expect(Object.keys(grouped)).toContain(WorkItemCategory.CLEANUP);
      expect(Object.keys(grouped)).toContain(WorkItemCategory.INSPECTION);
      expect(Object.keys(grouped)).toContain(WorkItemCategory.OTHER);
    });
  });

  describe('seedDefaultTemplates', () => {
    test('should seed default templates', async () => {
      await service.seedDefaultTemplates();

      const templates = await service.listTemplates();

      expect(templates.length).toBeGreaterThan(0);
      expect(templates.every((t) => t.isDefault)).toBe(true);
      
      // Check that we have templates in various categories
      const categories = new Set(templates.map((t) => t.category));
      expect(categories.has(WorkItemCategory.DEMOLITION)).toBe(true);
      expect(categories.has(WorkItemCategory.FRAMING)).toBe(true);
      expect(categories.has(WorkItemCategory.ELECTRICAL)).toBe(true);
      expect(categories.has(WorkItemCategory.PLUMBING)).toBe(true);
    });

    test('should not seed if default templates already exist', async () => {
      await service.seedDefaultTemplates();
      const firstCount = (await service.listTemplates()).length;

      await service.seedDefaultTemplates();
      const secondCount = (await service.listTemplates()).length;

      expect(firstCount).toBe(secondCount);
    });
  });
});
