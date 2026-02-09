import { Router, Request, Response } from 'express';
import { ProjectService } from '../services/ProjectService';
import { authenticate } from '../middleware';
import { ProjectStatus } from '../entities/Project';

const router = Router();
const projectService = new ProjectService();

/**
 * POST /api/projects
 * Create a new project
 */
router.post('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, clientName, clientEmail, clientPhone, description, startDate, estimatedEndDate, status } = req.body;

    // Validate required fields
    if (!name || !clientName || !startDate || !estimatedEndDate) {
      res.status(400).json({ 
        error: 'Missing required fields: name, clientName, startDate, estimatedEndDate' 
      });
      return;
    }

    // Validate dates
    const parsedStartDate = new Date(startDate);
    const parsedEstimatedEndDate = new Date(estimatedEndDate);

    if (isNaN(parsedStartDate.getTime()) || isNaN(parsedEstimatedEndDate.getTime())) {
      res.status(400).json({ error: 'Invalid date format' });
      return;
    }

    if (parsedEstimatedEndDate < parsedStartDate) {
      res.status(400).json({ error: 'Estimated end date must be after start date' });
      return;
    }

    // Validate status if provided
    if (status && !Object.values(ProjectStatus).includes(status)) {
      res.status(400).json({ error: 'Invalid project status' });
      return;
    }

    const project = await projectService.createProject({
      name,
      clientName,
      clientEmail,
      clientPhone,
      description,
      startDate: parsedStartDate,
      estimatedEndDate: parsedEstimatedEndDate,
      ownerId: req.userId!,
      status,
    });

    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

/**
 * GET /api/projects
 * List projects with optional filters
 */
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const { status, startDateFrom, startDateTo, estimatedEndDateFrom, estimatedEndDateTo } = req.query;

    const filters: any = {
      ownerId: req.userId,
    };

    // Parse status filter
    if (status) {
      if (typeof status === 'string') {
        // Single status or comma-separated statuses
        const statuses = status.split(',').map(s => s.trim());
        
        // Validate all statuses
        const invalidStatuses = statuses.filter(s => !Object.values(ProjectStatus).includes(s as ProjectStatus));
        if (invalidStatuses.length > 0) {
          res.status(400).json({ error: `Invalid status values: ${invalidStatuses.join(', ')}` });
          return;
        }

        filters.status = statuses.length === 1 ? statuses[0] as ProjectStatus : statuses as ProjectStatus[];
      }
    }

    // Parse date filters
    if (startDateFrom) {
      const date = new Date(startDateFrom as string);
      if (isNaN(date.getTime())) {
        res.status(400).json({ error: 'Invalid startDateFrom format' });
        return;
      }
      filters.startDateFrom = date;
    }

    if (startDateTo) {
      const date = new Date(startDateTo as string);
      if (isNaN(date.getTime())) {
        res.status(400).json({ error: 'Invalid startDateTo format' });
        return;
      }
      filters.startDateTo = date;
    }

    if (estimatedEndDateFrom) {
      const date = new Date(estimatedEndDateFrom as string);
      if (isNaN(date.getTime())) {
        res.status(400).json({ error: 'Invalid estimatedEndDateFrom format' });
        return;
      }
      filters.estimatedEndDateFrom = date;
    }

    if (estimatedEndDateTo) {
      const date = new Date(estimatedEndDateTo as string);
      if (isNaN(date.getTime())) {
        res.status(400).json({ error: 'Invalid estimatedEndDateTo format' });
        return;
      }
      filters.estimatedEndDateTo = date;
    }

    const projects = await projectService.listProjects(filters);
    res.json(projects);
  } catch (error) {
    console.error('Error listing projects:', error);
    res.status(500).json({ error: 'Failed to list projects' });
  }
});

/**
 * GET /api/projects/search
 * Search projects by name or client name
 */
router.get('/search', authenticate, async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      res.status(400).json({ error: 'Missing or invalid search query parameter "q"' });
      return;
    }

    const projects = await projectService.searchProjects(q, req.userId);
    res.json(projects);
  } catch (error) {
    console.error('Error searching projects:', error);
    res.status(500).json({ error: 'Failed to search projects' });
  }
});

/**
 * GET /api/projects/:id
 * Get a specific project by ID
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await projectService.getProject(id, req.userId);
    res.json(project);
  } catch (error) {
    if (error instanceof Error && error.message === 'Project not found') {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    console.error('Error getting project:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

/**
 * PUT /api/projects/:id
 * Update a project
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, clientName, clientEmail, clientPhone, description, startDate, estimatedEndDate, actualEndDate, status } = req.body;

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (clientName !== undefined) updateData.clientName = clientName;
    if (clientEmail !== undefined) updateData.clientEmail = clientEmail;
    if (clientPhone !== undefined) updateData.clientPhone = clientPhone;
    if (description !== undefined) updateData.description = description;

    // Parse and validate dates if provided
    if (startDate !== undefined) {
      const parsedDate = new Date(startDate);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ error: 'Invalid startDate format' });
        return;
      }
      updateData.startDate = parsedDate;
    }

    if (estimatedEndDate !== undefined) {
      const parsedDate = new Date(estimatedEndDate);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ error: 'Invalid estimatedEndDate format' });
        return;
      }
      updateData.estimatedEndDate = parsedDate;
    }

    if (actualEndDate !== undefined) {
      if (actualEndDate === null) {
        updateData.actualEndDate = null;
      } else {
        const parsedDate = new Date(actualEndDate);
        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ error: 'Invalid actualEndDate format' });
          return;
        }
        updateData.actualEndDate = parsedDate;
      }
    }

    // Validate status if provided
    if (status !== undefined) {
      if (!Object.values(ProjectStatus).includes(status)) {
        res.status(400).json({ error: 'Invalid project status' });
        return;
      }
      updateData.status = status;
    }

    // Validate date logic if both dates are being updated
    if (updateData.startDate && updateData.estimatedEndDate) {
      if (updateData.estimatedEndDate < updateData.startDate) {
        res.status(400).json({ error: 'Estimated end date must be after start date' });
        return;
      }
    }

    const project = await projectService.updateProject(id, updateData, req.userId);
    res.json(project);
  } catch (error) {
    if (error instanceof Error && error.message === 'Project not found') {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    console.error('Error updating project:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
});

/**
 * DELETE /api/projects/:id
 * Delete a project
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await projectService.deleteProject(id, req.userId);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Project not found') {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

/**
 * POST /api/projects/:id/archive
 * Archive a project
 */
router.post('/:id/archive', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const project = await projectService.archiveProject(id, req.userId);
    res.json(project);
  } catch (error) {
    if (error instanceof Error && error.message === 'Project not found') {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    console.error('Error archiving project:', error);
    res.status(500).json({ error: 'Failed to archive project' });
  }
});

export default router;
