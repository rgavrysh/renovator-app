import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Repository } from 'typeorm';
import { DocumentService, UploadDocumentInput, DocumentFilters } from './DocumentService';
import { Document, DocumentType } from '../entities/Document';
import { FileStorageService } from './FileStorageService';

describe('DocumentService', () => {
  let documentService: DocumentService;
  let mockDocumentRepository: Partial<Repository<Document>>;
  let mockFileStorageService: Partial<FileStorageService>;

  beforeEach(() => {
    // Mock repository
    mockDocumentRepository = {
      create: vi.fn((data) => data as Document),
      save: vi.fn((doc) => Promise.resolve(doc as Document)),
      findOne: vi.fn(),
      remove: vi.fn(),
      createQueryBuilder: vi.fn(),
    };

    // Mock file storage service
    mockFileStorageService = {
      uploadFile: vi.fn(),
      deleteFile: vi.fn(),
      generatePresignedDownloadUrl: vi.fn(),
    };

    documentService = new DocumentService(
      mockDocumentRepository as Repository<Document>,
      mockFileStorageService as FileStorageService
    );
  });

  describe('uploadDocument', () => {
    it('should upload a document with valid format', async () => {
      const input: UploadDocumentInput = {
        projectId: 'project-1',
        name: 'contract.pdf',
        type: DocumentType.CONTRACT,
        fileBuffer: Buffer.from('test file content'),
        fileType: 'application/pdf',
        uploadedBy: 'user-1',
        metadata: {
          description: 'Project contract',
          tags: ['legal', 'contract'],
        },
      };

      const uploadResult = {
        storageUrl: 'http://localhost:4000/files/contract.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
      };

      vi.mocked(mockFileStorageService.uploadFile!).mockResolvedValue(uploadResult);

      const result = await documentService.uploadDocument(input);

      expect(mockFileStorageService.uploadFile).toHaveBeenCalledWith(
        input.fileBuffer,
        input.name,
        input.fileType
      );

      expect(mockDocumentRepository.create).toHaveBeenCalledWith({
        projectId: input.projectId,
        name: input.name,
        type: input.type,
        fileType: uploadResult.fileType,
        fileSize: uploadResult.fileSize,
        storageUrl: uploadResult.storageUrl,
        uploadedBy: input.uploadedBy,
        metadata: input.metadata,
      });

      expect(mockDocumentRepository.save).toHaveBeenCalled();
    });

    it('should reject invalid file formats', async () => {
      const input: UploadDocumentInput = {
        projectId: 'project-1',
        name: 'malware.exe',
        type: DocumentType.OTHER,
        fileBuffer: Buffer.from('test'),
        fileType: 'application/x-msdownload',
        uploadedBy: 'user-1',
      };

      await expect(documentService.uploadDocument(input)).rejects.toThrow(
        'Invalid file format'
      );

      expect(mockFileStorageService.uploadFile).not.toHaveBeenCalled();
    });

    it('should accept all allowed file formats', async () => {
      const allowedFormats = [
        'document.pdf',
        'photo.jpg',
        'image.jpeg',
        'screenshot.png',
        'photo.heic',
        'contract.doc',
        'report.docx',
        'budget.xls',
        'expenses.xlsx',
      ];

      const uploadResult = {
        storageUrl: 'http://localhost:4000/files/test',
        fileSize: 1024,
        fileType: 'application/octet-stream',
      };

      vi.mocked(mockFileStorageService.uploadFile!).mockResolvedValue(uploadResult);

      for (const fileName of allowedFormats) {
        const input: UploadDocumentInput = {
          projectId: 'project-1',
          name: fileName,
          type: DocumentType.OTHER,
          fileBuffer: Buffer.from('test'),
          fileType: 'application/octet-stream',
          uploadedBy: 'user-1',
        };

        await expect(documentService.uploadDocument(input)).resolves.toBeDefined();
      }
    });
  });

  describe('getDocument', () => {
    it('should retrieve a document by ID', async () => {
      const mockDocument: Partial<Document> = {
        id: 'doc-1',
        projectId: 'project-1',
        name: 'contract.pdf',
        type: DocumentType.CONTRACT,
      };

      vi.mocked(mockDocumentRepository.findOne!).mockResolvedValue(
        mockDocument as Document
      );

      const result = await documentService.getDocument('doc-1');

      expect(mockDocumentRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'doc-1' },
      });
      expect(result).toEqual(mockDocument);
    });

    it('should throw error if document not found', async () => {
      vi.mocked(mockDocumentRepository.findOne!).mockResolvedValue(null);

      await expect(documentService.getDocument('non-existent')).rejects.toThrow(
        'Document not found'
      );
    });
  });

  describe('listDocuments', () => {
    it('should list documents with filters', async () => {
      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(mockDocumentRepository.createQueryBuilder!).mockReturnValue(
        mockQueryBuilder as any
      );

      const filters: DocumentFilters = {
        type: DocumentType.INVOICE,
        uploadedAfter: new Date('2024-01-01'),
        uploadedBefore: new Date('2024-12-31'),
      };

      await documentService.listDocuments('project-1', filters);

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'document.projectId = :projectId',
        { projectId: 'project-1' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'document.type = :type',
        { type: DocumentType.INVOICE }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'document.uploadedAt >= :uploadedAfter',
        { uploadedAfter: filters.uploadedAfter }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'document.uploadedAt <= :uploadedBefore',
        { uploadedBefore: filters.uploadedBefore }
      );
    });

    it('should exclude deleted documents by default', async () => {
      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(mockDocumentRepository.createQueryBuilder!).mockReturnValue(
        mockQueryBuilder as any
      );

      await documentService.listDocuments('project-1');

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'document.deletedAt IS NULL'
      );
    });

    it('should include deleted documents when requested', async () => {
      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(mockDocumentRepository.createQueryBuilder!).mockReturnValue(
        mockQueryBuilder as any
      );

      await documentService.listDocuments('project-1', { includeDeleted: true });

      // Should not add the deletedAt IS NULL filter
      const calls = mockQueryBuilder.andWhere.mock.calls;
      const hasDeletedFilter = calls.some(
        (call) => call[0] === 'document.deletedAt IS NULL'
      );
      expect(hasDeletedFilter).toBe(false);
    });

    it('should filter by tags', async () => {
      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(mockDocumentRepository.createQueryBuilder!).mockReturnValue(
        mockQueryBuilder as any
      );

      await documentService.listDocuments('project-1', {
        tags: ['legal', 'contract'],
      });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        "document.metadata->>'tags' ?| array[:...tags]",
        { tags: ['legal', 'contract'] }
      );
    });
  });

  describe('searchDocuments', () => {
    it('should search documents by query', async () => {
      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(mockDocumentRepository.createQueryBuilder!).mockReturnValue(
        mockQueryBuilder as any
      );

      await documentService.searchDocuments('project-1', 'contract');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'document.projectId = :projectId',
        { projectId: 'project-1' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'document.deletedAt IS NULL'
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        expect.stringContaining('LOWER(document.name) LIKE LOWER(:query)'),
        { query: '%contract%' }
      );
    });
  });

  describe('deleteDocument', () => {
    it('should soft delete a document', async () => {
      const mockDocument: Partial<Document> = {
        id: 'doc-1',
        projectId: 'project-1',
        name: 'contract.pdf',
        type: DocumentType.CONTRACT,
      };

      vi.mocked(mockDocumentRepository.findOne!).mockResolvedValue(
        mockDocument as Document
      );

      await documentService.deleteDocument('doc-1');

      expect(mockDocument.deletedAt).toBeDefined();
      expect(mockDocumentRepository.save).toHaveBeenCalledWith(mockDocument);
    });
  });

  describe('restoreDocument', () => {
    it('should restore a deleted document', async () => {
      const mockDocument: Partial<Document> = {
        id: 'doc-1',
        projectId: 'project-1',
        name: 'contract.pdf',
        type: DocumentType.CONTRACT,
        deletedAt: new Date(),
      };

      vi.mocked(mockDocumentRepository.findOne!).mockResolvedValue(
        mockDocument as Document
      );

      const result = await documentService.restoreDocument('doc-1');

      expect(result.deletedAt).toBeUndefined();
      expect(mockDocumentRepository.save).toHaveBeenCalledWith(mockDocument);
    });

    it('should throw error if document is not in trash', async () => {
      const mockDocument: Partial<Document> = {
        id: 'doc-1',
        projectId: 'project-1',
        name: 'contract.pdf',
        type: DocumentType.CONTRACT,
        deletedAt: undefined,
      };

      vi.mocked(mockDocumentRepository.findOne!).mockResolvedValue(
        mockDocument as Document
      );

      await expect(documentService.restoreDocument('doc-1')).rejects.toThrow(
        'Document is not in trash'
      );
    });
  });

  describe('permanentlyDeleteDocument', () => {
    it('should permanently delete document and file', async () => {
      const mockDocument: Partial<Document> = {
        id: 'doc-1',
        projectId: 'project-1',
        name: 'contract.pdf',
        type: DocumentType.CONTRACT,
        storageUrl: 'http://localhost:4000/files/contract.pdf',
      };

      vi.mocked(mockDocumentRepository.findOne!).mockResolvedValue(
        mockDocument as Document
      );

      await documentService.permanentlyDeleteDocument('doc-1');

      expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith(
        mockDocument.storageUrl
      );
      expect(mockDocumentRepository.remove).toHaveBeenCalledWith(mockDocument);
    });
  });

  describe('generatePresignedUrl', () => {
    it('should generate presigned URL for document', async () => {
      const mockDocument: Partial<Document> = {
        id: 'doc-1',
        projectId: 'project-1',
        name: 'contract.pdf',
        type: DocumentType.CONTRACT,
        storageUrl: 'http://localhost:4000/files/contract.pdf',
      };

      vi.mocked(mockDocumentRepository.findOne!).mockResolvedValue(
        mockDocument as Document
      );

      const presignedUrl = 'http://localhost:4000/files/download/contract.pdf?token=abc';
      vi.mocked(mockFileStorageService.generatePresignedDownloadUrl!).mockReturnValue({
        url: presignedUrl,
        expiresAt: new Date(),
      });

      const result = await documentService.generatePresignedUrl('doc-1');

      expect(mockFileStorageService.generatePresignedDownloadUrl).toHaveBeenCalledWith(
        mockDocument.storageUrl,
        3600
      );
      expect(result).toBe(presignedUrl);
    });
  });

  describe('getTrashDocuments', () => {
    it('should retrieve documents in trash', async () => {
      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        orderBy: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(mockDocumentRepository.createQueryBuilder!).mockReturnValue(
        mockQueryBuilder as any
      );

      await documentService.getTrashDocuments('project-1');

      expect(mockQueryBuilder.where).toHaveBeenCalledWith(
        'document.projectId = :projectId',
        { projectId: 'project-1' }
      );
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'document.deletedAt IS NOT NULL'
      );
    });
  });

  describe('cleanupOldTrashDocuments', () => {
    it('should permanently delete documents older than 30 days', async () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);

      const mockOldDocuments: Partial<Document>[] = [
        {
          id: 'doc-1',
          projectId: 'project-1',
          name: 'old-doc.pdf',
          type: DocumentType.OTHER,
          storageUrl: 'http://localhost:4000/files/old-doc.pdf',
          deletedAt: oldDate,
        },
      ];

      const mockQueryBuilder = {
        where: vi.fn().mockReturnThis(),
        andWhere: vi.fn().mockReturnThis(),
        getMany: vi.fn().mockResolvedValue(mockOldDocuments),
      };

      vi.mocked(mockDocumentRepository.createQueryBuilder!).mockReturnValue(
        mockQueryBuilder as any
      );

      vi.mocked(mockDocumentRepository.findOne!).mockResolvedValue(
        mockOldDocuments[0] as Document
      );

      const count = await documentService.cleanupOldTrashDocuments();

      expect(count).toBe(1);
      expect(mockFileStorageService.deleteFile).toHaveBeenCalledWith(
        mockOldDocuments[0].storageUrl
      );
      expect(mockDocumentRepository.remove).toHaveBeenCalled();
    });
  });
});
