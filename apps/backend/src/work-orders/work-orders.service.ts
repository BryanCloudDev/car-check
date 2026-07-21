import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { I18nContext, I18nService } from 'nestjs-i18n';
import PDFDocument from 'pdfkit';
import { OrderStatus, Prisma } from '../../generated/prisma/client';
import { PrismaErrorCode } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { WorkshopScopeService } from '../common/workshop-scope/workshop-scope.service';
import { VehiclesService } from '../vehicles/vehicles.service';
import { AdvanceStatusDto } from './dto/advance-status.dto';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { VALID_TRANSITIONS } from './work-orders.constants';

const ORDER_INCLUDE = {
  items: true,
  vehicle: true,
  customer: true,
} satisfies Prisma.WorkOrderInclude;

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: WorkshopScopeService,
    private readonly vehicles: VehiclesService,
    private readonly i18n: I18nService,
  ) {}

  findAll(workshopId: string, status?: OrderStatus) {
    return this.scope.for(workshopId).workOrder.findMany({
      where: status ? { status } : {},
      include: ORDER_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(workshopId: string, id: string) {
    return this.scope
      .for(workshopId)
      .workOrder.findFirstOrThrow({ where: { id }, include: ORDER_INCLUDE })
      .catch((e: unknown) => {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === PrismaErrorCode.NOT_FOUND
        ) {
          throw new NotFoundException('Orden no encontrada');
        }
        throw e;
      });
  }

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
    const vehicle = await this.vehicles.findOrCreate({
      vin,
      plate,
      make,
      model,
      year,
      mileage,
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

    const lang = I18nContext.current()?.lang ?? 'es';
    const t = (key: string): string =>
      this.i18n.translate(`receipt.${key}`, { lang });
    const dateLocale = lang.startsWith('en') ? 'en-US' : 'es-MX';

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
      doc.fontSize(14).font('Helvetica').text(t('title'), { align: 'center' });
      doc.moveDown();

      // Order info
      doc.fontSize(11).font('Helvetica-Bold').text(t('sections.order'));
      doc.font('Helvetica');
      doc.text(`${t('fields.id')}: ${id.slice(0, 8).toUpperCase()}`);
      doc.text(
        `${t('fields.date')}: ${order.createdAt.toLocaleDateString(dateLocale)}`,
      );
      doc.text(`${t('fields.status')}: ${order.status}`);
      if (order.serviceDate) {
        doc.text(
          `${t('fields.serviceDate')}: ${order.serviceDate.toLocaleDateString(dateLocale)}`,
        );
      }
      if (order.mileage) {
        doc.text(`${t('fields.mileage')}: ${order.mileage}`);
      }
      doc.moveDown();

      // Customer
      doc.font('Helvetica-Bold').text(t('sections.customer'));
      doc.font('Helvetica');
      doc.text(`${t('fields.name')}: ${order.customer.name}`);
      if (order.customer.phone)
        doc.text(`${t('fields.phone')}: ${order.customer.phone}`);
      if (order.customer.email)
        doc.text(`${t('fields.email')}: ${order.customer.email}`);
      doc.moveDown();

      // Vehicle
      doc.font('Helvetica-Bold').text(t('sections.vehicle'));
      doc.font('Helvetica');
      doc.text(`${t('fields.vin')}: ${order.vehicle.vin}`);
      if (order.vehicle.make)
        doc.text(`${t('fields.make')}: ${order.vehicle.make}`);
      if (order.vehicle.model)
        doc.text(`${t('fields.model')}: ${order.vehicle.model}`);
      if (order.vehicle.year)
        doc.text(`${t('fields.year')}: ${order.vehicle.year}`);
      if (order.vehicle.plate)
        doc.text(`${t('fields.plate')}: ${order.vehicle.plate}`);
      doc.moveDown();

      // Items table header
      doc.font('Helvetica-Bold').text(t('sections.items'));
      doc.moveDown(0.5);
      const tableTop = doc.y;
      const colType = 50;
      const colDesc = 110;
      const colQty = 330;
      const colPrice = 380;
      const colSub = 450;

      doc.fontSize(10);
      doc.text(t('table.type'), colType, tableTop);
      doc.text(t('table.description'), colDesc, tableTop);
      doc.text(t('table.quantity'), colQty, tableTop);
      doc.text(t('table.unitPrice'), colPrice, tableTop);
      doc.text(t('table.subtotal'), colSub, tableTop);
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
        .text(`${t('total')}: $${Number(order.cost).toFixed(2)}`, {
          align: 'right',
        });

      // Notes
      if (order.notes) {
        doc.moveDown();
        doc.font('Helvetica-Bold').fontSize(11).text(t('sections.notes'));
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
