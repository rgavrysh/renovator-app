import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageLayout } from '../components/layout/Container';
import { Header } from '../components/layout/Header';
import { Container } from '../components/layout/Container';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { Alert } from '../components/ui/Alert';
import { Divider } from '../components/ui/Divider';
import { formatCurrency } from '../utils/currency';
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
import { BudgetItemsList, BudgetItem } from '../components/BudgetItemsList';
import { BudgetItemForm } from '../components/BudgetItemForm';
import { Modal, ModalFooter } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { UserDropdown } from '../components/UserDropdown';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { getAccessToken } from '../contexts/AuthContext';
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
  price?: number;
  amount?: number;
  unit?: string;
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
  const { t, i18n } = useTranslation();

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isCreatingBudget, setIsCreatingBudget] = useState(false);
  const [isRecalculatingTasks, setIsRecalculatingTasks] = useState(false);
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
  const [isExportMilestoneSelectOpen, setIsExportMilestoneSelectOpen] = useState(false);
  const [exportMilestoneId, setExportMilestoneId] = useState<string>('');
  const [isEditingEstimatedBudget, setIsEditingEstimatedBudget] = useState(false);
  const [estimatedBudgetInput, setEstimatedBudgetInput] = useState<string>('');
  const [isSavingEstimatedBudget, setIsSavingEstimatedBudget] = useState(false);
  const [createBudgetEstimated, setCreateBudgetEstimated] = useState<string>('');

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
    if (!project || !window.confirm(t('projectDetail.archiveConfirm'))) {
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

  const handleTaskDetailClose = () => {
    setIsTaskDetailOpen(false);
    setSelectedTask(null);
  };

  const handleTaskDelete = async (_taskId: string) => {
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

  const updateTaskLocally = (taskId: string, patch: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, ...patch } : t))
    );
    if (selectedTask?.id === taskId) {
      setSelectedTask((prev) => (prev ? { ...prev, ...patch } : prev));
    }
  };

  const refreshTasks = async () => {
    if (!id) return;
    try {
      const tasksData = await apiClient.get<Task[]>(`/api/projects/${id}/tasks`);
      setTasks(tasksData);
    } catch {
      // silently ignore — local state is already updated optimistically
    }
  };

  const handleTaskStatusChange = async (task: Task, newStatus: TaskStatus) => {
    const completedDate = newStatus === TaskStatus.COMPLETED ? new Date().toISOString() : undefined;
    updateTaskLocally(task.id, {
      status: newStatus,
      ...(completedDate ? { completedDate } : { completedDate: undefined }),
    });

    try {
      await apiClient.put(`/api/tasks/${task.id}`, {
        status: newStatus,
        completedDate: completedDate ?? null,
      });
      await refreshTasks();
    } catch (err: any) {
      updateTaskLocally(task.id, { status: task.status, completedDate: task.completedDate });
      console.error('Error updating task status:', err);
      setError(err.message || 'Failed to update task status. Please try again.');
    }
  };

  const handleDeleteTaskFromList = async (task: Task) => {
    if (!globalThis.confirm(t('taskDetail.deleteConfirm', { name: task.name }))) {
      return;
    }
    setTasks((prev) => prev.filter((t) => t.id !== task.id));
    try {
      await apiClient.delete(`/api/tasks/${task.id}`);
      await loadProjectData();
    } catch (err: any) {
      setTasks((prev) => [...prev, task]);
      console.error('Error deleting task:', err);
      setError(err.message || 'Failed to delete task. Please try again.');
    }
  };

  const handleTaskAmountChange = async (task: Task, newAmount: number) => {
    const newActualPrice = (task.price ?? 0) * newAmount;
    updateTaskLocally(task.id, { amount: newAmount, actualPrice: newActualPrice });

    try {
      await apiClient.put(`/api/tasks/${task.id}`, { amount: newAmount });
      await refreshTasks();
    } catch (err: any) {
      updateTaskLocally(task.id, { amount: task.amount, actualPrice: task.actualPrice });
      console.error('Error updating task amount:', err);
      setError(err.message || 'Failed to update task amount. Please try again.');
    }
  };

  const handleTaskPriorityChange = async (task: Task, newPriority: TaskPriority) => {
    updateTaskLocally(task.id, { priority: newPriority });

    try {
      await apiClient.put(`/api/tasks/${task.id}`, { priority: newPriority });
      await refreshTasks();
    } catch (err: any) {
      updateTaskLocally(task.id, { priority: task.priority });
      console.error('Error updating task priority:', err);
      setError(err.message || 'Failed to update task priority. Please try again.');
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
      const payload: any = {};
      if (createBudgetEstimated) {
        const parsed = parseFloat(createBudgetEstimated);
        if (!isNaN(parsed) && parsed >= 0) {
          payload.totalEstimated = parsed;
        }
      }
      const newBudget = await apiClient.post<Budget>(`/api/projects/${id}/budget`, payload);
      setBudget(newBudget);
      setBudgetItems([]);
      setCreateBudgetEstimated('');
    } catch (err: any) {
      console.error('Error creating budget:', err);
      setError(err.message || 'Failed to create budget. Please try again.');
    } finally {
      setIsCreatingBudget(false);
    }
  };

  const handleStartEditEstimatedBudget = () => {
    setEstimatedBudgetInput(budget ? String(budget.totalEstimated) : '0');
    setIsEditingEstimatedBudget(true);
  };

  const handleSaveEstimatedBudget = async () => {
    if (!id || !budget) return;

    const parsed = parseFloat(estimatedBudgetInput);
    if (isNaN(parsed) || parsed < 0) return;

    try {
      setIsSavingEstimatedBudget(true);
      const updatedBudget = await apiClient.put<Budget>(`/api/projects/${id}/budget`, {
        totalEstimated: parsed,
      });
      setBudget(updatedBudget);
      setIsEditingEstimatedBudget(false);
    } catch (err: any) {
      console.error('Error updating estimated budget:', err);
      setError(err.message || 'Failed to update estimated budget.');
    } finally {
      setIsSavingEstimatedBudget(false);
    }
  };

  const handleCancelEditEstimatedBudget = () => {
    setIsEditingEstimatedBudget(false);
  };

  const handleRecalculateTasksCosts = async () => {
    if (!id || !budget) return;
    
    try {
      setIsRecalculatingTasks(true);
      const updatedBudget = await apiClient.post<Budget>(`/api/projects/${id}/budget/recalculate-tasks`);
      setBudget(updatedBudget);
      // Also reload budget items in case they changed
      if (updatedBudget && updatedBudget.id) {
        setBudgetItems((updatedBudget as any).items || budgetItems);
      }
    } catch (err: any) {
      console.error('Error recalculating tasks costs:', err);
      setError(err.message || 'Failed to recalculate tasks costs. Please try again.');
    } finally {
      setIsRecalculatingTasks(false);
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
    if (!window.confirm(t('projectDetail.deleteBudgetItemConfirm', { name: item.name }))) {
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

    if (!window.confirm(t('projectDetail.removeBudgetConfirm'))) {
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

  const handleExportBudgetClick = () => {
    if (!id || !budget) return;
    if (milestones.length > 0) {
      setExportMilestoneId('');
      setIsExportMilestoneSelectOpen(true);
    } else {
      doExportBudget();
    }
  };

  const handleExportWithMilestone = () => {
    setIsExportMilestoneSelectOpen(false);
    doExportBudget(exportMilestoneId || undefined);
  };

  const doExportBudget = async (milestoneId?: string) => {
    if (!id || !budget) return;
    
    try {
      setIsExportingBudget(true);
      setError(null);
      setExportSuccess(null);
      
      const accessToken = getAccessToken();
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      
      const currentLang = i18n.language?.startsWith('uk') ? 'uk' : 'en';
      let url = `${config.api.url}/api/projects/${id}/budget/export?lang=${currentLang}`;
      if (milestoneId) {
        url += `&milestoneId=${milestoneId}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export budget');
      }

      const blob = await response.blob();
      
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      const milestoneSuffix = milestoneId 
        ? `-${milestones.find(m => m.id === milestoneId)?.name || 'milestone'}` 
        : '';
      link.download = `${project?.name || 'project'}-budget${milestoneSuffix}-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      setExportSuccess(t('projectDetail.budgetExportSuccess'));
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
    return t(`projectStatus.${status}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = i18n.language === 'uk' ? 'uk-UA' : 'en-US';
    return date.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const fmtCurrency = (amount: number) => formatCurrency(amount, i18n.language);

  const calculateProgress = () => {
    if (milestones.length === 0) return 0;
    const completed = milestones.filter(m => m.status === MilestoneStatus.COMPLETED).length;
    return Math.round((completed / milestones.length) * 100);
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
                <span className="text-lg font-semibold text-gray-900">{t('app.name')}</span>
              </div>
            }
            actions={<><LanguageSwitcher /><UserDropdown /></>}
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
                <span className="text-lg font-semibold text-gray-900">{t('app.name')}</span>
              </div>
            }
            actions={<><LanguageSwitcher /><UserDropdown /></>}
          />
        }
      >
        <Container>
          <Alert variant="danger" className="mb-6">
            {error || t('projectDetail.projectNotFound')}
          </Alert>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            {t('projectDetail.backToDashboard')}
          </Button>
        </Container>
      </PageLayout>
    );
  }

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
              <span className="text-lg font-semibold text-gray-900">{t('app.name')}</span>
            </div>
          }
          actions={<><LanguageSwitcher /><UserDropdown /></>}
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
              ← {t('common.back')}
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
                {t('projectDetail.client')}: {project.clientName}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              <Button variant="secondary" onClick={handleEdit}>
                {t('projectDetail.editProject')}
              </Button>
              {project.status !== ProjectStatus.ARCHIVED && (
                <Button
                  variant="secondary"
                  onClick={handleArchive}
                  loading={isArchiving}
                  disabled={isArchiving}
                >
                  {t('projectDetail.archive')}
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
              <CardHeader title={t('projectDetail.projectInformation')} />
              <CardContent>
                <div className="space-y-4">
                  {project.description && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('common.description')}</p>
                      <p className="text-sm text-gray-900">{project.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('projectDetail.startDate')}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(project.startDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('projectDetail.estimatedEndDate')}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(project.estimatedEndDate)}
                      </p>
                    </div>
                  </div>

                  {project.actualEndDate && (
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('projectDetail.actualEndDate')}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {formatDate(project.actualEndDate)}
                      </p>
                    </div>
                  )}

                  <Divider />

                  <div className="grid grid-cols-2 gap-4">
                    {project.clientEmail && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t('projectDetail.clientEmail')}</p>
                        <p className="text-sm text-gray-900">{project.clientEmail}</p>
                      </div>
                    )}
                    {project.clientPhone && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t('projectDetail.clientPhone')}</p>
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
                title={t('projectDetail.timelineMilestones')}
                action={
                  <div className="flex items-center gap-3">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCreateMilestone}
                    >
                      {t('projectDetail.addMilestone')}
                    </Button>
                    <div className="text-sm text-gray-600">
                      {t('projectDetail.progress')}: {progress}%
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
                title={t('projectDetail.tasks')}
                action={
                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={handleAddFromLibrary}
                    >
                      {t('projectDetail.addFromLibrary')}
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCreateTask}
                    >
                      {t('projectDetail.addTask')}
                    </Button>
                  </div>
                }
              />
              <CardContent>
                <TaskList 
                  tasks={tasks}
                  onEdit={handleEditTask}
                  onDelete={handleDeleteTaskFromList}
                  onStatusChange={handleTaskStatusChange}
                  onPriorityChange={handleTaskPriorityChange}
                  onAmountChange={handleTaskAmountChange}
                />
              </CardContent>
            </Card>

            {/* Documents */}
            <Card>
              <CardHeader 
                title={t('projectDetail.documents')}
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDocumentUploadOpen}
                  >
                    {t('projectDetail.uploadDocument')}
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
                title={t('projectDetail.photos')}
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handlePhotoUploadOpen}
                  >
                    {t('projectDetail.uploadPhotos')}
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
                title={t('projectDetail.budgetSummary')}
                action={
                  budget ? (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleExportBudgetClick}
                        loading={isExportingBudget}
                        disabled={isExportingBudget}
                      >
                        {t('projectDetail.exportToPdf')}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleAddBudgetItem}
                      >
                        {t('projectDetail.addItem')}
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
                  <div className="py-4 space-y-4">
                    <p className="text-sm text-gray-500">{t('projectDetail.noBudgetSet')}</p>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">
                        {t('projectDetail.estimatedBudget')} ({t('projectDetail.optional')})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={createBudgetEstimated}
                        onChange={(e) => setCreateBudgetEstimated(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleCreateBudget}
                      loading={isCreatingBudget}
                      disabled={isCreatingBudget}
                    >
                      {t('projectDetail.createBudget')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-500">{t('projectDetail.totalEstimated')}</p>
                        {!isEditingEstimatedBudget && (
                          <button
                            onClick={handleStartEditEstimatedBudget}
                            className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                            title={t('common.edit')}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {isEditingEstimatedBudget ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={estimatedBudgetInput}
                            onChange={(e) => setEstimatedBudgetInput(e.target.value)}
                            className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEstimatedBudget();
                              if (e.key === 'Escape') handleCancelEditEstimatedBudget();
                            }}
                          />
                          <button
                            onClick={handleSaveEstimatedBudget}
                            disabled={isSavingEstimatedBudget}
                            className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                          <button
                            onClick={handleCancelEditEstimatedBudget}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <p className="text-xl font-bold text-gray-900">
                          {budget.totalEstimated > 0 ? fmtCurrency(budget.totalEstimated) : t('projectDetail.notSet')}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('projectDetail.totalActual')}</p>
                      <p className="text-xl font-bold text-gray-900">
                        {fmtCurrency(budget.totalActual)}
                      </p>
                      
                      {/* Breakdown of actual costs */}
                      <div className="mt-2 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-500">{t('projectDetail.fromBudgetItems')}</span>
                          <span className="font-medium text-gray-700">
                            {fmtCurrency(budget.totalActualFromItems || 0)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <span className="text-gray-500">{t('projectDetail.fromTasks')}</span>
                            <button
                              onClick={handleRecalculateTasksCosts}
                              disabled={isRecalculatingTasks}
                              className="p-0.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
                              title={t('projectDetail.recalculateTasksCosts')}
                            >
                              <svg
                                className={`w-3.5 h-3.5 ${isRecalculatingTasks ? 'animate-spin' : ''}`}
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-700">
                              {fmtCurrency(budget.totalActualFromTasks || 0)}
                            </span>
                            {budget.totalActualFromTasks > 0 && (
                              <button
                                onClick={handleScrollToTasks}
                                className="text-primary-600 hover:text-primary-700 underline text-xs"
                              >
                                {t('common.view')}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <Divider />

                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('projectDetail.variance')}</p>
                      <p
                        className={`text-lg font-bold ${
                          budget.totalActual > budget.totalEstimated
                            ? 'text-red-600'
                            : 'text-green-600'
                        }`}
                      >
                        {fmtCurrency(budget.totalActual - budget.totalEstimated)}
                      </p>
                    </div>

                    {budget.totalEstimated > 0 && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t('projectDetail.spent')}</p>
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
                        {t('projectDetail.removeBudget')}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Budget Items */}
            {budget && budgetItems.length > 0 && (
              <Card>
                <CardHeader title={t('projectDetail.budgetItems')} />
                <CardContent>
                  <BudgetItemsList 
                    items={budgetItems}
                    milestones={milestones}
                    showCard={false}
                    onEditItem={handleEditBudgetItem}
                    onDeleteItem={handleDeleteBudgetItem}
                  />
                </CardContent>
              </Card>
            )}

            {/* Quick Stats */}
            <Card>
              <CardHeader title={t('projectDetail.quickStats')} />
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('projectDetail.milestones')}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {milestones.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('projectDetail.tasks')}</span>
                    <span className="text-sm font-medium text-gray-900">
                      {tasks.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{t('projectDetail.progress')}</span>
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
        {budget && id && (
          <BudgetItemForm
            isOpen={isBudgetItemFormOpen}
            onClose={handleBudgetItemFormClose}
            onSuccess={handleBudgetItemFormSuccess}
            budgetId={budget.id}
            projectId={id}
            budgetItem={editingBudgetItem}
          />
        )}

        {/* Export Milestone Selection Modal */}
        <Modal
          isOpen={isExportMilestoneSelectOpen}
          onClose={() => setIsExportMilestoneSelectOpen(false)}
          title={t('projectDetail.exportToPdf')}
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{t('projectDetail.exportMilestoneHint')}</p>
            <Select
              label={t('projectDetail.exportMilestone')}
              name="exportMilestoneId"
              value={exportMilestoneId}
              onChange={(e) => setExportMilestoneId(e.target.value)}
              options={[
                { value: '', label: t('projectDetail.allProject') },
                ...milestones.map((m) => ({ value: m.id, label: m.name })),
              ]}
              fullWidth
            />
          </div>
          <ModalFooter>
            <Button
              variant="secondary"
              onClick={() => setIsExportMilestoneSelectOpen(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="primary"
              onClick={handleExportWithMilestone}
              loading={isExportingBudget}
            >
              {t('projectDetail.exportToPdf')}
            </Button>
          </ModalFooter>
        </Modal>
      </Container>
    </PageLayout>
  );
};
