import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageLayout } from '../components/layout/Container';
import { Header } from '../components/layout/Header';
import { Container } from '../components/layout/Container';
import { Card, CardHeader, CardContent } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { UserDropdown } from '../components/UserDropdown';
import { LanguageSwitcher } from '../components/LanguageSwitcher';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../utils/api';

interface ProjectFormData {
  name: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  description: string;
  startDate: string;
  estimatedEndDate: string;
  status: string;
}

interface FormErrors {
  name?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  startDate?: string;
  estimatedEndDate?: string;
}

export const ProjectForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useTranslation();
  const isEditMode = !!id;

  const PROJECT_STATUS_OPTIONS = [
    { value: 'planning', label: t('projectStatus.planning') },
    { value: 'active', label: t('projectStatus.active') },
    { value: 'on_hold', label: t('projectStatus.on_hold') },
    { value: 'completed', label: t('projectStatus.completed') },
  ];

  const [formData, setFormData] = useState<ProjectFormData>({
    name: '',
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    description: '',
    startDate: '',
    estimatedEndDate: '',
    status: 'planning',
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      setIsFetching(true);
      const project = await apiClient.get<any>(`/api/projects/${id}`);
      
      setFormData({
        name: project.name,
        clientName: project.clientName,
        clientEmail: project.clientEmail || '',
        clientPhone: project.clientPhone || '',
        description: project.description || '',
        startDate: project.startDate.split('T')[0],
        estimatedEndDate: project.estimatedEndDate.split('T')[0],
        status: project.status,
      });
    } catch (err) {
      console.error('Error loading project:', err);
      setSubmitError('Failed to load project. Please try again.');
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = t('projectForm.validation.nameRequired');
    }

    if (!formData.clientName.trim()) {
      newErrors.clientName = t('projectForm.validation.clientNameRequired');
    }

    if (!formData.startDate) {
      newErrors.startDate = t('projectForm.validation.startDateRequired');
    }

    if (!formData.estimatedEndDate) {
      newErrors.estimatedEndDate = t('projectForm.validation.endDateRequired');
    }

    // Email validation (if provided)
    if (formData.clientEmail && !isValidEmail(formData.clientEmail)) {
      newErrors.clientEmail = t('projectForm.validation.invalidEmail');
    }

    // Date validation
    if (formData.startDate && formData.estimatedEndDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.estimatedEndDate);
      
      if (endDate < startDate) {
        newErrors.estimatedEndDate = t('projectForm.validation.endDateAfterStart');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Validate form
    if (!validateForm()) {
      // Scroll to first error
      const firstError = document.querySelector('[class*="text-red-600"]');
      if (firstError) {
        firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    try {
      setIsLoading(true);

      const payload = {
        name: formData.name.trim(),
        clientName: formData.clientName.trim(),
        clientEmail: formData.clientEmail.trim() || undefined,
        clientPhone: formData.clientPhone.trim() || undefined,
        description: formData.description.trim() || undefined,
        startDate: formData.startDate,
        estimatedEndDate: formData.estimatedEndDate,
        status: formData.status,
      };

      if (isEditMode) {
        await apiClient.put(`/api/projects/${id}`, payload);
      } else {
        await apiClient.post('/api/projects', payload);
      }

      // Navigate back to dashboard on success
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Error saving project:', err);
      setSubmitError(
        err.message || `Failed to ${isEditMode ? 'update' : 'create'} project. Please try again.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/dashboard');
  };

  if (isFetching) {
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
      <Container size="md">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {isEditMode ? t('projectForm.editTitle') : t('projectForm.createTitle')}
          </h1>
          <p className="text-sm text-gray-600">
            {isEditMode
              ? t('projectForm.editSubtitle')
              : t('projectForm.createSubtitle')}
          </p>
        </div>

        <Card>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {submitError && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-linear">
                  <p className="text-sm text-red-600">{submitError}</p>
                </div>
              )}

              {/* Project Information Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  {t('projectForm.projectInformation')}
                </h3>
                <div className="space-y-4">
                  <Input
                    label={t('projectForm.projectName')}
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    error={errors.name}
                    placeholder={t('projectForm.projectNamePlaceholder')}
                    fullWidth
                    required
                  />

                  <Textarea
                    label={t('common.description')}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder={t('projectForm.descriptionPlaceholder')}
                    rows={4}
                    fullWidth
                  />

                  <Select
                    label={t('common.status')}
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    options={PROJECT_STATUS_OPTIONS}
                    fullWidth
                  />
                </div>
              </div>

              {/* Client Information Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  {t('projectForm.clientInformation')}
                </h3>
                <div className="space-y-4">
                  <Input
                    label={t('projectForm.clientName')}
                    name="clientName"
                    value={formData.clientName}
                    onChange={handleChange}
                    error={errors.clientName}
                    placeholder={t('projectForm.clientNamePlaceholder')}
                    fullWidth
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label={t('projectForm.clientEmail')}
                      name="clientEmail"
                      type="email"
                      value={formData.clientEmail}
                      onChange={handleChange}
                      error={errors.clientEmail}
                      placeholder={t('projectForm.clientEmailPlaceholder')}
                      fullWidth
                    />

                    <Input
                      label={t('projectForm.clientPhone')}
                      name="clientPhone"
                      type="tel"
                      value={formData.clientPhone}
                      onChange={handleChange}
                      error={errors.clientPhone}
                      placeholder={t('projectForm.clientPhonePlaceholder')}
                      fullWidth
                    />
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-4">
                  {t('projectForm.projectTimeline')}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label={t('projectForm.startDate')}
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleChange}
                    error={errors.startDate}
                    fullWidth
                    required
                  />

                  <Input
                    label={t('projectForm.estimatedEndDate')}
                    name="estimatedEndDate"
                    type="date"
                    value={formData.estimatedEndDate}
                    onChange={handleChange}
                    error={errors.estimatedEndDate}
                    fullWidth
                    required
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={isLoading}
                  disabled={isLoading}
                >
                  {isEditMode ? t('projectForm.updateButton') : t('projectForm.createButton')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </Container>
    </PageLayout>
  );
};
