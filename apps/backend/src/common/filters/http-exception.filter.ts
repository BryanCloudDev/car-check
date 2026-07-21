import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { I18nContext, I18nService } from 'nestjs-i18n';

const ERROR_KEYS: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'common.errors.badRequest',
  [HttpStatus.UNAUTHORIZED]: 'common.errors.unauthorized',
  [HttpStatus.FORBIDDEN]: 'common.errors.forbidden',
  [HttpStatus.NOT_FOUND]: 'common.errors.notFound',
  [HttpStatus.CONFLICT]: 'common.errors.conflict',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'common.errors.unprocessableEntity',
  [HttpStatus.TOO_MANY_REQUESTS]: 'common.errors.tooManyRequests',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'common.errors.internalServerError',
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse() as Record<string, unknown>;

    const lang = I18nContext.current(host)?.lang;
    const key = ERROR_KEYS[status] ?? 'common.errors.default';

    response.status(status).json({
      statusCode: status,
      error: this.i18n.translate(key, { lang }),
      message: body.message ?? exception.message,
    });
  }
}
