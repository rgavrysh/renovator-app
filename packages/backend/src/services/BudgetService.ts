import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Budget } from '../entities/Budget';
import { BudgetItem, BudgetCategory } from '../entities/BudgetItem';
import { TaskService } from './TaskService';
import { ProjectService } from './ProjectService';
import PDFDocument from 'pdfkit';

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
  private taskService: TaskService;
  private projectService: ProjectService;

  constructor() {
    this.budgetRepository = AppDataSource.getRepository(Budget);
    this.budgetItemRepository = AppDataSource.getRepository(BudgetItem);
    this.taskService = new TaskService();
    this.projectService = new ProjectService();
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
      totalActualFromItems: 0,
      totalActualFromTasks: 0,
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

  async deleteBudget(projectId: string): Promise<void> {
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

    // Remove all budget items first
    if (budget.items && budget.items.length > 0) {
      await this.budgetItemRepository.remove(budget.items);
    }

    // Remove the budget itself
    await this.budgetRepository.remove(budget);
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

  async recalculateBudgetTotalsForProject(projectId: string): Promise<void> {
    if (!isValidUUID(projectId)) {
      throw new Error('Invalid project ID');
    }

    const budget = await this.budgetRepository.findOne({
      where: { projectId },
    });

    if (budget) {
      await this.recalculateBudgetTotals(budget.id);
    }
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
    let totalActualFromItems = 0;

    for (const item of budget.items) {
      totalEstimated += Number(item.estimatedCost);
      totalActualFromItems += Number(item.actualCost);
    }

    // Calculate totals from tasks
    const taskCosts = await this.taskService.calculateTotalTaskCosts(budget.projectId);
    const totalActualFromTasks = taskCosts.actual;

    // Update budget totals
    budget.totalEstimated = totalEstimated;
    budget.totalActualFromItems = totalActualFromItems;
    budget.totalActualFromTasks = totalActualFromTasks;
    budget.totalActual = totalActualFromItems + totalActualFromTasks;

    await this.budgetRepository.save(budget);
  }

  async exportBudgetToPDF(projectId: string): Promise<Buffer> {
    if (!isValidUUID(projectId)) {
      throw new Error('Invalid project ID');
    }

    // Get project details
    const project = await this.projectService.getProject(projectId);
    
    // Get budget with items
    const budget = await this.getBudget(projectId);
    
    // Get tasks with pricing information
    const tasks = await this.taskService.listTasks(projectId, {});
    const tasksWithPricing = tasks.filter(task => task.actualPrice !== null && task.actualPrice !== undefined);

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    // Collect PDF data
    doc.on('data', (chunk) => chunks.push(chunk));

    // Header Section
    doc.fontSize(20).text('Budget Report', { align: 'center' });
    doc.moveDown();
    
    doc.fontSize(12).text(`Project: ${project.name}`, { align: 'left' });
    doc.text(`Client: ${project.clientName}`);
    if (project.clientEmail) {
      doc.text(`Email: ${project.clientEmail}`);
    }
    if (project.clientPhone) {
      doc.text(`Phone: ${project.clientPhone}`);
    }
    doc.text(`Total Budget: $${Number(budget.totalEstimated).toFixed(2)}`);
    doc.text(`Export Date: ${new Date().toLocaleDateString()}`);
    doc.moveDown(2);

    // Items Table
    doc.fontSize(14).text('Budget Items', { underline: true });
    doc.moveDown();

    // Table headers
    const tableTop = doc.y;
    const colWidths = { id: 60, name: 180, quantity: 60, perUnit: 80, price: 80 };
    let currentY = tableTop;

    doc.fontSize(10).font('Helvetica-Bold');
    doc.text('ID', 50, currentY, { width: colWidths.id });
    doc.text('Name', 110, currentY, { width: colWidths.name });
    doc.text('Quantity', 290, currentY, { width: colWidths.quantity });
    doc.text('Per Unit', 350, currentY, { width: colWidths.perUnit });
    doc.text('Price', 430, currentY, { width: colWidths.price });
    
    currentY += 20;
    doc.font('Helvetica');

    // Draw line under headers
    doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).stroke();

    // Add tasks with pricing
    for (let i = 0; i < tasksWithPricing.length; i++) {
      const task = tasksWithPricing[i];
      
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      const shortId = task.id.substring(0, 8);
      const quantity = task.perUnit ? '1' : '-';
      const perUnit = task.perUnit || '-';
      const price = task.actualPrice ? `$${Number(task.actualPrice).toFixed(2)}` : '$0.00';

      doc.text(`${shortId}`, 50, currentY, { width: colWidths.id });
      doc.text(`[Task] ${task.name}`, 110, currentY, { width: colWidths.name });
      doc.text(quantity, 290, currentY, { width: colWidths.quantity });
      doc.text(perUnit, 350, currentY, { width: colWidths.perUnit });
      doc.text(price, 430, currentY, { width: colWidths.price });
      
      currentY += 20;
    }

    // Add budget items
    for (let i = 0; i < budget.items.length; i++) {
      const item = budget.items[i];
      
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      const shortId = item.id.substring(0, 8);
      const price = `$${Number(item.actualCost).toFixed(2)}`;

      doc.text(`${shortId}`, 50, currentY, { width: colWidths.id });
      doc.text(`[${item.category}] ${item.name}`, 110, currentY, { width: colWidths.name });
      doc.text('-', 290, currentY, { width: colWidths.quantity });
      doc.text('-', 350, currentY, { width: colWidths.perUnit });
      doc.text(price, 430, currentY, { width: colWidths.price });
      
      currentY += 20;
    }

    doc.moveDown(2);
    currentY += 20;

    // Draw line before footer
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 20;

    // Footer Section - Category Subtotals
    doc.fontSize(12).font('Helvetica-Bold').text('Summary by Category', 50, currentY);
    currentY += 25;
    doc.font('Helvetica');

    // Calculate category totals
    const categoryTotals: Record<string, number> = {
      Tasks: Number(budget.totalActualFromTasks),
    };

    // Aggregate budget items by category
    for (const item of budget.items) {
      const category = item.category.charAt(0).toUpperCase() + item.category.slice(1).toLowerCase();
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += Number(item.actualCost);
    }

    // Display category totals
    for (const [category, total] of Object.entries(categoryTotals)) {
      if (total > 0) {
        doc.text(`${category}:`, 50, currentY, { continued: true });
        doc.text(`$${total.toFixed(2)}`, { align: 'right' });
        currentY += 20;
      }
    }

    currentY += 10;
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 20;

    // Total Summary
    doc.font('Helvetica-Bold');
    doc.text(`Total Estimated:`, 50, currentY, { continued: true });
    doc.text(`$${Number(budget.totalEstimated).toFixed(2)}`, { align: 'right' });
    currentY += 20;

    doc.text(`Total Actual:`, 50, currentY, { continued: true });
    doc.text(`$${Number(budget.totalActual).toFixed(2)}`, { align: 'right' });
    currentY += 20;

    const variance = Number(budget.totalActual) - Number(budget.totalEstimated);
    const variancePercentage = Number(budget.totalEstimated) > 0 
      ? ((variance / Number(budget.totalEstimated)) * 100).toFixed(1)
      : '0.0';
    
    doc.text(`Variance:`, 50, currentY, { continued: true });
    doc.text(`$${variance.toFixed(2)} (${variancePercentage}%)`, { align: 'right' });

    // Finalize PDF
    doc.end();

    // Return PDF buffer
    return new Promise((resolve, reject) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      doc.on('error', reject);
    });
  }
}
