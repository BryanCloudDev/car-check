import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { WorkshopScopeService } from '../common/workshop-scope/workshop-scope.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly scope: WorkshopScopeService) {}

  findAll(workshopId: string) {
    return this.scope.for(workshopId).customer.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async findOne(workshopId: string, id: string) {
    try {
      return await this.scope.for(workshopId).customer.findFirstOrThrow({
        where: { id },
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw e;
    }
  }

  create(workshopId: string, dto: CreateCustomerDto) {
    return this.scope.for(workshopId).customer.create({ data: dto });
  }

  async update(workshopId: string, id: string, dto: UpdateCustomerDto) {
    try {
      return await this.scope.for(workshopId).customer.update({
        where: { id },
        data: dto,
      });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw e;
    }
  }

  async remove(workshopId: string, id: string) {
    try {
      await this.scope.for(workshopId).customer.delete({ where: { id } });
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2025'
      ) {
        throw new NotFoundException('Cliente no encontrado');
      }
      throw e;
    }
  }
}
