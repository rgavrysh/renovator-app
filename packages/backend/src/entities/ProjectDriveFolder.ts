import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Project } from './Project';
import { User } from './User';

@Entity('project_drive_folders')
@Unique(['projectId', 'userId'])
export class ProjectDriveFolder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'project_id', type: 'uuid' })
  projectId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'drive_folder_id', type: 'varchar', length: 255 })
  driveFolderId: string;

  @Column({ name: 'drive_folder_name', type: 'varchar', length: 255 })
  driveFolderName: string;

  @Column({ name: 'drive_folder_url', type: 'varchar', length: 500, nullable: true })
  driveFolderUrl?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: Project;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
