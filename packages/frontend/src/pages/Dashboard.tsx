import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageLayout } from '../components/layout/Container';
import { Header } from '../components/layout/Header';
import { Container } from '../components/layout/Container';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState } from '../components/ui/EmptyState';
import { Spinner } from '../components/ui/Spinner';
import { UserDropdown } from '../components/UserDropdown';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
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

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    // Filter projects based on search query
    if (searchQuery.trim() === '') {
      setFilteredProjects(projects);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = projects.filter(
        (project) =>
          project.name.toLowerCase().includes(query) ||
          project.clientName.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query)
      );
      setFilteredProjects(filtered);
    }
  }, [searchQuery, projects]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch active projects (exclude archived and completed)
      const data = await apiClient.get<Project[]>(
        '/api/projects?status=planning,active,on_hold'
      );
      
      setProjects(data);
      setFilteredProjects(data);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load projects. Please try again.');
    } finally {
      setIsLoading(false);
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

  const handleProjectClick = (projectId: string) => {
    navigate(`/projects/${projectId}`);
  };

  const handleCreateProject = () => {
    navigate('/projects/new');
  };

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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('dashboard.title')}</h1>
          <p className="text-sm text-gray-600">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="mb-6 flex items-center gap-4">
          <div className="flex-1">
            <Input
              type="text"
              placeholder={t('dashboard.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              fullWidth
            />
          </div>
          <Button variant="primary" onClick={handleCreateProject}>
            {t('dashboard.newProject')}
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Spinner size="lg" />
          </div>
        ) : error ? (
          <Card>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-red-600 mb-4">{error}</p>
                <Button variant="primary" onClick={loadProjects}>
                  {t('common.retry')}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : filteredProjects.length === 0 ? (
          <Card>
            <CardContent>
              <EmptyState
                title={
                  searchQuery
                    ? t('dashboard.noProjectsFound')
                    : t('dashboard.noActiveProjects')
                }
                description={
                  searchQuery
                    ? t('dashboard.adjustSearch')
                    : t('dashboard.getStarted')
                }
                action={
                  !searchQuery && (
                    <Button variant="primary" onClick={handleCreateProject}>
                      {t('dashboard.createProject')}
                    </Button>
                  )
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <Card
                key={project.id}
                hover
                className="cursor-pointer"
                onClick={() => handleProjectClick(project.id)}
              >
                <CardHeader
                  title={project.name}
                  action={
                    <Badge
                      variant={getStatusBadgeVariant(project.status)}
                      size="sm"
                    >
                      {getStatusLabel(project.status)}
                    </Badge>
                  }
                />
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">{t('dashboard.client')}</p>
                      <p className="text-sm font-medium text-gray-900">
                        {project.clientName}
                      </p>
                    </div>

                    {project.description && (
                      <div>
                        <p className="text-xs text-gray-500 mb-1">{t('common.description')}</p>
                        <p className="text-sm text-gray-700 line-clamp-2">
                          {project.description}
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500">{t('dashboard.startDate')}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(project.startDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{t('dashboard.estEnd')}</p>
                        <p className="text-sm font-medium text-gray-900">
                          {formatDate(project.estimatedEndDate)}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && !error && filteredProjects.length > 0 && (
          <div className="mt-6 text-center text-sm text-gray-500">
            {t('dashboard.showingProjects', { filtered: filteredProjects.length, total: projects.length })}
          </div>
        )}
      </Container>
    </PageLayout>
  );
};
