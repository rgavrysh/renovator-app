import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Document, DocumentType } from '../entities/Document';
import { FileStorageService } from './FileStorageService';

export interface DocumentMetadata {
  tags?: string[];
  description?: string;
  captureDate?: Date;
  associatedMilestoneId?: string;
  caption?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface UploadDocumentInput {
  projectId: string;
  name: string;
  type: DocumentType;
  fileBuffer: Buffer;
  fileType: string;
  uploadedBy: string;
  metadata?: DocumentMetadata;
}

export interface DocumentFilters {
  type?: DocumentType;
  uploadedAfter?: Date;
  uploadedBefore?: Date;
  includeDeleted?: boolean;
  tags?: string[];
}

const ALLOWED_FILE_EXTENSIONS = [
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
  '.heic',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
];

/**
 * DocumentService handles document management including upload, search, filtering, and soft delete.
 */
export class DocumentService {
  private documentRepository: Repository<Document>;
  private fileStorageService: FileStorageService;

  constructor(
    documentRepository?: Repository<Document>,
    fileStorageService?: FileStorageService
  ) {
    this.documentRepository =
      documentRepository || AppDataSource.getRepository(Document);
    this.fileStorageService = fileStorageService || new FileStorageService();
  }

  /**
   * Validate file format
   */
  private validateFileFormat(fileName: string): void {
    const extension = fileName.substring(fileName.lastIndexOf('.')).toLowerCase();
    
    if (!ALLOWED_FILE_EXTENSIONS.includes(extension)) {
      throw new Error(
        `Invalid file format. Allowed formats: ${ALLOWED_FILE_EXTENSIONS.join(', ')}`
      );
    }
  }

  /**
   * Upload a document with metadata
   */
  async uploadDocument(input: UploadDocumentInput): Promise<Document> {
    // Validate file format
    this.validateFileFormat(input.name);

    // Upload file to storage
    const uploadResult = await this.fileStorageService.uploadFile(
      input.fileBuffer,
      input.name,
      input.fileType
    );

    // Create document entity
    const document = this.documentRepository.create({
      projectId: input.projectId,
      name: input.name,
      type: input.type,
      fileType: uploadResult.fileType,
      fileSize: uploadResult.fileSize,
      storageUrl: uploadResult.storageUrl,
      uploadedBy: input.uploadedBy,
      metadata: input.metadata,
    });

    return await this.documentRepository.save(document);
  }

  /**
   * Get a document by ID
   */
  async getDocument(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    return document;
  }

  /**
   * List documents with filters
   */
  async listDocuments(
    projectId: string,
    filters: DocumentFilters = {}
  ): Promise<Document[]> {
    const queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .where('document.projectId = :projectId', { projectId });

    // Filter by type
    if (filters.type) {
      queryBuilder.andWhere('document.type = :type', { type: filters.type });
    }

    // Filter by upload date range
    if (filters.uploadedAfter) {
      queryBuilder.andWhere('document.uploadedAt >= :uploadedAfter', {
        uploadedAfter: filters.uploadedAfter,
      });
    }

    if (filters.uploadedBefore) {
      queryBuilder.andWhere('document.uploadedAt <= :uploadedBefore', {
        uploadedBefore: filters.uploadedBefore,
      });
    }

    // Filter by tags
    if (filters.tags && filters.tags.length > 0) {
      queryBuilder.andWhere(
        "document.metadata->>'tags' ?| array[:...tags]",
        { tags: filters.tags }
      );
    }

    // Exclude deleted documents by default
    if (!filters.includeDeleted) {
      queryBuilder.andWhere('document.deletedAt IS NULL');
    }

    queryBuilder.orderBy('document.uploadedAt', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Search documents by name, type, or date range
   */
  async searchDocuments(projectId: string, query: string): Promise<Document[]> {
    const queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .where('document.projectId = :projectId', { projectId })
      .andWhere('document.deletedAt IS NULL');

    // Search in name, type, or description
    queryBuilder.andWhere(
      '(LOWER(document.name) LIKE LOWER(:query) OR ' +
      'LOWER(document.type) LIKE LOWER(:query) OR ' +
      "LOWER(document.metadata->>'description') LIKE LOWER(:query))",
      { query: `%${query}%` }
    );

    queryBuilder.orderBy('document.uploadedAt', 'DESC');

    return await queryBuilder.getMany();
  }

  /**
   * Soft delete a document (move to trash)
   */
  async deleteDocument(id: string): Promise<void> {
    const document = await this.getDocument(id);

    document.deletedAt = new Date();
    await this.documentRepository.save(document);
  }

  /**
   * Restore a document from trash
   */
  async restoreDocument(id: string): Promise<Document> {
    const document = await this.documentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (!document.deletedAt) {
      throw new Error('Document is not in trash');
    }

    document.deletedAt = undefined;
    return await this.documentRepository.save(document);
  }

  /**
   * Permanently delete a document and its file from storage
   */
  async permanentlyDeleteDocument(id: string): Promise<void> {
    const document = await this.documentRepository.findOne({
      where: { id },
    });

    if (!document) {
      throw new Error('Document not found');
    }

    // Delete file from storage
    await this.fileStorageService.deleteFile(document.storageUrl);

    // Delete document entity
    await this.documentRepository.remove(document);
  }

  /**
   * Generate a presigned URL for document download
   */
  async generatePresignedUrl(id: string): Promise<string> {
    const document = await this.getDocument(id);

    const result = this.fileStorageService.generatePresignedDownloadUrl(
      document.storageUrl,
      3600 // 1 hour expiration
    );

    return result.url;
  }

  /**
   * Get documents in trash (deleted more than 30 days ago should be permanently deleted)
   */
  async getTrashDocuments(projectId: string): Promise<Document[]> {
    return await this.documentRepository
      .createQueryBuilder('document')
      .where('document.projectId = :projectId', { projectId })
      .andWhere('document.deletedAt IS NOT NULL')
      .orderBy('document.deletedAt', 'DESC')
      .getMany();
  }

  /**
   * Clean up documents in trash older than 30 days
   */
  async cleanupOldTrashDocuments(): Promise<number> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const oldDocuments = await this.documentRepository
      .createQueryBuilder('document')
      .where('document.deletedAt IS NOT NULL')
      .andWhere('document.deletedAt < :thirtyDaysAgo', { thirtyDaysAgo })
      .getMany();

    for (const document of oldDocuments) {
      await this.permanentlyDeleteDocument(document.id);
    }

    return oldDocuments.length;
  }
}
