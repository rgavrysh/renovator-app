import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Budget } from './Budget';
import { Milestone } from './Milestone';

export enum BudgetCategory {
  LABOR = 'labor',
  MATERIALS = 'materials',
  EQUIPMENT = 'equipment',
  SUBCONTRACTORS = 'subcontractors',
  PERMITS = 'permits',
  CONTINGENCY = 'contingency',
  OTHER = 'other',
}

@Entity('budget_items')
export class BudgetItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'budget_id', type: 'uuid' })
  budgetId: string;

  @Column({ name: 'milestone_id', type: 'uuid', nullable: true })
  milestoneId?: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: BudgetCategory,
  })
  category: BudgetCategory;

  @Column({ name: 'actual_cost', type: 'decimal', precision: 12, scale: 2, default: 0 })
  actualCost: number;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Budget, (budget) => budget.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'budget_id' })
  budget: Budget;

  @ManyToOne(() => Milestone, (milestone) => milestone.budgetItems, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'milestone_id' })
  milestone?: Milestone;
}
