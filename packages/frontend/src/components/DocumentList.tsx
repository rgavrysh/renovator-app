import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Button } from './ui/Button';
import { IconButton } from './ui/IconButton';
import { ListRow, ListRowGroup } from './ui/ListRow';
import { GoogleDriveIcon } from './icons/GoogleDriveIcon';
import { useTranslation } from 'react-i18next';
import { FileText, Image as ImageIcon, FileSpreadsheet, File, FolderOpen, RotateCcw, Download, Trash2 } from 'lucide-react';

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
  storageProvider?: 'local' | 'google_drive';
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

      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const { url } = await response.json();
        window.open(url, '_blank');
      } else {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = window.document.createElement('a');
        link.href = url;
        link.download = document.name;
        link.click();
        URL.revokeObjectURL(url);
      }
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
      return <FileText className="w-5 h-5 text-danger-500" strokeWidth={1.5} />;
    }

    if (type.includes('image') || type.includes('jpg') || type.includes('png') || type.includes('heic')) {
      return <ImageIcon className="w-5 h-5 text-info-500" strokeWidth={1.5} />;
    }

    if (type.includes('word') || type.includes('doc')) {
      return <FileText className="w-5 h-5 text-info-600" strokeWidth={1.5} />;
    }

    if (type.includes('excel') || type.includes('xls') || type.includes('spreadsheet')) {
      return <FileSpreadsheet className="w-5 h-5 text-success-600" strokeWidth={1.5} />;
    }

    return <File className="w-5 h-5 text-gray-400" strokeWidth={1.5} />;
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
          icon={<FolderOpen className="w-12 h-12" strokeWidth={1.5} />}
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
      <ListRowGroup>
        {filteredDocuments.map((document) => (
          <ListRow
            key={document.id}
            onActivate={() => handlePreview(document)}
            icon={<div className="mt-0.5">{getFileIcon(document.fileType)}</div>}
            contentClassName="py-1"
            meta={
              <>
                <span className="whitespace-nowrap">{formatFileSize(document.fileSize)}</span>
                <span className="whitespace-nowrap">{formatDate(document.uploadedAt)}</span>
              </>
            }
            actions={
              viewingTrash ? (
                <IconButton
                  label={t('common.retry')}
                  icon={<RotateCcw className="w-4 h-4" strokeWidth={1.5} />}
                  onClick={(e) => handleRestore(document, e)}
                />
              ) : (
                <>
                  <IconButton
                    label={t('common.view')}
                    icon={<Download className="w-4 h-4" strokeWidth={1.5} />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(document);
                    }}
                  />
                  <IconButton
                    label={t('common.delete')}
                    icon={<Trash2 className="w-4 h-4" strokeWidth={1.5} />}
                    variant="danger"
                    onClick={(e) => handleDelete(document, e)}
                  />
                </>
              )
            }
          >
            <div className="flex items-center gap-2">
              <h4 className="text-ui font-medium text-gray-900 truncate">{document.name}</h4>
              {document.storageProvider === 'google_drive' && (
                <span
                  className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-ui-xs bg-info-50 text-info-600 flex-shrink-0"
                  title={t('googleDrive.storedInDrive')}
                >
                  <GoogleDriveIcon className="w-3 h-3" />
                </span>
              )}
              <Badge variant={getDocumentTypeColor(document.type)} size="sm" className="flex-shrink-0">
                {getDocumentTypeLabel(document.type)}
              </Badge>
            </div>

            {document.metadata?.description && (
              <p className="text-ui-sm text-gray-500 mt-0.5 line-clamp-2">{document.metadata.description}</p>
            )}

            {document.metadata?.tags && document.metadata.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {document.metadata.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-ui-xs bg-gray-100 text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </ListRow>
        ))}
      </ListRowGroup>
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
