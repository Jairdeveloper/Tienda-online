import { randomUUID } from 'crypto';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { JsonLoggerService } from '../logger/json-logger.service';

type ErrorBody = {
  statusCode: number;
  message: string | string[];
  errorCode: string;
  details: unknown;
  timestamp: string;
  path: string;
  method: string;
  requestId: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: JsonLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const rawResponse = exception instanceof HttpException ? exception.getResponse() : null;

    let message: string | string[] = 'Internal server error';
    let details: unknown = null;
    let errorCode = 'INTERNAL_SERVER_ERROR';

    if (typeof rawResponse === 'string') {
      message = rawResponse;
    } else if (rawResponse && typeof rawResponse === 'object') {
      const responseObject = rawResponse as Record<string, unknown>;
      const maybeMessage = responseObject.message;

      if (typeof maybeMessage === 'string' || Array.isArray(maybeMessage)) {
        message = maybeMessage;
      }

      if (typeof responseObject.error === 'string') {
        errorCode = responseObject.error.toUpperCase().replace(/\s+/g, '_');
      } else if (typeof responseObject.code === 'string') {
        errorCode = responseObject.code;
      } else if (statusCode < 500) {
        errorCode = 'BAD_REQUEST';
      }

      details = responseObject;
    } else if (exception instanceof Error) {
      message = exception.message;
      details = {
        name: exception.name,
      };
    }

    const requestId =
      request.requestId ??
      (Array.isArray(request.headers['x-request-id'])
        ? request.headers['x-request-id'][0]
        : request.headers['x-request-id']) ??
      randomUUID();

    const errorBody: ErrorBody = {
      statusCode,
      message,
      errorCode,
      details,
      timestamp: new Date().toISOString(),
      path: request.originalUrl,
      method: request.method,
      requestId,
    };

    if (statusCode >= 500) {
      this.logger.error(errorBody, exception instanceof Error ? exception.stack : undefined);
    } else {
      this.logger.warn(errorBody);
    }

    response.status(statusCode).json(errorBody);
  }
}
