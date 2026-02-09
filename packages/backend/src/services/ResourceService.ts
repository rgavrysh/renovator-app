import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Resource, ResourceStatus, ResourceType } from '../entities/Resource';

// UUID validation regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export interface CreateResourceInput {
  projectId: string;
  type: ResourceType;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  supplierId?: string;
  notes?: string;
}

export interface UpdateResourceInput {
  type?: ResourceType;
  name?: string;
  quantity?: number;
  unit?: string;
  cost?: number;
  status?: ResourceStatus;
  supplierId?: string;
  orderDate?: Date;
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  notes?: string;
}

export interface ResourceFilters {
  status?: ResourceStatus;
  type?: ResourceType;
  supplierId?: string;
}

export interface ResourcesByStatus {
  [ResourceStatus.NEEDED]: Resource[];
  [ResourceStatus.ORDERED]: Resource[];
  [ResourceStatus.RECEIVED]: Resource[];
  [ResourceStatus.CANCELLED]: Resource[];
}

export class ResourceService {
  private resourceRepository: Repository<Resource>;

  constructor() {
    this.resourceRepository = AppDataSource.getRepository(Resource);
  }

  async createResource(data: CreateResourceInput): Promise<Resource> {
    if (!isValidUUID(data.projectId)) {
      throw new Error('Invalid project ID');
    }

    if (data.supplierId && !isValidUUID(data.supplierId)) {
      throw new Error('Invalid supplier ID');
    }

    const resource = this.resourceRepository.create({
      projectId: data.projectId,
      type: data.type,
      name: data.name,
      quantity: data.quantity,
      unit: data.unit,
      cost: data.cost,
      status: ResourceStatus.NEEDED,
      supplierId: data.supplierId,
      notes: data.notes,
    });

    return await this.resourceRepository.save(resource);
  }

  async getResource(id: string): Promise<Resource> {
    if (!isValidUUID(id)) {
      throw new Error('Resource not found');
    }

    const resource = await this.resourceRepository.findOne({
      where: { id },
      relations: ['supplier'],
    });

    if (!resource) {
      throw new Error('Resource not found');
    }

    return resource;
  }

  async updateResource(id: string, data: UpdateResourceInput): Promise<Resource> {
    const resource = await this.getResource(id);

    if (data.supplierId && !isValidUUID(data.supplierId)) {
      throw new Error('Invalid supplier ID');
    }

    Object.assign(resource, data);

    return await this.resourceRepository.save(resource);
  }

  async deleteResource(id: string): Promise<void> {
    const resource = await this.getResource(id);
    await this.resourceRepository.remove(resource);
  }

  async listResources(
    projectId: string,
    filters?: ResourceFilters
  ): Promise<Resource[]> {
    if (!isValidUUID(projectId)) {
      throw new Error('Invalid project ID');
    }

    const whereClause: any = { projectId };

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.type) {
      whereClause.type = filters.type;
    }

    if (filters?.supplierId) {
      if (!isValidUUID(filters.supplierId)) {
        throw new Error('Invalid supplier ID');
      }
      whereClause.supplierId = filters.supplierId;
    }

    return await this.resourceRepository.find({
      where: whereClause,
      relations: ['supplier'],
      order: { createdAt: 'DESC' },
    });
  }

  async markAsOrdered(
    id: string,
    orderDate: Date,
    expectedDeliveryDate: Date
  ): Promise<Resource> {
    const resource = await this.getResource(id);

    resource.status = ResourceStatus.ORDERED;
    resource.orderDate = orderDate;
    resource.expectedDeliveryDate = expectedDeliveryDate;

    return await this.resourceRepository.save(resource);
  }

  async markAsReceived(id: string, actualDeliveryDate: Date): Promise<Resource> {
    const resource = await this.getResource(id);

    resource.status = ResourceStatus.RECEIVED;
    resource.actualDeliveryDate = actualDeliveryDate;

    return await this.resourceRepository.save(resource);
  }

  async checkOverdueDeliveries(): Promise<Resource[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate the date 2 days ago
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    // Find resources that are ordered, have an expected delivery date,
    // and the expected delivery date is more than 2 days in the past
    const overdueResources = await this.resourceRepository
      .createQueryBuilder('resource')
      .where('resource.status = :status', { status: ResourceStatus.ORDERED })
      .andWhere('resource.expected_delivery_date IS NOT NULL')
      .andWhere('resource.expected_delivery_date < :twoDaysAgo', { twoDaysAgo })
      .leftJoinAndSelect('resource.supplier', 'supplier')
      .orderBy('resource.expected_delivery_date', 'ASC')
      .getMany();

    return overdueResources;
  }

  async groupResourcesByStatus(projectId: string): Promise<ResourcesByStatus> {
    if (!isValidUUID(projectId)) {
      throw new Error('Invalid project ID');
    }

    const resources = await this.resourceRepository.find({
      where: { projectId },
      relations: ['supplier'],
      order: { createdAt: 'DESC' },
    });

    const grouped: ResourcesByStatus = {
      [ResourceStatus.NEEDED]: [],
      [ResourceStatus.ORDERED]: [],
      [ResourceStatus.RECEIVED]: [],
      [ResourceStatus.CANCELLED]: [],
    };

    resources.forEach((resource) => {
      grouped[resource.status].push(resource);
    });

    return grouped;
  }
}
