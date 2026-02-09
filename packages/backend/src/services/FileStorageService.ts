import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

export interface UploadResult {
  storageUrl: string;
  fileSize: number;
  fileType: string;
}

export interface PresignedUrlResult {
  url: string;
  expiresAt: Date;
}

export interface FileMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
}

/**
 * FileStorageService handles file upload, deletion, and presigned URL generation.
 * 
 * This implementation uses local file storage to simulate cloud storage (AWS S3).
 * It can be easily replaced with actual cloud storage implementation later.
 */
export class FileStorageService {
  private storageBasePath: string;
  private baseUrl: string;

  constructor(storageBasePath?: string, baseUrl?: string) {
    this.storageBasePath = storageBasePath || path.join(process.cwd(), 'uploads');
    this.baseUrl = baseUrl || process.env.FILE_STORAGE_BASE_URL || 'http://localhost:4000/files';
    
    // Ensure storage directory exists
    this.ensureStorageDirectory();
  }

  /**
   * Ensure the storage directory exists
   */
  private ensureStorageDirectory(): void {
    if (!fs.existsSync(this.storageBasePath)) {
      fs.mkdirSync(this.storageBasePath, { recursive: true });
    }
  }

  /**
   * Generate a unique file key for storage
   */
  private generateFileKey(fileName: string): string {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    const extension = path.extname(fileName);
    const baseName = path.basename(fileName, extension);
    const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    return `${timestamp}-${randomString}-${sanitizedBaseName}${extension}`;
  }

  /**
   * Get the full file path for a given key
   */
  private getFilePath(fileKey: string): string {
    return path.join(this.storageBasePath, fileKey);
  }

  /**
   * Upload a file to storage
   * 
   * @param fileBuffer - The file content as a Buffer
   * @param fileName - Original file name
   * @param fileType - MIME type of the file
   * @returns Upload result with storage URL and metadata
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    fileType: string
  ): Promise<UploadResult> {
    const fileKey = this.generateFileKey(fileName);
    const filePath = this.getFilePath(fileKey);

    // Write file to storage
    await fs.promises.writeFile(filePath, fileBuffer);

    const storageUrl = `${this.baseUrl}/${fileKey}`;
    const fileSize = fileBuffer.length;

    return {
      storageUrl,
      fileSize,
      fileType,
    };
  }

  /**
   * Delete a file from storage
   * 
   * @param storageUrl - The storage URL of the file to delete
   */
  async deleteFile(storageUrl: string): Promise<void> {
    const fileKey = this.extractFileKeyFromUrl(storageUrl);
    const filePath = this.getFilePath(fileKey);

    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  /**
   * Generate a presigned URL for file upload
   * 
   * This simulates AWS S3 presigned URLs. In a real implementation,
   * this would generate a signed URL that allows direct upload to S3.
   * 
   * @param fileName - Name of the file to upload
   * @param fileType - MIME type of the file
   * @param expiresInSeconds - URL expiration time in seconds (default: 3600)
   * @returns Presigned URL result with URL and expiration
   */
  generatePresignedUploadUrl(
    fileName: string,
    fileType: string,
    expiresInSeconds: number = 3600
  ): PresignedUrlResult {
    const fileKey = this.generateFileKey(fileName);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    
    // Generate a signature token
    const token = this.generateSignatureToken(fileKey, expiresAt);
    
    const url = `${this.baseUrl}/upload?key=${fileKey}&token=${token}&expires=${expiresAt.getTime()}`;

    return {
      url,
      expiresAt,
    };
  }

  /**
   * Generate a presigned URL for file download
   * 
   * @param storageUrl - The storage URL of the file
   * @param expiresInSeconds - URL expiration time in seconds (default: 3600)
   * @returns Presigned URL result with URL and expiration
   */
  generatePresignedDownloadUrl(
    storageUrl: string,
    expiresInSeconds: number = 3600
  ): PresignedUrlResult {
    const fileKey = this.extractFileKeyFromUrl(storageUrl);
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
    
    // Generate a signature token
    const token = this.generateSignatureToken(fileKey, expiresAt);
    
    const url = `${this.baseUrl}/download/${fileKey}?token=${token}&expires=${expiresAt.getTime()}`;

    return {
      url,
      expiresAt,
    };
  }

  /**
   * Validate a presigned URL token
   * 
   * @param fileKey - The file key
   * @param token - The signature token
   * @param expiresAt - The expiration timestamp
   * @returns True if valid, false otherwise
   */
  validatePresignedUrl(fileKey: string, token: string, expiresAt: number): boolean {
    // Check if expired
    if (Date.now() > expiresAt) {
      return false;
    }

    // Validate token
    const expectedToken = this.generateSignatureToken(fileKey, new Date(expiresAt));
    return token === expectedToken;
  }

  /**
   * Generate a signature token for presigned URLs
   */
  private generateSignatureToken(fileKey: string, expiresAt: Date): string {
    const secret = process.env.FILE_STORAGE_SECRET || 'default-secret-change-in-production';
    const data = `${fileKey}:${expiresAt.getTime()}`;
    
    return crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('hex');
  }

  /**
   * Extract file key from storage URL
   */
  private extractFileKeyFromUrl(storageUrl: string): string {
    const url = new URL(storageUrl);
    return path.basename(url.pathname);
  }

  /**
   * Check if a file exists in storage
   * 
   * @param storageUrl - The storage URL to check
   * @returns True if file exists, false otherwise
   */
  async fileExists(storageUrl: string): Promise<boolean> {
    const fileKey = this.extractFileKeyFromUrl(storageUrl);
    const filePath = this.getFilePath(fileKey);
    
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata
   * 
   * @param storageUrl - The storage URL
   * @returns File metadata
   */
  async getFileMetadata(storageUrl: string): Promise<FileMetadata> {
    const fileKey = this.extractFileKeyFromUrl(storageUrl);
    const filePath = this.getFilePath(fileKey);
    
    const stats = await fs.promises.stat(filePath);
    const extension = path.extname(fileKey);
    
    return {
      fileName: fileKey,
      fileType: this.getFileTypeFromExtension(extension),
      fileSize: stats.size,
    };
  }

  /**
   * Get MIME type from file extension
   */
  private getFileTypeFromExtension(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.heic': 'image/heic',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    
    return mimeTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Read file content
   * 
   * @param storageUrl - The storage URL
   * @returns File content as Buffer
   */
  async readFile(storageUrl: string): Promise<Buffer> {
    const fileKey = this.extractFileKeyFromUrl(storageUrl);
    const filePath = this.getFilePath(fileKey);
    
    return await fs.promises.readFile(filePath);
  }
}
