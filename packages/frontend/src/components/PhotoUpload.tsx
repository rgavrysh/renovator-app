import React, { useState, useRef } from 'react';
import { Button } from './ui/Button';
import { Select } from './ui/Select';
import { Input } from './ui/Input';
import { Modal, ModalFooter } from './ui/Modal';
import { Milestone } from './MilestoneList';

interface PhotoUploadProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
  milestones?: Milestone[];
}

interface PhotoFile {
  file: File;
  preview: string;
  captureDate: Date | null;
  caption: string;
}

const ALLOWED_PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.heic'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_BATCH_SIZE = 20; // Maximum 20 photos per batch

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
  milestones = [],
}) => {
  const [selectedPhotos, setSelectedPhotos] = useState<PhotoFile[]>([]);
  const [milestoneId, setMilestoneId] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const extractCaptureDate = async (file: File): Promise<Date | null> => {
    // Try to extract EXIF data from the file
    // For now, we'll use the file's lastModified date as a fallback
    // In a production app, you'd use a library like exif-js or piexifjs
    return new Date(file.lastModified);
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `File ${file.name} exceeds maximum size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`;
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    const hasValidExtension = ALLOWED_PHOTO_EXTENSIONS.some(ext => fileName.endsWith(ext));
    
    if (!hasValidExtension) {
      return `Invalid file format for ${file.name}. Allowed formats: ${ALLOWED_PHOTO_EXTENSIONS.join(', ')}`;
    }

    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
  };

  const processFiles = async (files: File[]) => {
    setValidationError(null);
    
    if (files.length === 0) return;

    // Check batch size limit
    if (selectedPhotos.length + files.length > MAX_BATCH_SIZE) {
      setValidationError(`Maximum ${MAX_BATCH_SIZE} photos allowed per batch`);
      return;
    }

    // Validate all files
    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        setValidationError(error);
        return;
      }
    }

    // Process files and extract metadata
    const photoFiles: PhotoFile[] = [];
    
    for (const file of files) {
      const preview = URL.createObjectURL(file);
      const captureDate = await extractCaptureDate(file);
      
      photoFiles.push({
        file,
        preview,
        captureDate,
        caption: '',
      });
    }

    setSelectedPhotos(prev => [...prev, ...photoFiles]);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = Array.from(e.dataTransfer.files);
    await processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

  const updateCaption = (index: number, caption: string) => {
    setSelectedPhotos(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], caption };
      return updated;
    });
  };

  const handleUpload = async () => {
    if (selectedPhotos.length === 0) {
      setValidationError('Please select at least one photo to upload');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      
      // Add all photo files
      selectedPhotos.forEach((photo, index) => {
        formData.append('files', photo.file);
        
        // Add metadata for each photo
        if (photo.caption.trim()) {
          formData.append(`captions[${index}]`, photo.caption.trim());
        }
        
        if (photo.captureDate) {
          formData.append(`captureDates[${index}]`, photo.captureDate.toISOString());
        }
      });
      
      // Add milestone association if selected
      if (milestoneId) {
        formData.append('milestoneId', milestoneId);
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
          setError(response.error || 'Failed to upload photos');
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
      xhr.open('POST', `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/photos`);
      
      if (accessToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
      }
      
      xhr.send(formData);
    } catch (err: any) {
      console.error('Error uploading photos:', err);
      setError(err.message || 'Failed to upload photos');
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    if (!isUploading) {
      // Clean up preview URLs
      selectedPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
      
      setSelectedPhotos([]);
      setMilestoneId('');
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

  const formatDate = (date: Date | null): string => {
    if (!date) return 'Unknown date';
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const milestoneOptions = [
    { value: '', label: 'No milestone' },
    ...milestones.map(m => ({
      value: m.id,
      label: m.name,
    })),
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Upload Photos"
      size="lg"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-linear">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* File picker area */}
        <div>
          <label htmlFor="photo-file-input" className="block text-sm font-medium text-gray-700 mb-1.5">
            Select Photos
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
              id="photo-file-input"
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept={ALLOWED_PHOTO_EXTENSIONS.join(',')}
              multiple
              className="hidden"
              disabled={isUploading}
            />
            
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
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <div>
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-primary-600">Click to browse</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supported formats: JPG, PNG, HEIC
                </p>
                <p className="text-xs text-gray-500">
                  Maximum {MAX_BATCH_SIZE} photos per batch, 50MB per file
                </p>
              </div>
            </div>
          </div>
          {validationError && (
            <p className="mt-1.5 text-sm text-red-600">{validationError}</p>
          )}
        </div>

        {/* Selected photos preview */}
        {selectedPhotos.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">
                Selected Photos ({selectedPhotos.length})
              </h4>
              {!isUploading && (
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    selectedPhotos.forEach(photo => URL.revokeObjectURL(photo.preview));
                    setSelectedPhotos([]);
                  }}
                >
                  Clear All
                </Button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 border border-gray-200 rounded-linear p-3">
              {selectedPhotos.map((photo, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-2 bg-white border border-gray-200 rounded-linear"
                >
                  {/* Thumbnail */}
                  <img
                    src={photo.preview}
                    alt={photo.file.name}
                    className="w-16 h-16 object-cover rounded flex-shrink-0"
                  />

                  {/* Photo details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {photo.file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {(photo.file.size / 1024).toFixed(2)} KB
                      </p>
                      <p className="text-xs text-gray-500">
                        Captured: {formatDate(photo.captureDate)}
                      </p>
                    </div>

                    {/* Caption input */}
                    <Input
                      value={photo.caption}
                      onChange={(e) => updateCaption(index, e.target.value)}
                      placeholder="Add a caption..."
                      size="sm"
                      fullWidth
                      disabled={isUploading}
                    />
                  </div>

                  {/* Remove button */}
                  {!isUploading && (
                    <button
                      onClick={() => removePhoto(index)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                      title="Remove photo"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload progress */}
        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Uploading {selectedPhotos.length} photos...</span>
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

        {/* Milestone association */}
        <Select
          label="Associate with Milestone (Optional)"
          value={milestoneId}
          onChange={(e) => setMilestoneId(e.target.value)}
          options={milestoneOptions}
          fullWidth
          disabled={isUploading}
          helperText="Link these photos to a specific project milestone"
        />
      </div>

      <ModalFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={isUploading}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="primary"
          onClick={handleUpload}
          disabled={selectedPhotos.length === 0 || isUploading}
          loading={isUploading}
        >
          Upload {selectedPhotos.length > 0 && `(${selectedPhotos.length})`}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
