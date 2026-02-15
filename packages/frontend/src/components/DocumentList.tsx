import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
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

export interface Document {
  id: string;
  projectId: string;
  name: string;
  type: DocumentType;
  fileType: string;
  fileSize: number;
  storageUrl: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  uploadedAt: string;
  deletedAt?: string;
  metadata?: {
    tags?: string[];
    description?: string;
    captureDate?: Date;
    associatedMilestoneId?: string;
    caption?: string;
  };
}

export interface DocumentListProps {
  projectId: string;
  showCard?: boolean;
  className?: string;
  onDocumentClick?: (document: Document) => void;
  showTrash?: boolean;
}

export const DocumentList: React.FC<DocumentListProps> = ({
  projectId,
  showCard = true,
  className = '',
  onDocumentClick,
  showTrash = false,
}) => {
  const { t, i18n } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewingTrash, setViewingTrash] = useState(showTrash);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  useEffect(() => {
    fetchDocuments();
  }, [projectId, viewingTrash]);

  useEffect(() => {
    applyFilters();
  }, [documents, searchQuery, typeFilter, dateFilter]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const authTokens = localStorage.getItem('auth_tokens');
      const accessToken = authTokens ? JSON.parse(authTokens).accessToken : null;

      const endpoint = viewingTrash
        ? `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/documents/trash`
        : `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/documents`;

      const response = await fetch(endpoint, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch documents');
      }

      const data = await response.json();
      setDocuments(data);
    } catch (err: any) {
      console.error('Error fetching documents:', err);
      setError(err.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...documents];

    // Don't apply filters in trash view
    if (viewingTrash) {
      setFilteredDocuments(filtered);
      return;
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.name.toLowerCase().includes(query) ||
          doc.type.toLowerCase().includes(query) ||
          doc.metadata?.description?.toLowerCase().includes(query) ||
          doc.metadata?.tags?.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.type === typeFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          filterDate.setFullYear(now.getFullYear() - 1);
          break;
      }

      if (dateFilter !== 'all') {
        filtered = filtered.filter(
          (doc) => new Date(doc.uploadedAt) >= filterDate
        );
      }
    }

    setFilteredDocuments(filtered);
  };

  const handleDownload = async (document: Document) => {
    try {
      const authTokens = localStorage.getItem('auth_tokens');
      const accessToken = authTokens ? JSON.parse(authTokens).accessToken : null;

      // Get presigned URL
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/documents/${document.id}/download`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get download URL');
      }

      const { url } = await response.json();

      // Open download URL in new tab
      window.open(url, '_blank');
    } catch (err: any) {
      console.error('Error downloading document:', err);
      alert('Failed to download document');
    }
  };

  const handleDelete = async (document: Document, e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm(t('documentList.deleteConfirm', { name: document.name }))) {
      return;
    }

    try {
      const authTokens = localStorage.getItem('auth_tokens');
      const accessToken = authTokens ? JSON.parse(authTokens).accessToken : null;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/documents/${document.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete document');
      }

      // Refresh the document list
      await fetchDocuments();
    } catch (err: any) {
      console.error('Error deleting document:', err);
      alert('Failed to delete document');
    }
  };

  const handleRestore = async (document: Document, e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const authTokens = localStorage.getItem('auth_tokens');
      const accessToken = authTokens ? JSON.parse(authTokens).accessToken : null;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/documents/${document.id}/restore`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to restore document');
      }

      // Refresh the document list
      await fetchDocuments();
    } catch (err: any) {
      console.error('Error restoring document:', err);
      alert('Failed to restore document');
    }
  };

  const handlePreview = (document: Document) => {
    if (onDocumentClick) {
      onDocumentClick(document);
    } else {
      // Default behavior: open in new tab
      handleDownload(document);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language === 'uk' ? 'uk-UA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getDocumentTypeLabel = (type: DocumentType): string => {
    return t(`documentType.${type}`);
  };

  const getDocumentTypeColor = (type: DocumentType): 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info' => {
    const colors: Record<DocumentType, 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'> = {
      [DocumentType.CONTRACT]: 'primary',
      [DocumentType.INVOICE]: 'warning',
      [DocumentType.RECEIPT]: 'success',
      [DocumentType.PHOTO]: 'info',
      [DocumentType.PERMIT]: 'danger',
      [DocumentType.WARRANTY]: 'default',
      [DocumentType.OTHER]: 'default',
    };
    return colors[type];
  };

  const getFileIcon = (fileType: string): React.ReactNode => {
    const type = fileType.toLowerCase();
    
    if (type.includes('pdf')) {
      return (
        <svg className="w-8 h-8 text-red-500" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
        </svg>
      );
    }
    
    if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('heic')) {
      return (
        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
        </svg>
      );
    }
    
    if (type.includes('word') || type.includes('doc')) {
      return (
        <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
        </svg>
      );
    }
    
    if (type.includes('excel') || type.includes('xls') || type.includes('spreadsheet')) {
      return (
        <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 20 20">
          <path d="M4 18h12V6h-4V2H4v16zm-2 1V0h12l4 4v16H2v-1z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
      </svg>
    );
  };

  const typeOptions = [
    { value: 'all', label: t('documentList.allTypes') },
    { value: DocumentType.CONTRACT, label: t('documentType.contract') },
    { value: DocumentType.INVOICE, label: t('documentType.invoice') },
    { value: DocumentType.RECEIPT, label: t('documentType.receipt') },
    { value: DocumentType.PHOTO, label: t('documentType.photo') },
    { value: DocumentType.PERMIT, label: t('documentType.permit') },
    { value: DocumentType.WARRANTY, label: t('documentType.warranty') },
    { value: DocumentType.OTHER, label: t('documentType.other') },
  ];

  const dateOptions = [
    { value: 'all', label: t('documentList.allTime') },
    { value: 'today', label: t('documentList.today') },
    { value: 'week', label: t('documentList.last7Days') },
    { value: 'month', label: t('documentList.last30Days') },
    { value: 'year', label: t('documentList.lastYear') },
  ];

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
            onClick={fetchDocuments}
            className="mt-3"
          >
            {t('common.retry')}
          </Button>
        </div>
      );
    }

    if (filteredDocuments.length === 0) {
      return (
        <EmptyState
          icon={
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          title={
            viewingTrash
              ? t('documentList.trashEmpty')
              : searchQuery || typeFilter !== 'all' || dateFilter !== 'all'
              ? t('documentList.noDocumentsFound')
              : t('documentList.noDocuments')
          }
          description={
            viewingTrash
              ? t('documentList.deletedDocsAppear')
              : searchQuery || typeFilter !== 'all' || dateFilter !== 'all'
              ? t('documentList.adjustFilters')
              : t('documentList.uploadToStart')
          }
        />
      );
    }

    return (
      <div className="space-y-3">
        {filteredDocuments.map((document) => (
          <div
            key={document.id}
            className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
            onClick={() => handlePreview(document)}
          >
            <div className="flex items-start gap-4">
              {/* File Icon */}
              <div className="flex-shrink-0">
                {getFileIcon(document.fileType)}
              </div>

              {/* Document Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {document.name}
                    </h4>
                    {document.metadata?.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {document.metadata.description}
                      </p>
                    )}
                  </div>
                  <Badge variant={getDocumentTypeColor(document.type)} size="sm">
                    {getDocumentTypeLabel(document.type)}
                  </Badge>
                </div>

                {/* Tags */}
                {document.metadata?.tags && document.metadata.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {document.metadata.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-600"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span>{formatFileSize(document.fileSize)}</span>
                  <span>•</span>
                  <span>{formatDate(document.uploadedAt)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-center gap-2">
                {viewingTrash ? (
                  <button
                    onClick={(e) => handleRestore(document, e)}
                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title={t('common.retry')}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownload(document);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                      title={t('common.view')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => handleDelete(document, e)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title={t('common.delete')}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const content = (
    <div className="space-y-4">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewingTrash(false)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              !viewingTrash
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('documentList.documents')}
          </button>
          <button
            onClick={() => setViewingTrash(true)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              viewingTrash
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t('documentList.trash')}
          </button>
        </div>
      </div>

      {/* Filters */}
      {!viewingTrash && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            placeholder={t('documentList.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            fullWidth
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={typeOptions}
            fullWidth
          />
          <Select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            options={dateOptions}
            fullWidth
          />
        </div>
      )}

      {/* Results count */}
      {!loading && !error && !viewingTrash && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>
            {filteredDocuments.length} {filteredDocuments.length === 1 ? t('documentList.document') : t('documentList.documents_count')}
            {(searchQuery || typeFilter !== 'all' || dateFilter !== 'all') && ` ${t('common.found')}`}
          </span>
          {(searchQuery || typeFilter !== 'all' || dateFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setTypeFilter('all');
                setDateFilter('all');
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              {t('common.clearFilters')}
            </button>
          )}
        </div>
      )}

      {/* Trash info */}
      {!loading && !error && viewingTrash && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            {t('documentList.trashNotice')}
          </p>
        </div>
      )}

      {/* Document List */}
      {renderContent()}
    </div>
  );

  if (showCard) {
    return (
      <Card className={className}>
        <CardHeader title={t('documentList.title')} />
        <CardContent>{content}</CardContent>
      </Card>
    );
  }

  return <div className={className}>{content}</div>;
};
