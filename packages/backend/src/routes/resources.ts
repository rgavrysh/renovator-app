import { Router, Request, Response } from 'express';
import { ResourceService } from '../services/ResourceService';
import { SupplierService } from '../services/SupplierService';
import { authenticate } from '../middleware';
import { ResourceStatus, ResourceType } from '../entities/Resource';

const router = Router();
const resourceService = new ResourceService();
const supplierService = new SupplierService();

/**
 * POST /api/projects/:projectId/resources
 * Create a new resource
 */
router.post('/projects/:projectId/resources', authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { type, name, quantity, unit, cost, supplierId, notes } = req.body;

    // Validate required fields
    if (!type || !name || quantity === undefined || !unit || cost === undefined) {
      res.status(400).json({ 
        error: 'Missing required fields: type, name, quantity, unit, cost' 
      });
      return;
    }

    // Validate type
    if (!Object.values(ResourceType).includes(type)) {
      res.status(400).json({ error: 'Invalid resource type' });
      return;
    }

    // Validate numeric fields
    if (typeof quantity !== 'number' || quantity <= 0) {
      res.status(400).json({ error: 'Quantity must be a positive number' });
      return;
    }

    if (typeof cost !== 'number' || cost < 0) {
      res.status(400).json({ error: 'Cost must be a non-negative number' });
      return;
    }

    const resource = await resourceService.createResource({
      projectId,
      type,
      name,
      quantity,
      unit,
      cost,
      supplierId,
      notes,
    });

    res.status(201).json(resource);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid')) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

/**
 * GET /api/projects/:projectId/resources
 * List resources for a project with optional filters
 */
router.get('/projects/:projectId/resources', authenticate, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { status, type, supplierId } = req.query;

    const filters: any = {};

    // Validate and parse status filter
    if (status) {
      if (typeof status === 'string' && !Object.values(ResourceStatus).includes(status as ResourceStatus)) {
        res.status(400).json({ error: 'Invalid status value' });
        return;
      }
      filters.status = status as ResourceStatus;
    }

    // Validate and parse type filter
    if (type) {
      if (typeof type === 'string' && !Object.values(ResourceType).includes(type as ResourceType)) {
        res.status(400).json({ error: 'Invalid type value' });
        return;
      }
      filters.type = type as ResourceType;
    }

    // Parse supplierId filter
    if (supplierId && typeof supplierId === 'string') {
      filters.supplierId = supplierId;
    }

    const resources = await resourceService.listResources(projectId, filters);
    res.json(resources);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid')) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Error listing resources:', error);
    res.status(500).json({ error: 'Failed to list resources' });
  }
});

/**
 * PUT /api/resources/:id
 * Update a resource
 */
