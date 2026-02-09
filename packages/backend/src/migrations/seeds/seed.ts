import { DataSource } from 'typeorm';
import { User } from '../../entities/User';
import { Project, ProjectStatus } from '../../entities/Project';
import { Task, TaskStatus, TaskPriority } from '../../entities/Task';
import { WorkItemTemplateService } from '../../services/WorkItemTemplateService';

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);
  const projectRepository = dataSource.getRepository(Project);
  const taskRepository = dataSource.getRepository(Task);

  console.log('Starting database seeding...');

  // Check if data already exists
  const existingUsers = await userRepository.count();
  if (existingUsers > 0) {
    console.log('Database already seeded. Skipping...');
    return;
  }

  // Create Users
  const user1 = userRepository.create({
    email: 'john.renovator@example.com',
    firstName: 'John',
    lastName: 'Renovator',
    phone: '+1-555-0101',
    company: 'John\'s Renovations LLC',
    idpUserId: 'idp-user-001',
  });

  const user2 = userRepository.create({
    email: 'jane.builder@example.com',
    firstName: 'Jane',
    lastName: 'Builder',
    phone: '+1-555-0102',
    company: 'Builder\'s Best',
    idpUserId: 'idp-user-002',
  });

  await userRepository.save([user1, user2]);
  console.log('✓ Created 2 users');

  // Create Projects
  const project1 = projectRepository.create({
    name: 'Kitchen Remodel - Smith Residence',
    clientName: 'Robert Smith',
    clientEmail: 'robert.smith@example.com',
    clientPhone: '+1-555-1001',
    description: 'Complete kitchen renovation including new cabinets, countertops, and appliances',
    startDate: new Date('2024-03-01'),
    estimatedEndDate: new Date('2024-05-15'),
    status: ProjectStatus.ACTIVE,
    ownerId: user1.id,
  });

  const project2 = projectRepository.create({
    name: 'Bathroom Upgrade - Johnson Home',
    clientName: 'Emily Johnson',
    clientEmail: 'emily.johnson@example.com',
    clientPhone: '+1-555-1002',
    description: 'Master bathroom renovation with walk-in shower and double vanity',
    startDate: new Date('2024-02-15'),
    estimatedEndDate: new Date('2024-04-30'),
    status: ProjectStatus.ACTIVE,
    ownerId: user1.id,
  });

  const project3 = projectRepository.create({
    name: 'Basement Finishing - Davis Property',
    clientName: 'Michael Davis',
    clientEmail: 'michael.davis@example.com',
    clientPhone: '+1-555-1003',
    description: 'Finish basement with rec room, bedroom, and full bathroom',
    startDate: new Date('2024-04-01'),
    estimatedEndDate: new Date('2024-07-31'),
    status: ProjectStatus.PLANNING,
    ownerId: user2.id,
  });

  await projectRepository.save([project1, project2, project3]);
  console.log('✓ Created 3 projects');

  // Create Tasks for Project 1 (Kitchen Remodel)
  const tasks1 = [
    taskRepository.create({
      name: 'Demolition - Remove old cabinets',
      description: 'Remove existing kitchen cabinets and countertops',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2024-03-05'),
      completedDate: new Date('2024-03-04'),
      estimatedPrice: 1500,
      actualPrice: 1450,
      projectId: project1.id,
      notes: ['Completed ahead of schedule', 'Minimal damage to walls'],
    }),
    taskRepository.create({
      name: 'Install new cabinets',
      description: 'Install custom white shaker cabinets',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2024-03-20'),
      estimatedPrice: 8500,
      projectId: project1.id,
      notes: ['Cabinets delivered on time'],
    }),
    taskRepository.create({
      name: 'Install granite countertops',
      description: 'Template and install granite countertops',
      status: TaskStatus.TODO,
      priority: TaskPriority.MEDIUM,
      dueDate: new Date('2024-04-01'),
      estimatedPrice: 4200,
      projectId: project1.id,
    }),
  ];

  // Create Tasks for Project 2 (Bathroom Upgrade)
  const tasks2 = [
    taskRepository.create({
      name: 'Demolition - Remove old fixtures',
      description: 'Remove existing bathtub, vanity, and tiles',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2024-02-20'),
      completedDate: new Date('2024-02-19'),
      estimatedPrice: 1200,
      actualPrice: 1300,
      projectId: project2.id,
    }),
    taskRepository.create({
      name: 'Plumbing rough-in',
      description: 'Install new plumbing for shower and double vanity',
      status: TaskStatus.COMPLETED,
      priority: TaskPriority.URGENT,
      dueDate: new Date('2024-02-25'),
      completedDate: new Date('2024-02-26'),
      estimatedPrice: 2500,
      actualPrice: 2800,
      projectId: project2.id,
      notes: ['Required additional piping', 'Passed inspection'],
    }),
    taskRepository.create({
      name: 'Tile installation',
      description: 'Install porcelain floor and wall tiles',
      status: TaskStatus.IN_PROGRESS,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2024-03-15'),
      estimatedPrice: 3500,
      projectId: project2.id,
    }),
  ];

  // Create Tasks for Project 3 (Basement Finishing)
  const tasks3 = [
    taskRepository.create({
      name: 'Framing',
      description: 'Frame walls for bedroom and bathroom',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2024-04-15'),
      estimatedPrice: 3200,
      projectId: project3.id,
    }),
    taskRepository.create({
      name: 'Electrical rough-in',
      description: 'Install electrical wiring and outlets',
      status: TaskStatus.TODO,
      priority: TaskPriority.HIGH,
      dueDate: new Date('2024-04-25'),
      estimatedPrice: 2800,
      projectId: project3.id,
    }),
  ];

  await taskRepository.save([...tasks1, ...tasks2, ...tasks3]);
  console.log('✓ Created 8 tasks across 3 projects');

  // Seed default work item templates
  const workItemTemplateService = new WorkItemTemplateService();
  await workItemTemplateService.seedDefaultTemplates();

  console.log('Database seeding completed successfully!');
}
