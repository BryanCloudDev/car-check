import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

const ERROR_NAMES: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: 'Solicitud inválida',
  [HttpStatus.UNAUTHORIZED]: 'No autorizado',
  [HttpStatus.FORBIDDEN]: 'Acceso denegado',
  [HttpStatus.NOT_FOUND]: 'No encontrado',
  [HttpStatus.CONFLICT]: 'Conflicto',
  [HttpStatus.UNPROCESSABLE_ENTITY]: 'Datos no procesables',
  [HttpStatus.TOO_MANY_REQUESTS]: 'Demasiadas solicitudes',
  [HttpStatus.INTERNAL_SERVER_ERROR]: 'Error interno del servidor',
};

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const body = exception.getResponse() as Record<string, unknown>;

    response.status(status).json({
      statusCode: status,
      error: ERROR_NAMES[status] ?? 'Error',
      message: body.message ?? exception.message,
    });
  }
}
