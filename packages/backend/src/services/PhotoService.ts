import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Document, DocumentType } from '../entities/Document';
import { FileStorageService } from './FileStorageService';
import * as exifr from 'exifr';
import sharp from 'sharp';

export interface PhotoMetadata {
  captureDate?: Date;
  milestoneId?: string;
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

export interface UploadPhotoInput {
  projectId: string;
  name: string;
  fileBuffer: Buffer;
  fileType: string;
  uploadedBy: string;
  metadata?: PhotoMetadata;
}

export interface PhotoFilters {
  milestoneId?: string;
  uploadedAfter?: Date;
  uploadedBefore?: Date;
  capturedAfter?: Date;
  capturedBefore?: Date;
}

/**
 * PhotoService handles photo management including upload with EXIF extraction,
 * thumbnail generation, batch upload, and chronological sorting.
 */
export class PhotoService {
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
   * Extract metadata from photo file including EXIF data
   */
  async extractMetadata(fileBuffer: Buffer): Promise<PhotoMetadata> {
    const metadata: PhotoMetadata = {};

    try {
      // Extract EXIF data
      const exifData = await exifr.parse(fileBuffer, {
        gps: true,
        pick: ['DateTimeOriginal', 'CreateDate', 'latitude', 'longitude'],
      });

      if (exifData) {
        // Extract capture date
        if (exifData.DateTimeOriginal) {
          metadata.captureDate = new Date(exifData.DateTimeOriginal);
        } else if (exifData.CreateDate) {
          metadata.captureDate = new Date(exifData.CreateDate);
        }

        // Extract GPS location
        if (exifData.latitude && exifData.longitude) {
          metadata.location = {
            latitude: exifData.latitude,
            longitude: exifData.longitude,
          };
        }
      }
    } catch (error) {
      // EXIF extraction failed, continue without EXIF data
      console.warn('Failed to extract EXIF data:', error);
    }

    try {
      // Extract image dimensions
      const imageMetadata = await sharp(fileBuffer).metadata();
      if (imageMetadata.width && imageMetadata.height) {
        metadata.dimensions = {
          width: imageMetadata.width,
          height: imageMetadata.height,
        };
      }
    } catch (error) {
      console.warn('Failed to extract image dimensions:', error);
    }

    return metadata;
  }

