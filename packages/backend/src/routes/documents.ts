import { Router, Request, Response } from 'express';
import { DocumentService } from '../services/DocumentService';
import { ProjectService } from '../services/ProjectService';
import { authenticate } from '../middleware';
import { DocumentType } from '../entities/Document';
import multer from 'multer';

const router = Router();
const documentService = new DocumentService();
const projectService = new ProjectService();

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

/**
 * POST /api/projects/:projectId/documents
 * Upload a document to a project
 */
router.post(
  '/:projectId/documents',
  authenticate,
  upload.single('file'),
  async (req: Request, res: Response) => {
    try {
      const { projectId } = req.params;
      const { type, description, tags } = req.body;

      // Verify project exists and user owns it
      try {
        await projectService.getProject(projectId, req.userId!);
      } catch (error) {
        res.status(404).json({ error: 'Project not found' });
        return;
      }

      // Validate file upload
      if (!req.file) {
        res.status(400).json({ error: 'No file uploaded' });
        return;
      }

      // Validate document type
      if (!type || !Object.values(DocumentType).includes(type)) {
        res.status(400).json({ error: 'Invalid or missing document type' });
        return;
      }

      // Parse tags if provided
      let parsedTags: string[] | undefined;
      if (tags) {
        try {
          parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        } catch (error) {
          res.status(400).json({ error: 'Invalid tags format' });
          return;
        }
      }

      const document = await documentService.uploadDocument({
        projectId,
        name: req.file.originalname,
        type,
        fileBuffer: req.file.buffer,
        fileType: req.file.mimetype,
        uploadedBy: req.userId!,
        metadata: {
          description,
          tags: parsedTags,
        },
      });

      res.status(201).json(document);
    } catch (error) {
      if (error instanceof Error && error.message.includes('Invalid file format')) {
        res.status(400).json({ error: error.message });
        return;
      }
      console.error('Error uploading document:', error);
      res.status(500).json({ error: 'Failed to upload document' });
    }
  }
);

/**
 * GET /api/projects/:projectId/documents
 * List documents for a project with optional filters
 */
router.get('/:projectId/documents', authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, uploadedAfter, uploadedBefore, tags, includeDeleted } = req.query;

    // Verify project exists and user owns it
    try {
      await projectService.getProject(projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    const filters: any = {};

    // Parse type filter
    if (type) {
      if (!Object.values(DocumentType).includes(type as DocumentType)) {
        res.status(400).json({ error: 'Invalid document type' });
        return;
      }
      filters.type = type as DocumentType;
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

    // Parse tags filter
    if (tags) {
      try {
        filters.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
      } catch (error) {
        res.status(400).json({ error: 'Invalid tags format' });
        return;
      }
    }

    // Parse includeDeleted filter
    if (includeDeleted === 'true') {
      filters.includeDeleted = true;
    }

    const documents = await documentService.listDocuments(projectId, filters);
    res.json(documents);
  } catch (error) {
    console.error('Error listing documents:', error);
    res.status(500).json({ error: 'Failed to list documents' });
  }
});

/**
 * GET /api/documents/:id
 * Get a specific document by ID
 */
router.get('/documents/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const document = await documentService.getDocument(id);

    // Verify user owns the project
    try {
      await projectService.getProject(document.projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    res.json(document);
  } catch (error) {
    if (error instanceof Error && error.message === 'Document not found') {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    console.error('Error getting document:', error);
    res.status(500).json({ error: 'Failed to get document' });
  }
});

/**
 * DELETE /api/documents/:id
 * Soft delete a document (move to trash)
 */
router.delete('/documents/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const document = await documentService.getDocument(id);

    // Verify user owns the project
    try {
      await projectService.getProject(document.projectId, req.userId!);
    } catch (error) {
      res.status(404).json({ error: 'Document not found' });
      return;
    }

    await documentService.deleteDocument(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Document not found') {
      res.status(404).json({ error: 'Document not found' });
      return;
    }
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

export default router;
