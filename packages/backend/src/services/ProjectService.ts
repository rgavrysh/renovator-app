import { Repository, Like, Between, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Project, ProjectStatus } from '../entities/Project';

// UUID validation regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export interface CreateProjectInput {
  name: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  description?: string;
  startDate: Date;
  estimatedEndDate: Date;
  ownerId: string;
  status?: ProjectStatus;
}

export interface UpdateProjectInput {
  name?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  description?: string;
  startDate?: Date;
  estimatedEndDate?: Date;
  actualEndDate?: Date;
  status?: ProjectStatus;
}

export interface ProjectFilters {
  ownerId?: string;
  status?: ProjectStatus | ProjectStatus[];
  startDateFrom?: Date;
  startDateTo?: Date;
  estimatedEndDateFrom?: Date;
  estimatedEndDateTo?: Date;
}

export class ProjectService {
  private projectRepository: Repository<Project>;

  constructor() {
    this.projectRepository = AppDataSource.getRepository(Project);
  }

  async createProject(data: CreateProjectInput): Promise<Project> {
    const project = this.projectRepository.create({
      name: data.name,
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      description: data.description,
      startDate: data.startDate,
      estimatedEndDate: data.estimatedEndDate,
      ownerId: data.ownerId,
      status: data.status || ProjectStatus.PLANNING,
    });

    return await this.projectRepository.save(project);
  }

  async getProject(id: string, ownerId?: string): Promise<Project> {
    if (!isValidUUID(id)) {
      throw new Error('Project not found');
    }

    const whereClause: any = { id };
    if (ownerId) {
      if (!isValidUUID(ownerId)) {
        throw new Error('Project not found');
      }
      whereClause.ownerId = ownerId;
    }

    const project = await this.projectRepository.findOne({
      where: whereClause,
    });

    if (!project) {
      throw new Error('Project not found');
    }

    return project;
  }

  async updateProject(
    id: string,
    data: UpdateProjectInput,
    ownerId?: string
  ): Promise<Project> {
    const project = await this.getProject(id, ownerId);

    Object.assign(project, data);

    return await this.projectRepository.save(project);
  }

  async deleteProject(id: string, ownerId?: string): Promise<void> {
    const project = await this.getProject(id, ownerId);
    await this.projectRepository.remove(project);
  }

  async listProjects(filters: ProjectFilters = {}): Promise<Project[]> {
    const whereClause: any = {};

    if (filters.ownerId) {
      whereClause.ownerId = filters.ownerId;
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        whereClause.status = In(filters.status);
      } else {
        whereClause.status = filters.status;
      }
    }

    if (filters.startDateFrom && filters.startDateTo) {
      whereClause.startDate = Between(filters.startDateFrom, filters.startDateTo);
    } else if (filters.startDateFrom) {
      whereClause.startDate = Between(filters.startDateFrom, new Date('2100-01-01'));
    } else if (filters.startDateTo) {
      whereClause.startDate = Between(new Date('1900-01-01'), filters.startDateTo);
    }

    if (filters.estimatedEndDateFrom && filters.estimatedEndDateTo) {
      whereClause.estimatedEndDate = Between(
        filters.estimatedEndDateFrom,
        filters.estimatedEndDateTo
      );
    } else if (filters.estimatedEndDateFrom) {
      whereClause.estimatedEndDate = Between(
        filters.estimatedEndDateFrom,
        new Date('2100-01-01')
      );
    } else if (filters.estimatedEndDateTo) {
      whereClause.estimatedEndDate = Between(
        new Date('1900-01-01'),
        filters.estimatedEndDateTo
      );
    }

    return await this.projectRepository.find({
      where: whereClause,
      order: { createdAt: 'DESC' },
    });
  }

  async searchProjects(query: string, ownerId?: string): Promise<Project[]> {
    const queryBuilder = this.projectRepository.createQueryBuilder('project');

    queryBuilder.where(
      '(project.name ILIKE :query OR project.clientName ILIKE :query)',
      { query: `%${query}%` }
    );

    if (ownerId) {
      queryBuilder.andWhere('project.ownerId = :ownerId', { ownerId });
    }

    queryBuilder.orderBy('project.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  async archiveProject(id: string, ownerId?: string): Promise<Project> {
    const project = await this.getProject(id, ownerId);
    project.status = ProjectStatus.ARCHIVED;
    return await this.projectRepository.save(project);
  }

  async getActiveProjects(ownerId: string): Promise<Project[]> {
    return await this.projectRepository.find({
      where: {
        ownerId,
        status: In([
          ProjectStatus.PLANNING,
          ProjectStatus.ACTIVE,
          ProjectStatus.ON_HOLD,
        ]),
      },
      order: { createdAt: 'DESC' },
    });
  }
}
