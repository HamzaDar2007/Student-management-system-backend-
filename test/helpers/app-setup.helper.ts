import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { XssPipe } from '../../src/common/pipes/xss.pipe';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';

/**
 * Configure a NestJS application for E2E testing to match production settings.
 */
export function setupE2EApp(app: INestApplication): INestApplication {
  // Set global prefix
  app.setGlobalPrefix('api');

  // Enable versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Apply filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Apply pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
    new XssPipe(),
  );

  return app;
}
