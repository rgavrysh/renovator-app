import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express, { Request, Response, NextFunction } from 'express';
import { DocumentType } from '../entities/Document';

// Create mock functions before vi.mock calls
const mockUploadPhoto = vi.fn();
const mockUploadPhotoBatch = vi.fn();
const mockGetPhotos = vi.fn();
const mockAddCaption = vi.fn();
const mockGetProject = vi.fn();

// Mock the authenticate middleware
vi.mock('../middleware', () => ({
  authenticate: (req: Request, _res: Response, next: NextFunction) => {
    req.userId = 'test-user-id';
    next();
  },
}));

// Mock the services
vi.mock('../services/PhotoService', () => ({
  PhotoService: vi.fn().mockImplementation(() => ({
    uploadPhoto: mockUploadPhoto,
    uploadPhotoBatch: mockUploadPhotoBatch,
    getPhotos: mockGetPhotos,
    addCaption: mockAddCaption,
  })),
}));

vi.mock('../services/ProjectService', () => ({
  ProjectService: vi.fn().mockImplementation(() => ({
    getProject: mockGetProject,
  })),
}));

// Import after mocks are set up
const photoRoutes = await import('./photos').then(m => m.default);

const app = express();
app.use(express.json());
app.use('/api/projects', photoRoutes);
app.use('/api', photoRoutes);

