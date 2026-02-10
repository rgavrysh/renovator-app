import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { DocumentList, DocumentType } from './DocumentList';

// Mock fetch
global.fetch = vi.fn();

describe('DocumentList', () => {
  const mockProjectId = 'project-123';
  const mockDocuments = [
    {
      id: 'doc-1',
      projectId: mockProjectId,
      name: 'Contract.pdf',
      type: DocumentType.CONTRACT,
      fileType: 'application/pdf',
      fileSize: 1024000,
      storageUrl: 'https://storage.example.com/contract.pdf',
      uploadedBy: 'user-1',
      uploadedAt: '2024-01-15T10:00:00Z',
      metadata: {
        description: 'Main project contract',
        tags: ['important', 'legal'],
      },
    },
    {
      id: 'doc-2',
      projectId: mockProjectId,
      name: 'Invoice_001.pdf',
      type: DocumentType.INVOICE,
      fileType: 'application/pdf',
      fileSize: 512000,
      storageUrl: 'https://storage.example.com/invoice.pdf',
      uploadedBy: 'user-1',
      uploadedAt: '2024-01-20T14:30:00Z',
      metadata: {
        description: 'First invoice',
        tags: ['billing'],
      },
    },
    {
      id: 'doc-3',
      projectId: mockProjectId,
      name: 'Photo.jpg',
      type: DocumentType.PHOTO,
      fileType: 'image/jpeg',
      fileSize: 2048000,
      storageUrl: 'https://storage.example.com/photo.jpg',
      uploadedBy: 'user-1',
      uploadedAt: '2024-01-25T09:15:00Z',
      metadata: {
        tags: ['progress'],
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('auth_tokens', JSON.stringify({ accessToken: 'test-token' }));
  });

  it('should render loading state initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    render(<DocumentList projectId={mockProjectId} />);

    // Check for loading spinner
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should fetch and display documents', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments,
    });

    render(<DocumentList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
      expect(screen.getByText('Invoice_001.pdf')).toBeInTheDocument();
      expect(screen.getByText('Photo.jpg')).toBeInTheDocument();
    });

    expect(screen.getByText('3 documents')).toBeInTheDocument();
  });

  it('should display document metadata', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments,
    });

    render(<DocumentList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('Main project contract')).toBeInTheDocument();
      expect(screen.getByText('important')).toBeInTheDocument();
      expect(screen.getByText('legal')).toBeInTheDocument();
    });
  });

  it('should filter documents by search query', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments,
    });

    render(<DocumentList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(searchInput, { target: { value: 'invoice' } });

    await waitFor(() => {
      expect(screen.queryByText('Contract.pdf')).not.toBeInTheDocument();
      expect(screen.getByText('Invoice_001.pdf')).toBeInTheDocument();
      expect(screen.queryByText('Photo.jpg')).not.toBeInTheDocument();
    });

    expect(screen.getByText('1 document found')).toBeInTheDocument();
  });

  it('should filter documents by type', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments,
    });

    render(<DocumentList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
    });

    const typeSelect = screen.getAllByRole('combobox')[0];
    fireEvent.change(typeSelect, { target: { value: DocumentType.PHOTO } });

    await waitFor(() => {
      expect(screen.queryByText('Contract.pdf')).not.toBeInTheDocument();
      expect(screen.queryByText('Invoice_001.pdf')).not.toBeInTheDocument();
      expect(screen.getByText('Photo.jpg')).toBeInTheDocument();
    });
  });

  it('should filter documents by tags', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments,
    });

    render(<DocumentList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(searchInput, { target: { value: 'legal' } });

    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
      expect(screen.queryByText('Invoice_001.pdf')).not.toBeInTheDocument();
      expect(screen.queryByText('Photo.jpg')).not.toBeInTheDocument();
    });
  });

  it('should clear filters', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments,
    });

    render(<DocumentList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
    });

    // Apply search filter
    const searchInput = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(searchInput, { target: { value: 'invoice' } });

    await waitFor(() => {
      expect(screen.getByText('1 document found')).toBeInTheDocument();
    });

    // Clear filters
    const clearButton = screen.getByText('Clear filters');
    fireEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText('3 documents')).toBeInTheDocument();
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
      expect(screen.getByText('Invoice_001.pdf')).toBeInTheDocument();
      expect(screen.getByText('Photo.jpg')).toBeInTheDocument();
    });
  });

  it('should display empty state when no documents', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<DocumentList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('No documents')).toBeInTheDocument();
      expect(screen.getByText('Upload documents to get started')).toBeInTheDocument();
    });
  });

  it('should display empty state when no results match filters', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments,
    });

    render(<DocumentList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText('Search documents...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No documents found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters')).toBeInTheDocument();
    });
  });

  it('should handle fetch error', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    render(<DocumentList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to fetch documents')).toBeInTheDocument();
    });

    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should format file sizes correctly', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments,
    });

    render(<DocumentList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('1000 KB')).toBeInTheDocument(); // 1024000 bytes
      expect(screen.getByText('500 KB')).toBeInTheDocument(); // 512000 bytes
      expect(screen.getByText('1.95 MB')).toBeInTheDocument(); // 2048000 bytes = 1.95 MB
    });
  });

  it('should call onDocumentClick when document is clicked', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments,
    });

    const onDocumentClick = vi.fn();
    render(<DocumentList projectId={mockProjectId} onDocumentClick={onDocumentClick} />);

    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
    });

    const documentCard = screen.getByText('Contract.pdf').closest('div[class*="cursor-pointer"]');
    fireEvent.click(documentCard!);

    expect(onDocumentClick).toHaveBeenCalledWith(mockDocuments[0]);
  });

  it('should render without card wrapper when showCard is false', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments,
    });

    const { container } = render(<DocumentList projectId={mockProjectId} showCard={false} />);

    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
    });

    // Should not have Card component styling
    expect(container.querySelector('.shadow-linear')).not.toBeInTheDocument();
  });

  it('should display document type badges with correct colors', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments,
    });

    render(<DocumentList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('Contract')).toBeInTheDocument();
      expect(screen.getByText('Invoice')).toBeInTheDocument();
      expect(screen.getByText('Photo')).toBeInTheDocument();
    });
  });

  it('should delete a document and move it to trash', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments,
    });

    // Mock window.confirm
    global.confirm = vi.fn(() => true);

    render(<DocumentList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
    });

    // Find and click delete button for first document
    const deleteButtons = screen.getAllByTitle('Delete');
    
    // Mock delete request
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
    });

    // Mock refetch after delete
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments.slice(1), // Return documents without the deleted one
    });

    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/doc-1'),
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });

    expect(global.confirm).toHaveBeenCalledWith(
      'Are you sure you want to delete "Contract.pdf"? It will be moved to trash.'
    );
  });

  it('should not delete document if user cancels confirmation', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments,
    });

    // Mock window.confirm to return false
    global.confirm = vi.fn(() => false);

    render(<DocumentList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete');
    const initialFetchCallCount = (global.fetch as any).mock.calls.length;

    fireEvent.click(deleteButtons[0]);

    // Should not make delete request
    expect((global.fetch as any).mock.calls.length).toBe(initialFetchCallCount);
  });

  it('should switch to trash view and display deleted documents', async () => {
    const deletedDocuments = [
      {
        ...mockDocuments[0],
        deletedAt: '2024-01-30T10:00:00Z',
      },
    ];

    // Initial fetch for normal view
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments,
    });

    render(<DocumentList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
    });

    // Mock fetch for trash view
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => deletedDocuments,
    });

    // Click trash button
    const trashButton = screen.getByText('Trash');
    fireEvent.click(trashButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/projects/project-123/documents/trash'),
        expect.any(Object)
      );
    });

    // Should show trash info message
    await waitFor(() => {
      expect(screen.getByText(/Documents in trash will be permanently deleted after 30 days/)).toBeInTheDocument();
    });
  });

  it('should restore a document from trash', async () => {
    const deletedDocuments = [
      {
        ...mockDocuments[0],
        deletedAt: '2024-01-30T10:00:00Z',
      },
    ];

    // Initial fetch for trash view
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => deletedDocuments,
    });

    render(<DocumentList projectId={mockProjectId} showTrash={true} />);

    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
    });

    // Find and click restore button
    const restoreButton = screen.getByTitle('Restore');

    // Mock restore request
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockDocuments[0], deletedAt: undefined }),
    });

    // Mock refetch after restore
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [], // Trash is now empty
    });

    fireEvent.click(restoreButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/documents/doc-1/restore'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  it('should show empty state in trash view', async () => {
    // Mock fetch for trash view with no documents
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<DocumentList projectId={mockProjectId} showTrash={true} />);

    await waitFor(() => {
      expect(screen.getByText('Trash is empty')).toBeInTheDocument();
      expect(screen.getByText('Deleted documents will appear here')).toBeInTheDocument();
    });
  });

  it('should not show filters in trash view', async () => {
    // Mock fetch for trash view
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<DocumentList projectId={mockProjectId} showTrash={true} />);

    await waitFor(() => {
      expect(screen.getByText('Trash is empty')).toBeInTheDocument();
    });

    // Filters should not be visible
    expect(screen.queryByPlaceholderText('Search documents...')).not.toBeInTheDocument();
  });

  it('should handle delete error gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockDocuments,
    });

    global.confirm = vi.fn(() => true);
    global.alert = vi.fn();

    render(<DocumentList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByTitle('Delete');

    // Mock delete request failure
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed to delete document');
    });
  });

  it('should handle restore error gracefully', async () => {
    const deletedDocuments = [
      {
        ...mockDocuments[0],
        deletedAt: '2024-01-30T10:00:00Z',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => deletedDocuments,
    });

    global.alert = vi.fn();

    render(<DocumentList projectId={mockProjectId} showTrash={true} />);

    await waitFor(() => {
      expect(screen.getByText('Contract.pdf')).toBeInTheDocument();
    });

    const restoreButton = screen.getByTitle('Restore');

    // Mock restore request failure
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
    });

    fireEvent.click(restoreButton);

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Failed to restore document');
    });
  });
});
