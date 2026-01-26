import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe, VersioningType } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { WinstonModule } from 'nest-winston';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';
import { XssPipe } from './common/pipes/xss.pipe';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import winstonConfig from './config/logger.config';

async function bootstrap() {
  // Create Winston logger instance
  const winstonLogger = WinstonModule.createLogger(winstonConfig);

  // Create app with Winston logger
  const app = await NestFactory.create(AppModule, {
    logger: winstonLogger,
  });

  // Use the same logger for bootstrap messages
  const logger = new Logger('Bootstrap');

  // Set global prefix for all routes
  app.setGlobalPrefix('api');

  // Enable API versioning (URI versioning: /api/v1/...)
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // Security middleware
  app.use(helmet());

  // Compression middleware for response compression
  app.use(compression());

  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // Global validation pipe
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

  // Enable CORS
  app.enableCors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  });

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Students Management System API')
    .setDescription(
      `
      RESTful API for managing students, courses, enrollments, grades, attendance, and academic administration.
      
      ## Base URL
      All API endpoints are prefixed with \`/api/v1/\`
      
      ## Authentication
      Most endpoints require JWT Bearer token authentication. Use the /api/v1/auth/login endpoint to obtain a token.
      
      ## Roles
      - **ADMIN**: Full access to all resources
      - **TEACHER**: Manage courses, grades, attendance for assigned courses
      - **STUDENT**: View own data, enrollments, grades, and attendance
    `,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication and authorization endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Students', 'Student management endpoints')
    .addTag('Teachers', 'Teacher management endpoints')
    .addTag('Courses', 'Course management endpoints')
    .addTag('Enrollments', 'Enrollment management endpoints')
    .addTag('Grades', 'Grade management endpoints')
    .addTag('Attendance', 'Attendance tracking endpoints')
    .addTag('Faculties', 'Faculty management endpoints')
    .addTag('Departments', 'Department management endpoints')
    .addTag('Academic Terms', 'Academic term/semester management')
    .addTag('Scheduling', 'Course scheduling and classroom management')
    .addTag('Audit', 'Audit log endpoints')
    .addTag('Health', 'Health check endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application running on http://localhost:${port}`);
  logger.log(
    `Swagger documentation available at http://localhost:${port}/api/docs`,
  );
}
bootstrap();
