import { Repository, In, LessThan, MoreThan, Between } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Task, TaskStatus, TaskPriority } from '../entities/Task';
import { WorkItemTemplate } from '../entities/WorkItemTemplate';

// UUID validation regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

/**
 * Compute actualPrice = price × amount.
 * Returns undefined if price is not set.
 */
function computeActualPrice(price?: number | null, amount?: number | null): number | undefined {
  if (price === undefined || price === null) {
    return undefined;
  }
  const amt = (amount !== undefined && amount !== null) ? Number(amount) : 1;
  return Number(price) * amt;
}

export interface CreateTaskInput {
  projectId: string;
  milestoneId?: string;
  name: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  price?: number;
  amount?: number;
  unit?: string;
  assignedTo?: string;
}

export interface UpdateTaskInput {
  name?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: Date;
  completedDate?: Date;
  price?: number | null;
  amount?: number;
  unit?: string | null;
  assignedTo?: string;
  milestoneId?: string;
}

export interface TaskFilters {
  status?: TaskStatus | TaskStatus[];
  priority?: TaskPriority | TaskPriority[];
  milestoneId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  assignedTo?: string;
}

export interface TaskCosts {
  actual: number;
}

export class TaskService {
  private taskRepository: Repository<Task>;
  private templateRepository: Repository<WorkItemTemplate>;

  constructor() {
    this.taskRepository = AppDataSource.getRepository(Task);
    this.templateRepository = AppDataSource.getRepository(WorkItemTemplate);
  }

  async createTask(data: CreateTaskInput): Promise<Task> {
    if (!isValidUUID(data.projectId)) {
      throw new Error('Invalid project ID');
    }

    if (data.milestoneId && !isValidUUID(data.milestoneId)) {
      throw new Error('Invalid milestone ID');
    }

    if (data.assignedTo && !isValidUUID(data.assignedTo)) {
      throw new Error('Invalid user ID');
    }

    const amount = data.amount !== undefined ? data.amount : 1;
    const actualPrice = computeActualPrice(data.price, amount);

    const task = this.taskRepository.create({
      projectId: data.projectId,
      milestoneId: data.milestoneId,
      name: data.name,
      description: data.description,
      status: data.status || TaskStatus.TODO,
      priority: data.priority || TaskPriority.MEDIUM,
      dueDate: data.dueDate,
      price: data.price,
      amount,
      actualPrice,
      unit: data.unit,
      assignedTo: data.assignedTo,
      notes: [],
    });

    return await this.taskRepository.save(task);
  }

  async getTask(id: string): Promise<Task> {
    if (!isValidUUID(id)) {
      throw new Error('Task not found');
    }

    const task = await this.taskRepository.findOne({
      where: { id },
    });

    if (!task) {
      throw new Error('Task not found');
    }

    return task;
  }

  async updateTask(id: string, data: UpdateTaskInput): Promise<Task> {
    const task = await this.getTask(id);

    if (data.milestoneId !== undefined && data.milestoneId !== null && !isValidUUID(data.milestoneId)) {
      throw new Error('Invalid milestone ID');
    }

    if (data.assignedTo !== undefined && data.assignedTo !== null && !isValidUUID(data.assignedTo)) {
      throw new Error('Invalid user ID');
    }

    // If status is being changed to COMPLETED, set completedDate
    if (data.status === TaskStatus.COMPLETED && task.status !== TaskStatus.COMPLETED) {
      data.completedDate = new Date();
    }

    Object.assign(task, data);

    // Recompute actual price whenever price or amount might have changed
    task.actualPrice = computeActualPrice(task.price, task.amount);

    return await this.taskRepository.save(task);
  }

  async deleteTask(id: string): Promise<void> {
    const task = await this.getTask(id);
    await this.taskRepository.remove(task);
  }

