import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Budget } from '../entities/Budget';
import { BudgetItem, BudgetCategory } from '../entities/BudgetItem';
import { TaskService } from './TaskService';
import { ProjectService } from './ProjectService';
import PDFDocument from 'pdfkit';
import path from 'path';
import { getPdfTranslations, translateCategory, formatPdfCurrency } from '../i18n/pdfTranslations';

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

    // Calculate existing tasks costs to include them from the start
    const taskCosts = await this.taskService.calculateTotalTaskCosts(projectId);

    const budget = this.budgetRepository.create({
      projectId,
      totalEstimated: 0,
      totalActual: taskCosts.actual,
      totalActualFromItems: 0,
      totalActualFromTasks: taskCosts.actual,
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

  async exportBudgetToPDF(projectId: string, lang: string = 'en'): Promise<Buffer> {
    if (!isValidUUID(projectId)) {
      throw new Error('Invalid project ID');
    }

    const t = getPdfTranslations(lang);

    // Get project details
    const project = await this.projectService.getProject(projectId);
    
    // Get budget with items
    const budget = await this.getBudget(projectId);
    
    // Get tasks with pricing information
    const tasks = await this.taskService.listTasks(projectId, {});
    const tasksWithPricing = tasks.filter(task => task.actualPrice !== null && task.actualPrice !== undefined);

    // Resolve font paths (Roboto supports Cyrillic)
    // Works in both dev (src/services/) and prod (dist/services/) by going up to package root
    const fontsDir = path.resolve(__dirname, '..', '..', 'assets', 'fonts');
    const fontRegular = path.join(fontsDir, 'Roboto-Regular.ttf');
    const fontBold = path.join(fontsDir, 'Roboto-Bold.ttf');

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    // Register custom fonts with Cyrillic support
    doc.registerFont('Roboto', fontRegular);
    doc.registerFont('Roboto-Bold', fontBold);

    // Collect PDF data
    doc.on('data', (chunk) => chunks.push(chunk));

    // Set locale for date formatting
    const dateLocale = lang === 'uk' ? 'uk-UA' : 'en-US';

    // Header Section
    doc.font('Roboto-Bold').fontSize(20).text(t.budgetReport, { align: 'center' });
    doc.moveDown();
    
    doc.font('Roboto').fontSize(12).text(`${t.project}: ${project.name}`, { align: 'left' });
    doc.text(`${t.client}: ${project.clientName}`);
    if (project.clientEmail) {
      doc.text(`${t.email}: ${project.clientEmail}`);
    }
    if (project.clientPhone) {
      doc.text(`${t.phone}: ${project.clientPhone}`);
    }
    doc.text(`${t.exportDate}: ${new Date().toLocaleDateString(dateLocale)}`);
    doc.moveDown(2);

    // Items Table
    doc.font('Roboto-Bold').fontSize(14).text(t.budgetItems, { underline: true });
    doc.moveDown();

    // Table headers
    const tableTop = doc.y;
    const colWidths = { id: 30, name: 155, quantity: 50, unit: 55, pricePerUnit: 75, price: 80 };
    const colX = { id: 50, name: 80, quantity: 240, unit: 290, pricePerUnit: 345, price: 420 };
    let currentY = tableTop;

    doc.fontSize(10).font('Roboto-Bold');
    doc.text('#', colX.id, currentY, { width: colWidths.id });
    doc.text(t.name, colX.name, currentY, { width: colWidths.name });
    doc.text(t.amount, colX.quantity, currentY, { width: colWidths.quantity });
    doc.text(t.unit, colX.unit, currentY, { width: colWidths.unit });
    doc.text(t.pricePerUnit, colX.pricePerUnit, currentY, { width: colWidths.pricePerUnit });
    doc.text(t.price, colX.price, currentY, { width: colWidths.price });
    
    currentY += 20;
    doc.font('Roboto');

    // Draw line under headers
    doc.moveTo(50, currentY - 5).lineTo(550, currentY - 5).stroke();

    // Sequential row number across tasks and budget items
    let rowNumber = 1;

    // Add tasks with pricing
    for (let i = 0; i < tasksWithPricing.length; i++) {
      const task = tasksWithPricing[i];
      
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      const amount = task.amount ? String(Number(task.amount)) : '1';
      const unit = task.unit || '-';
      const pricePerUnit = task.price != null ? formatPdfCurrency(Number(task.price), lang) : '-';
      const price = task.actualPrice ? formatPdfCurrency(Number(task.actualPrice), lang) : formatPdfCurrency(0, lang);

      doc.text(`${rowNumber}`, colX.id, currentY, { width: colWidths.id });
      doc.text(`[${t.task}] ${task.name}`, colX.name, currentY, { width: colWidths.name });
      doc.text(amount, colX.quantity, currentY, { width: colWidths.quantity });
      doc.text(unit, colX.unit, currentY, { width: colWidths.unit });
      doc.text(pricePerUnit, colX.pricePerUnit, currentY, { width: colWidths.pricePerUnit });
      doc.text(price, colX.price, currentY, { width: colWidths.price });
      
      currentY += 20;
      rowNumber++;
    }

    // Add budget items
    for (let i = 0; i < budget.items.length; i++) {
      const item = budget.items[i];
      
      // Check if we need a new page
      if (currentY > 700) {
        doc.addPage();
        currentY = 50;
      }

      const price = formatPdfCurrency(Number(item.actualCost), lang);
      const categoryLabel = translateCategory(item.category, t);

      doc.text(`${rowNumber}`, colX.id, currentY, { width: colWidths.id });
      doc.text(`[${categoryLabel}] ${item.name}`, colX.name, currentY, { width: colWidths.name });
      doc.text('-', colX.quantity, currentY, { width: colWidths.quantity });
      doc.text('-', colX.unit, currentY, { width: colWidths.unit });
      doc.text('-', colX.pricePerUnit, currentY, { width: colWidths.pricePerUnit });
      doc.text(price, colX.price, currentY, { width: colWidths.price });
      
      currentY += 20;
      rowNumber++;
    }

    doc.moveDown(2);
    currentY += 20;

    // Draw line before footer
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 20;

    // Footer Section - Category Subtotals
    doc.fontSize(12).font('Roboto-Bold').text(t.summaryByCategory, 50, currentY);
    currentY += 25;
    doc.font('Roboto');

    // Calculate category totals
    const categoryTotals: Record<string, number> = {};
    categoryTotals[t.tasks] = Number(budget.totalActualFromTasks);

    // Aggregate budget items by category
    for (const item of budget.items) {
      const category = translateCategory(item.category, t);
      if (!categoryTotals[category]) {
        categoryTotals[category] = 0;
      }
      categoryTotals[category] += Number(item.actualCost);
    }

    // Display category totals
    for (const [category, total] of Object.entries(categoryTotals)) {
      if (total > 0) {
        doc.text(`${category}:`, 50, currentY, { continued: true });
        doc.text(formatPdfCurrency(total, lang), { align: 'right' });
        currentY += 20;
      }
    }

    currentY += 10;
    doc.moveTo(50, currentY).lineTo(550, currentY).stroke();
    currentY += 20;

    // Total Summary
    doc.font('Roboto-Bold');
    doc.text(`${t.totalActual}:`, 50, currentY, { continued: true });
    doc.text(formatPdfCurrency(Number(budget.totalActual), lang), { align: 'right' });

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
