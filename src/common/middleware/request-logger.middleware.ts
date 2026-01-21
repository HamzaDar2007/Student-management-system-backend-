import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware for logging HTTP requests and responses.
 * Logs method, URL, status code, response time, and user agent.
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const { method, originalUrl, ip } = req;
    const userAgent = req.get('user-agent') || '';

    res.on('finish', () => {
      const { statusCode } = res;
      const contentLength = res.get('content-length') || 0;
      const responseTime = Date.now() - startTime;

      const logMessage = `${method} ${originalUrl} ${statusCode} ${contentLength}B - ${responseTime}ms`;

      if (statusCode >= 500) {
        this.logger.error(logMessage, `IP: ${ip}, UA: ${userAgent}`);
      } else if (statusCode >= 400) {
        this.logger.warn(logMessage, `IP: ${ip}`);
      } else {
        this.logger.log(logMessage);
      }
    });

    next();
  }
}