  async listTasks(projectId: string, filters: TaskFilters = {}): Promise<Task[]> {
    if (!isValidUUID(projectId)) {
      throw new Error('Invalid project ID');
    }

    const queryBuilder = this.taskRepository.createQueryBuilder('task');
    queryBuilder.where('task.projectId = :projectId', { projectId });

    // Apply filters
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        queryBuilder.andWhere('task.status IN (:...statuses)', { statuses: filters.status });
      } else {
        queryBuilder.andWhere('task.status = :status', { status: filters.status });
      }
    }

    if (filters.priority) {
      if (Array.isArray(filters.priority)) {
        queryBuilder.andWhere('task.priority IN (:...priorities)', { priorities: filters.priority });
      } else {
        queryBuilder.andWhere('task.priority = :priority', { priority: filters.priority });
      }
    }

    if (filters.milestoneId) {
      if (!isValidUUID(filters.milestoneId)) {
        throw new Error('Invalid milestone ID');
      }
      queryBuilder.andWhere('task.milestoneId = :milestoneId', { milestoneId: filters.milestoneId });
    }

    if (filters.assignedTo) {
      if (!isValidUUID(filters.assignedTo)) {
        throw new Error('Invalid user ID');
      }
      queryBuilder.andWhere('task.assignedTo = :assignedTo', { assignedTo: filters.assignedTo });
    }

    if (filters.dueDateFrom && filters.dueDateTo) {
      queryBuilder.andWhere('task.dueDate BETWEEN :dueDateFrom AND :dueDateTo', {
        dueDateFrom: filters.dueDateFrom,
        dueDateTo: filters.dueDateTo,
      });
    } else if (filters.dueDateFrom) {
      queryBuilder.andWhere('task.dueDate >= :dueDateFrom', { dueDateFrom: filters.dueDateFrom });
    } else if (filters.dueDateTo) {
      queryBuilder.andWhere('task.dueDate <= :dueDateTo', { dueDateTo: filters.dueDateTo });
    }

    queryBuilder.orderBy('task.createdAt', 'DESC');

    return await queryBuilder.getMany();
  }

  async assignTask(taskId: string, userId: string): Promise<Task> {
    if (!isValidUUID(userId)) {
      throw new Error('Invalid user ID');
    }

    const task = await this.getTask(taskId);
    task.assignedTo = userId;

    return await this.taskRepository.save(task);
  }

  async addTaskNote(taskId: string, note: string): Promise<Task> {
    const task = await this.getTask(taskId);

    if (!task.notes) {
      task.notes = [];
    }

    task.notes.push(note);

    return await this.taskRepository.save(task);
  }

  async calculateTotalTaskCosts(projectId: string): Promise<TaskCosts> {
    if (!isValidUUID(projectId)) {
      throw new Error('Invalid project ID');
    }

    const tasks = await this.taskRepository.find({
      where: { projectId },
    });

    const actual = tasks.reduce((sum, task) => {
      return sum + (task.actualPrice ? Number(task.actualPrice) : 0);
    }, 0);

    return { actual };
  }

  async bulkCreateTasksFromTemplates(
    projectId: string,
    templateIds: string[]
  ): Promise<Task[]> {
    if (!isValidUUID(projectId)) {
      throw new Error('Invalid project ID');
    }

    // Validate all template IDs
    for (const templateId of templateIds) {
      if (!isValidUUID(templateId)) {
        throw new Error('Invalid template ID');
      }
    }

    // Fetch all templates
    const templates = await this.templateRepository.find({
      where: { id: In(templateIds) },
    });

    if (templates.length !== templateIds.length) {
      throw new Error('One or more templates not found');
    }

    // Create tasks from templates
    const tasks = templates.map((template) => {
      const price = template.defaultPrice;
      const amount = 1;
      const actualPrice = computeActualPrice(price, amount);

      return this.taskRepository.create({
        projectId,
        name: template.name,
        description: template.description,
        status: TaskStatus.TODO,
        priority: TaskPriority.MEDIUM,
        price,
        amount,
        actualPrice,
        unit: template.unit,
        notes: [],
      });
    });

    return await this.taskRepository.save(tasks);
  }

  async checkOverdueTasks(): Promise<Task[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await this.taskRepository
      .createQueryBuilder('task')
      .where('task.dueDate < :today', { today })
      .andWhere('task.status != :completed', {
        completed: TaskStatus.COMPLETED,
      })
      .getMany();

    return tasks;
  }

  async completeTask(id: string): Promise<Task> {
    const task = await this.getTask(id);

    task.status = TaskStatus.COMPLETED;
    task.completedDate = new Date();

    return await this.taskRepository.save(task);
  }
}
