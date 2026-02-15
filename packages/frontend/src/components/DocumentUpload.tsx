import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Modal, ModalFooter } from './ui/Modal';
import { useTranslation } from 'react-i18next';

export enum DocumentType {
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  PHOTO = 'photo',
  PERMIT = 'permit',
  WARRANTY = 'warranty',
  OTHER = 'other',
}

interface DocumentUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.heic', '.doc', '.docx', '.xls', '.xlsx'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

export const DocumentUpload: React.FC<DocumentUploadProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
}) => {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>(DocumentType.OTHER);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return `Invalid file format. Allowed formats: ${ALLOWED_EXTENSIONS.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setValidationError(null);
    
    if (file) {
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        setSelectedFile(file);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files?.[0];
    setValidationError(null);
    
    if (file) {
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        setSelectedFile(null);
      } else {
        setSelectedFile(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setValidationError(t('documentUpload.selectFile'));
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', documentType);
      
      if (description.trim()) {
        formData.append('description', description.trim());
      }
      
      if (tags.trim()) {
        const tagArray = tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        formData.append('tags', JSON.stringify(tagArray));
      }

      // Get access token
      const authTokens = localStorage.getItem('auth_tokens');
      const accessToken = authTokens ? JSON.parse(authTokens).accessToken : null;

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percentComplete);
        }
      });

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 201) {
          setUploadProgress(100);
          onSuccess();
          handleClose();
        } else {
          const response = JSON.parse(xhr.responseText);
          setError(response.error || 'Failed to upload document');
          setIsUploading(false);
        }
      });

      // Handle errors
      xhr.addEventListener('error', () => {
        setError('Network error occurred during upload');
        setIsUploading(false);
      });

      xhr.addEventListener('abort', () => {
        setError('Upload was cancelled');
        setIsUploading(false);
      });

      // Send request
      xhr.open('POST', `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/documents`);
      
      if (accessToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      }
      
      xhr.send(formData);
    } catch (err: any) {
      console.error('Error uploading document:', err);
      setError(err.message || 'Failed to upload document');
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setDocumentType(DocumentType.OTHER);
      setDescription('');
      setTags('');
      setUploadProgress(0);
      setError(null);
      setValidationError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      onClose();
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const documentTypeOptions = [
    { value: DocumentType.CONTRACT, label: t('documentType.contract') },
    { value: DocumentType.INVOICE, label: t('documentType.invoice') },
    { value: DocumentType.RECEIPT, label: t('documentType.receipt') },
    { value: DocumentType.PHOTO, label: t('documentType.photo') },
    { value: DocumentType.PERMIT, label: t('documentType.permit') },
    { value: DocumentType.WARRANTY, label: t('documentType.warranty') },
    { value: DocumentType.OTHER, label: t('documentType.other') },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={t('documentUpload.title')}
      size="md"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-linear">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* File picker area */}
        <div>
          <label htmlFor="document-file-input" className="block text-sm font-medium text-gray-700 mb-1.5">
            {t('documentUpload.documentFile')}
          </label>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`
              border-2 border-dashed rounded-linear p-6 text-center
              transition-colors duration-150
              ${validationError 
                ? 'border-red-300 bg-red-50' 
                : 'border-gray-300 hover:border-primary-400 bg-gray-50'
              }
              ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            `}
            onClick={handleBrowseClick}
          >
            <input
              id="document-file-input"
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept={ALLOWED_EXTENSIONS.join(',')}
              className="hidden"
              disabled={isUploading}
            />
            
            {selectedFile ? (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(2)} KB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
                <div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-primary-600">{t('documentUpload.clickToBrowse')}</span> {t('documentUpload.orDragDrop')}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {t('documentUpload.supportedFormats')}
                  </p>
                  <p className="text-xs text-gray-500">
                    {t('documentUpload.maxFileSize')}
                  </p>
                </div>
              </div>
            )}
          </div>
          {validationError && (
            <p className="mt-1.5 text-sm text-red-600">{validationError}</p>
          )}
        </div>

        {/* Upload progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">{t('common.uploading')}</span>
              <span className="font-medium text-gray-900">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-primary-600 h-2 transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Document type */}
        <Select
          label={t('documentUpload.documentType')}
          value={documentType}
          onChange={(e) => setDocumentType(e.target.value as DocumentType)}
          options={documentTypeOptions}
          fullWidth
          required
          disabled={isUploading}
        />

        {/* Description */}
        <Textarea
          label={t('common.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={t('documentUpload.descriptionPlaceholder')}
          rows={3}
          fullWidth
          disabled={isUploading}
        />

        {/* Tags */}
        <Input
          label={t('documentUpload.tags')}
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder={t('documentUpload.tagsPlaceholder')}
          helperText={t('documentUpload.tagsHelper')}
          fullWidth
          disabled={isUploading}
        />
      </div>

      <ModalFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={isUploading}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          loading={isUploading}
        >
          {t('documentUpload.upload')}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
