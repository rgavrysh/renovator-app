import { Repository, In } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Milestone, MilestoneStatus } from '../entities/Milestone';
import { Task, TaskStatus } from '../entities/Task';

// UUID validation regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export interface CreateMilestoneInput {
  projectId: string;
  name: string;
  description?: string;
  targetDate: Date;
  orderIndex: number;
  status?: MilestoneStatus;
}

export interface UpdateMilestoneInput {
  name?: string;
  description?: string;
  targetDate?: Date;
  completedDate?: Date;
  status?: MilestoneStatus;
  orderIndex?: number;
}

export interface Timeline {
  projectId: string;
  startDate: Date;
  endDate: Date;
  milestones: Milestone[];
  progressPercentage: number;
}

export class MilestoneService {
  private milestoneRepository: Repository<Milestone>;
  private taskRepository: Repository<Task>;

  constructor() {
    this.milestoneRepository = AppDataSource.getRepository(Milestone);
    this.taskRepository = AppDataSource.getRepository(Task);
  }

  async createMilestone(data: CreateMilestoneInput): Promise<Milestone> {
    if (!isValidUUID(data.projectId)) {
      throw new Error('Invalid project ID');
    }

    const milestone = this.milestoneRepository.create({
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      targetDate: data.targetDate,
      orderIndex: data.orderIndex,
      status: data.status || MilestoneStatus.NOT_STARTED,
    });

    return await this.milestoneRepository.save(milestone);
  }

  async getMilestone(id: string): Promise<Milestone> {
    if (!isValidUUID(id)) {
      throw new Error('Milestone not found');
    }

    const milestone = await this.milestoneRepository.findOne({
      where: { id },
    });

    if (!milestone) {
      throw new Error('Milestone not found');
    }

    return milestone;
  }

  async updateMilestone(
    id: string,
    data: UpdateMilestoneInput
  ): Promise<Milestone> {
    const milestone = await this.getMilestone(id);

    Object.assign(milestone, data);

    return await this.milestoneRepository.save(milestone);
  }

  async deleteMilestone(id: string): Promise<void> {
    const milestone = await this.getMilestone(id);
    await this.milestoneRepository.remove(milestone);
  }

  async listMilestones(projectId: string): Promise<Milestone[]> {
    if (!isValidUUID(projectId)) {
      throw new Error('Invalid project ID');
    }

    return await this.milestoneRepository.find({
      where: { projectId },
      order: { targetDate: 'ASC', orderIndex: 'ASC' },
    });
  }

  async getTimeline(projectId: string): Promise<Timeline> {
    if (!isValidUUID(projectId)) {
      throw new Error('Invalid project ID');
    }

    const milestones = await this.listMilestones(projectId);

    if (milestones.length === 0) {
      return {
        projectId,
        startDate: new Date(),
        endDate: new Date(),
        milestones: [],
        progressPercentage: 0,
      };
    }

    const startDate = milestones[0].targetDate;
    const endDate = milestones[milestones.length - 1].targetDate;
    const progressPercentage = await this.calculateProgress(projectId);

    return {
      projectId,
      startDate,
      endDate,
      milestones,
      progressPercentage,
    };
  }

  async calculateProgress(projectId: string): Promise<number> {
    if (!isValidUUID(projectId)) {
      throw new Error('Invalid project ID');
    }

    const milestones = await this.milestoneRepository.find({
      where: { projectId },
    });

    if (milestones.length === 0) {
      return 0;
    }

    const completedCount = milestones.filter(
      (m) => m.status === MilestoneStatus.COMPLETED
    ).length;

    return Math.round((completedCount / milestones.length) * 100);
  }

  async checkOverdueMilestones(): Promise<Milestone[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const milestones = await this.milestoneRepository
      .createQueryBuilder('milestone')
      .where('milestone.targetDate < :today', { today })
      .andWhere('milestone.status != :completed', {
        completed: MilestoneStatus.COMPLETED,
      })
      .getMany();

    return milestones;
  }

  async completeMilestone(id: string): Promise<Milestone> {
    const milestone = await this.getMilestone(id);

    milestone.status = MilestoneStatus.COMPLETED;
    milestone.completedDate = new Date();

    return await this.milestoneRepository.save(milestone);
  }

  async calculateMilestoneProgress(milestoneId: string): Promise<number> {
    if (!isValidUUID(milestoneId)) {
      throw new Error('Invalid milestone ID');
    }

    const tasks = await this.taskRepository.find({
      where: { milestoneId },
    });

    if (tasks.length === 0) {
      return 0;
    }

    const completedCount = tasks.filter(
      (t) => t.status === TaskStatus.COMPLETED
    ).length;

    return Math.round((completedCount / tasks.length) * 100);
  }
}
