import { google, drive_v3 } from 'googleapis';
import { Readable } from 'node:stream';
import { GoogleDriveAuthService } from './GoogleDriveAuthService';

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 500;

async function withRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const status = error?.response?.status ?? error?.code;
      const isRetryable = status === 429 || status === 500 || status === 503;

      if (!isRetryable || attempt === retries) throw error;

      const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 200;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('Retry exhausted');
}

export interface DriveUploadResult {
  driveFileId: string;
  webViewLink: string;
  webContentLink: string;
}

export interface DriveFolderResult {
  folderId: string;
  folderName: string;
  webViewLink: string;
}

export interface DriveFolder {
  id: string;
  name: string;
  webViewLink: string;
}

export class GoogleDriveStorageProvider {
  private readonly authService: GoogleDriveAuthService;

  constructor(authService?: GoogleDriveAuthService) {
    this.authService = authService || new GoogleDriveAuthService();
  }

  private async getDriveClient(userId: string): Promise<drive_v3.Drive> {
    const oauth2Client = await this.authService.getAuthenticatedClient(userId);
    return google.drive({ version: 'v3', auth: oauth2Client });
  }

  async uploadFile(
    userId: string,
    folderId: string,
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
  ): Promise<DriveUploadResult> {
    const drive = await this.getDriveClient(userId);

    const response = await withRetry(() =>
      drive.files.create({
        requestBody: {
          name: fileName,
          parents: [folderId],
        },
        media: {
          mimeType,
          body: Readable.from(fileBuffer),
        },
        fields: 'id,webViewLink,webContentLink',
      }),
    );

    return {
      driveFileId: response.data.id!,
      webViewLink: response.data.webViewLink || '',
      webContentLink: response.data.webContentLink || '',
    };
  }

  async downloadFile(userId: string, driveFileId: string): Promise<Buffer> {
    const drive = await this.getDriveClient(userId);

    const response = await withRetry(() =>
      drive.files.get(
        { fileId: driveFileId, alt: 'media' },
        { responseType: 'arraybuffer' },
      ),
    );

    return Buffer.from(response.data as ArrayBuffer);
  }

  async deleteFile(userId: string, driveFileId: string): Promise<void> {
    const drive = await this.getDriveClient(userId);
    await withRetry(() => drive.files.delete({ fileId: driveFileId }));
  }

  async createFolder(
    userId: string,
    folderName: string,
    parentFolderId?: string,
  ): Promise<DriveFolderResult> {
    const drive = await this.getDriveClient(userId);

    const requestBody: drive_v3.Schema$File = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };

    if (parentFolderId) {
      requestBody.parents = [parentFolderId];
    }

    const response = await withRetry(() =>
      drive.files.create({
        requestBody,
        fields: 'id,name,webViewLink',
      }),
    );

    return {
      folderId: response.data.id!,
      folderName: response.data.name!,
      webViewLink: response.data.webViewLink || '',
    };
  }

  async listFolders(userId: string, parentFolderId?: string): Promise<DriveFolder[]> {
    const drive = await this.getDriveClient(userId);

    let query = "mimeType='application/vnd.google-apps.folder' and trashed=false";
    if (parentFolderId) {
      query += ` and '${parentFolderId}' in parents`;
    } else {
      query += " and 'root' in parents";
    }

    const response = await withRetry(() =>
      drive.files.list({
        q: query,
        fields: 'files(id,name,webViewLink)',
        orderBy: 'name',
        pageSize: 100,
      }),
    );

    return (response.data.files || []).map((file) => ({
      id: file.id!,
      name: file.name!,
      webViewLink: file.webViewLink || '',
    }));
  }
}
