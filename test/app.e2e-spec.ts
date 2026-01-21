import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );
    
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Root endpoint', () => {
    it('/ (GET) should return Hello World', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('Authentication required endpoints', () => {
    it('should reject unauthenticated requests to /api/users', () => {
      return request(app.getHttpServer())
        .get('/api/users')
        .expect(401);
    });

    it('should reject unauthenticated requests to /api/students', () => {
      return request(app.getHttpServer())
        .get('/api/students')
        .expect(401);
    });

    it('should reject unauthenticated requests to /api/courses', () => {
      return request(app.getHttpServer())
        .get('/api/courses')
        .expect(401);
    });

    it('should reject unauthenticated requests to /api/enrollments', () => {
      return request(app.getHttpServer())
        .get('/api/enrollments')
        .expect(401);
    });

    it('should reject unauthenticated requests to /api/grades', () => {
      return request(app.getHttpServer())
        .get('/api/grades')
        .expect(401);
    });

    it('should reject unauthenticated requests to /api/attendance', () => {
      return request(app.getHttpServer())
        .get('/api/attendance')
        .expect(401);
    });
  });

  describe('Public endpoints', () => {
    it('/api/auth/register should validate input', () => {
      return request(app.getHttpServer())
        .post('/api/auth/register')
        .send({})
        .expect(400);
    });
  });

  describe('Error handling', () => {
    it('should return 404 for non-existent routes', () => {
      return request(app.getHttpServer())
        .get('/api/non-existent-endpoint')
        .expect(404);
    });

    it('should handle malformed JSON', () => {
      return request(app.getHttpServer())
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });
  });
});