router.put('/resources/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { type, name, quantity, unit, cost, status, supplierId, orderDate, expectedDeliveryDate, actualDeliveryDate, notes } = req.body;

    const updateData: any = {};

    if (type !== undefined) {
      if (!Object.values(ResourceType).includes(type)) {
        res.status(400).json({ error: 'Invalid resource type' });
        return;
      }
      updateData.type = type;
    }

    if (name !== undefined) updateData.name = name;

    if (quantity !== undefined) {
      if (typeof quantity !== 'number' || quantity <= 0) {
        res.status(400).json({ error: 'Quantity must be a positive number' });
        return;
      }
      updateData.quantity = quantity;
    }

    if (unit !== undefined) updateData.unit = unit;

    if (cost !== undefined) {
      if (typeof cost !== 'number' || cost < 0) {
        res.status(400).json({ error: 'Cost must be a non-negative number' });
        return;
      }
      updateData.cost = cost;
    }

    if (status !== undefined) {
      if (!Object.values(ResourceStatus).includes(status)) {
        res.status(400).json({ error: 'Invalid resource status' });
        return;
      }
      updateData.status = status;
    }

    if (supplierId !== undefined) {
      updateData.supplierId = supplierId === null ? null : supplierId;
    }

    // Parse and validate dates if provided
    if (orderDate !== undefined) {
      if (orderDate === null) {
        updateData.orderDate = null;
      } else {
        const parsedDate = new Date(orderDate);
        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ error: 'Invalid orderDate format' });
          return;
        }
        updateData.orderDate = parsedDate;
      }
    }

    if (expectedDeliveryDate !== undefined) {
      if (expectedDeliveryDate === null) {
        updateData.expectedDeliveryDate = null;
      } else {
        const parsedDate = new Date(expectedDeliveryDate);
        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ error: 'Invalid expectedDeliveryDate format' });
          return;
        }
        updateData.expectedDeliveryDate = parsedDate;
      }
    }

    if (actualDeliveryDate !== undefined) {
      if (actualDeliveryDate === null) {
        updateData.actualDeliveryDate = null;
      } else {
        const parsedDate = new Date(actualDeliveryDate);
        if (isNaN(parsedDate.getTime())) {
          res.status(400).json({ error: 'Invalid actualDeliveryDate format' });
          return;
        }
        updateData.actualDeliveryDate = parsedDate;
      }
    }

    if (notes !== undefined) updateData.notes = notes;

    const resource = await resourceService.updateResource(id, updateData);
    res.json(resource);
  } catch (error) {
    if (error instanceof Error && error.message === 'Resource not found') {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }
    if (error instanceof Error && error.message.includes('Invalid')) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Error updating resource:', error);
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

/**
 * DELETE /api/resources/:id
 * Delete a resource
 */
router.delete('/resources/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await resourceService.deleteResource(id);
    res.status(204).send();
  } catch (error) {
    if (error instanceof Error && error.message === 'Resource not found') {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

/**
 * POST /api/resources/:id/order
 * Mark a resource as ordered
 */
router.post('/resources/:id/order', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { orderDate, expectedDeliveryDate } = req.body;

    // Validate required fields
    if (!orderDate || !expectedDeliveryDate) {
      res.status(400).json({ 
        error: 'Missing required fields: orderDate, expectedDeliveryDate' 
      });
      return;
    }

    // Parse and validate dates
    const parsedOrderDate = new Date(orderDate);
    const parsedExpectedDeliveryDate = new Date(expectedDeliveryDate);

    if (isNaN(parsedOrderDate.getTime())) {
      res.status(400).json({ error: 'Invalid orderDate format' });
      return;
    }

    if (isNaN(parsedExpectedDeliveryDate.getTime())) {
      res.status(400).json({ error: 'Invalid expectedDeliveryDate format' });
      return;
    }

    if (parsedExpectedDeliveryDate < parsedOrderDate) {
      res.status(400).json({ error: 'Expected delivery date must be after order date' });
      return;
    }

    const resource = await resourceService.markAsOrdered(id, parsedOrderDate, parsedExpectedDeliveryDate);
    res.json(resource);
  } catch (error) {
    if (error instanceof Error && error.message === 'Resource not found') {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }
    console.error('Error marking resource as ordered:', error);
    res.status(500).json({ error: 'Failed to mark resource as ordered' });
  }
});

/**
 * POST /api/resources/:id/receive
 * Mark a resource as received
 */
router.post('/resources/:id/receive', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { actualDeliveryDate } = req.body;

    // Validate required fields
    if (!actualDeliveryDate) {
      res.status(400).json({ 
        error: 'Missing required field: actualDeliveryDate' 
      });
      return;
    }

    // Parse and validate date
    const parsedActualDeliveryDate = new Date(actualDeliveryDate);

    if (isNaN(parsedActualDeliveryDate.getTime())) {
      res.status(400).json({ error: 'Invalid actualDeliveryDate format' });
      return;
    }

    const resource = await resourceService.markAsReceived(id, parsedActualDeliveryDate);
    res.json(resource);
  } catch (error) {
    if (error instanceof Error && error.message === 'Resource not found') {
      res.status(404).json({ error: 'Resource not found' });
      return;
    }
    console.error('Error marking resource as received:', error);
    res.status(500).json({ error: 'Failed to mark resource as received' });
  }
});

/**
 * POST /api/suppliers
 * Create a new supplier
 */
router.post('/suppliers', authenticate, async (req: Request, res: Response) => {
  try {
    const { name, contactName, email, phone, address, notes } = req.body;

    // Validate required fields
    if (!name) {
      res.status(400).json({ 
        error: 'Missing required field: name' 
      });
      return;
    }

    const supplier = await supplierService.createSupplier({
      name,
      contactName,
      email,
      phone,
      address,
      notes,
      ownerId: req.userId!,
    });

    res.status(201).json(supplier);
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(500).json({ error: 'Failed to create supplier' });
  }
});

/**
 * GET /api/suppliers
 * List suppliers for the authenticated user
 */
router.get('/suppliers', authenticate, async (req: Request, res: Response) => {
  try {
    const suppliers = await supplierService.listSuppliers(req.userId!);
    res.json(suppliers);
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid')) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error('Error listing suppliers:', error);
    res.status(500).json({ error: 'Failed to list suppliers' });
  }
});

export default router;
