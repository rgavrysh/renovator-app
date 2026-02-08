import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Project } from './Project';
import { BudgetItem } from './BudgetItem';

@Entity('budgets')
export class Budget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'total_estimated', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalEstimated: number;

  @Column({ name: 'total_actual', type: 'decimal', precision: 12, scale: 2, default: 0 })
  totalActual: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @OneToOne(() => Project, (project) => project.budget, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @OneToMany(() => BudgetItem, (budgetItem) => budgetItem.budget)
  items: BudgetItem[];
}