  /**
   * Generate thumbnail for photo
   */
  private async generateThumbnail(
    fileBuffer: Buffer,
    maxWidth: number = 300,
    maxHeight: number = 300
  ): Promise<Buffer> {
    return await sharp(fileBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({ quality: 80 })
      .toBuffer();
  }

  /**
   * Upload a photo with EXIF extraction and thumbnail generation
   */
  async uploadPhoto(input: UploadPhotoInput): Promise<Document> {
    // Extract metadata from photo
    const extractedMetadata = await this.extractMetadata(input.fileBuffer);

    // Merge extracted metadata with provided metadata (provided takes precedence)
    const finalMetadata: PhotoMetadata = {
      ...extractedMetadata,
      ...input.metadata,
    };

    // Upload original photo
    const uploadResult = await this.fileStorageService.uploadFile(
      input.fileBuffer,
      input.name,
      input.fileType
    );

    // Generate and upload thumbnail
    let thumbnailUrl: string | undefined;
    try {
      const thumbnailBuffer = await this.generateThumbnail(input.fileBuffer);
      const thumbnailName = `thumb_${input.name}`;
      const thumbnailResult = await this.fileStorageService.uploadFile(
        thumbnailBuffer,
        thumbnailName,
        'image/jpeg'
      );
      thumbnailUrl = thumbnailResult.storageUrl;
    } catch (error) {
      console.warn('Failed to generate thumbnail:', error);
    }

    // Create document entity with photo type
    const photo = this.documentRepository.create({
      projectId: input.projectId,
      name: input.name,
      type: DocumentType.PHOTO,
      fileType: uploadResult.fileType,
      fileSize: uploadResult.fileSize,
      storageUrl: uploadResult.storageUrl,
      thumbnailUrl,
      uploadedBy: input.uploadedBy,
      metadata: finalMetadata,
    });

    return await this.documentRepository.save(photo);
  }

  /**
   * Upload multiple photos in batch
   */
  async uploadPhotoBatch(
    projectId: string,
    files: Array<{ name: string; buffer: Buffer; fileType: string }>,
    uploadedBy: string,
    metadata?: Omit<PhotoMetadata, 'captureDate' | 'location' | 'dimensions'>
  ): Promise<Document[]> {
    const uploadPromises = files.map((file) =>
      this.uploadPhoto({
        projectId,
        name: file.name,
        fileBuffer: file.buffer,
        fileType: file.fileType,
        uploadedBy,
        metadata,
      })
    );

    return await Promise.all(uploadPromises);
  }

  /**
   * Get photos for a project with chronological sorting
   */
  async getPhotos(
    projectId: string,
    filters: PhotoFilters = {}
  ): Promise<Document[]> {
    const queryBuilder = this.documentRepository
      .createQueryBuilder('document')
      .where('document.projectId = :projectId', { projectId })
      .andWhere('document.type = :type', { type: DocumentType.PHOTO })
      .andWhere('document.deletedAt IS NULL');

    // Filter by milestone
    if (filters.milestoneId) {
      queryBuilder.andWhere(
        "document.metadata->>'associatedMilestoneId' = :milestoneId",
        { milestoneId: filters.milestoneId }
      );
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

    // Filter by capture date range
    if (filters.capturedAfter) {
      queryBuilder.andWhere(
        "(document.metadata->>'captureDate')::timestamp >= :capturedAfter",
        { capturedAfter: filters.capturedAfter }
      );
    }

    if (filters.capturedBefore) {
      queryBuilder.andWhere(
        "(document.metadata->>'captureDate')::timestamp <= :capturedBefore",
        { capturedBefore: filters.capturedBefore }
      );
    }

    // Sort chronologically by capture date (if available), then by upload date
    queryBuilder.orderBy(
      "COALESCE((document.metadata->>'captureDate')::timestamp, document.uploadedAt)",
      'ASC'
    );

    return await queryBuilder.getMany();
  }

  /**
   * Get photos by milestone
   */
  async getPhotosByMilestone(milestoneId: string): Promise<Document[]> {
    return await this.documentRepository
      .createQueryBuilder('document')
      .where('document.type = :type', { type: DocumentType.PHOTO })
      .andWhere('document.deletedAt IS NULL')
      .andWhere(
        "document.metadata->>'associatedMilestoneId' = :milestoneId",
        { milestoneId }
      )
      .orderBy(
        "COALESCE((document.metadata->>'captureDate')::timestamp, document.uploadedAt)",
        'ASC'
      )
      .getMany();
  }

  /**
   * Add or update caption for a photo
   */
  async addCaption(photoId: string, caption: string): Promise<Document> {
    const photo = await this.documentRepository.findOne({
      where: { id: photoId, type: DocumentType.PHOTO },
    });

    if (!photo) {
      throw new Error('Photo not found');
    }

    // Update metadata with caption
    photo.metadata = {
      ...photo.metadata,
      caption,
    };

    return await this.documentRepository.save(photo);
  }

  /**
   * Associate photo with milestone
   */
  async associateWithMilestone(
    photoId: string,
    milestoneId: string
  ): Promise<Document> {
    const photo = await this.documentRepository.findOne({
      where: { id: photoId, type: DocumentType.PHOTO },
    });

    if (!photo) {
      throw new Error('Photo not found');
    }

    // Update metadata with milestone association
    photo.metadata = {
      ...photo.metadata,
      associatedMilestoneId: milestoneId,
    };

    return await this.documentRepository.save(photo);
  }
}
