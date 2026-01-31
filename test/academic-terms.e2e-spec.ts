import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { setupE2EApp } from './helpers/app-setup.helper';
import {
  createAdminAndLogin,
  createTeacherAndLogin,
  createStudentAndLogin,
  deleteTestUsers,
  AuthTokens,
} from './helpers';
import { createTestAcademicTerm } from './helpers/data.helper';
import { AcademicTerm } from '../src/modules/academic-terms/entities/academic-term.entity';

describe('AcademicTermsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminAuth: AuthTokens;
  let teacherAuth: AuthTokens;
  let studentAuth: AuthTokens;
  const TEST_PREFIX = 'terms_e2e';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupE2EApp(app);

    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    adminAuth = await createAdminAndLogin(app, dataSource, TEST_PREFIX);
    teacherAuth = await createTeacherAndLogin(app, dataSource, TEST_PREFIX);
    studentAuth = await createStudentAndLogin(app, dataSource, TEST_PREFIX);
  });

  afterAll(async () => {
    // Clean up test academic terms
    const termRepo = dataSource.getRepository(AcademicTerm);
    await termRepo
      .createQueryBuilder()
      .delete()
      .where('name LIKE :pattern', { pattern: `${TEST_PREFIX}%` })
      .execute();

    await deleteTestUsers(dataSource, TEST_PREFIX);
    await app.close();
  });

  describe('POST /api/v1/academic-terms', () => {
    const endpoint = '/api/v1/academic-terms';

    it('admin should create academic term', async () => {
      const timestamp = Date.now();
      const year = new Date().getFullYear();
      const response = await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          name: `${TEST_PREFIX} Fall ${timestamp}`,
          start_date: `${year}-09-01`,
          end_date: `${year}-12-31`,
          is_active: false,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toContain(TEST_PREFIX);
    });

    it('should validate date range (start < end)', async () => {
      const timestamp = Date.now();
      const year = new Date().getFullYear();

      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          name: `${TEST_PREFIX} Invalid ${timestamp}`,
          start_date: `${year}-12-31`,
          end_date: `${year}-01-01`, // End before start
          is_active: false,
        })
        .expect(400);
    });

    it('should reject duplicate name', async () => {
      const timestamp = Date.now();
      const year = new Date().getFullYear();
      const name = `${TEST_PREFIX} Duplicate Term ${timestamp}`;

      // Create first term
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          name,
          start_date: `${year}-01-01`,
          end_date: `${year}-06-30`,
        })
        .expect(201);

      // Try duplicate
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          name,
          start_date: `${year}-07-01`,
          end_date: `${year}-12-31`,
        })
        .expect(409);
    });

    it('non-admin should be rejected', async () => {
      const timestamp = Date.now();
      const year = new Date().getFullYear();

      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .send({
          name: `${TEST_PREFIX} Unauthorized ${timestamp}`,
          start_date: `${year}-01-01`,
          end_date: `${year}-06-30`,
        })
        .expect(403);
    });
  });

  describe('GET /api/v1/academic-terms', () => {
    const endpoint = '/api/v1/academic-terms';

    beforeAll(async () => {
      await createTestAcademicTerm(dataSource, TEST_PREFIX);
      await createTestAcademicTerm(dataSource, TEST_PREFIX);
    });

    it('admin should get all terms', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('meta');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('teacher should access terms', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('student should access terms', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${studentAuth.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('GET /academic-terms/:id', () => {
    let testTermId: number;

    beforeAll(async () => {
      const term = await createTestAcademicTerm(dataSource, TEST_PREFIX);
      testTermId = term.id;
    });

    it('should get term by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/academic-terms/${testTermId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(testTermId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('startDate');
      expect(response.body).toHaveProperty('endDate');
    });

    it('should return 404 for non-existent term', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/academic-terms/999999')
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /academic-terms/:id', () => {
    let testTermId: number;

    beforeAll(async () => {
      const term = await createTestAcademicTerm(dataSource, TEST_PREFIX);
      testTermId = term.id;
    });

    it('admin should update term', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/academic-terms/${testTermId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          name: `${TEST_PREFIX} Updated Term`,
          is_active: true,
        })
        .expect(200);

      expect(response.body.name).toBe(`${TEST_PREFIX} Updated Term`);
      expect(response.body.isActive).toBe(true);
    });

    it('non-admin should be rejected', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/academic-terms/${testTermId}`)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .send({ name: 'Hacked' })
        .expect(403);
    });
  });

  describe('DELETE /academic-terms/:id', () => {
    it('admin should delete term', async () => {
      const term = await createTestAcademicTerm(dataSource, TEST_PREFIX);

      await request(app.getHttpServer())
        .delete(`/api/v1/academic-terms/${term.id}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      // Verify deleted
      await request(app.getHttpServer())
        .get(`/api/v1/academic-terms/${term.id}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(404);
    });

    it('non-admin should be rejected', async () => {
      const term = await createTestAcademicTerm(dataSource, TEST_PREFIX);

      await request(app.getHttpServer())
        .delete(`/api/v1/academic-terms/${term.id}`)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(403);
    });
  });
});
