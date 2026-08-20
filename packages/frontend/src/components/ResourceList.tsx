import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardContent } from './ui/Card';
import { Badge } from './ui/Badge';
import { EmptyState } from './ui/EmptyState';
import { Alert } from './ui/Alert';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/currency';
import { getResourceStatusVariant } from '../utils/statusColors';
import { Package, Wrench, Users, Box, AlertTriangle, AlertCircle } from 'lucide-react';

export enum ResourceType {
  MATERIAL = 'material',
  EQUIPMENT = 'equipment',
  SUBCONTRACTOR = 'subcontractor',
  OTHER = 'other',
}

export enum ResourceStatus {
  NEEDED = 'needed',
  ORDERED = 'ordered',
  RECEIVED = 'received',
  CANCELLED = 'cancelled',
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
}

export interface Resource {
  id: string;
  projectId: string;
  type: ResourceType;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  status: ResourceStatus;
  supplierId?: string;
  supplier?: Supplier;
  orderDate?: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceListProps {
  projectId: string;
  showCard?: boolean;
  className?: string;
  onResourceClick?: (resource: Resource) => void;
}

export const ResourceList: React.FC<ResourceListProps> = ({
  projectId,
  showCard = true,
  className = '',
  onResourceClick,
}) => {
  const { t, i18n } = useTranslation();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [overdueResources, setOverdueResources] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchResources();
  }, [projectId]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      setError(null);