describe('Photo Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/projects/:projectId/photos', () => {
    it('should upload a single photo successfully', async () => {
      const mockProject = { id: 'project-1', ownerId: 'test-user-id' };
      const mockPhoto = {
        id: 'photo-1',
        projectId: 'project-1',
        name: 'test.jpg',
        type: DocumentType.PHOTO,
        fileType: 'image/jpeg',
        fileSize: 2048,
        storageUrl: 'https://storage.example.com/test.jpg',
        thumbnailUrl: 'https://storage.example.com/thumb_test.jpg',
        uploadedBy: 'test-user-id',
        uploadedAt: new Date(),
        metadata: {
          captureDate: new Date('2024-01-01'),
          caption: 'Test photo',
        },
      };

      mockGetProject.mockResolvedValue(mockProject);
      mockUploadPhoto.mockResolvedValue(mockPhoto);

      const response = await request(app)
        .post('/api/projects/project-1/photos')
        .field('caption', 'Test photo')
        .attach('files', Buffer.from('test image content'), 'test.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toEqual(expect.objectContaining({
        id: 'photo-1',
        projectId: 'project-1',
        name: 'test.jpg',
        type: DocumentType.PHOTO,
      }));
      expect(mockGetProject).toHaveBeenCalledWith('project-1', 'test-user-id');
      expect(mockUploadPhoto).toHaveBeenCalled();
    });

    it('should upload multiple photos in batch', async () => {
      const mockProject = { id: 'project-1', ownerId: 'test-user-id' };
      const mockPhotos = [
        {
          id: 'photo-1',
          projectId: 'project-1',
          name: 'test1.jpg',
          type: DocumentType.PHOTO,
        },
        {
          id: 'photo-2',
          projectId: 'project-1',
          name: 'test2.jpg',
          type: DocumentType.PHOTO,
        },
      ];

      mockGetProject.mockResolvedValue(mockProject);
      mockUploadPhotoBatch.mockResolvedValue(mockPhotos);

      const response = await request(app)
        .post('/api/projects/project-1/photos')
        .attach('files', Buffer.from('test image 1'), 'test1.jpg')
        .attach('files', Buffer.from('test image 2'), 'test2.jpg');

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockPhotos);
      expect(mockUploadPhotoBatch).toHaveBeenCalled();
    });

    it('should return 404 if project not found', async () => {
      mockGetProject.mockRejectedValue(new Error('Project not found'));

      const response = await request(app)
        .post('/api/projects/project-1/photos')
        .attach('files', Buffer.from('test image'), 'test.jpg');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found');
    });

    it('should return 400 if no files uploaded', async () => {
      const mockProject = { id: 'project-1', ownerId: 'test-user-id' };
      mockGetProject.mockResolvedValue(mockProject);

      const response = await request(app).post('/api/projects/project-1/photos');

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('No files uploaded');
    });
  });

  describe('GET /api/projects/:projectId/photos', () => {
    it('should list photos for a project', async () => {
      const mockProject = { id: 'project-1', ownerId: 'test-user-id' };
      const mockPhotos = [
        {
          id: 'photo-1',
          projectId: 'project-1',
          name: 'test1.jpg',
          type: DocumentType.PHOTO,
          metadata: { captureDate: '2024-01-01T00:00:00.000Z' },
        },
        {
          id: 'photo-2',
          projectId: 'project-1',
          name: 'test2.jpg',
          type: DocumentType.PHOTO,
          metadata: { captureDate: '2024-01-02T00:00:00.000Z' },
        },
      ];

      mockGetProject.mockResolvedValue(mockProject);
      mockGetPhotos.mockResolvedValue(mockPhotos);

      const response = await request(app).get('/api/projects/project-1/photos');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPhotos);
      expect(mockGetPhotos).toHaveBeenCalledWith('project-1', {});
    });

    it('should filter photos by milestone', async () => {
      const mockProject = { id: 'project-1', ownerId: 'test-user-id' };
      const mockPhotos = [
        {
          id: 'photo-1',
          projectId: 'project-1',
          name: 'test1.jpg',
          type: DocumentType.PHOTO,
          metadata: { associatedMilestoneId: 'milestone-1' },
        },
      ];

      mockGetProject.mockResolvedValue(mockProject);
      mockGetPhotos.mockResolvedValue(mockPhotos);

      const response = await request(app)
        .get('/api/projects/project-1/photos')
        .query({ milestoneId: 'milestone-1' });

      expect(response.status).toBe(200);
      expect(mockGetPhotos).toHaveBeenCalledWith('project-1', {
        milestoneId: 'milestone-1',
      });
    });

    it('should filter photos by capture date range', async () => {
      const mockProject = { id: 'project-1', ownerId: 'test-user-id' };
      const mockPhotos = [
        {
          id: 'photo-1',
          projectId: 'project-1',
          name: 'test1.jpg',
          type: DocumentType.PHOTO,
        },
      ];

      mockGetProject.mockResolvedValue(mockProject);
      mockGetPhotos.mockResolvedValue(mockPhotos);

      const response = await request(app)
        .get('/api/projects/project-1/photos')
        .query({
          capturedAfter: '2024-01-01',
          capturedBefore: '2024-12-31',
        });

      expect(response.status).toBe(200);
      expect(mockGetPhotos).toHaveBeenCalledWith('project-1', {
        capturedAfter: new Date('2024-01-01'),
        capturedBefore: new Date('2024-12-31'),
      });
    });

    it('should return 404 if project not found', async () => {
      mockGetProject.mockRejectedValue(new Error('Project not found'));

      const response = await request(app).get('/api/projects/project-1/photos');

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Project not found');
    });
  });

  describe('PUT /api/photos/:id', () => {
    it('should update photo caption', async () => {
      const mockPhoto = {
        id: 'photo-1',
        projectId: 'project-1',
        name: 'test.jpg',
        type: DocumentType.PHOTO,
        metadata: { caption: 'Updated caption' },
      };
      const mockProject = { id: 'project-1', ownerId: 'test-user-id' };

      mockAddCaption.mockResolvedValue(mockPhoto);
      mockGetProject.mockResolvedValue(mockProject);

      const response = await request(app)
        .put('/api/photos/photo-1')
        .send({ caption: 'Updated caption' });

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockPhoto);
      expect(mockAddCaption).toHaveBeenCalledWith('photo-1', 'Updated caption');
    });

    it('should return 400 if caption is missing', async () => {
      const response = await request(app).put('/api/photos/photo-1').send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Missing caption field');
    });

    it('should return 404 if photo not found', async () => {
      mockAddCaption.mockRejectedValue(new Error('Photo not found'));

      const response = await request(app)
        .put('/api/photos/photo-1')
        .send({ caption: 'Updated caption' });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Photo not found');
    });
  });
});
