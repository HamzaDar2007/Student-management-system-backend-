import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Health (e2e)', () => {
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
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/health', () => {
    it('should return health status (may be 200 or 503 depending on thresholds)', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect((res) => {
          // Accept both 200 (ok) and 503 (service unavailable due to memory thresholds)
          expect([200, 503]).toContain(res.status);
          expect(res.body).toHaveProperty('status');
          expect(res.body).toHaveProperty('info');
        });
    });
  });

  describe('GET /api/health/liveness', () => {
    it('should return liveness status', () => {
      return request(app.getHttpServer())
        .get('/api/health/liveness')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('timestamp');
        });
    });
  });

  describe('GET /api/health/readiness', () => {
    it('should return readiness status (may be 200 or 503)', () => {
      return request(app.getHttpServer())
        .get('/api/health/readiness')
        .expect((res) => {
          expect([200, 503]).toContain(res.status);
          expect(res.body).toHaveProperty('status');
        });
    });
  });
});