      const authTokens = localStorage.getItem('auth_tokens');
      const accessToken = authTokens ? JSON.parse(authTokens).accessToken : null;

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/api/projects/${projectId}/resources`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }

      const data = await response.json();
      setResources(data);
      
      // Check for overdue deliveries
      checkOverdueDeliveries(data);
    } catch (err: any) {
      console.error('Error fetching resources:', err);
      setError(err.message || 'Failed to fetch resources');
    } finally {
      setLoading(false);
    }
  };

  const checkOverdueDeliveries = (resourceList: Resource[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const overdue = new Set<string>();
    
    resourceList.forEach((resource) => {
      if (
        resource.status === ResourceStatus.ORDERED &&
        resource.expectedDeliveryDate
      ) {
        const expectedDate = new Date(resource.expectedDeliveryDate);
        expectedDate.setHours(0, 0, 0, 0);
        
        if (expectedDate < twoDaysAgo) {
          overdue.add(resource.id);
        }
      }
    });

    setOverdueResources(overdue);
  };

  const fmtCurrency = (amount: number): string => formatCurrency(amount, i18n.language);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(i18n.language === 'uk' ? 'uk-UA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const getStatusLabel = (status: ResourceStatus): string => {
    return t(`resourceStatus.${status}`);
  };

  const getStatusColor = (status: ResourceStatus) => getResourceStatusVariant(status);

  const getTypeLabel = (type: ResourceType): string => {
    return t(`resourceType.${type}`);
  };

  const getTypeIcon = (type: ResourceType): React.ReactNode => {
    switch (type) {
      case ResourceType.MATERIAL:
        return <Package className="w-5 h-5" strokeWidth={1.5} />;
      case ResourceType.EQUIPMENT:
        return <Wrench className="w-5 h-5" strokeWidth={1.5} />;
      case ResourceType.SUBCONTRACTOR:
        return <Users className="w-5 h-5" strokeWidth={1.5} />;
      default:
        return <Box className="w-5 h-5" strokeWidth={1.5} />;
    }
  };

  // Group resources by status
  const groupedResources = resources.reduce((acc, resource) => {
    if (!acc[resource.status]) {
      acc[resource.status] = [];
    }
    acc[resource.status].push(resource);
    return acc;
  }, {} as Record<ResourceStatus, Resource[]>);

  // Define status order for display
  const statusOrder = [
    ResourceStatus.NEEDED,
    ResourceStatus.ORDERED,
    ResourceStatus.RECEIVED,
    ResourceStatus.CANCELLED,
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
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      );
    }

    if (resources.length === 0) {
      return (
        <EmptyState
          icon={<Package className="w-12 h-12" strokeWidth={1.5} />}
          title={t('resourceList.noResources')}
          description={t('resourceList.addResources')}
        />
      );
    }

    // Count overdue resources
    const overdueCount = overdueResources.size;

    return (
      <div className="space-y-6">
        {/* Overdue Warning */}
        {overdueCount > 0 && (
          <Alert variant="warning">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" strokeWidth={1.5} />
              <span className="font-medium">
                {t('resourceList.overdueDelivery', { count: overdueCount })}
              </span>
            </div>
          </Alert>
        )}

        {/* Resources grouped by status */}
        {statusOrder.map((status) => {
          const statusResources = groupedResources[status] || [];
          
          if (statusResources.length === 0) {
            return null;
          }

          return (
            <div key={status}>
              {/* Status Header */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant={getStatusColor(status)}>
                  {getStatusLabel(status)}
                </Badge>
                <span className="text-xs text-gray-500">
                  {statusResources.length} {statusResources.length === 1 ? t('common.item') : t('common.items')}
                </span>
              </div>

              {/* Status Resources */}
              <div className="space-y-2">
                {statusResources.map((resource) => {
                  const isOverdue = overdueResources.has(resource.id);

                  return (
                    <div
                      key={resource.id}
                      className={`border rounded-lg p-4 transition-all ${
                        isOverdue
                          ? 'border-red-300 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      } ${onResourceClick ? 'cursor-pointer' : ''}`}
                      onClick={() => onResourceClick?.(resource)}
                    >
                      {/* Overdue Banner */}
                      {isOverdue && (
                        <div className="flex items-center gap-2 mb-3 text-red-700">
                          <AlertCircle className="w-4 h-4 flex-shrink-0" strokeWidth={1.5} />
                          <span className="text-xs font-medium">
                            {t('resourceList.deliveryOverdue')}
                          </span>
                        </div>
                      )}

                      <div className="flex items-start gap-3">
                        {/* Type Icon */}
                        <div className="flex-shrink-0 text-gray-400 mt-0.5">
                          {getTypeIcon(resource.type)}
                        </div>

                        {/* Resource Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900">
                                {resource.name}
                              </h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {getTypeLabel(resource.type)}
                              </p>
                            </div>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            {/* Quantity */}
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">{t('resourceList.quantity')}</p>
                              <p className="text-sm font-medium text-gray-900">
                                {resource.quantity} {resource.unit}
                              </p>
                            </div>

                            {/* Cost */}
                            <div>
                              <p className="text-xs text-gray-500 mb-0.5">{t('resourceList.cost')}</p>
                              <p className="text-sm font-medium text-gray-900">
                                {fmtCurrency(resource.cost)}
                              </p>
                            </div>

                            {/* Supplier */}
                            {resource.supplier && (
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">{t('resourceList.supplier')}</p>
                                <p className="text-sm font-medium text-gray-900 truncate">
                                  {resource.supplier.name}
                                </p>
                              </div>
                            )}

                            {/* Delivery Date */}
                            {resource.expectedDeliveryDate && (
                              <div>
                                <p className="text-xs text-gray-500 mb-0.5">
                                  {resource.status === ResourceStatus.RECEIVED
                                    ? t('resourceList.delivered')
                                    : t('resourceList.expectedDelivery')}
                                </p>
                                <p className={`text-sm font-medium ${isOverdue ? 'text-red-700' : 'text-gray-900'}`}>
                                  {formatDate(
                                    resource.actualDeliveryDate || resource.expectedDeliveryDate
                                  )}
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Notes */}
                          {resource.notes && (
                            <p className="text-xs text-gray-600 mt-3 line-clamp-2">
                              {resource.notes}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (showCard) {
    return (
      <Card className={className}>
        <CardHeader title={t('resourceList.title')} />
        <CardContent>{renderContent()}</CardContent>
      </Card>
    );
  }

  return <div className={className}>{renderContent()}</div>;
};
