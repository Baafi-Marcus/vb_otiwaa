import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';

@Catch()
export class SpaFallbackFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status = exception instanceof HttpException
            ? exception.getStatus()
            : HttpStatus.INTERNAL_SERVER_ERROR;

        // If it's a 404 and NOT an API request, serve index.html
        if (status === HttpStatus.NOT_FOUND && !request.path.startsWith('/api')) {
            const indexPath = join(__dirname, '..', '..', 'frontend', 'dist', 'index.html');
            if (existsSync(indexPath)) {
                return response.sendFile(indexPath);
            }
        }

        // Otherwise, default error handling
        if (exception instanceof HttpException) {
            return response.status(status).json(exception.getResponse());
        }

        return response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
