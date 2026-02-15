import { Router, Request, Response } from 'express';
import { TaskService } from '../services/TaskService';
import { WorkItemTemplateService } from '../services/WorkItemTemplateService';
import { ProjectService } from '../services/ProjectService';
import { BudgetService } from '../services/BudgetService';
import { authenticate } from '../middleware';
import { TaskStatus, TaskPriority } from '../entities/Task';
import { WorkItemCategory } from '../entities/WorkItemTemplate';

const router = Router();
const taskService = new TaskService();
const workItemService = new WorkItemTemplateService();
const projectService = new ProjectService();
const budgetService = new BudgetService();

/**
 * POST /api/projects/:projectId/tasks
 * Create a new task for a project
 */
router.post('/:projectId/tasks', authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { name, description, milestoneId, status, priority, dueDate, price, amount, unit, assignedTo } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ error: 'Missing required field: name' });
      return;
    }

    // Verify project exists and user owns it
    try {
      await projectService.getProject(projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Validate status if provided
    if (status && !Object.values(TaskStatus).includes(status)) {
      res.status(400).json({ error: 'Invalid task status' });
      return;
    }

    // Validate priority if provided
    if (priority && !Object.values(TaskPriority).includes(priority)) {
      res.status(400).json({ error: 'Invalid task priority' });
      return;
    }

    // Parse and validate due date if provided
    let parsedDueDate: Date | undefined;
    if (dueDate) {
      parsedDueDate = new Date(dueDate);
      if (isNaN(parsedDueDate.getTime())) {
        res.status(400).json({ error: 'Invalid dueDate format' });
        return;
      }
    }

    // Validate price if provided
    if (price !== undefined && price !== null && (typeof price !== 'number' || price < 0)) {
      res.status(400).json({ error: 'price must be a non-negative number' });
      return;
    }

    // Validate amount if provided
    if (amount !== undefined && amount !== null && (typeof amount !== 'number' || amount < 0)) {
      res.status(400).json({ error: 'amount must be a non-negative number' });
      return;
    }

    const task = await taskService.createTask({
      projectId,
      name,
      description,
      milestoneId,
      status,
      priority,
      dueDate: parsedDueDate,
      price,
      amount,
      unit,
      assignedTo,
    });

    // Recalculate budget totals if task has pricing
    if (price !== undefined && price !== null) {
      try {
        await budgetService.recalculateBudgetTotalsForProject(projectId);
      } catch (error) {
        // Budget might not exist yet, that's okay
        console.log('Budget not found for project, skipping recalculation');
      }
    }

    res.status(201).json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

/**
 * POST /api/projects/:projectId/tasks/bulk
 * Bulk create tasks from work item templates
 */
router.post('/:projectId/tasks/bulk', authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { templateIds } = req.body;

    // Validate required fields
    if (!templateIds || !Array.isArray(templateIds) || templateIds.length === 0) {
      res.status(400).json({ error: 'templateIds must be a non-empty array' });
      return;
    }

    // Verify project exists and user owns it
    try {
      await projectService.getProject(projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const tasks = await taskService.bulkCreateTasksFromTemplates(projectId, templateIds);

    // Recalculate budget totals after bulk task creation
    try {
      await budgetService.recalculateBudgetTotalsForProject(projectId);
    } catch (error) {
      // Budget might not exist yet, that's okay
      console.log('Budget not found for project, skipping recalculation');
    }

    res.status(201).json(tasks);
  } catch (error) {
    if (error instanceof Error && error.message.includes('template')) {
      res.status(404).json({ error: error.message });
      return;
    }
    console.error('Error bulk creating tasks:', error);
    res.status(500).json({ error: 'Failed to bulk create tasks' });
  }
});

/**
 * GET /api/projects/:projectId/tasks
 * List/filter tasks for a project
 */
router.get('/:projectId/tasks', authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { status, priority, milestoneId, dueDateFrom, dueDateTo, assignedTo } = req.query;

    // Verify project exists and user owns it
    try {
      await projectService.getProject(projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const filters: any = {};

    // Parse status filter
    if (status) {
      if (typeof status === 'string') {
        const statuses = status.split(',').map(s => s.trim());
        
        // Validate all statuses
        const invalidStatuses = statuses.filter(s => !Object.values(TaskStatus).includes(s as TaskStatus));
        if (invalidStatuses.length > 0) {
          res.status(400).json({ error: `Invalid status values: ${invalidStatuses.join(', ')}` });
          return;
        }

        filters.status = statuses.length === 1 ? statuses[0] as TaskStatus : statuses as TaskStatus[];
      }
    }

    // Parse priority filter
    if (priority) {
      if (typeof priority === 'string') {
        const priorities = priority.split(',').map(p => p.trim());
        
        // Validate all priorities
        const invalidPriorities = priorities.filter(p => !Object.values(TaskPriority).includes(p as TaskPriority));
        if (invalidPriorities.length > 0) {
          res.status(400).json({ error: `Invalid priority values: ${invalidPriorities.join(', ')}` });
          return;
        }

        filters.priority = priorities.length === 1 ? priorities[0] as TaskPriority : priorities as TaskPriority[];
      }
    }

    // Parse milestone filter
    if (milestoneId && typeof milestoneId === 'string') {
      filters.milestoneId = milestoneId;
    }

    // Parse assignedTo filter
    if (assignedTo && typeof assignedTo === 'string') {
      filters.assignedTo = assignedTo;
    }

    // Parse date filters
    if (dueDateFrom) {
      const date = new Date(dueDateFrom as string);
      if (isNaN(date.getTime())) {
        res.status(400).json({ error: 'Invalid dueDateFrom format' });
        return;
      }
      filters.dueDateFrom = date;
    }

    if (dueDateTo) {
      const date = new Date(dueDateTo as string);
      if (isNaN(date.getTime())) {
        res.status(400).json({ error: 'Invalid dueDateTo format' });
        return;
      }
      filters.dueDateTo = date;
    }

    const tasks = await taskService.listTasks(projectId, filters);
    res.json(tasks);
  } catch (error) {
    console.error('Error listing tasks:', error);
    res.status(500).json({ error: 'Failed to list tasks' });
  }
});

/**
 * PUT /api/tasks/:id
 * Update a task
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, status, priority, dueDate, completedDate, price, amount, unit, assignedTo, milestoneId } = req.body;

    // Get task to verify it exists
    let task;
    try {
      task = await taskService.getTask(id);
    } catch (error) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Verify user owns the project
    try {
      await projectService.getProject(task.projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // Validate status if provided
    if (status !== undefined) {
      if (!Object.values(TaskStatus).includes(status)) {
        res.status(400).json({ error: 'Invalid task status' });
        return;
      }
      updateData.status = status;
    }

    // Validate priority if provided
    if (priority !== undefined) {
      if (!Object.values(TaskPriority).includes(priority)) {
        res.status(400).json({ error: 'Invalid task priority' });
        return;
      }
      updateData.priority = priority;
    }

    // Parse and validate dates if provided
    if (dueDate !== undefined) {
      if (dueDate === null) {
        updateData.dueDate = null;
      } else {
        const parsedDate = new Date(dueDate);
        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ error: 'Invalid dueDate format' });
          return;
        }
        updateData.dueDate = parsedDate;
      }
    }

    if (completedDate !== undefined) {
      if (completedDate === null) {
        updateData.completedDate = null;
      } else {
        const parsedDate = new Date(completedDate);
        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ error: 'Invalid completedDate format' });
          return;
        }
        updateData.completedDate = parsedDate;
      }
    }

    // Validate price if provided
    if (price !== undefined) {
      if (price === null) {
        updateData.price = null;
      } else if (typeof price !== 'number' || price < 0) {
        res.status(400).json({ error: 'price must be a non-negative number' });
        return;
      } else {
        updateData.price = price;
      }
    }

    // Validate amount if provided
    if (amount !== undefined) {
      if (typeof amount !== 'number' || amount < 0) {
        res.status(400).json({ error: 'amount must be a non-negative number' });
        return;
      }
      updateData.amount = amount;
    }

    // Handle unit
    if (unit !== undefined) {
      updateData.unit = unit;
    }

    if (assignedTo !== undefined) {
      updateData.assignedTo = assignedTo;
    }

    if (milestoneId !== undefined) {
      updateData.milestoneId = milestoneId;
    }

    const updatedTask = await taskService.updateTask(id, updateData);

    // Recalculate budget totals if task pricing was updated
    if (price !== undefined || amount !== undefined) {
      try {
        await budgetService.recalculateBudgetTotalsForProject(task.projectId);
      } catch (error) {
        // Budget might not exist yet, that's okay
        console.log('Budget not found for project, skipping recalculation');
      }
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get task to verify it exists
    let task;
    try {
      task = await taskService.getTask(id);
    } catch (error) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Verify user owns the project
    try {
      await projectService.getProject(task.projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    await taskService.deleteTask(id);

    // Recalculate budget totals after task deletion
    try {
      await budgetService.recalculateBudgetTotalsForProject(task.projectId);
    } catch (error) {
      // Budget might not exist yet, that's okay
      console.log('Budget not found for project, skipping recalculation');
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

/**
 * POST /api/tasks/:id/notes
 * Add a note to a task
 */
router.post('/:id/notes', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    // Validate required fields
    if (!note || typeof note !== 'string' || note.trim().length === 0) {
      res.status(400).json({ error: 'Note must be a non-empty string' });
      return;
    }

    // Get task to verify it exists
    let task;
    try {
      task = await taskService.getTask(id);
    } catch (error) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    // Verify user owns the project
    try {
      await projectService.getProject(task.projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const updatedTask = await taskService.addTaskNote(id, note.trim());
    res.json(updatedTask);
  } catch (error) {
    console.error('Error adding task note:', error);
    res.status(500).json({ error: 'Failed to add task note' });
  }
});

/**
 * GET /api/work-items
 * Get work item templates (optionally filtered by category)
 */
router.get('/work-items', authenticate, async (req: Request, res: Response) => {
  try {
    const { category } = req.query;

    // Validate category if provided
    if (category && typeof category === 'string') {
      if (!Object.values(WorkItemCategory).includes(category as WorkItemCategory)) {
        res.status(400).json({ error: 'Invalid work item category' });
        return;
      }
    }

    const templates = await workItemService.listTemplates(
      category as WorkItemCategory | undefined,
      req.userId
    );
    res.json(templates);
  } catch (error) {
    console.error('Error listing work item templates:', error);
    res.status(500).json({ error: 'Failed to list work item templates' });
  }
});

/**
 * GET /api/work-items/:id
 * Get a specific work item template
 */
router.get('/work-items/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const template = await workItemService.getTemplate(id, req.userId);
    
    if (!template) {
      res.status(404).json({ error: 'Work item template not found' });
      return;
    }

    res.json(template);
  } catch (error) {
    console.error('Error getting work item template:', error);
    res.status(500).json({ error: 'Failed to get work item template' });
  }
});

