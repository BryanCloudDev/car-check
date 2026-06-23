import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import PDFDocument from 'pdfkit';
import { Prisma } from '../../generated/prisma/client';
import { PrismaErrorCode } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { WorkshopScopeService } from '../common/workshop-scope/workshop-scope.service';
import { AdvanceStatusDto } from './dto/advance-status.dto';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { VALID_TRANSITIONS } from './work-orders.constants';

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: WorkshopScopeService,
  ) {}

  async create(workshopId: string, dto: CreateWorkOrderDto) {
    const {
      vin,
      plate,
      make,
      model,
      year,
      customerId,
      mileage,
      notes,
      serviceDate,
      items,
    } = dto;

    // Validate customer belongs to workshop
    try {
      await this.scope
        .for(workshopId)
        .customer.findFirstOrThrow({ where: { id: customerId } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === PrismaErrorCode.NOT_FOUND
      ) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw e;
    }

    // Find-or-create vehicle by VIN (global entity, no workshopId)
    const vehicle = await this.prisma.vehicle.upsert({
      where: { vin },
      update: {},
      create: { vin, plate, make, model, year },
    });

    // Compute cost from items
    const cost = items.reduce(
      (sum, item) => sum + (item.quantity ?? 1) * (item.unitPrice ?? 0),
      0,
    );

    return this.scope.for(workshopId).workOrder.create({
      data: {
        vehicleId: vehicle.id,
        customerId,
        mileage,
        notes,
        serviceDate: serviceDate ? new Date(serviceDate) : undefined,
        cost,
        items: {
          createMany: {
            data: items.map((item) => ({
              type: item.type,
              description: item.description,
              quantity: item.quantity ?? 1,
              unitPrice: item.unitPrice ?? 0,
            })),
          },
        },
      },
      include: { items: true },
    });
  }

  async advanceStatus(workshopId: string, id: string, dto: AdvanceStatusDto) {
    const order = await this.scope
      .for(workshopId)
      .workOrder.findFirstOrThrow({ where: { id } })
      .catch((e: unknown) => {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === PrismaErrorCode.NOT_FOUND
        ) {
          throw new NotFoundException('Orden no encontrada');
        }
        throw e;
      });

    const allowed = VALID_TRANSITIONS[order.status];
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(
        `Transición inválida: ${order.status} → ${dto.status}`,
      );
    }

    return this.scope.for(workshopId).workOrder.update({
      where: { id },
      data: { status: dto.status },
      include: { items: true },
    });
  }

  async getReceipt(workshopId: string, id: string): Promise<Buffer> {
    const order = await this.prisma.workOrder
      .findFirstOrThrow({
        where: { id, workshopId },
        include: { vehicle: true, customer: true, workshop: true, items: true },
      })
      .catch((e: unknown) => {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === PrismaErrorCode.NOT_FOUND
        ) {
          throw new NotFoundException('Orden no encontrada');
        }
        throw e;
      });

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc
        .fontSize(18)
        .font('Helvetica-Bold')
        .text(order.workshop.name, { align: 'center' });
      doc
        .fontSize(14)
        .font('Helvetica')
        .text('Comprobante de Orden', { align: 'center' });
      doc.moveDown();

      // Order info
      doc.fontSize(11).font('Helvetica-Bold').text('Datos de la Orden');
      doc.font('Helvetica');
      doc.text(`ID: ${id.slice(0, 8).toUpperCase()}`);
      doc.text(`Fecha: ${order.createdAt.toLocaleDateString('es-MX')}`);
      doc.text(`Estado: ${order.status}`);
      if (order.serviceDate) {
        doc.text(
          `Fecha de servicio: ${order.serviceDate.toLocaleDateString('es-MX')}`,
        );
      }
      if (order.mileage) {
        doc.text(`Kilometraje: ${order.mileage}`);
      }
      doc.moveDown();

      // Customer
      doc.font('Helvetica-Bold').text('Cliente');
      doc.font('Helvetica');
      doc.text(`Nombre: ${order.customer.name}`);
      if (order.customer.phone) doc.text(`Teléfono: ${order.customer.phone}`);
      if (order.customer.email) doc.text(`Email: ${order.customer.email}`);
      doc.moveDown();

      // Vehicle
      doc.font('Helvetica-Bold').text('Vehículo');
      doc.font('Helvetica');
      doc.text(`VIN: ${order.vehicle.vin}`);
      if (order.vehicle.make) doc.text(`Marca: ${order.vehicle.make}`);
      if (order.vehicle.model) doc.text(`Modelo: ${order.vehicle.model}`);
      if (order.vehicle.year) doc.text(`Año: ${order.vehicle.year}`);
      if (order.vehicle.plate) doc.text(`Placa: ${order.vehicle.plate}`);
      doc.moveDown();

      // Items table header
      doc.font('Helvetica-Bold').text('Servicios y Repuestos');
      doc.moveDown(0.5);
      const tableTop = doc.y;
      const colType = 50;
      const colDesc = 110;
      const colQty = 330;
      const colPrice = 380;
      const colSub = 450;

      doc.fontSize(10);
      doc.text('Tipo', colType, tableTop);
      doc.text('Descripción', colDesc, tableTop);
      doc.text('Cant.', colQty, tableTop);
      doc.text('P. Unit.', colPrice, tableTop);
      doc.text('Subtotal', colSub, tableTop);
      doc
        .moveTo(50, doc.y + 2)
        .lineTo(560, doc.y + 2)
        .stroke();
      doc.moveDown(0.5);

      for (const item of order.items) {
        const rowY = doc.y;
        const subtotal = item.quantity * Number(item.unitPrice);
        doc.font('Helvetica').fontSize(10);
        doc.text(item.type, colType, rowY);
        doc.text(item.description, colDesc, rowY, { width: 200 });
        doc.text(String(item.quantity), colQty, rowY);
        doc.text(`$${Number(item.unitPrice).toFixed(2)}`, colPrice, rowY);
        doc.text(`$${subtotal.toFixed(2)}`, colSub, rowY);
        doc.moveDown();
      }

      doc.moveTo(50, doc.y).lineTo(560, doc.y).stroke();
      doc.moveDown(0.5);

      // Total
      doc
        .font('Helvetica-Bold')
        .fontSize(12)
        .text(`Total: $${Number(order.cost).toFixed(2)}`, { align: 'right' });

      // Notes
      if (order.notes) {
        doc.moveDown();
        doc.font('Helvetica-Bold').fontSize(11).text('Notas');
        doc.font('Helvetica').fontSize(10).text(order.notes);
      }

      doc.end();
    });
  }

  async update(workshopId: string, id: string, dto: UpdateWorkOrderDto) {
    const { mileage, notes, serviceDate, items } = dto;

    const data: Prisma.WorkOrderUncheckedUpdateInput = {
      ...(mileage !== undefined && { mileage }),
      ...(notes !== undefined && { notes }),
      ...(serviceDate !== undefined && { serviceDate: new Date(serviceDate) }),
    };

    if (items !== undefined) {
      data.cost = items.reduce(
        (sum, item) => sum + (item.quantity ?? 1) * (item.unitPrice ?? 0),
        0,
      );
      data.items = {
        deleteMany: {},
        createMany: {
          data: items.map((item) => ({
            type: item.type,
            description: item.description,
            quantity: item.quantity ?? 1,
            unitPrice: item.unitPrice ?? 0,
          })),
        },
      };
    }

    try {
      return await this.scope.for(workshopId).workOrder.update({
        where: { id },
        data,
        include: { items: true },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === PrismaErrorCode.NOT_FOUND
      ) {
        throw new NotFoundException('Orden no encontrada');
      }
      throw e;
    }
  }
}
