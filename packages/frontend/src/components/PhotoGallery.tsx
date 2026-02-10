import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { EmptyState } from './ui/EmptyState';
import { Button } from './ui/Button';

export interface Photo {
  id: string;
  projectId: string;
  name: string;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
  metadata?: {
    captureDate?: string;
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
  };
}

export interface PhotoGalleryProps {
  projectId: string;
  showCard?: boolean;
  className?: string;
  milestoneId?: string;
}

export const PhotoGallery: React.FC<PhotoGalleryProps> = ({
  projectId,
  showCard = true,
  className = '',
  milestoneId,
}) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchPhotos();
  }, [projectId, milestoneId]);

  const fetchPhotos = async () => {
    try {
      setLoading(true);
      setError(null);

      const authTokens = localStorage.getItem('auth_tokens');
      const accessToken = authTokens ? JSON.parse(authTokens).accessToken : null;

      let endpoint = `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/photos`;
      
      if (milestoneId) {
        endpoint += `?milestoneId=${milestoneId}`;
      }

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch photos');
      }

      const data = await response.json();
      setPhotos(data);
    } catch (err: any) {
      console.error('Error fetching photos:', err);
      setError(err.message || 'Failed to fetch photos');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const openLightbox = (index: number) => {
    setSelectedPhotoIndex(index);
  };

  const closeLightbox = () => {
    setSelectedPhotoIndex(null);
  };

  const goToPrevious = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex > 0) {
      setSelectedPhotoIndex(selectedPhotoIndex - 1);
    }
  };

  const goToNext = () => {
    if (selectedPhotoIndex !== null && selectedPhotoIndex < photos.length - 1) {
      setSelectedPhotoIndex(selectedPhotoIndex + 1);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (selectedPhotoIndex === null) return;

    switch (e.key) {
      case 'Escape':
        closeLightbox();
        break;
      case 'ArrowLeft':
        goToPrevious();
        break;
      case 'ArrowRight':
        goToNext();
        break;
    }
  };

  useEffect(() => {
    if (selectedPhotoIndex !== null) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [selectedPhotoIndex]);

  const renderLightbox = () => {
    if (selectedPhotoIndex === null) return null;

    const photo = photos[selectedPhotoIndex];
    const captureDate = photo.metadata?.captureDate 
      ? formatDate(photo.metadata.captureDate)
      : formatDate(photo.uploadedAt);

    return (
      <div
        className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
        onClick={closeLightbox}
      >
        {/* Close button */}
        <button
          onClick={closeLightbox}
          className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
          aria-label="Close"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Previous button */}
        {selectedPhotoIndex > 0 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
            className="absolute left-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Previous"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}

        {/* Next button */}
        {selectedPhotoIndex < photos.length - 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
            className="absolute right-4 text-white hover:text-gray-300 transition-colors z-10"
            aria-label="Next"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Image container */}
        <div
          className="max-w-7xl max-h-[90vh] flex flex-col items-center"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={photo.storageUrl}
            alt={photo.name}
            className="max-w-full max-h-[80vh] object-contain"
          />

          {/* Photo info */}
          <div className="mt-4 text-center text-white space-y-2">
            <p className="text-lg font-medium">{photo.name}</p>
            <p className="text-sm text-gray-300">{captureDate}</p>
            {photo.metadata?.caption && (
              <p className="text-sm text-gray-300 max-w-2xl">{photo.metadata.caption}</p>
            )}
            <p className="text-xs text-gray-400">
              {selectedPhotoIndex + 1} / {photos.length}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-linear">
          <p className="text-sm text-red-600">{error}</p>
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchPhotos}
            className="mt-3"
          >
            Retry
          </Button>
        </div>
      );
    }

    if (photos.length === 0) {
      return (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          title="No photos"
          description="Upload photos to document project progress"
        />
      );
    }

    return (
      <div className="space-y-4">
        {/* Photo count */}
        <div className="text-sm text-gray-500">
          {photos.length} {photos.length === 1 ? 'photo' : 'photos'}
        </div>

        {/* Photo grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {photos.map((photo, index) => {
            const captureDate = photo.metadata?.captureDate 
              ? formatDate(photo.metadata.captureDate)
              : formatDate(photo.uploadedAt);

            return (
              <div
                key={photo.id}
                className="group relative aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => openLightbox(index)}
              >
                {/* Thumbnail */}
                <img
                  src={photo.thumbnailUrl || photo.storageUrl}
                  alt={photo.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />

                {/* Overlay with date stamp */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-xs font-medium truncate">
                      {photo.name}
                    </p>
                    <p className="text-white text-xs opacity-90 mt-1">
                      {captureDate}
                    </p>
                  </div>
                </div>

                {/* Date stamp badge (always visible) */}
                <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {captureDate}
                </div>

                {/* Caption indicator */}
                {photo.metadata?.caption && (
                  <div className="absolute top-2 right-2 bg-black/70 text-white p-1 rounded">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const content = (
    <>
      {renderContent()}
      {renderLightbox()}
    </>
  );

  if (showCard) {
    return (
      <Card className={className}>
        <CardHeader title="Photos" />
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return <div className={className}>{content}</div>;
};
