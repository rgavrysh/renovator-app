import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Textarea,
  Card,
  CardHeader,
  CardContent,
  Modal,
  ModalFooter,
  Badge,
  Alert,
  Checkbox,
  Divider,
  EmptyState,
  Loading,
  Spinner,
} from '../components/ui';
import {
  Container,
  Header,
  HeaderNavItem,
  Sidebar,
  SidebarSection,
  SidebarItem,
  PageLayout,
} from '../components/layout';

export const ComponentShowcase: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  return (
    <PageLayout
      header={
        <Header
          logo={
            <div className="text-xl font-bold text-gray-900">
              Renovator
            </div>
          }
          navigation={
            <>
              <HeaderNavItem href="#" active>Dashboard</HeaderNavItem>
              <HeaderNavItem href="#">Projects</HeaderNavItem>
              <HeaderNavItem href="#">Components</HeaderNavItem>
            </>
          }
          actions={
            <>
              <Button variant="ghost" size="sm">Help</Button>
              <Button variant="primary" size="sm">New Project</Button>
            </>
          }
        />
      }
      sidebar={
        <Sidebar>
          <SidebarSection title="Main">
            <SidebarItem href="#" active icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            }>
              Dashboard
            </SidebarItem>
            <SidebarItem href="#" icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            } badge={<Badge variant="primary" size="sm">3</Badge>}>
              Projects
            </SidebarItem>
          </SidebarSection>
        </Sidebar>
      }
    >
      <Container>
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Component Showcase</h1>

        {/* Alerts */}
        {showAlert && (
          <div className="mb-8">
            <Alert variant="info" title="Component Library" onClose={() => setShowAlert(false)}>
              This is a showcase of all available UI components in the Linear-inspired design system.
            </Alert>
          </div>
        )}

        {/* Buttons */}
        <Card className="mb-8">
          <CardHeader title="Buttons" subtitle="Various button styles and sizes" />
          <CardContent>
            <div className="space-y-4">
              <div className="flex gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
                <Button variant="danger">Danger</Button>
              </div>
              <div className="flex gap-3">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
              </div>
              <div className="flex gap-3">
                <Button variant="primary" loading>Loading</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Inputs */}
        <Card className="mb-8">
          <CardHeader title="Form Inputs" subtitle="Text inputs, selects, and textareas" />
          <CardContent>
            <div className="space-y-4 max-w-md">
              <Input
                label="Project Name"
                placeholder="Enter project name"
                helperText="This will be visible to clients"
              />
              <Input
                label="Email"
                type="email"
                error="Please enter a valid email address"
              />
              <Select
                label="Project Status"
                options={[
                  { value: 'planning', label: 'Planning' },
                  { value: 'active', label: 'Active' },
                  { value: 'completed', label: 'Completed' },
                ]}
              />
              <Textarea
                label="Description"
                placeholder="Enter project description"
                rows={4}
              />
              <Checkbox label="Send email notifications" helperText="Receive updates about this project" />
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card className="mb-8">
          <CardHeader title="Badges" subtitle="Status indicators and labels" />
          <CardContent>
            <div className="flex gap-3 flex-wrap">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Modal */}
        <Card className="mb-8">
          <CardHeader title="Modal" subtitle="Dialog and modal windows" />
          <CardContent>
            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
            <Modal
              isOpen={isModalOpen}
              onClose={() => setIsModalOpen(false)}
              title="Create New Project"
              size="md"
            >
              <div className="space-y-4">
                <Input label="Project Name" placeholder="Kitchen Renovation" fullWidth />
                <Input label="Client Name" placeholder="John Doe" fullWidth />
                <Textarea label="Description" placeholder="Project details..." rows={4} fullWidth />
              </div>
              <ModalFooter>
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => setIsModalOpen(false)}>Create Project</Button>
              </ModalFooter>
            </Modal>
          </CardContent>
        </Card>

        {/* Loading States */}
        <Card className="mb-8">
          <CardHeader title="Loading States" subtitle="Spinners and loading indicators" />
          <CardContent>
            <div className="space-y-6">
              <div className="flex gap-4 items-center">
                <Spinner size="sm" className="text-primary-600" />
                <Spinner size="md" className="text-primary-600" />
                <Spinner size="lg" className="text-primary-600" />
              </div>
              <Divider />
              <Loading text="Loading projects..." />
            </div>
          </CardContent>
        </Card>

        {/* Empty State */}
        <Card className="mb-8">
          <CardHeader title="Empty State" subtitle="No data placeholders" />
          <CardContent>
            <EmptyState
              icon={
                <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="No projects yet"
              description="Get started by creating your first renovation project"
              action={<Button variant="primary">Create Project</Button>}
            />
          </CardContent>
        </Card>

        {/* Alerts */}
        <Card className="mb-8">
          <CardHeader title="Alerts" subtitle="Notification messages" />
          <CardContent>
            <div className="space-y-4">
              <Alert variant="info" title="Information">
                This is an informational message.
              </Alert>
              <Alert variant="success" title="Success">
                Your project has been created successfully.
              </Alert>
              <Alert variant="warning" title="Warning">
                Budget is approaching the limit.
              </Alert>
              <Alert variant="danger" title="Error">
                Failed to save changes. Please try again.
              </Alert>
            </div>
          </CardContent>
        </Card>
      </Container>
    </PageLayout>
  );
};
