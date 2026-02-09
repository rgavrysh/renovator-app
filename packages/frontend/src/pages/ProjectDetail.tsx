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
import { MilestoneList } from '../components/MilestoneList';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/api';

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

interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  targetDate: string;
  completedDate?: string;
  status: MilestoneStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
}

enum MilestoneStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
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
  createdAt: string;
  updatedAt: string;
}

export const ProjectDetail: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user, logout } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [budget, setBudget] = useState<Budget | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);

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
      } catch (err) {
        // Budget might not exist yet, that's okay
        console.log('No budget found for project');
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
            actions={
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {user?.firstName} {user?.lastName}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            }
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
            actions={
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  {user?.firstName} {user?.lastName}
                </span>
                <Button variant="ghost" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            }
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
          actions={
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600">
                {user?.firstName} {user?.lastName}
              </span>
              <Button variant="ghost" size="sm" onClick={logout}>
                Logout
              </Button>
            </div>
          }
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
                  <div className="text-sm text-gray-600">
                    Progress: {progress}%
                  </div>
                }
              />
              <CardContent>
                <MilestoneList milestones={milestones} showProgress={true} />
              </CardContent>
            </Card>

            {/* Tasks Summary */}
            <Card>
              <CardHeader title="Tasks" />
              <CardContent>
                {tasks.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No tasks yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Task Statistics */}
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900">{taskStats.total}</p>
                        <p className="text-xs text-gray-500">Total</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-600">{taskStats.completed}</p>
                        <p className="text-xs text-gray-500">Completed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-blue-600">{taskStats.inProgress}</p>
                        <p className="text-xs text-gray-500">In Progress</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-600">{taskStats.todo}</p>
                        <p className="text-xs text-gray-500">To Do</p>
                      </div>
                    </div>

                    <Divider />

                    {/* Recent Tasks */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Tasks</h4>
                      <div className="space-y-2">
                        {tasks.slice(0, 5).map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-2 rounded-linear hover:bg-gray-50"
                          >
                            <div className="flex-1">
                              <p className="text-sm font-medium text-gray-900">{task.name}</p>
                              {task.dueDate && (
                                <p className="text-xs text-gray-500">
                                  Due: {formatDate(task.dueDate)}
                                </p>
                              )}
                            </div>
                            <Badge
                              variant={getTaskStatusBadgeVariant(task.status)}
                              size="sm"
                            >
                              {getTaskStatusLabel(task.status)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      {tasks.length > 5 && (
                        <p className="text-xs text-gray-500 mt-2 text-center">
                          And {tasks.length - 5} more tasks...
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
            {/* Budget Summary */}
            <Card>
              <CardHeader title="Budget Summary" />
              <CardContent>
                {!budget ? (
                  <div className="text-center py-8">
                    <p className="text-sm text-gray-500">No budget set</p>
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
                  </div>
                )}
              </CardContent>
            </Card>

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
      </Container>
    </PageLayout>
  );
};
