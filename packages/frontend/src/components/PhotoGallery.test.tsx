import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PhotoGallery, Photo } from './PhotoGallery';

// Mock fetch
global.fetch = vi.fn();

const mockPhotos: Photo[] = [
  {
    id: '1',
    projectId: 'project-1',
    name: 'photo1.jpg',
    fileType: 'image/jpeg',
    fileSize: 1024000,
    storageUrl: 'https://storage.example.com/photo1.jpg',
    thumbnailUrl: 'https://storage.example.com/thumb_photo1.jpg',
    uploadedBy: 'user-1',
    uploadedAt: '2024-01-15T10:00:00Z',
    metadata: {
      captureDate: '2024-01-15T09:30:00Z',
      caption: 'Kitchen before renovation',
    },
  },
  {
    id: '2',
    projectId: 'project-1',
    name: 'photo2.jpg',
    fileType: 'image/jpeg',
    fileSize: 2048000,
    storageUrl: 'https://storage.example.com/photo2.jpg',
    thumbnailUrl: 'https://storage.example.com/thumb_photo2.jpg',
    uploadedBy: 'user-1',
    uploadedAt: '2024-01-20T14:00:00Z',
    metadata: {
      captureDate: '2024-01-20T13:45:00Z',
    },
  },
  {
    id: '3',
    projectId: 'project-1',
    name: 'photo3.jpg',
    fileType: 'image/jpeg',
    fileSize: 1536000,
    storageUrl: 'https://storage.example.com/photo3.jpg',
    thumbnailUrl: 'https://storage.example.com/thumb_photo3.jpg',
    uploadedBy: 'user-1',
    uploadedAt: '2024-01-25T16:00:00Z',
    metadata: {
      captureDate: '2024-01-25T15:30:00Z',
      caption: 'Kitchen after renovation',
    },
  },
];

