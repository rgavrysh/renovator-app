import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { PageLayout } from '../components/layout/Container';
import { Header } from '../components/layout/Header';
import { Container } from '../components/layout/Container';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Divider } from '../components/ui/Divider';
import { MilestoneList, type Milestone, MilestoneStatus } from '../components/MilestoneList';
import { MilestoneForm } from '../components/MilestoneForm';
import { TaskList } from '../components/TaskList';
import { TaskDetail } from '../components/TaskDetail';
import { TaskForm } from '../components/TaskForm';
import { WorkItemsLibraryModal } from '../components/WorkItemsLibraryModal';
import { DocumentUpload } from '../components/DocumentUpload';
import { DocumentList } from '../components/DocumentList';
import { PhotoUpload } from '../components/PhotoUpload';
import { PhotoGallery } from '../components/PhotoGallery';
import { BudgetOverview } from '../components/BudgetOverview';
import { BudgetItemsList, BudgetItem } from '../components/BudgetItemsList';
import { BudgetItemForm } from '../components/BudgetItemForm';
import { UserDropdown } from '../components/UserDropdown';
import { useAuth, getAccessToken } from '../contexts/AuthContext';
import { apiClient } from '../utils/api';
import config from '../config';

interface Project {
  id: string;
  name: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  description?: string;
  startDate: string;
  estimatedEndDate: string;
  actualEndDate?: string;
  status: ProjectStatus;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

interface Task {
  id: string;
  projectId: string;
  milestoneId?: string;
  name: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;
  completedDate?: string;
  estimatedPrice?: number;
  actualPrice?: number;
  notes: string[];
  createdAt: string;
  updatedAt: string;
}

enum TaskStatus {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  BLOCKED = 'blocked',
}

enum TaskPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

interface Budget {
  id: string;
  projectId: string;
  totalEstimated: number;
  totalActual: number;
  totalActualFromItems: number;
  totalActualFromTasks: number;
  createdAt: string;
  updatedAt: string;
}

export const ProjectDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isCreatingBudget, setIsCreatingBudget] = useState(false);
  const [isExportingBudget, setIsExportingBudget] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [isBudgetItemFormOpen, setIsBudgetItemFormOpen] = useState(false);
  const [editingBudgetItem, setEditingBudgetItem] = useState<BudgetItem | undefined>(undefined);
  const [isMilestoneFormOpen, setIsMilestoneFormOpen] = useState(false);
  const [editingMilestone, setEditingMilestone] = useState<Milestone | undefined>(undefined);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);
  const [isWorkItemsModalOpen, setIsWorkItemsModalOpen] = useState(false);
  const [isDocumentUploadOpen, setIsDocumentUploadOpen] = useState(false);
  const [isPhotoUploadOpen, setIsPhotoUploadOpen] = useState(false);
  const [documentsKey, setDocumentsKey] = useState(0);
  const [photosKey, setPhotosKey] = useState(0);

  useEffect(() => {
    if (id) {
      loadProjectData();
    }
  }, [id]);

  const loadProjectData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load project details
      const projectData = await apiClient.get<Project>(`/api/projects/${id}`);
      setProject(projectData);

      // Load milestones
      const milestonesData = await apiClient.get<Milestone[]>(
        `/api/projects/${id}/milestones`
      );
      setMilestones(milestonesData);

      // Load tasks
      const tasksData = await apiClient.get<Task[]>(
        `/api/projects/${id}/tasks`
      );
      setTasks(tasksData);

      // Load budget
      try {
        const budgetData = await apiClient.get<Budget>(
          `/api/projects/${id}/budget`
        );
        setBudget(budgetData);
        
        // Load budget items if budget exists
        if (budgetData && budgetData.id) {
          // Budget items are included in the budget response
          setBudgetItems((budgetData as any).items || []);
        }
      } catch (err) {
        // Budget might not exist yet, that's okay
        console.log('No budget found for project');
        setBudget(null);
        setBudgetItems([]);
      }
    } catch (err: any) {
      console.error('Error loading project data:', err);
      setError(err.message || 'Failed to load project details. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!project || !window.confirm('Are you sure you want to archive this project?')) {
      return;
    }

    try {
      setIsArchiving(true);
      await apiClient.post(`/api/projects/${id}/archive`);
      
      // Navigate back to dashboard after successful archive
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error archiving project:', err);
      setError(err.message || 'Failed to archive project. Please try again.');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleEdit = () => {
    navigate(`/projects/${id}/edit`);
  };

  const handleCreateMilestone = () => {
    setEditingMilestone(undefined);
    setIsMilestoneFormOpen(true);
  };

  const handleEditMilestone = (milestone: Milestone) => {
    setEditingMilestone(milestone);
    setIsMilestoneFormOpen(true);
  };

  const handleMilestoneFormClose = () => {
    setIsMilestoneFormOpen(false);
    setEditingMilestone(undefined);
  };

  const handleMilestoneFormSuccess = () => {
    // Reload project data to get updated milestones
    loadProjectData();
  };

  const handleCompleteMilestone = async (milestone: Milestone) => {
    try {
      // Call the complete milestone API endpoint
      await apiClient.post(`/api/milestones/${milestone.id}/complete`);
      
      // Reload project data to get updated milestones and recalculated progress
      await loadProjectData();
    } catch (err: any) {
      console.error('Error completing milestone:', err);
      setError(err.message || 'Failed to complete milestone. Please try again.');
    }
  };

  const handleViewTaskDetails = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDetailOpen(true);
  };

  const handleTaskDetailClose = () => {
    setIsTaskDetailOpen(false);
    setSelectedTask(null);
  };

  const handleTaskDelete = async (taskId: string) => {
    // Reload project data to get updated task list and recalculated progress
    await loadProjectData();
  };

  const handleTaskUpdate = async () => {
    // Reload project data to get updated task with new notes
    await loadProjectData();
    
    // Update the selected task with fresh data
    if (selectedTask) {
      const updatedTask = tasks.find(t => t.id === selectedTask.id);
      if (updatedTask) {
        setSelectedTask(updatedTask);
      }
    }
  };

  const handleTaskStatusChange = async (task: Task, newStatus: TaskStatus) => {
    try {
      // Call the API to update task status
      await apiClient.put(`/api/tasks/${task.id}`, {
        status: newStatus,
        // If marking as completed, set the completed date
        completedDate: newStatus === TaskStatus.COMPLETED ? new Date().toISOString() : null,
      });

      // Reload project data to get updated tasks and recalculated progress
      await loadProjectData();

      // Update the selected task if it's open in the detail view
      if (selectedTask && selectedTask.id === task.id) {
        const updatedTask = tasks.find(t => t.id === task.id);
        if (updatedTask) {
          setSelectedTask(updatedTask);
        }
      }
    } catch (err: any) {
      console.error('Error updating task status:', err);
      setError(err.message || 'Failed to update task status. Please try again.');
    }
  };

  const handleCreateTask = () => {
    setEditingTask(undefined);
    setIsTaskFormOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskFormOpen(true);
  };

  const handleTaskFormClose = () => {
    setIsTaskFormOpen(false);
    setEditingTask(undefined);
  };

  const handleTaskFormSuccess = () => {
    // Reload project data to get updated tasks
    loadProjectData();
  };

  const handleAddFromLibrary = () => {
    setIsWorkItemsModalOpen(true);
  };

  const handleWorkItemsModalClose = () => {
    setIsWorkItemsModalOpen(false);
  };

  const handleWorkItemsModalSuccess = () => {
    // Reload project data to get newly created tasks
    loadProjectData();
  };

  const handleDocumentUploadOpen = () => {
    setIsDocumentUploadOpen(true);
  };

  const handleDocumentUploadClose = () => {
    setIsDocumentUploadOpen(false);
  };

  const handleDocumentUploadSuccess = () => {
    // Refresh document list
    setDocumentsKey(prev => prev + 1);
  };

  const handlePhotoUploadOpen = () => {
    setIsPhotoUploadOpen(true);
  };

  const handlePhotoUploadClose = () => {
    setIsPhotoUploadOpen(false);
  };

  const handlePhotoUploadSuccess = () => {
    // Refresh photo gallery
    setPhotosKey(prev => prev + 1);
  };

  const handleScrollToTasks = () => {
    // Scroll to tasks section
    const tasksSection = document.getElementById('tasks-section');
    if (tasksSection) {
      tasksSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleCreateBudget = async () => {
    if (!id) return;
    
    try {
      setIsCreatingBudget(true);
      const newBudget = await apiClient.post<Budget>(`/api/projects/${id}/budget`);
      setBudget(newBudget);
      setBudgetItems([]);
    } catch (err: any) {
      console.error('Error creating budget:', err);
      setError(err.message || 'Failed to create budget. Please try again.');
    } finally {
      setIsCreatingBudget(false);
    }
  };

  const handleAddBudgetItem = () => {
    setEditingBudgetItem(undefined);
    setIsBudgetItemFormOpen(true);
  };

  const handleEditBudgetItem = (item: BudgetItem) => {
    setEditingBudgetItem(item);
    setIsBudgetItemFormOpen(true);
  };

  const handleBudgetItemFormClose = () => {
    setIsBudgetItemFormOpen(false);
    setEditingBudgetItem(undefined);
  };

  const handleBudgetItemFormSuccess = () => {
    // Reload project data to get updated budget and items
    loadProjectData();
  };

  const handleDeleteBudgetItem = async (item: BudgetItem) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}" from the budget?`)) {
      return;
    }

    try {
      await apiClient.delete(`/api/budget-items/${item.id}`);
      // Reload project data to get updated budget and items
      await loadProjectData();
    } catch (err: any) {
      console.error('Error deleting budget item:', err);
      setError(err.message || 'Failed to delete budget item. Please try again.');
    }
  };

  const handleDeleteBudget = async () => {
    if (!id || !budget) return;

    if (!window.confirm('Are you sure you want to remove the entire budget? All budget items will be deleted. This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.delete(`/api/projects/${id}/budget`);
      setBudget(null);
      setBudgetItems([]);
    } catch (err: any) {
      console.error('Error deleting budget:', err);
      setError(err.message || 'Failed to delete budget. Please try again.');
    }
  };

  const handleExportBudget = async () => {
    if (!id || !budget) return;
    
    try {
      setIsExportingBudget(true);
      setError(null);
      setExportSuccess(null);
      
      // Get access token
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      
      // Call the export API endpoint
      const response = await fetch(`${config.api.url}/api/projects/${id}/budget/export`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export budget');
      }

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${project?.name || 'project'}-budget-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      // Show success message
      setExportSuccess('Budget exported successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setExportSuccess(null);
      }, 3000);
    } catch (err: any) {
      console.error('Error exporting budget:', err);
      setError(err.message || 'Failed to export budget to PDF. Please try again.');
    } finally {
      setIsExportingBudget(false);
    }
  };

  const getStatusBadgeVariant = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PLANNING:
        return 'info';
      case ProjectStatus.ACTIVE:
        return 'success';
      case ProjectStatus.ON_HOLD:
        return 'warning';
      case ProjectStatus.COMPLETED:
        return 'default';
      case ProjectStatus.ARCHIVED:
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.PLANNING:
        return 'Planning';
      case ProjectStatus.ACTIVE:
        return 'Active';
      case ProjectStatus.ON_HOLD:
        return 'On Hold';
      case ProjectStatus.COMPLETED:
        return 'Completed';
      case ProjectStatus.ARCHIVED:
        return 'Archived';
      default:
        return status;
    }
  };

  const getTaskStatusBadgeVariant = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'default';
      case TaskStatus.IN_PROGRESS:
        return 'info';
      case TaskStatus.COMPLETED:
        return 'success';
      case TaskStatus.BLOCKED:
        return 'danger';
      default:
        return 'default';
    }
  };

  const getTaskStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case TaskStatus.TODO:
        return 'To Do';
      case TaskStatus.IN_PROGRESS:
        return 'In Progress';
      case TaskStatus.COMPLETED:
        return 'Completed';
      case TaskStatus.BLOCKED:
        return 'Blocked';
      default:
        return status;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const calculateProgress = () => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.status === MilestoneStatus.COMPLETED).length;
    return Math.round((completed / milestones.length) * 100);
  };

  const getTaskStats = () => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === TaskStatus.COMPLETED).length;
    const inProgress = tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const todo = tasks.filter(t => t.status === TaskStatus.TODO).length;
    
    return { total, completed, inProgress, todo };
  };

  if (isLoading) {
    return (
      <PageLayout
        header={
          <Header
            logo={
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-linear flex items-center justify-center">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">Renovator</span>
              </div>
            }
            actions={<UserDropdown />}
          />
        }
      >
        <Container>
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        </Container>
      </PageLayout>
    );
  }

  if (error || !project) {
    return (
      <PageLayout
        header={
          <Header
            logo={
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary-600 rounded-linear flex items-center justify-center">
                  <span className="text-white font-bold text-lg">R</span>
                </div>
                <span className="text-lg font-semibold text-gray-900">Renovator</span>
              </div>
            }
            actions={<UserDropdown />}
          />
        }
      >
        <Container>
          <Alert variant="danger" className="mb-6">
            {error || 'Project not found'}
          </Alert>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </Container>
      </PageLayout>
    );
  }

  const taskStats = getTaskStats();
  const progress = calculateProgress();

  return (
    <PageLayout
      header={
        <Header
          logo={
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-600 rounded-linear flex items-center justify-center">
                <span className="text-white font-bold text-lg">R</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">Renovator</span>
            </div>
          }
          actions={<UserDropdown />}
        />
      }
    >
      <Container>
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              ← Back
            </Button>
          </div>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                <Badge variant={getStatusBadgeVariant(project.status)}>
                  {getStatusLabel(project.status)}
                </Badge>
              </div>
              <p className="text-sm text-gray-600">
                Client: {project.clientName}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={handleEdit}>
                Edit Project
              </Button>
              {project.status !== ProjectStatus.ARCHIVED && (
                <Button
                  variant="secondary"
                  onClick={handleArchive}
                  loading={isArchiving}
                  disabled={isArchiving}
                >
                  Archive
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Information */}
            <Card>
              <CardHeader title="Project Information" />
              <CardContent>
                <div className="space-y-4">
                  {project.description && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Description</p>
                      <p className="text-sm text-gray-900">{project.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Start Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(project.startDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Estimated End Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(project.estimatedEndDate)}
                      </p>
                    </div>
                  </div>

                  {project.actualEndDate && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Actual End Date</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(project.actualEndDate)}
                      </p>
                    </div>
                  )}

                  <Divider />

                  <div className="grid grid-cols-2 gap-4">
                    {project.clientEmail && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Client Email</p>
                        <p className="text-sm text-gray-900">{project.clientEmail}</p>
                      </div>
                    )}
                    {project.clientPhone && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Client Phone</p>
                        <p className="text-sm text-gray-900">{project.clientPhone}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline and Milestones */}
            <Card>
              <CardHeader
                title="Timeline & Milestones"
                action={
                  <div className="flex items-center gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCreateMilestone}
                    >
                      Add Milestone
                    </Button>
                    <div className="text-sm text-gray-600">
                      Progress: {progress}%
                    </div>
                  </div>
                }
              />
              <CardContent>
                <MilestoneList 
                  milestones={milestones} 
                  showProgress={true}
                  onEdit={handleEditMilestone}
                  onComplete={handleCompleteMilestone}
                />
              </CardContent>
            </Card>

            {/* Tasks */}
            <Card id="tasks-section">
              <CardHeader 
                title="Tasks"
                action={
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAddFromLibrary}
                    >
                      Add from Library
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCreateTask}
                    >
                      Add Task
                    </Button>
                  </div>
                }
              />
              <CardContent>
                <TaskList 
                  tasks={tasks}
                  onEdit={handleEditTask}
                  onViewDetails={handleViewTaskDetails}
                  onStatusChange={handleTaskStatusChange}
                />
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader 
                title="Documents"
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDocumentUploadOpen}
                  >
                    Upload Document
                  </Button>
                }
              />
              <CardContent>
                <DocumentList 
                  key={documentsKey}
                  projectId={id!}
                  showCard={false}
                />
              </CardContent>
            </Card>

            {/* Photos */}
            <Card>
              <CardHeader 
                title="Photos"
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePhotoUploadOpen}
                  >
                    Upload Photos
                  </Button>
                }
              />
              <CardContent>
                <PhotoGallery 
                  key={photosKey}
                  projectId={id!}
                  showCard={false}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Budget Summary */}
            <Card>
              <CardHeader 
                title="Budget Summary"
                action={
                  budget ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleExportBudget}
                        loading={isExportingBudget}
                        disabled={isExportingBudget}
                      >
                        Export to PDF
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddBudgetItem}
                      >
                        Add Item
                      </Button>
                    </div>
                  ) : null
                }
              />
              <CardContent>
                {/* Success message */}
                {exportSuccess && (
                  <Alert variant="success" className="mb-4">
                    {exportSuccess}
                  </Alert>
                )}
                
                {!budget ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500 mb-4">No budget set</p>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCreateBudget}
                      loading={isCreatingBudget}
                      disabled={isCreatingBudget}
                    >
                      Create Budget
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Estimated</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(budget.totalEstimated)}
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Total Actual</p>
                      <p className="text-xl font-bold text-gray-900">
                        {formatCurrency(budget.totalActual)}
                      </p>
                      
                      {/* Breakdown of actual costs */}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">From Budget Items:</span>
                          <span className="font-medium text-gray-700">
                            {formatCurrency(budget.totalActualFromItems || 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">From Tasks:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">
                              {formatCurrency(budget.totalActualFromTasks || 0)}
                            </span>
                            {budget.totalActualFromTasks > 0 && (
                              <button
                                onClick={handleScrollToTasks}
                                className="text-primary-600 hover:text-primary-700 underline text-xs"
                              >
                                View
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Divider />

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Variance</p>
                      <p
                        className={`text-lg font-bold ${
                          budget.totalActual > budget.totalEstimated
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {formatCurrency(budget.totalActual - budget.totalEstimated)}
                      </p>
                    </div>

                    {budget.totalEstimated > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">Spent</p>
                        <p className="text-lg font-bold text-gray-900">
                          {Math.round((budget.totalActual / budget.totalEstimated) * 100)}%
                        </p>
                      </div>
                    )}

                    <Divider />

                    <div className="pt-1">
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={handleDeleteBudget}
                      >
                        Remove Budget
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Items */}
            {budget && budgetItems.length > 0 && (
              <Card>
                <CardHeader title="Budget Items" />
                <CardContent>
                  <BudgetItemsList 
                    items={budgetItems}
                    showCard={false}
                    onEditItem={handleEditBudgetItem}
                    onDeleteItem={handleDeleteBudgetItem}
                  />
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader title="Quick Stats" />
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Milestones</span>
                    <span className="text-sm font-medium text-gray-900">
                      {milestones.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Tasks</span>
                    <span className="text-sm font-medium text-gray-900">
                      {tasks.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Progress</span>
                    <span className="text-sm font-medium text-gray-900">
                      {progress}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Milestone Form Modal */}
        {id && (
          <MilestoneForm
            isOpen={isMilestoneFormOpen}
            onClose={handleMilestoneFormClose}
            onSuccess={handleMilestoneFormSuccess}
            projectId={id}
            existingMilestonesCount={milestones.length}
            milestone={editingMilestone}
          />
        )}

        {/* Task Form Modal */}
        {id && (
          <TaskForm
            isOpen={isTaskFormOpen}
            onClose={handleTaskFormClose}
            onSuccess={handleTaskFormSuccess}
            projectId={id}
            task={editingTask}
          />
        )}

        {/* Work Items Library Modal */}
        {id && (
          <WorkItemsLibraryModal
            isOpen={isWorkItemsModalOpen}
            onClose={handleWorkItemsModalClose}
            onSuccess={handleWorkItemsModalSuccess}
            projectId={id}
          />
        )}

        {/* Task Detail Modal */}
        <TaskDetail
          isOpen={isTaskDetailOpen}
          onClose={handleTaskDetailClose}
          task={selectedTask}
          onTaskUpdate={handleTaskUpdate}
          onStatusChange={handleTaskStatusChange}
          onTaskDelete={handleTaskDelete}
        />

        {/* Document Upload Modal */}
        {id && (
          <DocumentUpload
            isOpen={isDocumentUploadOpen}
            onClose={handleDocumentUploadClose}
            onSuccess={handleDocumentUploadSuccess}
            projectId={id}
          />
        )}

        {/* Photo Upload Modal */}
        {id && (
          <PhotoUpload
            isOpen={isPhotoUploadOpen}
            onClose={handlePhotoUploadClose}
            onSuccess={handlePhotoUploadSuccess}
            projectId={id}
            milestones={milestones}
          />
        )}

        {/* Budget Item Form Modal */}
        {budget && (
          <BudgetItemForm
            isOpen={isBudgetItemFormOpen}
            onClose={handleBudgetItemFormClose}
            onSuccess={handleBudgetItemFormSuccess}
            budgetId={budget.id}
            budgetItem={editingBudgetItem}
          />
        )}
      </Container>
    </PageLayout>
  );
};
