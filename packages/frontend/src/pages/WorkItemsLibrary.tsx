import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/layout/Header';
import { UserDropdown } from '../components/UserDropdown';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Badge } from '../components/ui/Badge';
import { apiClient } from '../utils/api';
import { WorkItemTemplate, WorkItemCategory } from '../components/WorkItemsLibraryModal';

export const WorkItemsLibrary: React.FC = () => {
  const navigate = useNavigate();
  const [workItems, setWorkItems] = useState<WorkItemTemplate[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkItems();
  }, []);

  const loadWorkItems = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await apiClient.get<WorkItemTemplate[]>('/api/work-items');
      setWorkItems(data);
    } catch (err: any) {
      console.error('Error loading work items:', err);
      setError(err.message || 'Failed to load work items. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getCategoryLabel = (category: WorkItemCategory): string => {
    const labels: Record<WorkItemCategory, string> = {
      [WorkItemCategory.DEMOLITION]: 'Demolition',
      [WorkItemCategory.FRAMING]: 'Framing',
      [WorkItemCategory.ELECTRICAL]: 'Electrical',
      [WorkItemCategory.PLUMBING]: 'Plumbing',
      [WorkItemCategory.HVAC]: 'HVAC',
      [WorkItemCategory.DRYWALL]: 'Drywall',
      [WorkItemCategory.PAINTING]: 'Painting',
      [WorkItemCategory.FLOORING]: 'Flooring',
      [WorkItemCategory.FINISHING]: 'Finishing',
      [WorkItemCategory.CLEANUP]: 'Cleanup',
      [WorkItemCategory.INSPECTION]: 'Inspection',
      [WorkItemCategory.OTHER]: 'Other',
    };
    return labels[category];
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Group work items by category
  const workItemsByCategory = useMemo(() => {
    const grouped: Record<string, WorkItemTemplate[]> = {};
    
    workItems.forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });

    return grouped;
  }, [workItems]);

  // Filter work items based on selected category
  const filteredWorkItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return workItems;
    }
    return workItems.filter(item => item.category === selectedCategory);
  }, [workItems, selectedCategory]);

  // Get available categories
  const availableCategories = useMemo(() => {
    const categories = new Set(workItems.map(item => item.category));
    return Array.from(categories).sort();
  }, [workItems]);

  // Filter only custom work items (not default)
  const customWorkItems = useMemo(() => {
    return filteredWorkItems.filter(item => !item.isDefault);
  }, [filteredWorkItems]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        logo={
          <button
            onClick={() => navigate('/dashboard')}
            className="text-xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
          >
            Renovator
          </button>
        }
        actions={<UserDropdown />}
      />

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">Work Items Library</h1>
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </div>
          <p className="text-gray-600">
            Manage your custom work item templates
          </p>
        </div>

        {error && (
          <Alert variant="danger" onClose={() => setError(null)} className="mb-6">
            {error}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Category Filter */}
            <div className="bg-white rounded-linear border border-gray-200 p-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-gray-700">Category:</span>
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`px-3 py-1.5 text-xs font-medium rounded-linear transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({workItems.length})
                </button>
                {availableCategories.map(category => {
                  const count = workItemsByCategory[category]?.length || 0;
                  return (
                    <button
                      key={category}
                      onClick={() => setSelectedCategory(category)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-linear transition-colors ${
                        selectedCategory === category
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {getCategoryLabel(category as WorkItemCategory)} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Work Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {customWorkItems.length === 0 ? (
                <div className="col-span-full bg-white rounded-linear border border-gray-200 p-12 text-center">
                  <p className="text-gray-500 mb-4">
                    {selectedCategory === 'all'
                      ? 'No custom work items found. Create your first custom template to get started.'
                      : 'No custom work items found in this category.'}
                  </p>
                </div>
              ) : (
                customWorkItems.map(item => (
                  <div
                    key={item.id}
                    className="bg-white rounded-linear border border-gray-200 p-4 hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 mb-1 truncate">
                          {item.name}
                        </h3>
                        <Badge variant="default" size="sm">
                          {getCategoryLabel(item.category)}
                        </Badge>
                      </div>
                    </div>

                    {item.description && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    <div className="space-y-2 text-sm">
                      {item.defaultPrice !== undefined && item.defaultPrice !== null && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Default Price:</span>
                          <span className="font-medium text-gray-900">
                            {formatCurrency(Number(item.defaultPrice))}
                          </span>
                        </div>
                      )}
                      {item.estimatedDuration && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-500">Est. Duration:</span>
                          <span className="font-medium text-gray-900">
                            {item.estimatedDuration} hours
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Show all work items count */}
            <div className="bg-white rounded-linear border border-gray-200 p-4">
              <div className="text-sm text-gray-600">
                Showing {customWorkItems.length} custom work item
                {customWorkItems.length !== 1 ? 's' : ''} 
                {selectedCategory !== 'all' && ` in ${getCategoryLabel(selectedCategory as WorkItemCategory)}`}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
