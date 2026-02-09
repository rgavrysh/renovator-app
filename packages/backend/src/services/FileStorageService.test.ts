import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { FileStorageService } from './FileStorageService';
import * as fs from 'fs';
import * as path from 'path';

describe('FileStorageService', () => {
  let service: FileStorageService;
  let testStoragePath: string;

  beforeEach(() => {
    // Create a temporary test storage directory
    testStoragePath = path.join(process.cwd(), 'test-uploads');
    service = new FileStorageService(testStoragePath, 'http://localhost:4000/files');
  });

  afterEach(() => {
    // Clean up test storage directory
    if (fs.existsSync(testStoragePath)) {
      const files = fs.readdirSync(testStoragePath);
      files.forEach((file) => {
        fs.unlinkSync(path.join(testStoragePath, file));
      });
      fs.rmdirSync(testStoragePath);
    }
  });

  describe('uploadFile', () => {
    test('should upload a file and return storage URL', async () => {
      const fileBuffer = Buffer.from('test file content');
      const fileName = 'test-document.pdf';
      const fileType = 'application/pdf';

      const result = await service.uploadFile(fileBuffer, fileName, fileType);

      expect(result.storageUrl).toContain('http://localhost:4000/files/');
      expect(result.storageUrl).toContain('test-document.pdf');
      expect(result.fileSize).toBe(fileBuffer.length);
      expect(result.fileType).toBe(fileType);
    });

    test('should create unique storage URLs for same file name', async () => {
      const fileBuffer = Buffer.from('test content');
      const fileName = 'duplicate.pdf';
      const fileType = 'application/pdf';

      const result1 = await service.uploadFile(fileBuffer, fileName, fileType);
      const result2 = await service.uploadFile(fileBuffer, fileName, fileType);

      expect(result1.storageUrl).not.toBe(result2.storageUrl);
    });

    test('should handle files with special characters in name', async () => {
      const fileBuffer = Buffer.from('test content');
      const fileName = 'test file (1) @#$.pdf';
      const fileType = 'application/pdf';

      const result = await service.uploadFile(fileBuffer, fileName, fileType);

      expect(result.storageUrl).toBeDefined();
      expect(result.fileSize).toBe(fileBuffer.length);
    });

    test('should store file content correctly', async () => {
      const fileContent = 'test file content with special chars: 你好';
      const fileBuffer = Buffer.from(fileContent);
      const fileName = 'test.txt';
      const fileType = 'text/plain';

      const result = await service.uploadFile(fileBuffer, fileName, fileType);
      const storedContent = await service.readFile(result.storageUrl);

      expect(storedContent.toString()).toBe(fileContent);
    });
  });

  describe('deleteFile', () => {
    test('should delete an uploaded file', async () => {
      const fileBuffer = Buffer.from('test content');
      const fileName = 'to-delete.pdf';
      const fileType = 'application/pdf';

      const result = await service.uploadFile(fileBuffer, fileName, fileType);
      
      // Verify file exists
      const existsBefore = await service.fileExists(result.storageUrl);
      expect(existsBefore).toBe(true);

      // Delete file
      await service.deleteFile(result.storageUrl);

      // Verify file no longer exists
      const existsAfter = await service.fileExists(result.storageUrl);
      expect(existsAfter).toBe(false);
    });

    test('should not throw error when deleting non-existent file', async () => {
      const fakeUrl = 'http://localhost:4000/files/non-existent-file.pdf';

      await expect(service.deleteFile(fakeUrl)).resolves.not.toThrow();
    });
  });

  describe('generatePresignedUploadUrl', () => {
    test('should generate presigned upload URL with token', () => {
      const fileName = 'upload-test.pdf';
      const fileType = 'application/pdf';

      const result = service.generatePresignedUploadUrl(fileName, fileType);

      expect(result.url).toContain('http://localhost:4000/files/upload');
      expect(result.url).toContain('key=');
      expect(result.url).toContain('token=');
      expect(result.url).toContain('expires=');
      expect(result.expiresAt).toBeInstanceOf(Date);
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    test('should generate URL with custom expiration time', () => {
      const fileName = 'test.pdf';
      const fileType = 'application/pdf';
      const expiresInSeconds = 7200; // 2 hours

      const result = service.generatePresignedUploadUrl(fileName, fileType, expiresInSeconds);

      const expectedExpiration = Date.now() + expiresInSeconds * 1000;
      const actualExpiration = result.expiresAt.getTime();
      
      // Allow 1 second tolerance for test execution time
      expect(Math.abs(actualExpiration - expectedExpiration)).toBeLessThan(1000);
    });

    test('should generate unique URLs for same file name', () => {
      const fileName = 'test.pdf';
      const fileType = 'application/pdf';

      const result1 = service.generatePresignedUploadUrl(fileName, fileType);
      const result2 = service.generatePresignedUploadUrl(fileName, fileType);

      expect(result1.url).not.toBe(result2.url);
    });
  });

  describe('generatePresignedDownloadUrl', () => {
    test('should generate presigned download URL', async () => {
      const fileBuffer = Buffer.from('test content');
      const fileName = 'download-test.pdf';
      const fileType = 'application/pdf';

      const uploadResult = await service.uploadFile(fileBuffer, fileName, fileType);
      const downloadResult = service.generatePresignedDownloadUrl(uploadResult.storageUrl);

      expect(downloadResult.url).toContain('http://localhost:4000/files/download/');
      expect(downloadResult.url).toContain('token=');
      expect(downloadResult.url).toContain('expires=');
      expect(downloadResult.expiresAt).toBeInstanceOf(Date);
      expect(downloadResult.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });

    test('should generate URL with custom expiration time', async () => {
      const fileBuffer = Buffer.from('test content');
      const uploadResult = await service.uploadFile(fileBuffer, 'test.pdf', 'application/pdf');
      const expiresInSeconds = 1800; // 30 minutes

      const result = service.generatePresignedDownloadUrl(uploadResult.storageUrl, expiresInSeconds);

      const expectedExpiration = Date.now() + expiresInSeconds * 1000;
      const actualExpiration = result.expiresAt.getTime();
      
      expect(Math.abs(actualExpiration - expectedExpiration)).toBeLessThan(1000);
    });
  });

  describe('validatePresignedUrl', () => {
    test('should validate a valid presigned URL', () => {
      const fileName = 'test.pdf';
      const fileType = 'application/pdf';

      const presignedUrl = service.generatePresignedUploadUrl(fileName, fileType);
      
      // Extract parameters from URL
      const url = new URL(presignedUrl.url);
      const fileKey = url.searchParams.get('key')!;
      const token = url.searchParams.get('token')!;
      const expires = parseInt(url.searchParams.get('expires')!);

      const isValid = service.validatePresignedUrl(fileKey, token, expires);

      expect(isValid).toBe(true);
    });

    test('should reject expired presigned URL', () => {
      const fileKey = 'test-file.pdf';
      const token = 'some-token';
      const expires = Date.now() - 1000; // Expired 1 second ago

      const isValid = service.validatePresignedUrl(fileKey, token, expires);

      expect(isValid).toBe(false);
    });

    test('should reject presigned URL with invalid token', () => {
      const fileName = 'test.pdf';
      const fileType = 'application/pdf';

      const presignedUrl = service.generatePresignedUploadUrl(fileName, fileType);
      
      const url = new URL(presignedUrl.url);
      const fileKey = url.searchParams.get('key')!;
      const expires = parseInt(url.searchParams.get('expires')!);
      const invalidToken = 'invalid-token';

      const isValid = service.validatePresignedUrl(fileKey, invalidToken, expires);

      expect(isValid).toBe(false);
    });
  });

  describe('fileExists', () => {
    test('should return true for existing file', async () => {
      const fileBuffer = Buffer.from('test content');
      const result = await service.uploadFile(fileBuffer, 'exists.pdf', 'application/pdf');

      const exists = await service.fileExists(result.storageUrl);

      expect(exists).toBe(true);
    });

    test('should return false for non-existent file', async () => {
      const fakeUrl = 'http://localhost:4000/files/non-existent.pdf';

      const exists = await service.fileExists(fakeUrl);

      expect(exists).toBe(false);
    });
  });

  describe('getFileMetadata', () => {
    test('should return file metadata', async () => {
      const fileBuffer = Buffer.from('test content');
      const fileName = 'metadata-test.pdf';
      const fileType = 'application/pdf';

      const uploadResult = await service.uploadFile(fileBuffer, fileName, fileType);
      const metadata = await service.getFileMetadata(uploadResult.storageUrl);

      expect(metadata.fileName).toContain('metadata-test.pdf');
      expect(metadata.fileType).toBe('application/pdf');
      expect(metadata.fileSize).toBe(fileBuffer.length);
    });

    test('should detect correct MIME types for different extensions', async () => {
      const testCases = [
        { fileName: 'test.jpg', expectedType: 'image/jpeg' },
        { fileName: 'test.png', expectedType: 'image/png' },
        { fileName: 'test.pdf', expectedType: 'application/pdf' },
        { fileName: 'test.docx', expectedType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
      ];

      for (const testCase of testCases) {
        const fileBuffer = Buffer.from('test');
        const uploadResult = await service.uploadFile(fileBuffer, testCase.fileName, testCase.expectedType);
        const metadata = await service.getFileMetadata(uploadResult.storageUrl);

        expect(metadata.fileType).toBe(testCase.expectedType);
      }
    });
  });

  describe('readFile', () => {
    test('should read file content', async () => {
      const originalContent = 'test file content';
      const fileBuffer = Buffer.from(originalContent);
      const uploadResult = await service.uploadFile(fileBuffer, 'read-test.txt', 'text/plain');

      const content = await service.readFile(uploadResult.storageUrl);

      expect(content.toString()).toBe(originalContent);
    });

    test('should handle binary content', async () => {
      const binaryContent = Buffer.from([0x00, 0x01, 0x02, 0x03, 0xFF]);
      const uploadResult = await service.uploadFile(binaryContent, 'binary.bin', 'application/octet-stream');

      const content = await service.readFile(uploadResult.storageUrl);

      expect(content).toEqual(binaryContent);
    });
  });
});
