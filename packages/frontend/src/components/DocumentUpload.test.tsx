import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DocumentUpload, DocumentType } from './DocumentUpload';

describe('DocumentUpload', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const projectId = 'test-project-id';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the upload modal when open', () => {
    render(
      <DocumentUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    expect(screen.getByText('Upload Document')).toBeInTheDocument();
    expect(screen.getByText(/Click to browse/)).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <DocumentUpload
        isOpen={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    expect(screen.queryByText('Upload Document')).not.toBeInTheDocument();
  });

  it('displays file format validation message', () => {
    render(
      <DocumentUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    expect(screen.getByText(/Supported formats: PDF, JPG, PNG, HEIC, DOC, DOCX, XLS, XLSX/)).toBeInTheDocument();
    expect(screen.getByText(/Maximum file size: 50MB/)).toBeInTheDocument();
  });

  it('validates file format on selection', () => {
    render(
      <DocumentUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const fileInput = screen.getByLabelText(/Document File/i) as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    // Create an invalid file
    const invalidFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(screen.getByText(/Invalid file format/)).toBeInTheDocument();
  });

  it('accepts valid file formats', () => {
    render(
      <DocumentUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const fileInput = screen.getByLabelText(/Document File/i) as HTMLInputElement;
    
    // Create a valid PDF file
    const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.queryByText(/Invalid file format/)).not.toBeInTheDocument();
  });

  it('validates file size', () => {
    render(
      <DocumentUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const fileInput = screen.getByLabelText(/Document File/i) as HTMLInputElement;
    
    // Create a file larger than 50MB
    const largeFile = new File(['x'.repeat(51 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(screen.getByText(/File size exceeds maximum limit/)).toBeInTheDocument();
  });

  it('allows selecting document type', () => {
    render(
      <DocumentUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const typeSelect = screen.getByLabelText(/Document Type/i);
    expect(typeSelect).toBeInTheDocument();

    fireEvent.change(typeSelect, { target: { value: DocumentType.INVOICE } });
    expect(typeSelect).toHaveValue(DocumentType.INVOICE);
  });

  it('allows entering description', () => {
    render(
      <DocumentUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const descriptionInput = screen.getByLabelText(/Description/i);
    expect(descriptionInput).toBeInTheDocument();

    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });
    expect(descriptionInput).toHaveValue('Test description');
  });

  it('allows entering tags', () => {
    render(
      <DocumentUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const tagsInput = screen.getByLabelText(/Tags/i);
    expect(tagsInput).toBeInTheDocument();

    fireEvent.change(tagsInput, { target: { value: 'important, urgent' } });
    expect(tagsInput).toHaveValue('important, urgent');
  });

  it('disables upload button when no file is selected', () => {
    render(
      <DocumentUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const uploadButton = screen.getByRole('button', { name: /Upload/i });
    expect(uploadButton).toBeDisabled();
  });

  it('enables upload button when valid file is selected', () => {
    render(
      <DocumentUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const fileInput = screen.getByLabelText(/Document File/i) as HTMLInputElement;
    const validFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    const uploadButton = screen.getByRole('button', { name: /Upload/i });
    expect(uploadButton).not.toBeDisabled();
  });

  it('calls onClose when cancel button is clicked', () => {
    render(
      <DocumentUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const cancelButton = screen.getByRole('button', { name: /Cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('displays all document type options', () => {
    render(
      <DocumentUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const typeSelect = screen.getByLabelText(/Document Type/i);
    const options = typeSelect.querySelectorAll('option');

    expect(options).toHaveLength(7);
    expect(screen.getByRole('option', { name: 'Contract' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Invoice' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Receipt' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Photo' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Permit' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Warranty' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument();
  });

  it('shows file name and size after selection', () => {
    render(
      <DocumentUpload
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        projectId={projectId}
      />
    );

    const fileInput = screen.getByLabelText(/Document File/i) as HTMLInputElement;
    const validFile = new File(['test content'], 'document.pdf', { type: 'application/pdf' });
    
    fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.getByText(/KB/)).toBeInTheDocument();
  });
});
