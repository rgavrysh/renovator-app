import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './User';

export enum WorkItemCategory {
  DEMOLITION = 'demolition',
  FRAMING = 'framing',
  ELECTRICAL = 'electrical',
  PLUMBING = 'plumbing',
  HVAC = 'hvac',
  DRYWALL = 'drywall',
  PAINTING = 'painting',
  FLOORING = 'flooring',
  FINISHING = 'finishing',
  CLEANUP = 'cleanup',
  INSPECTION = 'inspection',
  OTHER = 'other',
}

@Entity('work_item_templates')
export class WorkItemTemplate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: WorkItemCategory,
  })
  category: WorkItemCategory;

  @Column({ name: 'estimated_duration', type: 'integer', nullable: true })
  estimatedDuration?: number;

  @Column({ name: 'default_price', type: 'decimal', precision: 12, scale: 2, nullable: true })
  defaultPrice?: number;

  @Column({ name: 'is_default', type: 'boolean', default: false })
  isDefault: boolean;

  @Column({ name: 'owner_id', type: 'uuid', nullable: true })
  ownerId?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'owner_id' })
  owner?: User;
}
