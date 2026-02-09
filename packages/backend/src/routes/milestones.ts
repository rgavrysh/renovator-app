import { Router, Request, Response } from 'express';
import { MilestoneService } from '../services/MilestoneService';
import { ProjectService } from '../services/ProjectService';
import { authenticate } from '../middleware';
import { MilestoneStatus } from '../entities/Milestone';

const router = Router();
const milestoneService = new MilestoneService();
const projectService = new ProjectService();

/**
 * POST /api/projects/:projectId/milestones
 * Create a new milestone for a project
 */
router.post('/:projectId/milestones', authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { name, description, targetDate, orderIndex, status } = req.body;

    // Validate required fields
    if (!name || !targetDate || orderIndex === undefined) {
      res.status(400).json({ 
        error: 'Missing required fields: name, targetDate, orderIndex' 
      });
      return;
    }

    // Verify project exists and user owns it
    try {
      await projectService.getProject(projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    // Validate target date
    const parsedTargetDate = new Date(targetDate);
    if (isNaN(parsedTargetDate.getTime())) {
      res.status(400).json({ error: 'Invalid targetDate format' });
      return;
    }

    // Validate status if provided
    if (status && !Object.values(MilestoneStatus).includes(status)) {
      res.status(400).json({ error: 'Invalid milestone status' });
      return;
    }

    // Validate orderIndex is a number
    if (typeof orderIndex !== 'number' || orderIndex < 0) {
      res.status(400).json({ error: 'orderIndex must be a non-negative number' });
      return;
    }

    const milestone = await milestoneService.createMilestone({
      projectId,
      name,
      description,
      targetDate: parsedTargetDate,
      orderIndex,
      status,
    });

    res.status(201).json(milestone);
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({ error: 'Failed to create milestone' });
  }
});

/**
 * GET /api/projects/:projectId/milestones
 * List all milestones for a project
 */
router.get('/:projectId/milestones', authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;

    // Verify project exists and user owns it
    try {
      await projectService.getProject(projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const milestones = await milestoneService.listMilestones(projectId);
    res.json(milestones);
  } catch (error) {
    console.error('Error listing milestones:', error);
    res.status(500).json({ error: 'Failed to list milestones' });
  }
});

/**
 * PUT /api/milestones/:id
 * Update a milestone
 */
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, targetDate, completedDate, status, orderIndex } = req.body;

    // Get milestone to verify it exists
    let milestone;
    try {
      milestone = await milestoneService.getMilestone(id);
    } catch (error) {
      res.status(404).json({ error: 'Milestone not found' });
      return;
    }

    // Verify user owns the project
    try {
      await projectService.getProject(milestone.projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // Parse and validate dates if provided
    if (targetDate !== undefined) {
      const parsedDate = new Date(targetDate);
      if (isNaN(parsedDate.getTime())) {
        res.status(400).json({ error: 'Invalid targetDate format' });
        return;
      }
      updateData.targetDate = parsedDate;
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

    // Validate status if provided
    if (status !== undefined) {
      if (!Object.values(MilestoneStatus).includes(status)) {
        res.status(400).json({ error: 'Invalid milestone status' });
        return;
      }
      updateData.status = status;
    }

    // Validate orderIndex if provided
    if (orderIndex !== undefined) {
      if (typeof orderIndex !== 'number' || orderIndex < 0) {
        res.status(400).json({ error: 'orderIndex must be a non-negative number' });
        return;
      }
      updateData.orderIndex = orderIndex;
    }

    const updatedMilestone = await milestoneService.updateMilestone(id, updateData);
    res.json(updatedMilestone);
  } catch (error) {
    console.error('Error updating milestone:', error);
    res.status(500).json({ error: 'Failed to update milestone' });
  }
});

/**
 * DELETE /api/milestones/:id
 * Delete a milestone
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get milestone to verify it exists
    let milestone;
    try {
      milestone = await milestoneService.getMilestone(id);
    } catch (error) {
      res.status(404).json({ error: 'Milestone not found' });
      return;
    }

    // Verify user owns the project
    try {
      await projectService.getProject(milestone.projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    await milestoneService.deleteMilestone(id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting milestone:', error);
    res.status(500).json({ error: 'Failed to delete milestone' });
  }
});

/**
 * POST /api/milestones/:id/complete
 * Mark a milestone as complete
 */
router.post('/:id/complete', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get milestone to verify it exists
    let milestone;
    try {
      milestone = await milestoneService.getMilestone(id);
    } catch (error) {
      res.status(404).json({ error: 'Milestone not found' });
      return;
    }

    // Verify user owns the project
    try {
      await projectService.getProject(milestone.projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const completedMilestone = await milestoneService.completeMilestone(id);
    res.json(completedMilestone);
  } catch (error) {
    console.error('Error completing milestone:', error);
    res.status(500).json({ error: 'Failed to complete milestone' });
  }
});

export default router;
