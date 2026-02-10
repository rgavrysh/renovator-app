import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { ResourceList, ResourceStatus, ResourceType } from './ResourceList';

// Mock fetch
global.fetch = vi.fn();

describe('ResourceList', () => {
  const mockProjectId = 'project-123';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem(
      'auth_tokens',
      JSON.stringify({ accessToken: 'test-token' })
    );
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {}));

    render(<ResourceList projectId={mockProjectId} />);

    expect(screen.getByText('Resources')).toBeInTheDocument();
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('renders empty state when no resources', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    render(<ResourceList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('No resources')).toBeInTheDocument();
    });
  });

  it('groups resources by status', async () => {
    const mockResources = [
      {
        id: '1',
        projectId: mockProjectId,
        type: ResourceType.MATERIAL,
        name: 'Lumber',
        quantity: 100,
        unit: 'boards',
        cost: 500,
        status: ResourceStatus.NEEDED,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '2',
        projectId: mockProjectId,
        type: ResourceType.EQUIPMENT,
        name: 'Drill',
        quantity: 1,
        unit: 'unit',
        cost: 200,
        status: ResourceStatus.ORDERED,
        orderDate: '2024-01-05',
        expectedDeliveryDate: '2024-01-10',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-05',
      },
      {
        id: '3',
        projectId: mockProjectId,
        type: ResourceType.MATERIAL,
        name: 'Paint',
        quantity: 10,
        unit: 'gallons',
        cost: 300,
        status: ResourceStatus.RECEIVED,
        actualDeliveryDate: '2024-01-08',
        createdAt: '2024-01-01',
        updatedAt: '2024-01-08',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResources,
    });

    render(<ResourceList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('Needed')).toBeInTheDocument();
      expect(screen.getByText('Ordered')).toBeInTheDocument();
      expect(screen.getByText('Received')).toBeInTheDocument();
    });

    expect(screen.getByText('Lumber')).toBeInTheDocument();
    expect(screen.getByText('Drill')).toBeInTheDocument();
    expect(screen.getByText('Paint')).toBeInTheDocument();
  });

  it('displays overdue delivery warning', async () => {
    const today = new Date();
    const fourDaysAgo = new Date(today);
    fourDaysAgo.setDate(today.getDate() - 4);

    const mockResources = [
      {
        id: '1',
        projectId: mockProjectId,
        type: ResourceType.MATERIAL,
        name: 'Overdue Item',
        quantity: 50,
        unit: 'units',
        cost: 1000,
        status: ResourceStatus.ORDERED,
        orderDate: fourDaysAgo.toISOString().split('T')[0],
        expectedDeliveryDate: fourDaysAgo.toISOString().split('T')[0],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResources,
    });

    render(<ResourceList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText(/overdue for delivery/i)).toBeInTheDocument();
      expect(screen.getByText(/Delivery overdue by more than 2 days/i)).toBeInTheDocument();
    });
  });

  it('does not show overdue warning for resources within 2 days', async () => {
    const today = new Date();
    const oneDayAgo = new Date(today);
    oneDayAgo.setDate(today.getDate() - 1);

    const mockResources = [
      {
        id: '1',
        projectId: mockProjectId,
        type: ResourceType.MATERIAL,
        name: 'Recent Order',
        quantity: 50,
        unit: 'units',
        cost: 1000,
        status: ResourceStatus.ORDERED,
        orderDate: oneDayAgo.toISOString().split('T')[0],
        expectedDeliveryDate: oneDayAgo.toISOString().split('T')[0],
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResources,
    });

    render(<ResourceList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('Recent Order')).toBeInTheDocument();
    });

    expect(screen.queryByText(/overdue for delivery/i)).not.toBeInTheDocument();
  });

  it('displays supplier information when available', async () => {
    const mockResources = [
      {
        id: '1',
        projectId: mockProjectId,
        type: ResourceType.MATERIAL,
        name: 'Concrete',
        quantity: 5,
        unit: 'yards',
        cost: 750,
        status: ResourceStatus.ORDERED,
        supplier: {
          id: 'supplier-1',
          name: 'ABC Supplies',
          email: 'contact@abc.com',
        },
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResources,
    });

    render(<ResourceList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('ABC Supplies')).toBeInTheDocument();
    });
  });

  it('renders without card wrapper when showCard is false', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => [],
    });

    const { container } = render(
      <ResourceList projectId={mockProjectId} showCard={false} />
    );

    await waitFor(() => {
      expect(screen.getByText('No resources')).toBeInTheDocument();
    });

    expect(container.querySelector('.card')).not.toBeInTheDocument();
  });

  it('handles fetch error gracefully', async () => {
    (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

    render(<ResourceList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText(/Network error/i)).toBeInTheDocument();
    });
  });

  it('formats currency correctly', async () => {
    const mockResources = [
      {
        id: '1',
        projectId: mockProjectId,
        type: ResourceType.MATERIAL,
        name: 'Test Item',
        quantity: 1,
        unit: 'unit',
        cost: 1234.56,
        status: ResourceStatus.NEEDED,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResources,
    });

    render(<ResourceList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('$1,234.56')).toBeInTheDocument();
    });
  });

  it('displays resource type icons', async () => {
    const mockResources = [
      {
        id: '1',
        projectId: mockProjectId,
        type: ResourceType.MATERIAL,
        name: 'Material Item',
        quantity: 1,
        unit: 'unit',
        cost: 100,
        status: ResourceStatus.NEEDED,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '2',
        projectId: mockProjectId,
        type: ResourceType.EQUIPMENT,
        name: 'Equipment Item',
        quantity: 1,
        unit: 'unit',
        cost: 200,
        status: ResourceStatus.NEEDED,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
      {
        id: '3',
        projectId: mockProjectId,
        type: ResourceType.SUBCONTRACTOR,
        name: 'Subcontractor Service',
        quantity: 1,
        unit: 'person',
        cost: 300,
        status: ResourceStatus.NEEDED,
        createdAt: '2024-01-01',
        updatedAt: '2024-01-01',
      },
    ];

    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => mockResources,
    });

    render(<ResourceList projectId={mockProjectId} />);

    await waitFor(() => {
      expect(screen.getByText('Material Item')).toBeInTheDocument();
      expect(screen.getByText('Equipment Item')).toBeInTheDocument();
      expect(screen.getByText('Subcontractor Service')).toBeInTheDocument();
    });
  });
});
