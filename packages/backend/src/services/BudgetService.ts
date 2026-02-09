import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Budget } from '../entities/Budget';
import { BudgetItem, BudgetCategory } from '../entities/BudgetItem';

// UUID validation regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export interface CreateBudgetItemInput {
  name: string;
  category: BudgetCategory;
  estimatedCost: number;
  actualCost?: number;
  notes?: string;
}

export interface UpdateBudgetItemInput {
  name?: string;
  category?: BudgetCategory;
  estimatedCost?: number;
  actualCost?: number;
  notes?: string;
}

export interface BudgetAlert {
  budgetId: string;
  type: 'warning' | 'critical';
  message: string;
  variancePercentage: number;
}

export class BudgetService {
  private budgetRepository: Repository<Budget>;
  private budgetItemRepository: Repository<BudgetItem>;

  constructor() {
    this.budgetRepository = AppDataSource.getRepository(Budget);
    this.budgetItemRepository = AppDataSource.getRepository(BudgetItem);
  }

  async createBudget(projectId: string): Promise<Budget> {
    if (!isValidUUID(projectId)) {
      throw new Error('Invalid project ID');
    }

    // Check if budget already exists for this project
    const existingBudget = await this.budgetRepository.findOne({
      where: { projectId },
    });

    if (existingBudget) {
      throw new Error('Budget already exists for this project');
    }

    const budget = this.budgetRepository.create({
      projectId,
      totalEstimated: 0,
      totalActual: 0,
    });

    return await this.budgetRepository.save(budget);
  }

  async getBudget(projectId: string): Promise<Budget> {
    if (!isValidUUID(projectId)) {
      throw new Error('Budget not found');
    }

    const budget = await this.budgetRepository.findOne({
      where: { projectId },
      relations: ['items'],
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    return budget;
  }

  async addBudgetItem(
    budgetId: string,
    data: CreateBudgetItemInput
  ): Promise<BudgetItem> {
    if (!isValidUUID(budgetId)) {
      throw new Error('Invalid budget ID');
    }

    // Verify budget exists
    const budget = await this.budgetRepository.findOne({
      where: { id: budgetId },
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    const budgetItem = this.budgetItemRepository.create({
      budgetId,
      name: data.name,
      category: data.category,
      estimatedCost: data.estimatedCost,
      actualCost: data.actualCost ?? 0,
      notes: data.notes,
    });

    const savedItem = await this.budgetItemRepository.save(budgetItem);

    // Recalculate budget totals
    await this.recalculateBudgetTotals(budgetId);

    return savedItem;
  }

  async updateBudgetItem(
    itemId: string,
    data: UpdateBudgetItemInput
  ): Promise<BudgetItem> {
    if (!isValidUUID(itemId)) {
      throw new Error('Budget item not found');
    }

    const budgetItem = await this.budgetItemRepository.findOne({
      where: { id: itemId },
    });

    if (!budgetItem) {
      throw new Error('Budget item not found');
    }

    Object.assign(budgetItem, data);

    const savedItem = await this.budgetItemRepository.save(budgetItem);

    // Recalculate budget totals
    await this.recalculateBudgetTotals(budgetItem.budgetId);

    return savedItem;
  }

  async deleteBudgetItem(itemId: string): Promise<void> {
    if (!isValidUUID(itemId)) {
      throw new Error('Budget item not found');
    }

    const budgetItem = await this.budgetItemRepository.findOne({
      where: { id: itemId },
    });

    if (!budgetItem) {
      throw new Error('Budget item not found');
    }

    const budgetId = budgetItem.budgetId;

    await this.budgetItemRepository.remove(budgetItem);

    // Recalculate budget totals
    await this.recalculateBudgetTotals(budgetId);
  }

  async calculateVariance(budgetId: string): Promise<Budget> {
    const budget = await this.budgetRepository.findOne({
      where: { id: budgetId },
      relations: ['items'],
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    // Variance is already calculated in recalculateBudgetTotals
    // This method returns the budget with variance information
    return budget;
  }

  async checkBudgetAlerts(budgetId: string): Promise<BudgetAlert[]> {
    const budget = await this.budgetRepository.findOne({
      where: { id: budgetId },
    });

    if (!budget) {
      throw new Error('Budget not found');
    }

    const alerts: BudgetAlert[] = [];

    // Check if actual costs exceed estimated by more than 10%
    if (budget.totalEstimated > 0) {
      const variancePercentage =
        ((budget.totalActual - budget.totalEstimated) / budget.totalEstimated) * 100;

      if (variancePercentage > 10) {
        alerts.push({
          budgetId: budget.id,
          type: variancePercentage > 20 ? 'critical' : 'warning',
          message: `Budget exceeded by ${variancePercentage.toFixed(1)}%`,
          variancePercentage,
        });
      }
    }

    return alerts;
  }

  private async recalculateBudgetTotals(budgetId: string): Promise<void> {
    const budget = await this.budgetRepository.findOne({
      where: { id: budgetId },
      relations: ['items'],
    });

    if (!budget) {
      return;
    }

    // Calculate totals from all budget items
    let totalEstimated = 0;
    let totalActual = 0;

    for (const item of budget.items) {
      totalEstimated += Number(item.estimatedCost);
      totalActual += Number(item.actualCost);
    }

    budget.totalEstimated = totalEstimated;
    budget.totalActual = totalActual;

    await this.budgetRepository.save(budget);
  }
}
