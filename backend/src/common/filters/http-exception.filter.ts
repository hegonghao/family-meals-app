import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Request, Response } from 'express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(@Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse = exception instanceof HttpException ? exception.getResponse() : null;

    const error =
      (typeof exceptionResponse === 'object' && exceptionResponse && 'error' in exceptionResponse
        ? (exceptionResponse as { error?: string }).error
        : undefined) ?? (exception instanceof Error ? exception.name : 'Error');

    const messageSource =
      (typeof exceptionResponse === 'object' && exceptionResponse && 'message' in exceptionResponse
        ? (exceptionResponse as { message?: string | string[] }).message
        : undefined) ?? (exception instanceof Error ? exception.message : 'Internal server error');

    const message = Array.isArray(messageSource) ? messageSource.join(', ') : messageSource;

    const errorPayload = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
    };

    this.logger.error('HTTP exception', {
      ...errorPayload,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    response.status(status).json(errorPayload);
  }
}