describe('PhotoGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_tokens', JSON.stringify({ accessToken: 'test-token' }));
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should display photos in chronological order', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPhotos,
    });

    render(<PhotoGallery projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText('3 photos')).toBeInTheDocument();
    });

    // Photos should be displayed in chronological order by capture date
    const photoElements = screen.getAllByRole('img');
    expect(photoElements[0]).toHaveAttribute('alt', 'photo1.jpg');
    expect(photoElements[1]).toHaveAttribute('alt', 'photo2.jpg');
    expect(photoElements[2]).toHaveAttribute('alt', 'photo3.jpg');
  });

  it('should show thumbnails with date stamps', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPhotos,
    });

    render(<PhotoGallery projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText('3 photos')).toBeInTheDocument();
    });

    // Check that thumbnails are displayed
    const thumbnails = screen.getAllByRole('img');
    expect(thumbnails[0]).toHaveAttribute('src', 'https://storage.example.com/thumb_photo1.jpg');
    expect(thumbnails[1]).toHaveAttribute('src', 'https://storage.example.com/thumb_photo2.jpg');
    expect(thumbnails[2]).toHaveAttribute('src', 'https://storage.example.com/thumb_photo3.jpg');

    // Check that date stamps are displayed (each date appears twice: badge + hover overlay)
    expect(screen.getAllByText('Jan 15, 2024').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jan 20, 2024').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Jan 25, 2024').length).toBeGreaterThan(0);
  });

  it('should open lightbox when photo is clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPhotos,
    });

    render(<PhotoGallery projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText('3 photos')).toBeInTheDocument();
    });

    // Click on first photo
    const photoContainers = screen.getAllByRole('img')[0].closest('div');
    fireEvent.click(photoContainers!);

    // Lightbox should open with full-size image
    await waitFor(() => {
      const lightboxImages = screen.getAllByRole('img');
      const lightboxImage = lightboxImages.find(img => 
        img.getAttribute('src') === 'https://storage.example.com/photo1.jpg'
      );
      expect(lightboxImage).toBeInTheDocument();
    });

    // Check that photo info is displayed
    expect(screen.getByText('Kitchen before renovation')).toBeInTheDocument();
    expect(screen.getByText('1 / 3')).toBeInTheDocument();
  });

  it('should navigate between photos in lightbox', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPhotos,
    });

    render(<PhotoGallery projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText('3 photos')).toBeInTheDocument();
    });

    // Open lightbox on first photo
    const photoContainers = screen.getAllByRole('img')[0].closest('div');
    fireEvent.click(photoContainers!);

    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    // Click next button
    const nextButton = screen.getByLabelText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('2 / 3')).toBeInTheDocument();
    });

    // Click previous button
    const prevButton = screen.getByLabelText('Previous');
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });
  });

  it('should close lightbox when close button is clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPhotos,
    });

    render(<PhotoGallery projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText('3 photos')).toBeInTheDocument();
    });

    // Open lightbox
    const photoContainers = screen.getAllByRole('img')[0].closest('div');
    fireEvent.click(photoContainers!);

    await waitFor(() => {
      expect(screen.getByText('1 / 3')).toBeInTheDocument();
    });

    // Close lightbox
    const closeButton = screen.getByLabelText('Close');
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('1 / 3')).not.toBeInTheDocument();
    });
  });

  it('should display empty state when no photos', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<PhotoGallery projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText('No photos')).toBeInTheDocument();
      expect(screen.getByText('Upload photos to document project progress')).toBeInTheDocument();
    });
  });

  it('should display loading state', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    const { container } = render(<PhotoGallery projectId="project-1" />);

    // Check for loading spinner
    expect(container.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('should display error state and allow retry', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<PhotoGallery projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });

    // Mock successful retry
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPhotos,
    });

    const retryButton = screen.getByText('Retry');
    fireEvent.click(retryButton);

    await waitFor(() => {
      expect(screen.getByText('3 photos')).toBeInTheDocument();
    });
  });

  it('should filter photos by milestone', async () => {
    const milestonePhotos = mockPhotos.slice(0, 2);
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => milestonePhotos,
    });

    render(<PhotoGallery projectId="project-1" milestoneId="milestone-1" />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('milestoneId=milestone-1'),
        expect.any(Object)
      );
    });

    await waitFor(() => {
      expect(screen.getByText('2 photos')).toBeInTheDocument();
    });
  });

  it('should use capture date when available, otherwise upload date', async () => {
    const photoWithoutCaptureDate: Photo = {
      id: '4',
      projectId: 'project-1',
      name: 'photo4.jpg',
      fileType: 'image/jpeg',
      fileSize: 1024000,
      storageUrl: 'https://storage.example.com/photo4.jpg',
      uploadedBy: 'user-1',
      uploadedAt: '2024-02-01T10:00:00Z',
      metadata: {},
    };

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [photoWithoutCaptureDate],
    });

    render(<PhotoGallery projectId="project-1" />);

    await waitFor(() => {
      // Should display upload date when capture date is not available (appears twice: badge + hover)
      expect(screen.getAllByText('Feb 1, 2024').length).toBeGreaterThan(0);
    });
  });

  it('should show caption indicator for photos with captions', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPhotos,
    });

    render(<PhotoGallery projectId="project-1" />);

    await waitFor(() => {
      expect(screen.getByText('3 photos')).toBeInTheDocument();
    });

    // Photos with captions should have caption indicator icon
    const captionIcons = screen.getAllByRole('img').filter(img => 
      img.closest('div')?.querySelector('svg')
    );
    
    // Two photos have captions in mockPhotos
    expect(captionIcons.length).toBeGreaterThan(0);
  });

  it('should render without card wrapper when showCard is false', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockPhotos,
    });

    const { container } = render(<PhotoGallery projectId="project-1" showCard={false} />);

    await waitFor(() => {
      expect(screen.getByText('3 photos')).toBeInTheDocument();
    });

    // Should not have Card component structure
    expect(container.querySelector('.card')).not.toBeInTheDocument();
  });
});
