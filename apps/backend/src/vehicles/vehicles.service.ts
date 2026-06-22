import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VIN_REGEX } from '../common/constants';
import { PrismaService } from '../prisma/prisma.service';
import { WorkshopScopeService } from '../common/workshop-scope/workshop-scope.service';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scope: WorkshopScopeService,
  ) {}

  async getHistory(workshopId: string, vin: string) {
    if (!VIN_REGEX.test(vin)) {
      throw new BadRequestException('VIN inválido');
    }

    const vehicle = await this.prisma.vehicle.findUnique({ where: { vin } });
    if (!vehicle) {
      throw new NotFoundException('Vehículo no encontrado');
    }

    return this.scope.for(workshopId).workOrder.findMany({
      where: { vehicleId: vehicle.id },
      orderBy: [{ serviceDate: 'asc' }, { createdAt: 'asc' }],
      include: { items: true },
    });
  }
}
