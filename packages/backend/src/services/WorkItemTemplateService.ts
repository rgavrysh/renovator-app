import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { WorkItemTemplate, WorkItemCategory } from '../entities/WorkItemTemplate';

// UUID validation regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export interface CreateWorkItemTemplateInput {
  name: string;
  description?: string;
  category: WorkItemCategory;
  estimatedDuration?: number;
  defaultPrice?: number;
  isDefault?: boolean;
  ownerId?: string;
}

export interface UpdateWorkItemTemplateInput {
  name?: string;
  description?: string;
  category?: WorkItemCategory;
  estimatedDuration?: number;
  defaultPrice?: number;
}

export class WorkItemTemplateService {
  private templateRepository: Repository<WorkItemTemplate>;

  constructor() {
    this.templateRepository = AppDataSource.getRepository(WorkItemTemplate);
  }

  async createTemplate(data: CreateWorkItemTemplateInput): Promise<WorkItemTemplate> {
    const template = this.templateRepository.create({
      name: data.name,
      description: data.description,
      category: data.category,
      estimatedDuration: data.estimatedDuration,
      defaultPrice: data.defaultPrice,
      isDefault: data.isDefault || false,
      ownerId: data.ownerId,
    });

    return await this.templateRepository.save(template);
  }

  async getTemplate(id: string, ownerId?: string): Promise<WorkItemTemplate> {
    if (!isValidUUID(id)) {
      throw new Error('Template not found');
    }

    const whereClause: any = { id };
    
    const template = await this.templateRepository.findOne({
      where: whereClause,
    });

    if (!template) {
      throw new Error('Template not found');
    }

    // Check ownership - user can access default templates or their own templates
    if (ownerId && template.ownerId && template.ownerId !== ownerId && !template.isDefault) {
      throw new Error('Template not found');
    }

    return template;
  }

  async updateTemplate(
    id: string,
    data: UpdateWorkItemTemplateInput,
    ownerId?: string
  ): Promise<WorkItemTemplate> {
    const template = await this.getTemplate(id, ownerId);

    // Only allow updating custom templates (not default ones)
    if (template.isDefault) {
      throw new Error('Cannot update default templates');
    }

    // Verify ownership for custom templates
    if (ownerId && template.ownerId !== ownerId) {
      throw new Error('Template not found');
    }

    Object.assign(template, data);

    return await this.templateRepository.save(template);
  }

  async deleteTemplate(id: string, ownerId?: string): Promise<void> {
    const template = await this.getTemplate(id, ownerId);

    // Only allow deleting custom templates (not default ones)
    if (template.isDefault) {
      throw new Error('Cannot delete default templates');
    }

    // Verify ownership for custom templates
    if (ownerId && template.ownerId !== ownerId) {
      throw new Error('Template not found');
    }

    await this.templateRepository.remove(template);
  }

  async listTemplates(category?: WorkItemCategory, ownerId?: string): Promise<WorkItemTemplate[]> {
    const whereClause: any = {};

    if (category) {
      whereClause.category = category;
    }

    // Build query to get default templates and user's custom templates
    const queryBuilder = this.templateRepository.createQueryBuilder('template');

    if (category) {
      queryBuilder.where('template.category = :category', { category });
    }

    // Get default templates or user's own templates
    if (ownerId) {
      if (category) {
        queryBuilder.andWhere('(template.isDefault = :isDefault OR template.ownerId = :ownerId)', {
          isDefault: true,
          ownerId,
        });
      } else {
        queryBuilder.where('(template.isDefault = :isDefault OR template.ownerId = :ownerId)', {
          isDefault: true,
          ownerId,
        });
      }
    } else {
      // If no ownerId provided, only return default templates
      if (category) {
        queryBuilder.andWhere('template.isDefault = :isDefault', { isDefault: true });
      } else {
        queryBuilder.where('template.isDefault = :isDefault', { isDefault: true });
      }
    }

    queryBuilder.orderBy('template.category', 'ASC').addOrderBy('template.name', 'ASC');

    return await queryBuilder.getMany();
  }

  async getTemplatesByCategory(ownerId?: string): Promise<Record<WorkItemCategory, WorkItemTemplate[]>> {
    const templates = await this.listTemplates(undefined, ownerId);

    const grouped: Record<WorkItemCategory, WorkItemTemplate[]> = {
      [WorkItemCategory.DEMOLITION]: [],
      [WorkItemCategory.FRAMING]: [],
      [WorkItemCategory.ELECTRICAL]: [],
      [WorkItemCategory.PLUMBING]: [],
      [WorkItemCategory.HVAC]: [],
      [WorkItemCategory.DRYWALL]: [],
      [WorkItemCategory.PAINTING]: [],
      [WorkItemCategory.FLOORING]: [],
      [WorkItemCategory.FINISHING]: [],
      [WorkItemCategory.CLEANUP]: [],
      [WorkItemCategory.INSPECTION]: [],
      [WorkItemCategory.OTHER]: [],
    };

    templates.forEach((template) => {
      grouped[template.category].push(template);
    });

    return grouped;
  }

