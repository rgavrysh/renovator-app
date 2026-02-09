# File Storage Service

The `FileStorageService` provides a unified interface for file upload, deletion, and presigned URL generation. This implementation uses local file storage to simulate cloud storage (like AWS S3) and can be easily migrated to actual cloud storage later.

## Features

- **File Upload**: Upload files with automatic unique key generation
- **File Deletion**: Delete files from storage
- **Presigned URLs**: Generate time-limited URLs for secure file upload and download
- **File Validation**: Check file existence and retrieve metadata
- **MIME Type Detection**: Automatic MIME type detection from file extensions

## Configuration

Add the following environment variables to your `.env` file:

```env
FILE_STORAGE_BASE_URL=http://localhost:4000/files
FILE_STORAGE_SECRET=change-this-secret-in-production
FILE_STORAGE_PATH=./uploads
```

## Usage

### Initialize the Service

```typescript
import { FileStorageService } from './services/FileStorageService';

const fileStorage = new FileStorageService();
```

### Upload a File

```typescript
const fileBuffer = Buffer.from(fileContent);
const result = await fileStorage.uploadFile(
  fileBuffer,
  'document.pdf',
  'application/pdf'
);

console.log(result.storageUrl); // http://localhost:4000/files/1234567890-abc123-document.pdf
console.log(result.fileSize);   // File size in bytes
console.log(result.fileType);   // application/pdf
```

### Delete a File

```typescript
await fileStorage.deleteFile(storageUrl);
```

### Generate Presigned Upload URL

Presigned upload URLs allow clients to upload files directly to storage without going through your backend:

```typescript
const result = fileStorage.generatePresignedUploadUrl(
  'document.pdf',
  'application/pdf',
  3600 // Expires in 1 hour
);

console.log(result.url);       // Presigned URL with token
console.log(result.expiresAt); // Expiration timestamp
```

### Generate Presigned Download URL

Presigned download URLs provide temporary access to files:

```typescript
const result = fileStorage.generatePresignedDownloadUrl(
  storageUrl,
  3600 // Expires in 1 hour
);

console.log(result.url);       // Presigned URL with token
console.log(result.expiresAt); // Expiration timestamp
```

### Validate Presigned URL

```typescript
const isValid = fileStorage.validatePresignedUrl(fileKey, token, expiresAt);
```

### Check File Existence

```typescript
const exists = await fileStorage.fileExists(storageUrl);
```

### Get File Metadata

```typescript
const metadata = await fileStorage.getFileMetadata(storageUrl);

console.log(metadata.fileName);  // File name
console.log(metadata.fileType);  // MIME type
console.log(metadata.fileSize);  // Size in bytes
```

### Read File Content

```typescript
const content = await fileStorage.readFile(storageUrl);
```

## Supported File Types

The service supports the following file formats (as per Requirements 5.1):

- **Documents**: PDF, DOC, DOCX, XLS, XLSX
- **Images**: JPG, JPEG, PNG, HEIC

## Security

- All presigned URLs include a cryptographic signature token
- URLs expire after a configurable time period (default: 1 hour)
- File keys are generated with random components to prevent guessing
- The signature secret should be changed in production

## Migration to Cloud Storage

This implementation is designed to be easily replaced with cloud storage (AWS S3, Google Cloud Storage, etc.):

1. Replace the `uploadFile` method to use cloud storage SDK
2. Replace the `deleteFile` method to use cloud storage SDK
3. Update `generatePresignedUploadUrl` to use cloud provider's presigned URL generation
4. Update `generatePresignedDownloadUrl` to use cloud provider's presigned URL generation
5. Remove local file system operations

The interface remains the same, so no changes are needed in consuming code.

## Testing

Run the test suite:

```bash
npm test -- FileStorageService.test.ts
```

The tests cover:
- File upload with various file types and names
- File deletion
- Presigned URL generation and validation
- File existence checks
- Metadata retrieval
- File content reading
