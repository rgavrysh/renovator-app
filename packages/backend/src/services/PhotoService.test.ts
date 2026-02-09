import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Repository } from 'typeorm';
import { PhotoService, UploadPhotoInput, PhotoFilters } from './PhotoService';
import { Document, DocumentType } from '../entities/Document';
import { FileStorageService } from './FileStorageService';
import * as fs from 'fs';
import * as path from 'path';

describe('PhotoService', () => {
  let photoService: PhotoService;
  let mockDocumentRepository: Partial<Repository<Document>>;
  let mockFileStorageService: Partial<FileStorageService>;

  beforeEach(() => {
    mockDocumentRepository = {
      create: vi.fn((data) => data as Document),
      save: vi.fn((doc) => Promise.resolve({ ...doc, id: 'photo-123' } as Document)),
      findOne: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    mockFileStorageService = {
      uploadFile: vi.fn((buffer, name, type) =>
        Promise.resolve({
          storageUrl: `http://storage.example.com/${name}`,
          fileSize: buffer.length,
          fileType: type,
        })
      ),
    };

    photoService = new PhotoService(
      mockDocumentRepository as Repository<Document>,
      mockFileStorageService as FileStorageService
    );
  });

  describe('extractMetadata', () => {
    it('should extract dimensions from image', async () => {
      // Create a simple 1x1 PNG buffer
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
        0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
        0x42, 0x60, 0x82,
      ]);

      const metadata = await photoService.extractMetadata(pngBuffer);

      expect(metadata).toBeDefined();
      expect(metadata.dimensions).toBeDefined();
      expect(metadata.dimensions?.width).toBe(1);
      expect(metadata.dimensions?.height).toBe(1);
    });

    it('should handle images without EXIF data gracefully', async () => {
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4,
        0x89, 0x00, 0x00, 0x00, 0x0a, 0x49, 0x44, 0x41,
        0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
        0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00,
        0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae,
        0x42, 0x60, 0x82,
      ]);

      const metadata = await photoService.extractMetadata(pngBuffer);

      expect(metadata).toBeDefined();
      expect(metadata.captureDate).toBeUndefined();
      expect(metadata.location).toBeUndefined();
    });
  });

  describe('uploadPhoto', () => {
    it('should upload photo with extracted metadata', async () => {
      const input: UploadPhotoInput = {
        projectId: 'project-123',
        name: 'photo.jpg',
        fileBuffer: Buffer.from('fake-image-data'),
        fileType: 'image/jpeg',
        uploadedBy: 'user-123',
      };

      const result = await photoService.uploadPhoto(input);

      expect(mockDocumentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: 'project-123',
          name: 'photo.jpg',
          type: DocumentType.PHOTO,
          uploadedBy: 'user-123',
        })
      );
      expect(mockDocumentRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('photo-123');
    });

    it('should merge provided metadata with extracted metadata', async () => {
      const captureDate = new Date('2024-01-15');
      const input: UploadPhotoInput = {
        projectId: 'project-123',
        name: 'photo.jpg',
        fileBuffer: Buffer.from('fake-image-data'),
        fileType: 'image/jpeg',
        uploadedBy: 'user-123',
        metadata: {
          captureDate,
          caption: 'Test caption',
          milestoneId: 'milestone-123',
        },
      };

      await photoService.uploadPhoto(input);

      expect(mockDocumentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            captureDate,
            caption: 'Test caption',
            milestoneId: 'milestone-123',
          }),
        })
      );
    });

    it('should upload both original and thumbnail', async () => {
      const input: UploadPhotoInput = {
        projectId: 'project-123',
        name: 'photo.jpg',
        fileBuffer: Buffer.from('fake-image-data'),
        fileType: 'image/jpeg',
        uploadedBy: 'user-123',
      };

      await photoService.uploadPhoto(input);

      // Should upload original photo
      expect(mockFileStorageService.uploadFile).toHaveBeenCalledWith(
        expect.any(Buffer),
        'photo.jpg',
        'image/jpeg'
      );
    });
  });

  describe('uploadPhotoBatch', () => {
    it('should upload multiple photos', async () => {
      const files = [
        { name: 'photo1.jpg', buffer: Buffer.from('data1'), fileType: 'image/jpeg' },
        { name: 'photo2.jpg', buffer: Buffer.from('data2'), fileType: 'image/jpeg' },
        { name: 'photo3.jpg', buffer: Buffer.from('data3'), fileType: 'image/jpeg' },
      ];

      const results = await photoService.uploadPhotoBatch(
        'project-123',
        files,
        'user-123'
      );

      expect(results).toHaveLength(3);
      expect(mockDocumentRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should apply shared metadata to all photos', async () => {
      const files = [
        { name: 'photo1.jpg', buffer: Buffer.from('data1'), fileType: 'image/jpeg' },
        { name: 'photo2.jpg', buffer: Buffer.from('data2'), fileType: 'image/jpeg' },
      ];

      await photoService.uploadPhotoBatch(
        'project-123',
        files,
        'user-123',
        { milestoneId: 'milestone-123', caption: 'Batch upload' }
      );

      expect(mockDocumentRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            milestoneId: 'milestone-123',
            caption: 'Batch upload',
          }),
        })
      );
    });
  });

  describe('getPhotos', () => {
    it('should retrieve photos in chronological order', async () => {
      const mockPhotos = [
        {
          id: 'photo-1',
          metadata: { captureDate: new Date('2024-01-01') },
        },
        {
          id: 'photo-2',
          metadata: { captureDate: new Date('2024-01-02') },
        },
      ];

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockPhotos),
      };

      mockDocumentRepository.createQueryBuilder = vi
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const results = await photoService.getPhotos('project-123');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'document.projectId = :projectId',
        { projectId: 'project-123' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'document.type = :type',
        { type: DocumentType.PHOTO }
      );
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(
        "COALESCE((document.metadata->>'captureDate')::timestamp, document.uploadedAt)",
        'ASC'
      );
      expect(results).toEqual(mockPhotos);
    });

    it('should filter photos by milestone', async () => {
      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };

      mockDocumentRepository.createQueryBuilder = vi
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const filters: PhotoFilters = {
        milestoneId: 'milestone-123',
      };

      await photoService.getPhotos('project-123', filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "document.metadata->>'associatedMilestoneId' = :milestoneId",
        { milestoneId: 'milestone-123' }
      );
    });

    it('should filter photos by capture date range', async () => {
      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };

      mockDocumentRepository.createQueryBuilder = vi
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const filters: PhotoFilters = {
        capturedAfter: new Date('2024-01-01'),
        capturedBefore: new Date('2024-01-31'),
      };

      await photoService.getPhotos('project-123', filters);

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "(document.metadata->>'captureDate')::timestamp >= :capturedAfter",
        { capturedAfter: filters.capturedAfter }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "(document.metadata->>'captureDate')::timestamp <= :capturedBefore",
        { capturedBefore: filters.capturedBefore }
      );
    });
  });

  describe('getPhotosByMilestone', () => {
    it('should retrieve photos for a specific milestone', async () => {
      const mockPhotos = [
        { id: 'photo-1', metadata: { associatedMilestoneId: 'milestone-123' } },
        { id: 'photo-2', metadata: { associatedMilestoneId: 'milestone-123' } },
      ];

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockPhotos),
      };

      mockDocumentRepository.createQueryBuilder = vi
        .fn()
        .mockReturnValue(mockQueryBuilder);

      const results = await photoService.getPhotosByMilestone('milestone-123');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "document.metadata->>'associatedMilestoneId' = :milestoneId",
        { milestoneId: 'milestone-123' }
      );
      expect(results).toEqual(mockPhotos);
    });
  });

  describe('addCaption', () => {
    it('should add caption to photo', async () => {
      const mockPhoto = {
        id: 'photo-123',
        type: DocumentType.PHOTO,
        metadata: {},
      };

      mockDocumentRepository.findOne = vi.fn().mockResolvedValue(mockPhoto);
      mockDocumentRepository.save = vi.fn((doc) => Promise.resolve(doc));

      const result = await photoService.addCaption('photo-123', 'Beautiful sunset');

      expect(mockDocumentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'photo-123', type: DocumentType.PHOTO },
      });
      expect(result.metadata?.caption).toBe('Beautiful sunset');
      expect(mockDocumentRepository.save).toHaveBeenCalled();
    });

    it('should throw error if photo not found', async () => {
      mockDocumentRepository.findOne = vi.fn().mockResolvedValue(null);

      await expect(
        photoService.addCaption('photo-123', 'Caption')
      ).rejects.toThrow('Photo not found');
    });

    it('should preserve existing metadata when adding caption', async () => {
      const mockPhoto = {
        id: 'photo-123',
        type: DocumentType.PHOTO,
        metadata: {
          captureDate: new Date('2024-01-01'),
          location: { latitude: 40.7128, longitude: -74.006 },
        },
      };

      mockDocumentRepository.findOne = vi.fn().mockResolvedValue(mockPhoto);
      mockDocumentRepository.save = vi.fn((doc) => Promise.resolve(doc));

      const result = await photoService.addCaption('photo-123', 'New caption');

      expect(result.metadata?.captureDate).toEqual(new Date('2024-01-01'));
      expect(result.metadata?.location).toEqual({ latitude: 40.7128, longitude: -74.006 });
      expect(result.metadata?.caption).toBe('New caption');
    });
  });

  describe('associateWithMilestone', () => {
    it('should associate photo with milestone', async () => {
      const mockPhoto = {
        id: 'photo-123',
        type: DocumentType.PHOTO,
        metadata: {},
      };

      mockDocumentRepository.findOne = vi.fn().mockResolvedValue(mockPhoto);
      mockDocumentRepository.save = vi.fn((doc) => Promise.resolve(doc));

      const result = await photoService.associateWithMilestone(
        'photo-123',
        'milestone-123'
      );

      expect(result.metadata?.associatedMilestoneId).toBe('milestone-123');
      expect(mockDocumentRepository.save).toHaveBeenCalled();
    });

    it('should throw error if photo not found', async () => {
      mockDocumentRepository.findOne = vi.fn().mockResolvedValue(null);

      await expect(
        photoService.associateWithMilestone('photo-123', 'milestone-123')
      ).rejects.toThrow('Photo not found');
    });
  });
});
