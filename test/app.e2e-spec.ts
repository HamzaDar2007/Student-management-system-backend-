import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { setupE2EApp } from './helpers/app-setup.helper';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupE2EApp(app);

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Root endpoint', () => {
    it('/api/v1 (GET) should return Hello World', () => {
      return request(app.getHttpServer())
        .get('/api/v1')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('Authentication required endpoints', () => {
    it('should reject unauthenticated requests to /api/users', () => {
      return request(app.getHttpServer()).get('/api/v1/users').expect(401);
    });

    it('should reject unauthenticated requests to /api/students', () => {
      return request(app.getHttpServer()).get('/api/v1/students').expect(401);
    });

    it('should reject unauthenticated requests to /api/courses', () => {
      return request(app.getHttpServer()).get('/api/v1/courses').expect(401);
    });

    it('should reject unauthenticated requests to /api/enrollments', () => {
      return request(app.getHttpServer())
        .get('/api/v1/enrollments')
        .expect(401);
    });

    it('should reject unauthenticated requests to /api/grades', () => {
      return request(app.getHttpServer()).get('/api/v1/grades').expect(401);
    });

    it('should reject unauthenticated requests to /api/attendance', () => {
      return request(app.getHttpServer()).get('/api/v1/attendance').expect(401);
    });
  });

  describe('Public endpoints', () => {
    it('/api/v1/auth/register should validate input', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({})
        .expect(400);
    });
  });

  describe('Error handling', () => {
    it('should return 404 for non-existent routes', () => {
      return request(app.getHttpServer())
        .get('/api/v1/non-existent-endpoint')
        .expect(404);
    });

    it('should handle malformed JSON', () => {
      return request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });
  });
});
