import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ScopedPrisma } from './scoped-prisma';

/**
 * Factory service that creates workshop-scoped Prisma delegates.
 *
 * Usage in a feature service:
 *   constructor(private readonly scope: WorkshopScopeService) {}
 *
 *   findAll(workshopId: string) {
 *     return this.scope.for(workshopId).customer.findMany();
 *   }
 */
@Injectable()
export class WorkshopScopeService {
  constructor(private readonly prisma: PrismaService) {}

  for(workshopId: string): ScopedPrisma {
    return new ScopedPrisma(this.prisma, workshopId);
  }
}
