import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { DocumentType } from '../entities/Document';

// Create mock functions before vi.mock calls
const mockUploadDocument = vi.fn();
const mockGetDocument = vi.fn();
const mockListDocuments = vi.fn();
const mockDeleteDocument = vi.fn();
const mockGetProject = vi.fn();

// Mock the authenticate middleware
vi.mock('../middleware', () => ({
  authenticate: (req: Request, _res: Response, next: NextFunction) => {
    req.userId = 'test-user-id';
    next();
  },
}));

// Mock the services
vi.mock('../services/DocumentService', () => ({
  DocumentService: vi.fn().mockImplementation(() => ({
    uploadDocument: mockUploadDocument,
    getDocument: mockGetDocument,
    listDocuments: mockListDocuments,
    deleteDocument: mockDeleteDocument,
  })),
}));

vi.mock('../services/ProjectService', () => ({
  ProjectService: vi.fn().mockImplementation(() => ({
    getProject: mockGetProject,
  })),
}));

// Import after mocks are set up
const documentRoutes = await import('./documents').then(m => m.default);

const app = express();
app.use(express.json());
app.use('/api/projects', documentRoutes);
app.use('/api', documentRoutes);

describe('Document Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/projects/:projectId/documents', () => {
    it('should upload a document successfully', async () => {
      const mockProject = { id: 'project-1', ownerId: 'test-user-id' };
      const mockDocument = {
        id: 'doc-1',
        projectId: 'project-1',
        name: 'test.pdf',
        type: DocumentType.CONTRACT,
        fileType: 'application/pdf',
        fileSize: 1024,
        storageUrl: 'https://storage.example.com/test.pdf',
        uploadedBy: 'test-user-id',
        uploadedAt: new Date(),
      };

      mockGetProject.mockResolvedValue(mockProject);
      mockUploadDocument.mockResolvedValue(mockDocument);

      const response = await request(app)
        .post('/api/projects/project-1/documents')
        .field('type', DocumentType.CONTRACT)
        .field('description', 'Test document')
        .attach('file', Buffer.from('test content'), 'test.pdf');

      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({
        id: 'doc-1',
        projectId: 'project-1',
        name: 'test.pdf',
        type: DocumentType.CONTRACT,
      }));
      expect(mockGetProject).toHaveBeenCalledWith('project-1', 'test-user-id');
      expect(mockUploadDocument).toHaveBeenCalled();
    });

    it('should return 404 if project not found', async () => {
      mockGetProject.mockRejectedValue(new Error('Project not found'));

      const response = await request(app)
        .post('/api/projects/project-1/documents')
        .field('type', DocumentType.CONTRACT)
        .attach('file', Buffer.from('test content'), 'test.pdf');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found');
    });

    it('should return 400 if no file uploaded', async () => {
      const mockProject = { id: 'project-1', ownerId: 'test-user-id' };
      mockGetProject.mockResolvedValue(mockProject);

      const response = await request(app)
        .post('/api/projects/project-1/documents')
        .field('type', DocumentType.CONTRACT);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No file uploaded');
    });

    it('should return 400 if document type is invalid', async () => {
      const mockProject = { id: 'project-1', ownerId: 'test-user-id' };
      mockGetProject.mockResolvedValue(mockProject);

      const response = await request(app)
        .post('/api/projects/project-1/documents')
        .field('type', 'invalid-type')
        .attach('file', Buffer.from('test content'), 'test.pdf');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Invalid or missing document type');
    });
  });

  describe('GET /api/projects/:projectId/documents', () => {
    it('should list documents for a project', async () => {
      const mockProject = { id: 'project-1', ownerId: 'test-user-id' };
      const mockDocuments = [
        {
          id: 'doc-1',
          projectId: 'project-1',
          name: 'test1.pdf',
          type: DocumentType.CONTRACT,
        },
        {
          id: 'doc-2',
          projectId: 'project-1',
          name: 'test2.pdf',
          type: DocumentType.INVOICE,
        },
      ];

      mockGetProject.mockResolvedValue(mockProject);
      mockListDocuments.mockResolvedValue(mockDocuments);

      const response = await request(app).get('/api/projects/project-1/documents');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDocuments);
      expect(mockListDocuments).toHaveBeenCalledWith('project-1', {});
    });

    it('should filter documents by type', async () => {
      const mockProject = { id: 'project-1', ownerId: 'test-user-id' };
      const mockDocuments = [
        {
          id: 'doc-1',
          projectId: 'project-1',
          name: 'test1.pdf',
          type: DocumentType.CONTRACT,
        },
      ];

      mockGetProject.mockResolvedValue(mockProject);
      mockListDocuments.mockResolvedValue(mockDocuments);

      const response = await request(app)
        .get('/api/projects/project-1/documents')
        .query({ type: DocumentType.CONTRACT });

      expect(response.status).toBe(200);
      expect(mockListDocuments).toHaveBeenCalledWith('project-1', {
        type: DocumentType.CONTRACT,
      });
    });

    it('should return 404 if project not found', async () => {
      mockGetProject.mockRejectedValue(new Error('Project not found'));

      const response = await request(app).get('/api/projects/project-1/documents');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found');
    });
  });

  describe('GET /api/documents/:id', () => {
    it('should get a document by id', async () => {
      const mockDocument = {
        id: 'doc-1',
        projectId: 'project-1',
        name: 'test.pdf',
        type: DocumentType.CONTRACT,
      };
      const mockProject = { id: 'project-1', ownerId: 'test-user-id' };

      mockGetDocument.mockResolvedValue(mockDocument);
      mockGetProject.mockResolvedValue(mockProject);

      const response = await request(app).get('/api/documents/doc-1');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockDocument);
    });

    it('should return 404 if document not found', async () => {
      mockGetDocument.mockRejectedValue(new Error('Document not found'));

      const response = await request(app).get('/api/documents/doc-1');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Document not found');
    });
  });

  describe('DELETE /api/documents/:id', () => {
    it('should soft delete a document', async () => {
      const mockDocument = {
        id: 'doc-1',
        projectId: 'project-1',
        name: 'test.pdf',
        type: DocumentType.CONTRACT,
      };
      const mockProject = { id: 'project-1', ownerId: 'test-user-id' };

      mockGetDocument.mockResolvedValue(mockDocument);
      mockGetProject.mockResolvedValue(mockProject);
      mockDeleteDocument.mockResolvedValue(undefined);

      const response = await request(app).delete('/api/documents/doc-1');

      expect(response.status).toBe(204);
      expect(mockDeleteDocument).toHaveBeenCalledWith('doc-1');
    });

    it('should return 404 if document not found', async () => {
      mockGetDocument.mockRejectedValue(new Error('Document not found'));

      const response = await request(app).delete('/api/documents/doc-1');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Document not found');
    });
  });
});
