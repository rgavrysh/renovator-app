import { Router, Request, Response } from 'express';
import { PhotoService } from '../services/PhotoService';
import { ProjectService } from '../services/ProjectService';
import { authenticate } from '../middleware';
import multer from 'multer';

const router = Router();
const photoService = new PhotoService();
const projectService = new ProjectService();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit per file
  },
});

/**
 * POST /api/projects/:projectId/photos
 * Upload photo(s) to a project (supports single or batch upload)
 */
router.post(
  '/:projectId/photos',
  authenticate,
  upload.array('files', 50), // Support up to 50 files in batch
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { caption, milestoneId } = req.body;

      // Verify project exists and user owns it
      try {
        await projectService.getProject(projectId, req.userId!);
      } catch (error) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      // Validate file upload
      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({ error: 'No files uploaded' });
        return;
      }

      const metadata: any = {};
      if (caption) {
        metadata.caption = caption;
      }
      if (milestoneId) {
        metadata.associatedMilestoneId = milestoneId;
      }

      // Handle single or batch upload
      if (req.files.length === 1) {
        // Single photo upload
        const file = req.files[0];
        const photo = await photoService.uploadPhoto({
          projectId,
          name: file.originalname,
          fileBuffer: file.buffer,
          fileType: file.mimetype,
          uploadedBy: req.userId!,
          metadata,
        });

        res.status(201).json(photo);
      } else {
        // Batch photo upload
        const files = req.files.map((file) => ({
          name: file.originalname,
          buffer: file.buffer,
          fileType: file.mimetype,
        }));

        const photos = await photoService.uploadPhotoBatch(
          projectId,
          files,
          req.userId!,
          metadata
        );

        res.status(201).json(photos);
      }
    } catch (error) {
      console.error('Error uploading photo(s):', error);
      res.status(500).json({ error: 'Failed to upload photo(s)' });
    }
  }
);

/**
 * GET /api/projects/:projectId/photos
 * List photos for a project with optional filters
 */
router.get('/:projectId/photos', authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { milestoneId, uploadedAfter, uploadedBefore, capturedAfter, capturedBefore } = req.query;

    // Verify project exists and user owns it
    try {
      await projectService.getProject(projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const filters: any = {};

    // Parse milestone filter
    if (milestoneId) {
      filters.milestoneId = milestoneId as string;
    }

    // Parse date filters
    if (uploadedAfter) {
      const date = new Date(uploadedAfter as string);
      if (isNaN(date.getTime())) {
        res.status(400).json({ error: 'Invalid uploadedAfter format' });
        return;
      }
      filters.uploadedAfter = date;
    }

    if (uploadedBefore) {
      const date = new Date(uploadedBefore as string);
      if (isNaN(date.getTime())) {
        res.status(400).json({ error: 'Invalid uploadedBefore format' });
        return;
      }
      filters.uploadedBefore = date;
    }

    if (capturedAfter) {
      const date = new Date(capturedAfter as string);
      if (isNaN(date.getTime())) {
        res.status(400).json({ error: 'Invalid capturedAfter format' });
        return;
      }
      filters.capturedAfter = date;
    }

    if (capturedBefore) {
      const date = new Date(capturedBefore as string);
      if (isNaN(date.getTime())) {
        res.status(400).json({ error: 'Invalid capturedBefore format' });
        return;
      }
      filters.capturedBefore = date;
    }

    const photos = await photoService.getPhotos(projectId, filters);
    res.json(photos);
  } catch (error) {
    console.error('Error listing photos:', error);
    res.status(500).json({ error: 'Failed to list photos' });
  }
});

/**
 * PUT /api/photos/:id
 * Update photo caption
 */
router.put('/photos/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { caption } = req.body;

    if (caption === undefined) {
      res.status(400).json({ error: 'Missing caption field' });
      return;
    }

    // Update caption (this will throw if photo not found)
    const updatedPhoto = await photoService.addCaption(id, caption);
    
    // Verify user owns the project
    try {
      await projectService.getProject(updatedPhoto.projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }

    res.json(updatedPhoto);
  } catch (error) {
    if (error instanceof Error && error.message === 'Photo not found') {
      res.status(404).json({ error: 'Photo not found' });
      return;
    }
    console.error('Error updating photo caption:', error);
    res.status(500).json({ error: 'Failed to update photo caption' });
  }
});

export default router;