  async seedDefaultTemplates(): Promise<void> {
    // Check if default templates already exist
    const existingDefaults = await this.templateRepository.count({
      where: { isDefault: true },
    });

    if (existingDefaults > 0) {
      console.log('Default work item templates already exist. Skipping seed...');
      return;
    }

    const defaultTemplates: CreateWorkItemTemplateInput[] = [
      // Demolition
      {
        name: 'Remove existing cabinets',
        description: 'Demolish and remove old kitchen or bathroom cabinets',
        category: WorkItemCategory.DEMOLITION,
        estimatedDuration: 4,
        defaultPrice: 500,
        isDefault: true,
      },
      {
        name: 'Remove flooring',
        description: 'Remove existing flooring material',
        category: WorkItemCategory.DEMOLITION,
        estimatedDuration: 8,
        defaultPrice: 800,
        isDefault: true,
      },
      {
        name: 'Remove drywall',
        description: 'Demolish and remove drywall',
        category: WorkItemCategory.DEMOLITION,
        estimatedDuration: 6,
        defaultPrice: 600,
        isDefault: true,
      },

      // Framing
      {
        name: 'Frame interior walls',
        description: 'Build wood frame for interior walls',
        category: WorkItemCategory.FRAMING,
        estimatedDuration: 16,
        defaultPrice: 2000,
        isDefault: true,
      },
      {
        name: 'Frame door openings',
        description: 'Frame rough openings for doors',
        category: WorkItemCategory.FRAMING,
        estimatedDuration: 4,
        defaultPrice: 400,
        isDefault: true,
      },
      {
        name: 'Frame window openings',
        description: 'Frame rough openings for windows',
        category: WorkItemCategory.FRAMING,
        estimatedDuration: 4,
        defaultPrice: 400,
        isDefault: true,
      },

      // Electrical
      {
        name: 'Electrical rough-in',
        description: 'Install electrical wiring, boxes, and conduit',
        category: WorkItemCategory.ELECTRICAL,
        estimatedDuration: 16,
        defaultPrice: 2500,
        isDefault: true,
      },
      {
        name: 'Install outlets and switches',
        description: 'Install electrical outlets and light switches',
        category: WorkItemCategory.ELECTRICAL,
        estimatedDuration: 8,
        defaultPrice: 800,
        isDefault: true,
      },
      {
        name: 'Install light fixtures',
        description: 'Install ceiling and wall light fixtures',
        category: WorkItemCategory.ELECTRICAL,
        estimatedDuration: 4,
        defaultPrice: 600,
        isDefault: true,
      },

      // Plumbing
      {
        name: 'Plumbing rough-in',
        description: 'Install water supply and drain pipes',
        category: WorkItemCategory.PLUMBING,
        estimatedDuration: 16,
        defaultPrice: 2800,
        isDefault: true,
      },
      {
        name: 'Install fixtures',
        description: 'Install sinks, faucets, and toilets',
        category: WorkItemCategory.PLUMBING,
        estimatedDuration: 8,
        defaultPrice: 1200,
        isDefault: true,
      },
      {
        name: 'Install water heater',
        description: 'Install or replace water heater',
        category: WorkItemCategory.PLUMBING,
        estimatedDuration: 6,
        defaultPrice: 1500,
        isDefault: true,
      },

      // HVAC
      {
        name: 'Install ductwork',
        description: 'Install HVAC ductwork and vents',
        category: WorkItemCategory.HVAC,
        estimatedDuration: 16,
        defaultPrice: 3000,
        isDefault: true,
      },
      {
        name: 'Install HVAC unit',
        description: 'Install heating and cooling unit',
        category: WorkItemCategory.HVAC,
        estimatedDuration: 8,
        defaultPrice: 4500,
        isDefault: true,
      },

      // Drywall
      {
        name: 'Hang drywall',
        description: 'Install drywall sheets on walls and ceilings',
        category: WorkItemCategory.DRYWALL,
        estimatedDuration: 12,
        defaultPrice: 1500,
        isDefault: true,
      },
      {
        name: 'Tape and mud drywall',
        description: 'Tape seams and apply joint compound',
        category: WorkItemCategory.DRYWALL,
        estimatedDuration: 16,
        defaultPrice: 1200,
        isDefault: true,
      },
      {
        name: 'Sand and finish drywall',
        description: 'Sand drywall smooth and apply final coat',
        category: WorkItemCategory.DRYWALL,
        estimatedDuration: 8,
        defaultPrice: 800,
        isDefault: true,
      },

      // Painting
      {
        name: 'Prime walls',
        description: 'Apply primer to walls and ceilings',
        category: WorkItemCategory.PAINTING,
        estimatedDuration: 8,
        defaultPrice: 600,
        isDefault: true,
      },
      {
        name: 'Paint walls',
        description: 'Apply finish paint to walls',
        category: WorkItemCategory.PAINTING,
        estimatedDuration: 12,
        defaultPrice: 1000,
        isDefault: true,
      },
      {
        name: 'Paint trim and doors',
        description: 'Paint baseboards, trim, and doors',
        category: WorkItemCategory.PAINTING,
        estimatedDuration: 8,
        defaultPrice: 800,
        isDefault: true,
      },

      // Flooring
      {
        name: 'Install hardwood flooring',
        description: 'Install hardwood floor planks',
        category: WorkItemCategory.FLOORING,
        estimatedDuration: 16,
        defaultPrice: 3500,
        isDefault: true,
      },
      {
        name: 'Install tile flooring',
        description: 'Install ceramic or porcelain tile',
        category: WorkItemCategory.FLOORING,
        estimatedDuration: 16,
        defaultPrice: 3000,
        isDefault: true,
      },
      {
        name: 'Install carpet',
        description: 'Install carpet with padding',
        category: WorkItemCategory.FLOORING,
        estimatedDuration: 8,
        defaultPrice: 2000,
        isDefault: true,
      },
      {
        name: 'Install vinyl flooring',
        description: 'Install vinyl plank or sheet flooring',
        category: WorkItemCategory.FLOORING,
        estimatedDuration: 12,
        defaultPrice: 2200,
        isDefault: true,
      },

      // Finishing
      {
        name: 'Install baseboards',
        description: 'Install baseboard trim',
        category: WorkItemCategory.FINISHING,
        estimatedDuration: 8,
        defaultPrice: 800,
        isDefault: true,
      },
      {
        name: 'Install crown molding',
        description: 'Install crown molding at ceiling',
        category: WorkItemCategory.FINISHING,
        estimatedDuration: 8,
        defaultPrice: 1000,
        isDefault: true,
      },
      {
        name: 'Install doors',
        description: 'Hang interior doors with hardware',
        category: WorkItemCategory.FINISHING,
        estimatedDuration: 4,
        defaultPrice: 600,
        isDefault: true,
      },
      {
        name: 'Install cabinets',
        description: 'Install kitchen or bathroom cabinets',
        category: WorkItemCategory.FINISHING,
        estimatedDuration: 16,
        defaultPrice: 2500,
        isDefault: true,
      },
      {
        name: 'Install countertops',
        description: 'Template and install countertops',
        category: WorkItemCategory.FINISHING,
        estimatedDuration: 8,
        defaultPrice: 3000,
        isDefault: true,
      },

      // Cleanup
      {
        name: 'Daily cleanup',
        description: 'Daily site cleanup and debris removal',
        category: WorkItemCategory.CLEANUP,
        estimatedDuration: 2,
        defaultPrice: 150,
        isDefault: true,
      },
      {
        name: 'Final cleanup',
        description: 'Thorough final cleaning before handover',
        category: WorkItemCategory.CLEANUP,
        estimatedDuration: 8,
        defaultPrice: 500,
        isDefault: true,
      },
      {
        name: 'Dumpster rental',
        description: 'Rent dumpster for construction debris',
        category: WorkItemCategory.CLEANUP,
        estimatedDuration: 0,
        defaultPrice: 400,
        isDefault: true,
      },

      // Inspection
      {
        name: 'Framing inspection',
        description: 'Schedule and pass framing inspection',
        category: WorkItemCategory.INSPECTION,
        estimatedDuration: 2,
        defaultPrice: 200,
        isDefault: true,
      },
      {
        name: 'Electrical inspection',
        description: 'Schedule and pass electrical inspection',
        category: WorkItemCategory.INSPECTION,
        estimatedDuration: 2,
        defaultPrice: 200,
        isDefault: true,
      },
      {
        name: 'Plumbing inspection',
        description: 'Schedule and pass plumbing inspection',
        category: WorkItemCategory.INSPECTION,
        estimatedDuration: 2,
        defaultPrice: 200,
        isDefault: true,
      },
      {
        name: 'Final inspection',
        description: 'Schedule and pass final building inspection',
        category: WorkItemCategory.INSPECTION,
        estimatedDuration: 2,
        defaultPrice: 250,
        isDefault: true,
      },
    ];

    const templates = defaultTemplates.map((data) =>
      this.templateRepository.create(data)
    );

    await this.templateRepository.save(templates);
    console.log(`✓ Created ${templates.length} default work item templates`);
  }
}
