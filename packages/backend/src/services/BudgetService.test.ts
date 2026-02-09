import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource } from '../config/database';
import { BudgetService } from './BudgetService';
import { ProjectService } from './ProjectService';
import { Budget } from '../entities/Budget';
import { BudgetItem, BudgetCategory } from '../entities/BudgetItem';
import { ProjectStatus } from '../entities/Project';
import { User } from '../entities/User';

describe('BudgetService', () => {
  let budgetService: BudgetService;
  let projectService: ProjectService;
  let testProjectId: string;
  let testUser: User;

  beforeAll(async () => {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Create or find test user
    const userRepository = AppDataSource.getRepository(User);
    let existingUser = await userRepository.findOne({
      where: { email: 'budget-test@example.com' },
    });

    if (existingUser) {
      testUser = existingUser;
    } else {
      testUser = userRepository.create({
        email: 'budget-test@example.com',
        firstName: 'Budget',
        lastName: 'Test',
        idpUserId: 'budget-test-idp-user-id',
      });
      testUser = await userRepository.save(testUser);
    }
  });

  afterAll(async () => {
    // Clean up test data
    if (AppDataSource.isInitialized) {
      // Delete projects first (foreign key constraint)
      const projectRepository = AppDataSource.getRepository('Project');
      await projectRepository.delete({ ownerId: testUser.id });
      
      const userRepository = AppDataSource.getRepository(User);
      await userRepository.delete({ id: testUser.id });
      await AppDataSource.destroy();
    }
  });

  beforeEach(async () => {
    budgetService = new BudgetService();
    projectService = new ProjectService();

    // Create a test project
    const project = await projectService.createProject({
      name: 'Test Project',
      clientName: 'Test Client',
      startDate: new Date('2024-01-01'),
      estimatedEndDate: new Date('2024-12-31'),
      ownerId: testUser.id,
      status: ProjectStatus.ACTIVE,
    });
    testProjectId = project.id;
  });

  describe('createBudget', () => {
    test('should create a budget for a project', async () => {
      const budget = await budgetService.createBudget(testProjectId);

      expect(budget).toBeDefined();
      expect(budget.id).toBeDefined();
      expect(budget.projectId).toBe(testProjectId);
      expect(Number(budget.totalEstimated)).toBe(0);
      expect(Number(budget.totalActual)).toBe(0);
      expect(budget.createdAt).toBeInstanceOf(Date);
      expect(budget.updatedAt).toBeInstanceOf(Date);
    });

    test('should throw error if budget already exists for project', async () => {
      await budgetService.createBudget(testProjectId);

      await expect(budgetService.createBudget(testProjectId)).rejects.toThrow(
        'Budget already exists for this project'
      );
    });

    test('should throw error for invalid project ID', async () => {
      await expect(budgetService.createBudget('invalid-id')).rejects.toThrow(
        'Invalid project ID'
      );
    });
  });

  describe('getBudget', () => {
    test('should retrieve budget with items', async () => {
      const createdBudget = await budgetService.createBudget(testProjectId);

      const budget = await budgetService.getBudget(testProjectId);

      expect(budget).toBeDefined();
      expect(budget.id).toBe(createdBudget.id);
      expect(budget.projectId).toBe(testProjectId);
      expect(budget.items).toBeDefined();
      expect(Array.isArray(budget.items)).toBe(true);
    });

    test('should throw error if budget not found', async () => {
      const nonExistentProjectId = '123e4567-e89b-12d3-a456-426614174999';

      await expect(budgetService.getBudget(nonExistentProjectId)).rejects.toThrow(
        'Budget not found'
      );
    });

    test('should throw error for invalid project ID', async () => {
      await expect(budgetService.getBudget('invalid-id')).rejects.toThrow(
        'Budget not found'
      );
    });
  });

  describe('addBudgetItem', () => {
    let budgetId: string;

    beforeEach(async () => {
      const budget = await budgetService.createBudget(testProjectId);
      budgetId = budget.id;
    });

    test('should add budget item with all fields', async () => {
      const itemData = {
        name: 'Labor Costs',
        category: BudgetCategory.LABOR,
        estimatedCost: 5000,
        actualCost: 4500,
        notes: 'Initial labor estimate',
      };

      const budgetItem = await budgetService.addBudgetItem(budgetId, itemData);

      expect(budgetItem).toBeDefined();
      expect(budgetItem.id).toBeDefined();
      expect(budgetItem.budgetId).toBe(budgetId);
      expect(budgetItem.name).toBe(itemData.name);
      expect(budgetItem.category).toBe(itemData.category);
      expect(Number(budgetItem.estimatedCost)).toBe(itemData.estimatedCost);
      expect(Number(budgetItem.actualCost)).toBe(itemData.actualCost);
      expect(budgetItem.notes).toBe(itemData.notes);
    });

    test('should add budget item with default actual cost', async () => {
      const itemData = {
        name: 'Materials',
        category: BudgetCategory.MATERIALS,
        estimatedCost: 3000,
      };

      const budgetItem = await budgetService.addBudgetItem(budgetId, itemData);

      expect(Number(budgetItem.actualCost)).toBe(0);
    });

    test('should update budget totals after adding item', async () => {
      await budgetService.addBudgetItem(budgetId, {
        name: 'Labor',
        category: BudgetCategory.LABOR,
        estimatedCost: 5000,
        actualCost: 4500,
      });

      await budgetService.addBudgetItem(budgetId, {
        name: 'Materials',
        category: BudgetCategory.MATERIALS,
        estimatedCost: 3000,
        actualCost: 2800,
      });

      const budget = await budgetService.getBudget(testProjectId);

      expect(Number(budget.totalEstimated)).toBe(8000);
      expect(Number(budget.totalActual)).toBe(7300);
    });

    test('should throw error for invalid budget ID', async () => {
      await expect(
        budgetService.addBudgetItem('invalid-id', {
          name: 'Test',
          category: BudgetCategory.LABOR,
          estimatedCost: 1000,
        })
      ).rejects.toThrow('Invalid budget ID');
    });

    test('should throw error if budget not found', async () => {
      const nonExistentBudgetId = '123e4567-e89b-12d3-a456-426614174999';

      await expect(
        budgetService.addBudgetItem(nonExistentBudgetId, {
          name: 'Test',
          category: BudgetCategory.LABOR,
          estimatedCost: 1000,
        })
      ).rejects.toThrow('Budget not found');
    });
  });

  describe('updateBudgetItem', () => {
    let budgetId: string;
    let itemId: string;

    beforeEach(async () => {
      const budget = await budgetService.createBudget(testProjectId);
      budgetId = budget.id;

      const item = await budgetService.addBudgetItem(budgetId, {
        name: 'Labor',
        category: BudgetCategory.LABOR,
        estimatedCost: 5000,
        actualCost: 4500,
      });
      itemId = item.id;
    });

    test('should update budget item fields', async () => {
      const updatedItem = await budgetService.updateBudgetItem(itemId, {
        name: 'Updated Labor',
        actualCost: 5200,
        notes: 'Cost increased',
      });

      expect(updatedItem.name).toBe('Updated Labor');
      expect(Number(updatedItem.actualCost)).toBe(5200);
      expect(updatedItem.notes).toBe('Cost increased');
      expect(updatedItem.category).toBe(BudgetCategory.LABOR);
      expect(Number(updatedItem.estimatedCost)).toBe(5000);
    });

    test('should update budget totals after updating item', async () => {
      await budgetService.updateBudgetItem(itemId, {
        estimatedCost: 6000,
        actualCost: 5500,
      });

      const budget = await budgetService.getBudget(testProjectId);

      expect(Number(budget.totalEstimated)).toBe(6000);
      expect(Number(budget.totalActual)).toBe(5500);
    });

    test('should throw error for invalid item ID', async () => {
      await expect(
        budgetService.updateBudgetItem('invalid-id', { actualCost: 1000 })
      ).rejects.toThrow('Budget item not found');
    });

    test('should throw error if item not found', async () => {
      const nonExistentItemId = '123e4567-e89b-12d3-a456-426614174999';

      await expect(
        budgetService.updateBudgetItem(nonExistentItemId, { actualCost: 1000 })
      ).rejects.toThrow('Budget item not found');
    });
  });

  describe('deleteBudgetItem', () => {
    let budgetId: string;
    let itemId: string;

    beforeEach(async () => {
      const budget = await budgetService.createBudget(testProjectId);
      budgetId = budget.id;

      const item = await budgetService.addBudgetItem(budgetId, {
        name: 'Labor',
        category: BudgetCategory.LABOR,
        estimatedCost: 5000,
        actualCost: 4500,
      });
      itemId = item.id;
    });

    test('should delete budget item', async () => {
      await budgetService.deleteBudgetItem(itemId);

      const budget = await budgetService.getBudget(testProjectId);

      expect(budget.items.length).toBe(0);
    });

    test('should update budget totals after deleting item', async () => {
      await budgetService.addBudgetItem(budgetId, {
        name: 'Materials',
        category: BudgetCategory.MATERIALS,
        estimatedCost: 3000,
        actualCost: 2800,
      });

      await budgetService.deleteBudgetItem(itemId);

      const budget = await budgetService.getBudget(testProjectId);

      expect(Number(budget.totalEstimated)).toBe(3000);
      expect(Number(budget.totalActual)).toBe(2800);
    });

    test('should throw error for invalid item ID', async () => {
      await expect(budgetService.deleteBudgetItem('invalid-id')).rejects.toThrow(
        'Budget item not found'
      );
    });

    test('should throw error if item not found', async () => {
      const nonExistentItemId = '123e4567-e89b-12d3-a456-426614174999';

      await expect(budgetService.deleteBudgetItem(nonExistentItemId)).rejects.toThrow(
        'Budget item not found'
      );
    });
  });

  describe('calculateVariance', () => {
    let budgetId: string;

    beforeEach(async () => {
      const budget = await budgetService.createBudget(testProjectId);
      budgetId = budget.id;
    });

    test('should return budget with variance information', async () => {
      await budgetService.addBudgetItem(budgetId, {
        name: 'Labor',
        category: BudgetCategory.LABOR,
        estimatedCost: 5000,
        actualCost: 5500,
      });

      await budgetService.addBudgetItem(budgetId, {
        name: 'Materials',
        category: BudgetCategory.MATERIALS,
        estimatedCost: 3000,
        actualCost: 2800,
      });

      const budget = await budgetService.calculateVariance(budgetId);

      expect(Number(budget.totalEstimated)).toBe(8000);
      expect(Number(budget.totalActual)).toBe(8300);
    });

    test('should throw error if budget not found', async () => {
      const nonExistentBudgetId = '123e4567-e89b-12d3-a456-426614174999';

      await expect(budgetService.calculateVariance(nonExistentBudgetId)).rejects.toThrow(
        'Budget not found'
      );
    });
  });

  describe('checkBudgetAlerts', () => {
    let budgetId: string;

    beforeEach(async () => {
      const budget = await budgetService.createBudget(testProjectId);
      budgetId = budget.id;
    });

    test('should return no alerts when within budget', async () => {
      await budgetService.addBudgetItem(budgetId, {
        name: 'Labor',
        category: BudgetCategory.LABOR,
        estimatedCost: 5000,
        actualCost: 4500,
      });

      const alerts = await budgetService.checkBudgetAlerts(budgetId);

      expect(alerts).toEqual([]);
    });

    test('should return warning alert when over budget by 10-20%', async () => {
      await budgetService.addBudgetItem(budgetId, {
        name: 'Labor',
        category: BudgetCategory.LABOR,
        estimatedCost: 5000,
        actualCost: 5600,
      });

      const alerts = await budgetService.checkBudgetAlerts(budgetId);

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('warning');
      expect(alerts[0].budgetId).toBe(budgetId);
      expect(alerts[0].variancePercentage).toBeCloseTo(12, 1);
      expect(alerts[0].message).toContain('12.0%');
    });

    test('should return critical alert when over budget by more than 20%', async () => {
      await budgetService.addBudgetItem(budgetId, {
        name: 'Labor',
        category: BudgetCategory.LABOR,
        estimatedCost: 5000,
        actualCost: 6500,
      });

      const alerts = await budgetService.checkBudgetAlerts(budgetId);

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('critical');
      expect(alerts[0].budgetId).toBe(budgetId);
      expect(alerts[0].variancePercentage).toBeCloseTo(30, 1);
      expect(alerts[0].message).toContain('30.0%');
    });

    test('should return no alerts when budget is empty', async () => {
      const alerts = await budgetService.checkBudgetAlerts(budgetId);

      expect(alerts).toEqual([]);
    });

    test('should throw error if budget not found', async () => {
      const nonExistentBudgetId = '123e4567-e89b-12d3-a456-426614174999';

      await expect(budgetService.checkBudgetAlerts(nonExistentBudgetId)).rejects.toThrow(
        'Budget not found'
      );
    });
  });

  describe('totals aggregation', () => {
    let budgetId: string;

    beforeEach(async () => {
      const budget = await budgetService.createBudget(testProjectId);
      budgetId = budget.id;
    });

    test('should aggregate totals from multiple budget items', async () => {
      await budgetService.addBudgetItem(budgetId, {
        name: 'Labor',
        category: BudgetCategory.LABOR,
        estimatedCost: 5000,
        actualCost: 4800,
      });

      await budgetService.addBudgetItem(budgetId, {
        name: 'Materials',
        category: BudgetCategory.MATERIALS,
        estimatedCost: 3000,
        actualCost: 3200,
      });

      await budgetService.addBudgetItem(budgetId, {
        name: 'Equipment',
        category: BudgetCategory.EQUIPMENT,
        estimatedCost: 1500,
        actualCost: 1400,
      });

      const budget = await budgetService.getBudget(testProjectId);

      expect(Number(budget.totalEstimated)).toBe(9500);
      expect(Number(budget.totalActual)).toBe(9400);
    });

    test('should handle decimal values correctly', async () => {
      await budgetService.addBudgetItem(budgetId, {
        name: 'Labor',
        category: BudgetCategory.LABOR,
        estimatedCost: 1234.56,
        actualCost: 1234.78,
      });

      await budgetService.addBudgetItem(budgetId, {
        name: 'Materials',
        category: BudgetCategory.MATERIALS,
        estimatedCost: 987.65,
        actualCost: 987.43,
      });

      const budget = await budgetService.getBudget(testProjectId);

      expect(Number(budget.totalEstimated)).toBeCloseTo(2222.21, 2);
      expect(Number(budget.totalActual)).toBeCloseTo(2222.21, 2);
    });
  });
});
