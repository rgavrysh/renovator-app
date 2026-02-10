import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PhotoUpload } from './PhotoUpload';
import { MilestoneStatus } from './MilestoneList';

describe('PhotoUpload', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const projectId = 'project-123';

  const mockMilestones = [
    {
      id: 'milestone-1',
      projectId: 'project-123',
      name: 'Foundation',
      description: 'Foundation work',
      targetDate: '2024-06-01',
      status: MilestoneStatus.IN_PROGRESS,
      order: 1,
      createdAt: '2024-05-01T00:00:00Z',
      updatedAt: '2024-05-01T00:00:00Z',
    },
    {
      id: 'milestone-2',
      projectId: 'project-123',
      name: 'Framing',
      description: 'Framing work',
      targetDate: '2024-07-01',
      status: MilestoneStatus.NOT_STARTED,
      order: 2,
      createdAt: '2024-05-01T00:00:00Z',
      updatedAt: '2024-05-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders upload modal when open', () => {
    render(
      <PhotoUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    expect(screen.getByText('Upload Photos')).toBeInTheDocument();
    expect(screen.getByText(/Click to browse/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <PhotoUpload
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    expect(screen.queryByText('Upload Photos')).not.toBeInTheDocument();
  });

  it('displays milestone options when provided', () => {
    render(
      <PhotoUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
        milestones={mockMilestones}
      />
    );

    const milestoneSelect = screen.getByLabelText(/Associate with Milestone/);
    expect(milestoneSelect).toBeInTheDocument();

    // Check that milestone options are available
    const options = screen.getAllByRole('option');
    expect(options.length).toBeGreaterThan(0);
  });

  it('allows file selection via input', async () => {
    render(
      <PhotoUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const file = new File(['photo content'], 'test-photo.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Select Photos') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test-photo.jpg')).toBeInTheDocument();
    });
  });

  it('displays selected photos with preview', async () => {
    render(
      <PhotoUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const file = new File(['photo content'], 'vacation.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Select Photos') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('vacation.jpg')).toBeInTheDocument();
      expect(screen.getByText(/Selected Photos \(1\)/)).toBeInTheDocument();
    });
  });

  it('allows multiple photo selection', async () => {
    render(
      <PhotoUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const file1 = new File(['photo 1'], 'photo1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['photo 2'], 'photo2.png', { type: 'image/png' });
    const input = screen.getByLabelText('Select Photos') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file1, file2] } });

    await waitFor(() => {
      expect(screen.getByText('photo1.jpg')).toBeInTheDocument();
      expect(screen.getByText('photo2.png')).toBeInTheDocument();
      expect(screen.getByText(/Selected Photos \(2\)/)).toBeInTheDocument();
    });
  });

  it('allows adding captions to photos', async () => {
    render(
      <PhotoUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const file = new File(['photo content'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Select Photos') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });

    const captionInput = screen.getByPlaceholderText('Add a caption...');
    fireEvent.change(captionInput, { target: { value: 'Beautiful sunset' } });

    expect(captionInput).toHaveValue('Beautiful sunset');
  });

  it('displays capture date for photos', async () => {
    render(
      <PhotoUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const file = new File(['photo content'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Select Photos') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Captured:/)).toBeInTheDocument();
    });
  });

  it('allows removing individual photos', async () => {
    render(
      <PhotoUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const file1 = new File(['photo 1'], 'photo1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['photo 2'], 'photo2.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Select Photos') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file1, file2] } });

    await waitFor(() => {
      expect(screen.getByText('photo1.jpg')).toBeInTheDocument();
      expect(screen.getByText('photo2.jpg')).toBeInTheDocument();
    });

    // Click the first remove button
    const removeButtons = screen.getAllByTitle('Remove photo');
    fireEvent.click(removeButtons[0]);

    await waitFor(() => {
      expect(screen.queryByText('photo1.jpg')).not.toBeInTheDocument();
      expect(screen.getByText('photo2.jpg')).toBeInTheDocument();
      expect(screen.getByText(/Selected Photos \(1\)/)).toBeInTheDocument();
    });
  });

  it('allows clearing all photos', async () => {
    render(
      <PhotoUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const file1 = new File(['photo 1'], 'photo1.jpg', { type: 'image/jpeg' });
    const file2 = new File(['photo 2'], 'photo2.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Select Photos') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file1, file2] } });

    await waitFor(() => {
      expect(screen.getByText(/Selected Photos \(2\)/)).toBeInTheDocument();
    });

    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.queryByText(/Selected Photos/)).not.toBeInTheDocument();
    });
  });

  it('validates file format', async () => {
    render(
      <PhotoUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const invalidFile = new File(['content'], 'document.pdf', { type: 'application/pdf' });
    const input = screen.getByLabelText('Select Photos') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [invalidFile] } });

    await waitFor(() => {
      expect(screen.getByText(/Invalid file format/)).toBeInTheDocument();
    });
  });

  it('validates maximum batch size', async () => {
    render(
      <PhotoUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    // Create 21 files (exceeds max of 20)
    const files = Array.from({ length: 21 }, (_, i) =>
      new File(['photo'], `photo${i}.jpg`, { type: 'image/jpeg' })
    );

    const input = screen.getByLabelText('Select Photos') as HTMLInputElement;
    fireEvent.change(input, { target: { files } });

    await waitFor(() => {
      expect(screen.getByText(/Maximum 20 photos allowed/)).toBeInTheDocument();
    });
  });

  it('disables upload button when no photos selected', () => {
    render(
      <PhotoUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const uploadButton = screen.getByRole('button', { name: /Upload/ });
    expect(uploadButton).toBeDisabled();
  });

  it('enables upload button when photos are selected', async () => {
    render(
      <PhotoUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Select Photos') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      const uploadButton = screen.getByRole('button', { name: /Upload \(1\)/ });
      expect(uploadButton).not.toBeDisabled();
    });
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <PhotoUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('cleans up preview URLs on close', async () => {
    const { unmount } = render(
      <PhotoUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Select Photos') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });

    const cancelButton = screen.getByRole('button', { name: 'Cancel' });
    fireEvent.click(cancelButton);

    expect(global.URL.revokeObjectURL).toHaveBeenCalled();
  });

  it('uploads photos with milestone association', async () => {
    const mockXHR = {
      open: vi.fn(),
      send: vi.fn(),
      setRequestHeader: vi.fn(),
      upload: {
        addEventListener: vi.fn(),
      },
      addEventListener: vi.fn((event, handler) => {
        if (event === 'load') {
          setTimeout(() => {
            mockXHR.status = 201;
            mockXHR.responseText = JSON.stringify({ success: true });
            handler();
          }, 0);
        }
      }),
      status: 0,
      responseText: '',
    };

    // @ts-ignore
    global.XMLHttpRequest = vi.fn(() => mockXHR);

    render(
      <PhotoUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
        milestones={mockMilestones}
      />
    );

    const file = new File(['photo'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText('Select Photos') as HTMLInputElement;

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });

    // Select milestone
    const milestoneSelect = screen.getByLabelText(/Associate with Milestone/);
    fireEvent.change(milestoneSelect, { target: { value: 'milestone-1' } });

    const uploadButton = screen.getByRole('button', { name: /Upload \(1\)/ });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(mockXHR.open).toHaveBeenCalledWith(
        'POST',
        expect.stringContaining(`/api/projects/${projectId}/photos`)
      );
      expect(mockXHR.send).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });
});