/**
 * POST /api/work-items
 * Create a custom work item template
 */
router.post('/work-items', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, description, category, estimatedDuration, defaultPrice, unit } = req.body;

    // Validate required fields
    if (!name || !category) {
      res.status(400).json({ error: 'Missing required fields: name, category' });
      return;
    }

    // Validate category
    if (!Object.values(WorkItemCategory).includes(category)) {
      res.status(400).json({ error: 'Invalid work item category' });
      return;
    }

    // Validate estimatedDuration if provided
    if (estimatedDuration !== undefined && (typeof estimatedDuration !== 'number' || estimatedDuration < 0)) {
      res.status(400).json({ error: 'estimatedDuration must be a non-negative number' });
      return;
    }

    // Validate defaultPrice if provided
    if (defaultPrice !== undefined && (typeof defaultPrice !== 'number' || defaultPrice < 0)) {
      res.status(400).json({ error: 'defaultPrice must be a non-negative number' });
      return;
    }

    const template = await workItemService.createTemplate({
      name,
      description,
      category,
      estimatedDuration,
      defaultPrice,
      unit: unit || undefined,
      isDefault: false,
      ownerId: req.userId,
    });

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating work item template:', error);
    res.status(500).json({ error: 'Failed to create work item template' });
  }
});

/**
 * PUT /api/work-items/:id
 * Update a custom work item template
 */
