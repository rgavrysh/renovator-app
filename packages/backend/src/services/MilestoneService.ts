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

    // Unassign any tasks that were assigned to this milestone before deleting it
    await this.taskRepository
      .createQueryBuilder()
      .update(Task)
      .set({ milestoneId: () => 'NULL' })
      .where('milestone_id = :id', { id })
      .execute();

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

  /**
   * Recompute a milestone's status from the status of its associated tasks.
   *
   * Rules:
   * - Milestones with no associated tasks are left untouched (manual status).
   * - If every task is completed, the milestone is COMPLETED and its
   *   completedDate is stamped (if not already set).
   * - If at least one task is in progress, blocked, or completed (but not all
   *   completed), the milestone is IN_PROGRESS.
   * - If every task is still in its initial "to do" state, the milestone is
   *   NOT_STARTED.
   *
   * Silently no-ops for missing/invalid milestone IDs since this is called
   * as a side effect of task mutations.
   */
  async recalculateMilestoneStatus(
    milestoneId: string | null | undefined
  ): Promise<Milestone | null> {
    if (!milestoneId || !isValidUUID(milestoneId)) {
      return null;
    }

    const milestone = await this.milestoneRepository.findOne({
      where: { id: milestoneId },
    });

    if (!milestone) {
      return null;
    }

    const tasks = await this.taskRepository.find({ where: { milestoneId } });

    if (tasks.length === 0) {
      return milestone;
    }

    const allCompleted = tasks.every((t) => t.status === TaskStatus.COMPLETED);
    const anyStarted = tasks.some(
      (t) =>
        t.status === TaskStatus.IN_PROGRESS ||
        t.status === TaskStatus.BLOCKED ||
        t.status === TaskStatus.COMPLETED
    );

    let newStatus: MilestoneStatus;
    if (allCompleted) {
      newStatus = MilestoneStatus.COMPLETED;
    } else if (anyStarted) {
      newStatus = MilestoneStatus.IN_PROGRESS;
    } else {
      newStatus = MilestoneStatus.NOT_STARTED;
    }

    let changed = false;
    const wasCompleted = milestone.status === MilestoneStatus.COMPLETED;

    if (milestone.status !== newStatus) {
      milestone.status = newStatus;
      changed = true;
    }

    if (newStatus === MilestoneStatus.COMPLETED) {
      // Never clobber a completedDate that was already set (either by a
      // prior auto-completion or a manual override in the milestone editor).
      if (!milestone.completedDate) {
        milestone.completedDate = new Date();
        changed = true;
      }
    } else if (wasCompleted && milestone.completedDate) {
      // Only clear the date when the milestone is actually regressing out of
      // COMPLETED (e.g. a task was reopened). A manually-set completedDate on
      // a milestone that was never auto/marked completed is left untouched.
      // Explicit null (rather than undefined) so TypeORM persists the clear.
      milestone.completedDate = null as unknown as undefined;
      changed = true;
    }

    return changed
      ? await this.milestoneRepository.save(milestone)
      : milestone;
  }
}
