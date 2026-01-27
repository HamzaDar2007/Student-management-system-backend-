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
  createTestUser,
} from './helpers';
import { createTestTeacherProfile } from './helpers/data.helper';
import { UserRole } from '../src/modules/users/entities/user.entity';

describe('TeachersController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminAuth: AuthTokens;
  let teacherAuth: AuthTokens;
  let studentAuth: AuthTokens;
  const TEST_PREFIX = 'teachers_e2e';

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
    await deleteTestUsers(dataSource, TEST_PREFIX);
    await app.close();
  });

  describe('POST /api/teachers', () => {
    const endpoint = '/api/v1/teachers';

    it('admin should create teacher profile', async () => {
      const teacherUser = await createTestUser(
        dataSource,
        UserRole.TEACHER,
        `${TEST_PREFIX}_newteacher`,
      );
      const timestamp = Date.now();

      const response = await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          user_id: teacherUser.id,
          employee_id: `EMP${timestamp.toString().slice(-6)}`,
          rank: 'assistant_professor',
          specialization: 'Computer Science',
          office_location: 'Room 101',
          office_hours: 'Mon-Fri 9-11 AM',
          phone: '03001234567',
          bio: 'Test teacher bio',
          hire_date: '2020-01-15',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.userId).toBe(teacherUser.id);
      expect(response.body.rank).toBe('assistant_professor');
    });

    it('should validate employee_id uniqueness', async () => {
      const teacherUser1 = await createTestUser(
        dataSource,
        UserRole.TEACHER,
        `${TEST_PREFIX}_emp1`,
      );
      const teacherUser2 = await createTestUser(
        dataSource,
        UserRole.TEACHER,
        `${TEST_PREFIX}_emp2`,
      );
      const employeeId = `EMP${Date.now().toString().slice(-6)}`;

      // Create first profile
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          user_id: teacherUser1.id,
          employee_id: employeeId,
          rank: 'lecturer',
        })
        .expect(201);

      // Try duplicate employee_id
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          user_id: teacherUser2.id,
          employee_id: employeeId,
          rank: 'lecturer',
        })
        .expect(409);
    });

    it('non-admin should be rejected', async () => {
      const teacherUser = await createTestUser(
        dataSource,
        UserRole.TEACHER,
        `${TEST_PREFIX}_unauth`,
      );

      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .send({
          user_id: teacherUser.id,
          employee_id: `EMP${Date.now()}`,
          rank: 'lecturer',
        })
        .expect(403);
    });

    it('should reject non-teacher user', async () => {
      const studentUser = await createTestUser(
        dataSource,
        UserRole.STUDENT,
        `${TEST_PREFIX}_wrongrole`,
      );

      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          user_id: studentUser.id,
          employee_id: `EMP${Date.now()}`,
          rank: 'lecturer',
        })
        .expect(409);
    });
  });

  describe('GET /api/teachers', () => {
    const endpoint = '/api/v1/teachers';

    beforeAll(async () => {
      // Create some teacher profiles
      const teacher1 = await createTestUser(
        dataSource,
        UserRole.TEACHER,
        `${TEST_PREFIX}_list1`,
      );
      const teacher2 = await createTestUser(
        dataSource,
        UserRole.TEACHER,
        `${TEST_PREFIX}_list2`,
      );
      await createTestTeacherProfile(dataSource, teacher1.id, TEST_PREFIX);
      await createTestTeacherProfile(dataSource, teacher2.id, TEST_PREFIX);
    });

    it('should return paginated teachers', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(Array.isArray(response.body.items)).toBe(true);
    });

    it('teacher should access teacher list', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('items');
    });

    it('student should be rejected', async () => {
      await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${studentAuth.accessToken}`)
        .expect(403);
    });
  });

  describe('GET /api/teachers/:id', () => {
    let testProfileId: number;

    beforeAll(async () => {
      const teacher = await createTestUser(
        dataSource,
        UserRole.TEACHER,
        `${TEST_PREFIX}_getone`,
      );
      const profile = await createTestTeacherProfile(
        dataSource,
        teacher.id,
        TEST_PREFIX,
      );
      testProfileId = profile.id;
    });

    it('should get teacher by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/teachers/${testProfileId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(testProfileId);
      expect(response.body).toHaveProperty('user');
    });

    it('should return 404 for non-existent', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/teachers/999999')
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(404);
    });
  });

  describe('GET /api/teachers/user/:userId', () => {
    let testUserId: number;

    beforeAll(async () => {
      const teacher = await createTestUser(
        dataSource,
        UserRole.TEACHER,
        `${TEST_PREFIX}_byuser`,
      );
      await createTestTeacherProfile(dataSource, teacher.id, TEST_PREFIX);
      testUserId = teacher.id;
    });

    it('should get teacher by user ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/teachers/user/${testUserId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      expect(response.body.userId).toBe(testUserId);
    });

    it('should return 404 if no profile exists', async () => {
      const userWithoutProfile = await createTestUser(
        dataSource,
        UserRole.TEACHER,
        `${TEST_PREFIX}_noprofile`,
      );

      await request(app.getHttpServer())
        .get(`/api/v1/teachers/user/${userWithoutProfile.id}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/teachers/:id', () => {
    let testProfileId: number;

    beforeAll(async () => {
      const teacher = await createTestUser(
        dataSource,
        UserRole.TEACHER,
        `${TEST_PREFIX}_update`,
      );
      const profile = await createTestTeacherProfile(
        dataSource,
        teacher.id,
        TEST_PREFIX,
      );
      testProfileId = profile.id;
    });

    it('admin should update teacher', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/teachers/${testProfileId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          rank: 'associate_professor',
          specialization: 'Data Science',
          office_location: 'Room 202',
        })
        .expect(200);

      expect(response.body.rank).toBe('associate_professor');
      expect(response.body.specialization).toBe('Data Science');
      expect(response.body.officeLocation).toBe('Room 202');
    });

    it('non-admin should be rejected', async () => {
      await request(app.getHttpServer())
        .put(`/api/v1/teachers/${testProfileId}`)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .send({ rank: 'professor' })
        .expect(403);
    });
  });

  describe('DELETE /api/teachers/:id', () => {
    it('admin should delete teacher', async () => {
      const teacher = await createTestUser(
        dataSource,
        UserRole.TEACHER,
        `${TEST_PREFIX}_delete`,
      );
      const profile = await createTestTeacherProfile(
        dataSource,
        teacher.id,
        TEST_PREFIX,
      );

      await request(app.getHttpServer())
        .delete(`/api/v1/teachers/${profile.id}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      // Verify deleted
      await request(app.getHttpServer())
        .get(`/api/v1/teachers/${profile.id}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(404);
    });

    it('non-admin should be rejected', async () => {
      const teacher = await createTestUser(
        dataSource,
        UserRole.TEACHER,
        `${TEST_PREFIX}_nodelete`,
      );
      const profile = await createTestTeacherProfile(
        dataSource,
        teacher.id,
        TEST_PREFIX,
      );

      await request(app.getHttpServer())
        .delete(`/api/v1/teachers/${profile.id}`)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(403);
    });
  });
});
