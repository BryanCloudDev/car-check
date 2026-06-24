import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaErrorCode, VIN_REGEX } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { WorkshopScopeService } from '../common/workshop-scope/workshop-scope.service';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: WorkshopScopeService,
  ) {}

  async create(dto: CreateVehicleDto) {
    try {
      return await this.prisma.vehicle.create({ data: dto });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === PrismaErrorCode.UNIQUE_VIOLATION
      ) {
        throw new ConflictException('Ya existe un vehículo con ese VIN');
      }
      throw e;
    }
  }

  async findOrCreate(dto: CreateVehicleDto) {
    const vin = this.normalizeVin(dto.vin);

    return this.prisma.vehicle.upsert({
      where: { vin },
      update: {
        plate: dto.plate ?? undefined,
        mileage: dto.mileage ?? undefined,
      },
      create: {
        vin,
        plate: dto.plate,
        make: dto.make,
        model: dto.model,
        year: dto.year,
        mileage: dto.mileage,
      },
    });
  }

  async findOne(vin: string) {
    const normalized = this.normalizeVin(vin);

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { vin: normalized },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    return vehicle;
  }

  async update(vin: string, dto: UpdateVehicleDto) {
    const normalized = this.normalizeVin(vin);

    try {
      return await this.prisma.vehicle.update({
        where: { vin: normalized },
        data: dto,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === PrismaErrorCode.NOT_FOUND
      ) {
        throw new NotFoundException('Vehículo no encontrado');
      }
      throw e;
    }
  }

  async getHistory(workshopId: string, vin: string) {
    const normalized = this.normalizeVin(vin);

    const vehicle = await this.prisma.vehicle.findUnique({
      where: { vin: normalized },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    return this.scope.for(workshopId).workOrder.findMany({
      where: { vehicleId: vehicle.id },
      orderBy: [{ serviceDate: 'asc' }, { createdAt: 'asc' }],
      include: { items: true },
    });
  }

  private normalizeVin(vin: string): string {
    const normalized = vin.trim().toUpperCase();
    if (!VIN_REGEX.test(normalized)) {
      throw new BadRequestException('VIN inválido');
    }
    return normalized;
  }
}
