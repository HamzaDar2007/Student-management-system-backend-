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
import { createTestFaculty } from './helpers/data.helper';
import { Faculty } from '../src/modules/faculties/entities/faculty.entity';

describe('FacultiesController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminAuth: AuthTokens;
  let teacherAuth: AuthTokens;
  let studentAuth: AuthTokens;
  const TEST_PREFIX = 'faculties_e2e';

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
    // Clean up test faculties
    const facultyRepo = dataSource.getRepository(Faculty);
    await facultyRepo
      .createQueryBuilder()
      .delete()
      .where('code LIKE :pattern', {
        pattern: `${TEST_PREFIX.toUpperCase().slice(0, 2)}%`,
      })
      .execute();

    await deleteTestUsers(dataSource, TEST_PREFIX);
    await app.close();
  });

  describe('POST /faculties', () => {
    const endpoint = '/api/v1/faculties';

    it('admin should create faculty', async () => {
      const timestamp = Date.now();
      const response = await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          name: `${TEST_PREFIX} Faculty ${timestamp}`,
          code: `${TEST_PREFIX.toUpperCase().slice(0, 2)}${timestamp.toString().slice(-4)}`,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toContain(TEST_PREFIX);
    });

    it('should reject duplicate name', async () => {
      const timestamp = Date.now();
      const name = `${TEST_PREFIX} Duplicate Faculty ${timestamp}`;
      const code1 = `${TEST_PREFIX.toUpperCase().slice(0, 2)}D${timestamp.toString().slice(-3)}`;
      const code2 = `${TEST_PREFIX.toUpperCase().slice(0, 2)}E${timestamp.toString().slice(-3)}`;

      // Create first faculty
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({ name, code: code1 })
        .expect(201);

      // Try duplicate name
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({ name, code: code2 })
        .expect(409);
    });

    it('should reject duplicate code', async () => {
      const timestamp = Date.now();
      const code = `${TEST_PREFIX.toUpperCase().slice(0, 2)}F${timestamp.toString().slice(-3)}`;

      // Create first faculty
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          name: `${TEST_PREFIX} First Faculty ${timestamp}`,
          code,
        })
        .expect(201);

      // Try duplicate code
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          name: `${TEST_PREFIX} Second Faculty ${timestamp}`,
          code,
        })
        .expect(409);
    });

    it('non-admin should be rejected', async () => {
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .send({
          name: `${TEST_PREFIX} Unauthorized`,
          code: 'UNAUTH',
        })
        .expect(403);
    });

    it('unauthenticated should be rejected', async () => {
      await request(app.getHttpServer())
        .post(endpoint)
        .send({
          name: `${TEST_PREFIX} Unauthenticated`,
          code: 'NOAUTH',
        })
        .expect(401);
    });
  });

  describe('GET /faculties', () => {
    const endpoint = '/api/v1/faculties';

    beforeAll(async () => {
      await createTestFaculty(dataSource, TEST_PREFIX);
      await createTestFaculty(dataSource, TEST_PREFIX);
    });

    it('admin should get all faculties', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('teacher should access faculties', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('student should access faculties', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${studentAuth.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('unauthenticated should be rejected', async () => {
      await request(app.getHttpServer()).get(endpoint).expect(401);
    });
  });

  describe('GET /faculties/:id', () => {
    let testFacultyId: number;

    beforeAll(async () => {
      const faculty = await createTestFaculty(dataSource, TEST_PREFIX);
      testFacultyId = faculty.id;
    });

    it('should get faculty by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/faculties/${testFacultyId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(testFacultyId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 404 for non-existent faculty', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/faculties/999999')
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /faculties/:id', () => {
    let testFacultyId: number;

    beforeAll(async () => {
      const faculty = await createTestFaculty(dataSource, TEST_PREFIX);
      testFacultyId = faculty.id;
    });

    it('admin should update faculty', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/faculties/${testFacultyId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          name: `${TEST_PREFIX} Updated Faculty`,
        })
        .expect(200);

      expect(response.body.name).toBe(`${TEST_PREFIX} Updated Faculty`);
    });

    it('non-admin should be rejected', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/faculties/${testFacultyId}`)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .send({ name: 'Hacked' })
        .expect(403);
    });
  });

  describe('DELETE /faculties/:id', () => {
    it('admin should delete faculty', async () => {
      const faculty = await createTestFaculty(dataSource, TEST_PREFIX);

      await request(app.getHttpServer())
        .delete(`/api/v1/faculties/${faculty.id}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      // Verify deleted
      await request(app.getHttpServer())
        .get(`/api/v1/faculties/${faculty.id}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(404);
    });

    it('non-admin should be rejected', async () => {
      const faculty = await createTestFaculty(dataSource, TEST_PREFIX);

      await request(app.getHttpServer())
        .delete(`/api/v1/faculties/${faculty.id}`)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(403);
    });
  });
});
