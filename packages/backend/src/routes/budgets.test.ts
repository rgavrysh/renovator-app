import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { AppDataSource } from '../config/database';
import { ProjectService } from '../services/ProjectService';
import { BudgetService } from '../services/BudgetService';
import { BudgetCategory } from '../entities/BudgetItem';
import { User } from '../entities/User';
import { Project } from '../entities/Project';
import { Budget } from '../entities/Budget';

describe('Budget Routes Integration', () => {
  let projectService: ProjectService;
  let budgetService: BudgetService;
  let testUserId: string;
  let testProjectId: string;
  let testBudgetId: string;

  beforeAll(async () => {
    // Initialize database
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    // Create or find test user
    const userRepo = AppDataSource.getRepository(User);
    let testUser = await userRepo.findOne({
      where: { email: 'test-budget-routes@example.com' },
    });

    if (!testUser) {
      testUser = userRepo.create({
        email: 'test-budget-routes@example.com',
        firstName: 'Test',
        lastName: 'User',
        idpUserId: 'test-idp-user-budget-routes',
      });
      testUser = await userRepo.save(testUser);
    }
    
    testUserId = testUser.id;

    projectService = new ProjectService();
    budgetService = new BudgetService();
  });

  afterAll(async () => {
    // Clean up projects first (due to foreign key constraint)
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
    // Clean up projects and budgets before each test
    const projectRepo = AppDataSource.getRepository(Project);
    await projectRepo.delete({ ownerId: testUserId });

    // Create a test project
    const project = await projectService.createProject({
      name: 'Test Project',
      clientName: 'Test Client',
      startDate: new Date('2024-01-01'),
      estimatedEndDate: new Date('2024-12-31'),
      ownerId: testUserId,
    });
    testProjectId = project.id;
  });

  describe('POST /api/projects/:projectId/budget - Create Budget', () => {
    it('should create a budget for a project', async () => {
      const budget = await budgetService.createBudget(testProjectId);

      expect(budget).toBeDefined();
      expect(budget.id).toBeDefined();
      expect(budget.projectId).toBe(testProjectId);
      expect(Number(budget.totalEstimated)).toBe(0);
      expect(Number(budget.totalActual)).toBe(0);

      testBudgetId = budget.id;
    });

    it('should throw error if budget already exists', async () => {
      // Create first budget
      await budgetService.createBudget(testProjectId);

      // Try to create second budget
      await expect(budgetService.createBudget(testProjectId)).rejects.toThrow(
        'Budget already exists for this project'
      );
    });

    it('should throw error for non-existent project', async () => {
      await expect(
        budgetService.createBudget('123e4567-e89b-12d3-a456-426614174999')
      ).rejects.toThrow();
    });
  });

  describe('GET /api/projects/:projectId/budget - Get Budget', () => {
    beforeEach(async () => {
      const budget = await budgetService.createBudget(testProjectId);
      testBudgetId = budget.id;
    });

    it('should get budget for a project', async () => {
      const budget = await budgetService.getBudget(testProjectId);

      expect(budget).toBeDefined();
      expect(budget.id).toBeDefined();
      expect(budget.projectId).toBe(testProjectId);
      expect(budget.items).toBeDefined();
    });

    it('should throw error for project without budget', async () => {
      // Create another project without budget
      const project2 = await projectService.createProject({
        name: 'Test Project 2',
        clientName: 'Test Client 2',
        startDate: new Date('2024-01-01'),
        estimatedEndDate: new Date('2024-12-31'),
        ownerId: testUserId,
      });

      await expect(budgetService.getBudget(project2.id)).rejects.toThrow('Budget not found');
    });

    it('should throw error for non-existent project', async () => {
      await expect(
        budgetService.getBudget('123e4567-e89b-12d3-a456-426614174999')
      ).rejects.toThrow('Budget not found');
    });
  });

  describe('POST /api/budgets/:budgetId/items - Add Budget Item', () => {
    beforeEach(async () => {
      const budget = await budgetService.createBudget(testProjectId);
      testBudgetId = budget.id;
    });

    it('should add a budget item', async () => {
      const budgetItem = await budgetService.addBudgetItem(testBudgetId, {
        name: 'Labor Costs',
        category: BudgetCategory.LABOR,
        estimatedCost: 5000,
        actualCost: 4500,
        notes: 'Initial labor estimate',
      });

      expect(budgetItem).toBeDefined();
      expect(budgetItem.id).toBeDefined();
      expect(budgetItem.name).toBe('Labor Costs');
      expect(budgetItem.category).toBe(BudgetCategory.LABOR);
      expect(Number(budgetItem.estimatedCost)).toBe(5000);
      expect(Number(budgetItem.actualCost)).toBe(4500);
      expect(budgetItem.notes).toBe('Initial labor estimate');
    });

    it('should default actualCost to 0 if not provided', async () => {
      const budgetItem = await budgetService.addBudgetItem(testBudgetId, {
        name: 'Materials',
        category: BudgetCategory.MATERIALS,
        estimatedCost: 3000,
      });

      expect(Number(budgetItem.actualCost)).toBe(0);
    });

    it('should throw error for non-existent budget', async () => {
      await expect(
        budgetService.addBudgetItem('123e4567-e89b-12d3-a456-426614174999', {
          name: 'Labor Costs',
          category: BudgetCategory.LABOR,
          estimatedCost: 5000,
        })
      ).rejects.toThrow('Budget not found');
    });

    it('should update budget totals after adding item', async () => {
      await budgetService.addBudgetItem(testBudgetId, {
        name: 'Labor Costs',
        category: BudgetCategory.LABOR,
        estimatedCost: 5000,
        actualCost: 4500,
      });

      const budget = await budgetService.getBudget(testProjectId);
      expect(Number(budget.totalEstimated)).toBe(5000);
      expect(Number(budget.totalActual)).toBe(4500);
    });
  });

  describe('PUT /api/budget-items/:id - Update Budget Item', () => {
    let testBudgetItemId: string;

    beforeEach(async () => {
      const budget = await budgetService.createBudget(testProjectId);
      testBudgetId = budget.id;

      const budgetItem = await budgetService.addBudgetItem(testBudgetId, {
        name: 'Labor Costs',
        category: BudgetCategory.LABOR,
        estimatedCost: 5000,
        actualCost: 0,
      });
      testBudgetItemId = budgetItem.id;
    });

    it('should update a budget item', async () => {
      const updatedItem = await budgetService.updateBudgetItem(testBudgetItemId, {
        name: 'Updated Labor Costs',
        actualCost: 4800,
        notes: 'Updated estimate',
      });

      expect(updatedItem.name).toBe('Updated Labor Costs');
      expect(Number(updatedItem.actualCost)).toBe(4800);
      expect(updatedItem.notes).toBe('Updated estimate');
    });

    it('should update only provided fields', async () => {
      const updatedItem = await budgetService.updateBudgetItem(testBudgetItemId, {
        actualCost: 4500,
      });

      expect(updatedItem.name).toBe('Labor Costs');
      expect(Number(updatedItem.actualCost)).toBe(4500);
    });

    it('should throw error for non-existent budget item', async () => {
      await expect(
        budgetService.updateBudgetItem('123e4567-e89b-12d3-a456-426614174999', {
          actualCost: 4500,
        })
      ).rejects.toThrow('Budget item not found');
    });

    it('should update budget totals after updating item', async () => {
      await budgetService.updateBudgetItem(testBudgetItemId, {
        actualCost: 4800,
      });

      const budget = await budgetService.getBudget(testProjectId);
      expect(Number(budget.totalEstimated)).toBe(5000);
      expect(Number(budget.totalActual)).toBe(4800);
    });
  });

  describe('DELETE /api/budget-items/:id - Delete Budget Item', () => {
    let testBudgetItemId: string;

    beforeEach(async () => {
      const budget = await budgetService.createBudget(testProjectId);
      testBudgetId = budget.id;

      const budgetItem = await budgetService.addBudgetItem(testBudgetId, {
        name: 'Labor Costs',
        category: BudgetCategory.LABOR,
        estimatedCost: 5000,
      });
      testBudgetItemId = budgetItem.id;
    });

    it('should delete a budget item', async () => {
      await budgetService.deleteBudgetItem(testBudgetItemId);

      // Verify item is deleted
      const budget = await budgetService.getBudget(testProjectId);
      expect(budget.items.length).toBe(0);
    });

    it('should throw error for non-existent budget item', async () => {
      await expect(
        budgetService.deleteBudgetItem('123e4567-e89b-12d3-a456-426614174999')
      ).rejects.toThrow('Budget item not found');
    });

    it('should update budget totals after deleting item', async () => {
      await budgetService.deleteBudgetItem(testBudgetItemId);

      const budget = await budgetService.getBudget(testProjectId);
      expect(Number(budget.totalEstimated)).toBe(0);
      expect(Number(budget.totalActual)).toBe(0);
    });
  });

  describe('GET /api/budgets/:budgetId/alerts - Get Budget Alerts', () => {
    beforeEach(async () => {
      const budget = await budgetService.createBudget(testProjectId);
      testBudgetId = budget.id;
    });

    it('should return empty alerts when budget is within threshold', async () => {
      await budgetService.addBudgetItem(testBudgetId, {
        name: 'Labor Costs',
        category: BudgetCategory.LABOR,
        estimatedCost: 5000,
        actualCost: 4500,
      });

      const alerts = await budgetService.checkBudgetAlerts(testBudgetId);

      expect(alerts).toEqual([]);
    });

    it('should return warning alert when budget exceeds by 10-20%', async () => {
      await budgetService.addBudgetItem(testBudgetId, {
        name: 'Labor Costs',
        category: BudgetCategory.LABOR,
        estimatedCost: 5000,
        actualCost: 5600,
      });

      const alerts = await budgetService.checkBudgetAlerts(testBudgetId);

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('warning');
      expect(alerts[0].variancePercentage).toBeCloseTo(12, 0);
    });

    it('should return critical alert when budget exceeds by more than 20%', async () => {
      await budgetService.addBudgetItem(testBudgetId, {
        name: 'Labor Costs',
        category: BudgetCategory.LABOR,
        estimatedCost: 5000,
        actualCost: 6500,
      });

      const alerts = await budgetService.checkBudgetAlerts(testBudgetId);

      expect(alerts.length).toBe(1);
      expect(alerts[0].type).toBe('critical');
      expect(alerts[0].variancePercentage).toBeCloseTo(30, 0);
    });

    it('should throw error for non-existent budget', async () => {
      await expect(
        budgetService.checkBudgetAlerts('123e4567-e89b-12d3-a456-426614174999')
      ).rejects.toThrow('Budget not found');
    });
  });
});
