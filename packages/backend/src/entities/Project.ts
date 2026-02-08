import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Milestone } from './Milestone';
import { Task } from './Task';
import { Budget } from './Budget';
import { Document } from './Document';
import { Resource } from './Resource';

export enum ProjectStatus {
  PLANNING = 'planning',
  ACTIVE = 'active',
  ON_HOLD = 'on_hold',
  COMPLETED = 'completed',
  ARCHIVED = 'archived',
}

@Entity('projects')
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ name: 'client_name', type: 'varchar', length: 255 })
  clientName: string;

  @Column({ name: 'client_email', type: 'varchar', length: 255, nullable: true })
  clientEmail?: string;

  @Column({ name: 'client_phone', type: 'varchar', length: 20, nullable: true })
  clientPhone?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'estimated_end_date', type: 'date' })
  estimatedEndDate: Date;

  @Column({ name: 'actual_end_date', type: 'date', nullable: true })
  actualEndDate?: Date;

  @Column({
    type: 'varchar',
    length: 50,
    enum: ProjectStatus,
    default: ProjectStatus.PLANNING,
  })
  status: ProjectStatus;

  @Column({ name: 'owner_id', type: 'uuid' })
  ownerId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.projects)
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @OneToMany(() => Milestone, (milestone) => milestone.project)
  milestones: Milestone[];

  @OneToMany(() => Task, (task) => task.project)
  tasks: Task[];

  @OneToOne(() => Budget, (budget) => budget.project)
  budget: Budget;

  @OneToMany(() => Document, (document) => document.project)
  documents: Document[];

  @OneToMany(() => Resource, (resource) => resource.project)
  resources: Resource[];
}
