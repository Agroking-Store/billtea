import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected error occurred. Please try again later.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      if (typeof exResponse === 'string') {
        message = exResponse;
      } else if (typeof exResponse === 'object' && exResponse !== null) {
        const resp = exResponse as any;
        // Handle class-validator errors
        if (Array.isArray(resp.message)) {
          message = resp.message.join(', ');
        } else {
          message = resp.message || message;
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      console.error('Unhandled error:', exception);
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
    });
  }
}
