# Linear-Inspired UI Component Library

A clean, minimalist component library inspired by Linear's design system, built with React, TypeScript, and Tailwind CSS.

## Design Principles

- **Simplicity First**: Clean, intuitive interfaces with minimal visual noise
- **Consistency**: Unified design language across all components
- **Accessibility**: WCAG-compliant components with proper ARIA attributes
- **Performance**: Lightweight components with minimal dependencies
- **Flexibility**: Customizable through props and Tailwind classes

## Components

### UI Components

#### Button
Versatile button component with multiple variants and sizes.

```tsx
import { Button } from '@/components/ui';

<Button variant="primary" size="md" onClick={handleClick}>
  Click me
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'ghost' | 'danger'
- `size`: 'sm' | 'md' | 'lg'
- `fullWidth`: boolean
- `loading`: boolean
- `disabled`: boolean

#### Input
Text input with label, error, and helper text support.

```tsx
import { Input } from '@/components/ui';

<Input
  label="Email"
  placeholder="Enter your email"
  error="Invalid email"
  helperText="We'll never share your email"
  fullWidth
/>
```

**Props:**
- `label`: string
- `error`: string
- `helperText`: string
- `fullWidth`: boolean
- All standard HTML input attributes

#### Select
Dropdown select component with label and error support.

```tsx
import { Select } from '@/components/ui';

<Select
  label="Status"
  options={[
    { value: 'active', label: 'Active' },
    { value: 'completed', label: 'Completed' }
  ]}
/>
```

#### Textarea
Multi-line text input with label and error support.

```tsx
import { Textarea } from '@/components/ui';

<Textarea
  label="Description"
  rows={4}
  placeholder="Enter description"
/>
```

#### Card
Container component with optional header and content sections.

```tsx
import { Card, CardHeader, CardContent } from '@/components/ui';

<Card padding="md" hover>
  <CardHeader 
    title="Project Details" 
    subtitle="View and edit project information"
    action={<Button size="sm">Edit</Button>}
  />
  <CardContent>
    {/* Card content */}
  </CardContent>
</Card>
```

**Props:**
- `padding`: 'none' | 'sm' | 'md' | 'lg'
- `hover`: boolean (adds hover effect)

#### Modal
Dialog component with backdrop and close functionality.

```tsx
import { Modal, ModalFooter } from '@/components/ui';

<Modal
  isOpen={isOpen}
  onClose={handleClose}
  title="Create Project"
  size="md"
>
  {/* Modal content */}
  <ModalFooter>
    <Button variant="ghost" onClick={handleClose}>Cancel</Button>
    <Button variant="primary" onClick={handleSubmit}>Save</Button>
  </ModalFooter>
</Modal>
```

**Props:**
- `isOpen`: boolean
- `onClose`: () => void
- `title`: string
- `size`: 'sm' | 'md' | 'lg' | 'xl'
- `showCloseButton`: boolean

#### Badge
Small status indicator or label.

```tsx
import { Badge } from '@/components/ui';

<Badge variant="success" size="md">Active</Badge>
```

**Props:**
- `variant`: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info'
- `size`: 'sm' | 'md'

#### Alert
Notification message component with variants.

```tsx
import { Alert } from '@/components/ui';

<Alert 
  variant="warning" 
  title="Budget Alert"
  onClose={handleClose}
>
  Your budget is approaching the limit.
</Alert>
```

**Props:**
- `variant`: 'info' | 'success' | 'warning' | 'danger'
- `title`: string
- `onClose`: () => void (optional)

#### Checkbox
Checkbox input with label and helper text.

```tsx
import { Checkbox } from '@/components/ui';

<Checkbox 
  label="Send notifications"
  helperText="Receive email updates"
/>
```

#### Spinner & Loading
Loading indicators for async operations.

```tsx
import { Spinner, Loading } from '@/components/ui';

<Spinner size="md" className="text-primary-600" />
<Loading text="Loading projects..." />
```

#### EmptyState
Placeholder for empty data states.

```tsx
import { EmptyState } from '@/components/ui';

<EmptyState
  icon={<ProjectIcon />}
  title="No projects yet"
  description="Get started by creating your first project"
  action={<Button>Create Project</Button>}
/>
```

#### Divider
Horizontal or vertical separator line.

```tsx
import { Divider } from '@/components/ui';

<Divider orientation="horizontal" />
```

### Layout Components

#### Header
Top navigation bar with logo, navigation, and actions.

```tsx
import { Header, HeaderNavItem } from '@/components/layout';

<Header
  logo={<Logo />}
  navigation={
    <>
      <HeaderNavItem href="/dashboard" active>Dashboard</HeaderNavItem>
      <HeaderNavItem href="/projects">Projects</HeaderNavItem>
    </>
  }
  actions={
    <Button variant="primary">New Project</Button>
  }
/>
```

#### Sidebar
Side navigation panel with sections and items.

```tsx
import { Sidebar, SidebarSection, SidebarItem } from '@/components/layout';

<Sidebar width="md">
  <SidebarSection title="Main">
    <SidebarItem href="/dashboard" active icon={<Icon />}>
      Dashboard
    </SidebarItem>
    <SidebarItem href="/projects" badge={<Badge>3</Badge>}>
      Projects
    </SidebarItem>
  </SidebarSection>
</Sidebar>
```

**Props:**
- `width`: 'sm' | 'md' | 'lg'

#### Container
Content container with max-width and padding.

```tsx
import { Container } from '@/components/layout';

<Container size="xl" padding>
  {/* Page content */}
</Container>
```

**Props:**
- `size`: 'sm' | 'md' | 'lg' | 'xl' | 'full'
- `padding`: boolean

#### PageLayout
Complete page layout with header, sidebar, and main content.

```tsx
import { PageLayout } from '@/components/layout';

<PageLayout
  header={<Header />}
  sidebar={<Sidebar />}
>
  {/* Main content */}
</PageLayout>
```

## Color Palette

The design system uses a custom color palette:

- **Primary**: Blue shades for primary actions and highlights
- **Gray**: Neutral shades for text, borders, and backgrounds
- **Success**: Green for positive states
- **Warning**: Yellow for cautionary states
- **Danger**: Red for errors and destructive actions

## Typography

The system uses system fonts for optimal performance:
- `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`, `Roboto`, `Helvetica Neue`, `Arial`, `sans-serif`

## Customization

All components accept a `className` prop for additional Tailwind classes:

```tsx
<Button className="mt-4 shadow-lg">Custom Button</Button>
```

## Testing

Components include unit tests using Vitest and React Testing Library:

```bash
npm test
```

## Demo

View all components in action:

```bash
npm run dev
```

Navigate to `/components` to see the component showcase.

## Best Practices

1. **Use semantic HTML**: Components use proper HTML elements for accessibility
2. **Provide labels**: Always include labels for form inputs
3. **Handle errors**: Display error messages for form validation
4. **Loading states**: Show loading indicators during async operations
5. **Empty states**: Provide helpful empty state messages
6. **Responsive design**: Components are mobile-friendly by default

## Future Enhancements

- [ ] Dark mode support
- [ ] Additional form components (Radio, Switch, DatePicker)
- [ ] Table component with sorting and filtering
- [ ] Toast notifications
- [ ] Dropdown menu component
- [ ] Tabs component
- [ ] Tooltip component
