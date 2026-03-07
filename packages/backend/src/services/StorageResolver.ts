import { AppDataSource } from '../config/database';
import config from '../config';
import { Document } from '../entities/Document';
import { ProjectDriveFolder } from '../entities/ProjectDriveFolder';
import { GoogleDriveAuthService, GoogleDriveTokenError } from './GoogleDriveAuthService';
import { GoogleDriveStorageProvider } from './GoogleDriveStorageProvider';
import { FileStorageService, UploadResult } from './FileStorageService';

export interface StorageUploadResult extends UploadResult {
  storageProvider: 'local' | 'google_drive';
  driveFileId?: string;
}

export class StorageResolver {
  private _authService: GoogleDriveAuthService | null;
  private _driveProvider: GoogleDriveStorageProvider | null;
  private readonly localProvider: FileStorageService;

  constructor(
    authService?: GoogleDriveAuthService,
    driveProvider?: GoogleDriveStorageProvider,
    localProvider?: FileStorageService,
  ) {
    this._authService = authService || null;
    this._driveProvider = driveProvider || null;
    this.localProvider = localProvider || new FileStorageService();
  }

  private get authService(): GoogleDriveAuthService {
    if (!this._authService) this._authService = new GoogleDriveAuthService();
    return this._authService;
  }

  private get driveProvider(): GoogleDriveStorageProvider {
    if (!this._driveProvider) this._driveProvider = new GoogleDriveStorageProvider(this.authService);
    return this._driveProvider;
  }

  private isGoogleDriveConfigured(): boolean {
    return !!(config.google.clientId && config.google.clientSecret && config.tokenEncryption.key);
  }

  async getStorageMode(userId: string): Promise<'local' | 'google_drive'> {
    if (!this.isGoogleDriveConfigured()) return 'local';
    const connected = await this.authService.isConnected(userId);
    return connected ? 'google_drive' : 'local';
  }

  /**
   * Get or auto-create the Google Drive folder for a project.
   * 1. Check project_drive_folders for existing mapping
   * 2. If found → return that drive_folder_id
   * 3. If not → create "Renovator - {Project Name}" in Drive root, save mapping
   */
  async resolveProjectFolder(
    userId: string,
    projectId: string,
    projectName: string,
  ): Promise<string> {
    const repo = AppDataSource.getRepository(ProjectDriveFolder);

    const existing = await repo.findOne({
      where: { projectId, userId },
    });

    if (existing) {
      return existing.driveFolderId;
    }

    const folderName = `Renovator - ${projectName}`;
    const result = await this.driveProvider.createFolder(userId, folderName);

    const mapping = repo.create({
      projectId,
      userId,
      driveFolderId: result.folderId,
      driveFolderName: result.folderName,
      driveFolderUrl: result.webViewLink,
    });
    await repo.save(mapping);

    return result.folderId;
  }

  /**
   * Upload a file to the appropriate storage backend.
   */
  async uploadFile(
    userId: string,
    projectId: string,
    projectName: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<StorageUploadResult> {
    const mode = await this.getStorageMode(userId);

    if (mode === 'google_drive') {
      try {
        const folderId = await this.resolveProjectFolder(userId, projectId, projectName);
        const driveResult = await this.driveProvider.uploadFile(
          userId,
          folderId,
          fileBuffer,
          fileName,
          mimeType,
        );

        return {
          storageUrl: driveResult.webViewLink || driveResult.driveFileId,
          fileSize: fileBuffer.length,
          fileType: mimeType,
          storageProvider: 'google_drive',
          driveFileId: driveResult.driveFileId,
        };
      } catch (error) {
        if (error instanceof GoogleDriveTokenError) {
          console.warn(`Google Drive token expired for user ${userId}, falling back to local storage`);
        } else {
          throw error;
        }
      }
    }

    const localResult = await this.localProvider.uploadFile(fileBuffer, fileName, mimeType);
    return {
      ...localResult,
      storageProvider: 'local',
    };
  }

  /**
   * Read file content regardless of storage provider.
   */
  async readFile(document: Document, userId: string): Promise<Buffer> {
    if (document.storageProvider === 'google_drive' && document.driveFileId) {
      return this.driveProvider.downloadFile(userId, document.driveFileId);
    }
    return this.localProvider.readFile(document.storageUrl);
  }

  /**
   * Get a download URL / presigned URL for a document.
   * For Google Drive files the backend must proxy, so we return a backend proxy path.
   * For local files we return the existing presigned URL.
   */
  getDownloadUrl(document: Document): string {
    if (document.storageProvider === 'google_drive' && document.driveFileId) {
      return `/api/documents/${document.id}/download`;
    }

    const result = this.localProvider.generatePresignedDownloadUrl(document.storageUrl);
    return result.url;
  }

  /**
   * Delete a file from the appropriate storage backend.
   */
  async deleteFile(document: Document, userId: string): Promise<void> {
    if (document.storageProvider === 'google_drive' && document.driveFileId) {
      await this.driveProvider.deleteFile(userId, document.driveFileId);
      return;
    }
    await this.localProvider.deleteFile(document.storageUrl);
  }
}
