import { Router, Request, Response } from 'express';
import { BudgetService } from '../services/BudgetService';
import { ProjectService } from '../services/ProjectService';
import { authenticate } from '../middleware';
import { BudgetCategory } from '../entities/BudgetItem';

const router = Router();
const budgetService = new BudgetService();
const projectService = new ProjectService();

/**
 * POST /api/projects/:projectId/budget
 * Create a budget for a project
 */
router.post('/:projectId/budget', authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and user owns it
    try {
      await projectService.getProject(projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const budget = await budgetService.createBudget(projectId);
    res.status(201).json(budget);
  } catch (error) {
    if (error instanceof Error && error.message === 'Budget already exists for this project') {
      res.status(409).json({ error: 'Budget already exists for this project' });
      return;
    }
    console.error('Error creating budget:', error);
    res.status(500).json({ error: 'Failed to create budget' });
  }
});

/**
 * GET /api/projects/:projectId/budget
 * Get budget for a project
 */
router.get('/:projectId/budget', authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and user owns it
    try {
      await projectService.getProject(projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const budget = await budgetService.getBudget(projectId);
    res.json(budget);
  } catch (error) {
    if (error instanceof Error && error.message === 'Budget not found') {
      res.status(404).json({ error: 'Budget not found' });
      return;
    }
    console.error('Error getting budget:', error);
    res.status(500).json({ error: 'Failed to get budget' });
  }
});

/**
 * POST /api/budgets/:budgetId/items
 * Add a budget item to a budget
 */
router.post('/:budgetId/items', authenticate, async (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;
    const { name, category, estimatedCost, actualCost, notes } = req.body;

    // Validate required fields
    if (!name || !category || estimatedCost === undefined) {
      res.status(400).json({ 
        error: 'Missing required fields: name, category, estimatedCost' 
      });
      return;
    }

    // Validate category
    if (!Object.values(BudgetCategory).includes(category)) {
      res.status(400).json({ error: 'Invalid budget category' });
      return;
    }

    // Validate costs are numbers
    if (typeof estimatedCost !== 'number' || estimatedCost < 0) {
      res.status(400).json({ error: 'estimatedCost must be a non-negative number' });
      return;
    }

    if (actualCost !== undefined && (typeof actualCost !== 'number' || actualCost < 0)) {
      res.status(400).json({ error: 'actualCost must be a non-negative number' });
      return;
    }

    // Verify budget exists and user owns the project
    try {
      const budget = await budgetService.calculateVariance(budgetId);
      await projectService.getProject(budget.projectId, req.userId!);
    } catch (error) {
      if (error instanceof Error && error.message === 'Budget not found') {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const budgetItem = await budgetService.addBudgetItem(budgetId, {
      name,
      category,
      estimatedCost,
      actualCost,
      notes,
    });

    res.status(201).json(budgetItem);
  } catch (error) {
    console.error('Error adding budget item:', error);
    res.status(500).json({ error: 'Failed to add budget item' });
  }
});

/**
 * PUT /api/budget-items/:id
 * Update a budget item
 */
router.put('/budget-items/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, estimatedCost, actualCost, notes } = req.body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (notes !== undefined) updateData.notes = notes;

    // Validate category if provided
    if (category !== undefined) {
      if (!Object.values(BudgetCategory).includes(category)) {
        res.status(400).json({ error: 'Invalid budget category' });
        return;
      }
      updateData.category = category;
    }

    // Validate costs if provided
    if (estimatedCost !== undefined) {
      if (typeof estimatedCost !== 'number' || estimatedCost < 0) {
        res.status(400).json({ error: 'estimatedCost must be a non-negative number' });
        return;
      }
      updateData.estimatedCost = estimatedCost;
    }

    if (actualCost !== undefined) {
      if (typeof actualCost !== 'number' || actualCost < 0) {
        res.status(400).json({ error: 'actualCost must be a non-negative number' });
        return;
      }
      updateData.actualCost = actualCost;
    }

    // Get budget item to verify ownership
    try {
      const budgetItem = await budgetService.updateBudgetItem(id, {});
      const budget = await budgetService.calculateVariance(budgetItem.budgetId);
      await projectService.getProject(budget.projectId, req.userId!);
    } catch (error) {
      if (error instanceof Error && error.message === 'Budget item not found') {
        res.status(404).json({ error: 'Budget item not found' });
        return;
      }
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const updatedItem = await budgetService.updateBudgetItem(id, updateData);
    res.json(updatedItem);
  } catch (error) {
    console.error('Error updating budget item:', error);
    res.status(500).json({ error: 'Failed to update budget item' });
  }
});

/**
 * DELETE /api/budget-items/:id
 * Delete a budget item
 */
router.delete('/budget-items/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get budget item to verify ownership
    try {
      const budgetItem = await budgetService.updateBudgetItem(id, {});
      const budget = await budgetService.calculateVariance(budgetItem.budgetId);
      await projectService.getProject(budget.projectId, req.userId!);
    } catch (error) {
      if (error instanceof Error && error.message === 'Budget item not found') {
        res.status(404).json({ error: 'Budget item not found' });
        return;
      }
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    await budgetService.deleteBudgetItem(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting budget item:', error);
    res.status(500).json({ error: 'Failed to delete budget item' });
  }
});

/**
 * GET /api/budgets/:budgetId/alerts
 * Get budget alerts for a budget
 */
router.get('/:budgetId/alerts', authenticate, async (req: Request, res: Response) => {
  try {
    const { budgetId } = req.params;

    // Verify budget exists and user owns the project
    try {
      const budget = await budgetService.calculateVariance(budgetId);
      await projectService.getProject(budget.projectId, req.userId!);
    } catch (error) {
      if (error instanceof Error && error.message === 'Budget not found') {
        res.status(404).json({ error: 'Budget not found' });
        return;
      }
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const alerts = await budgetService.checkBudgetAlerts(budgetId);
    res.json(alerts);
  } catch (error) {
    console.error('Error getting budget alerts:', error);
    res.status(500).json({ error: 'Failed to get budget alerts' });
  }
});

export default router;