router.put('/work-items/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, category, estimatedDuration, defaultPrice, unit } = req.body;

    // Validate required fields
    if (!name || !category) {
      res.status(400).json({ error: 'Missing required fields: name, category' });
      return;
    }

    // Validate category
    if (!Object.values(WorkItemCategory).includes(category)) {
      res.status(400).json({ error: 'Invalid work item category' });
      return;
    }

    // Validate estimatedDuration if provided
    if (estimatedDuration !== undefined && (typeof estimatedDuration !== 'number' || estimatedDuration < 0)) {
      res.status(400).json({ error: 'estimatedDuration must be a non-negative number' });
      return;
    }

    // Validate defaultPrice if provided
    if (defaultPrice !== undefined && (typeof defaultPrice !== 'number' || defaultPrice < 0)) {
      res.status(400).json({ error: 'defaultPrice must be a non-negative number' });
      return;
    }

    const updateData: any = {
      name,
      description,
      category,
    };

    if (estimatedDuration !== undefined) {
      updateData.estimatedDuration = estimatedDuration;
    }

    if (defaultPrice !== undefined) {
      updateData.defaultPrice = defaultPrice;
    }

    if (unit !== undefined) {
      updateData.unit = unit;
    }

    const template = await workItemService.updateTemplate(id, updateData, req.userId);

    res.json(template);
  } catch (error: any) {
    console.error('Error updating work item template:', error);
    if (error.message === 'Template not found' || error.message === 'Cannot update default templates') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to update work item template' });
  }
});

/**
 * DELETE /api/work-items/:id
 * Delete a custom work item template
 */
router.delete('/work-items/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await workItemService.deleteTemplate(id, req.userId);

    res.status(204).send();
  } catch (error: any) {
    console.error('Error deleting work item template:', error);
    if (error.message === 'Template not found' || error.message === 'Cannot delete default templates') {
      res.status(404).json({ error: error.message });
      return;
    }
    res.status(500).json({ error: 'Failed to delete work item template' });
  }
});

export default router;
