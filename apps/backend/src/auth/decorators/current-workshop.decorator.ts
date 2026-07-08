import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../jwt.strategy';

export const CurrentWorkshop = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string =>
    ctx.switchToHttp().getRequest<{ user: AuthenticatedUser }>().user
      .workshopId,
);
