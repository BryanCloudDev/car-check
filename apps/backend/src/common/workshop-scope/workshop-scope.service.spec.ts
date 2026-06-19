import { Test } from '@nestjs/testing';
import { WorkshopScopeService } from './workshop-scope.service';
import { ScopedPrisma } from './scoped-prisma';
import { PrismaService } from '../../prisma/prisma.service';

describe('WorkshopScopeService', () => {
  let service: WorkshopScopeService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        WorkshopScopeService,
        {
          provide: PrismaService,
          useValue: { customer: {}, workOrder: {} },
        },
      ],
    }).compile();

    service = module.get(WorkshopScopeService);
  });

  it('for() returns a ScopedPrisma instance', () => {
    const result = service.for('workshop-1');
    expect(result).toBeInstanceOf(ScopedPrisma);
  });

  it('for() binds the correct workshopId', () => {
    const result = service.for('workshop-xyz');
    expect(result.workshopId).toBe('workshop-xyz');
  });

  it('for() returns a different instance on each call', () => {
    const a = service.for('ws-1');
    const b = service.for('ws-1');
    expect(a).not.toBe(b);
  });

  it('two calls with different workshopId produce isolated scopes', () => {
    const scopeA = service.for('ws-A');
    const scopeB = service.for('ws-B');
    expect(scopeA.workshopId).toBe('ws-A');
    expect(scopeB.workshopId).toBe('ws-B');
  });
});
