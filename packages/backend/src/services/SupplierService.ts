import { Repository } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Supplier } from '../entities/Supplier';

// UUID validation regex
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidUUID(id: string): boolean {
  return UUID_REGEX.test(id);
}

export interface CreateSupplierInput {
  name: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
  ownerId: string;
}

export interface UpdateSupplierInput {
  name?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  notes?: string;
}

export class SupplierService {
  private supplierRepository: Repository<Supplier>;

  constructor() {
    this.supplierRepository = AppDataSource.getRepository(Supplier);
  }

  async createSupplier(data: CreateSupplierInput): Promise<Supplier> {
    const supplier = this.supplierRepository.create({
      name: data.name,
      contactName: data.contactName,
      email: data.email,
      phone: data.phone,
      address: data.address,
      notes: data.notes,
      ownerId: data.ownerId,
    });

    return await this.supplierRepository.save(supplier);
  }

  async getSupplier(id: string, ownerId?: string): Promise<Supplier> {
    if (!isValidUUID(id)) {
      throw new Error('Supplier not found');
    }

    const whereClause: any = { id };
    if (ownerId) {
      if (!isValidUUID(ownerId)) {
        throw new Error('Supplier not found');
      }
      whereClause.ownerId = ownerId;
    }

    const supplier = await this.supplierRepository.findOne({
      where: whereClause,
    });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    return supplier;
  }

  async updateSupplier(
    id: string,
    data: UpdateSupplierInput,
    ownerId?: string
  ): Promise<Supplier> {
    const supplier = await this.getSupplier(id, ownerId);

    Object.assign(supplier, data);

    return await this.supplierRepository.save(supplier);
  }

  async deleteSupplier(id: string, ownerId?: string): Promise<void> {
    const supplier = await this.getSupplier(id, ownerId);
    await this.supplierRepository.remove(supplier);
  }

  async listSuppliers(ownerId: string): Promise<Supplier[]> {
    if (!isValidUUID(ownerId)) {
      throw new Error('Invalid owner ID');
    }

    return await this.supplierRepository.find({
      where: { ownerId },
      order: { name: 'ASC' },
    });
  }
}
