import React, { useState, useEffect, useMemo } from 'react';
import { Modal, ModalFooter } from './ui/Modal';
import { Button } from './ui/Button';
import { Spinner } from './ui/Spinner';
import { Alert } from './ui/Alert';
import { Badge } from './ui/Badge';
import { apiClient } from '../utils/api';

export enum WorkItemCategory {
  DEMOLITION = 'demolition',
  FRAMING = 'framing',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  HVAC = 'hvac',
  DRYWALL = 'drywall',
  PAINTING = 'painting',
  FLOORING = 'flooring',
  FINISHING = 'finishing',
  CLEANUP = 'cleanup',
  INSPECTION = 'inspection',
  OTHER = 'other',
}

export interface WorkItemTemplate {
  id: string;
  name: string;
  description?: string;
  category: WorkItemCategory;
  estimatedDuration?: number;
  defaultPrice?: number;
  isDefault: boolean;
  ownerId?: string;
  createdAt: string;
}

export interface WorkItemsLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
}

export const WorkItemsLibraryModal: React.FC<WorkItemsLibraryModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  projectId,
}) => {
  const [workItems, setWorkItems] = useState<WorkItemTemplate[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadWorkItems();
      setSelectedItems(new Set());
      setSelectedCategory('all');
    }
  }, [isOpen]);

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

  const handleToggleItem = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    const filteredIds = filteredWorkItems.map(item => item.id);
    setSelectedItems(new Set(filteredIds));
  };

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
  };

  const handleSubmit = async () => {
    if (selectedItems.size === 0) {
      setError('Please select at least one work item');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      await apiClient.post(`/api/projects/${projectId}/tasks/bulk`, {
        templateIds: Array.from(selectedItems),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating tasks:', err);
      setError(err.message || 'Failed to create tasks. Please try again.');
    } finally {
      setIsSubmitting(false);
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Work Items Library" size="xl">
      <div className="space-y-4">
        {error && (
          <Alert variant="danger" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : (
          <>
            {/* Category Filter */}
            <div className="flex items-center gap-2 pb-4 border-b border-gray-200">
              <span className="text-sm font-medium text-gray-700">Category:</span>
              <div className="flex flex-wrap gap-2">
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

            {/* Selection Controls */}
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {selectedItems.size} of {filteredWorkItems.length} items selected
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSelectAll}
                  disabled={filteredWorkItems.length === 0}
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeselectAll}
                  disabled={selectedItems.size === 0}
                >
                  Deselect All
                </Button>
              </div>
            </div>

            {/* Work Items List */}
            <div className="max-h-96 overflow-y-auto space-y-2">
              {filteredWorkItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-gray-500">
                    No work items found in this category
                  </p>
                </div>
              ) : (
                filteredWorkItems.map(item => {
                  const isSelected = selectedItems.has(item.id);
                  
                  return (
                    <div
                      key={item.id}
                      onClick={() => handleToggleItem(item.id)}
                      className={`p-3 border rounded-linear cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Checkbox */}
                        <div className="flex-shrink-0 mt-0.5">
                          <div
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'bg-primary-600 border-primary-600'
                                : 'bg-white border-gray-300'
                            }`}
                          >
                            {isSelected && (
                              <svg
                                className="w-3 h-3 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Item Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="text-sm font-medium text-gray-900">
                              {item.name}
                            </h4>
                            <Badge variant="default" size="sm">
                              {getCategoryLabel(item.category)}
                            </Badge>
                            {item.isDefault && (
                              <Badge variant="info" size="sm">
                                Default
                              </Badge>
                            )}
                          </div>
                          
                          {item.description && (
                            <p className="text-xs text-gray-600 mb-2">
                              {item.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            {item.defaultPrice !== undefined && item.defaultPrice !== null && (
                              <span>
                                Default Price: {formatCurrency(Number(item.defaultPrice))}
                              </span>
                            )}
                            {item.estimatedDuration && (
                              <span>
                                Est. Duration: {item.estimatedDuration} hours
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>

      <ModalFooter>
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          loading={isSubmitting}
          disabled={isSubmitting || selectedItems.size === 0}
        >
          Add {selectedItems.size} {selectedItems.size === 1 ? 'Task' : 'Tasks'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};
