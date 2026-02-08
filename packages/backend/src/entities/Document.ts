import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from './Project';
import { User } from './User';

export enum DocumentType {
  CONTRACT = 'contract',
  INVOICE = 'invoice',
  RECEIPT = 'receipt',
  PHOTO = 'photo',
  PERMIT = 'permit',
  WARRANTY = 'warranty',
  OTHER = 'other',
}

@Entity('documents')
export class Document {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    enum: DocumentType,
  })
  type: DocumentType;

  @Column({ name: 'file_type', type: 'varchar', length: 50 })
  fileType: string;

  @Column({ name: 'file_size', type: 'bigint' })
  fileSize: number;

  @Column({ name: 'storage_url', type: 'varchar', length: 500 })
  storageUrl: string;

  @Column({ name: 'thumbnail_url', type: 'varchar', length: 500, nullable: true })
  thumbnailUrl?: string;

  @Column({ name: 'uploaded_by', type: 'uuid' })
  uploadedBy: string;

  @CreateDateColumn({ name: 'uploaded_at' })
  uploadedAt: Date;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: {
    tags?: string[];
    description?: string;
    captureDate?: Date;
    associatedMilestoneId?: string;
    caption?: string;
    location?: {
      latitude: number;
      longitude: number;
    };
    dimensions?: {
      width: number;
      height: number;
    };
  };

  // Relationships
  @ManyToOne(() => Project, (project) => project.documents, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User;
}
