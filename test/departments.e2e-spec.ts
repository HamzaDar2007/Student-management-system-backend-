import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import {
  createAdminAndLogin,
  createTeacherAndLogin,
  createStudentAndLogin,
  deleteTestUsers,
  AuthTokens,
} from './helpers';
import { createTestFaculty, createTestDepartment } from './helpers/data.helper';
import { Department } from '../src/modules/departments/entities/department.entity';
import { Faculty } from '../src/modules/faculties/entities/faculty.entity';

describe('DepartmentsController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminAuth: AuthTokens;
  let teacherAuth: AuthTokens;
  let studentAuth: AuthTokens;
  let testFaculty: Faculty;
  const TEST_PREFIX = 'depts_e2e';

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
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    adminAuth = await createAdminAndLogin(app, dataSource, TEST_PREFIX);
    teacherAuth = await createTeacherAndLogin(app, dataSource, TEST_PREFIX);
    studentAuth = await createStudentAndLogin(app, dataSource, TEST_PREFIX);

    // Create a test faculty for department tests
    testFaculty = await createTestFaculty(dataSource, TEST_PREFIX);
  });

  afterAll(async () => {
    // Clean up test departments
    const deptRepo = dataSource.getRepository(Department);
    await deptRepo
      .createQueryBuilder()
      .delete()
      .where('code LIKE :pattern', { pattern: `${TEST_PREFIX.toUpperCase().slice(0, 2)}D%` })
      .execute();

    // Clean up test faculties
    const facultyRepo = dataSource.getRepository(Faculty);
    await facultyRepo
      .createQueryBuilder()
      .delete()
      .where('code LIKE :pattern', { pattern: `${TEST_PREFIX.toUpperCase().slice(0, 2)}%` })
      .execute();

    await deleteTestUsers(dataSource, TEST_PREFIX);
    await app.close();
  });

  describe('POST /departments', () => {
    const endpoint = '/departments';

    it('admin should create department', async () => {
      const timestamp = Date.now();
      const response = await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          name: `${TEST_PREFIX} Department ${timestamp}`,
          code: `${TEST_PREFIX.toUpperCase().slice(0, 2)}D${timestamp.toString().slice(-3)}`,
          faculty_id: testFaculty.id,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toContain(TEST_PREFIX);
    });

    it('should reject duplicate code', async () => {
      const timestamp = Date.now();
      const code = `${TEST_PREFIX.toUpperCase().slice(0, 2)}D${timestamp.toString().slice(-3)}`;

      // Create first department
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          name: `${TEST_PREFIX} First Dept ${timestamp}`,
          code,
          faculty_id: testFaculty.id,
        })
        .expect(201);

      // Try duplicate code
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          name: `${TEST_PREFIX} Second Dept ${timestamp}`,
          code,
          faculty_id: testFaculty.id,
        })
        .expect(409);
    });

    it('should validate faculty_id exists', async () => {
      const timestamp = Date.now();
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          name: `${TEST_PREFIX} Invalid Faculty Dept`,
          code: `${TEST_PREFIX.toUpperCase().slice(0, 2)}D${timestamp.toString().slice(-3)}`,
          faculty_id: 999999,
        })
        .expect(404);
    });

    it('non-admin should be rejected', async () => {
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .send({
          name: `${TEST_PREFIX} Unauthorized Dept`,
          code: 'UNAUTH',
          faculty_id: testFaculty.id,
        })
        .expect(403);
    });
  });

  describe('GET /departments', () => {
    const endpoint = '/departments';

    beforeAll(async () => {
      await createTestDepartment(dataSource, testFaculty, TEST_PREFIX);
      await createTestDepartment(dataSource, testFaculty, TEST_PREFIX);
    });

    it('admin should get all departments', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('teacher should access departments', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('student should access departments', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${studentAuth.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(Array.isArray(response.body.items)).toBe(true);
    });
  });

  describe('GET /departments/:id', () => {
    let testDeptId: number;

    beforeAll(async () => {
      const dept = await createTestDepartment(dataSource, testFaculty, TEST_PREFIX);
      testDeptId = dept.id;
    });

    it('should get department by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/departments/${testDeptId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(testDeptId);
      expect(response.body).toHaveProperty('name');
      expect(response.body).toHaveProperty('code');
    });

    it('should return 404 for non-existent department', async () => {
      await request(app.getHttpServer())
        .get('/departments/999999')
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /departments/:id', () => {
    let testDeptId: number;

    beforeAll(async () => {
      const dept = await createTestDepartment(dataSource, testFaculty, TEST_PREFIX);
      testDeptId = dept.id;
    });

    it('admin should update department', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/departments/${testDeptId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          name: `${TEST_PREFIX} Updated Department`,
        })
        .expect(200);

      expect(response.body.name).toBe(`${TEST_PREFIX} Updated Department`);
    });

    it('non-admin should be rejected', async () => {
      await request(app.getHttpServer())
        .patch(`/departments/${testDeptId}`)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .send({ name: 'Hacked' })
        .expect(403);
    });
  });

  describe('DELETE /departments/:id', () => {
    it('admin should delete department', async () => {
      const dept = await createTestDepartment(dataSource, testFaculty, TEST_PREFIX);

      await request(app.getHttpServer())
        .delete(`/departments/${dept.id}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      // Verify deleted
      await request(app.getHttpServer())
        .get(`/departments/${dept.id}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(404);
    });

    it('non-admin should be rejected', async () => {
      const dept = await createTestDepartment(dataSource, testFaculty, TEST_PREFIX);

      await request(app.getHttpServer())
        .delete(`/departments/${dept.id}`)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(403);
    });
  });
});
