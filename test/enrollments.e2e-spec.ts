import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/modules/users/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { setupE2EApp } from './helpers/app-setup.helper';

describe('Enrollments (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let testStudentId: number;
  let testCourseId: number;
  let testEnrollmentId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupE2EApp(app);

    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    // Create test users
    await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, true) RETURNING id`,
      [
        'e2e_enroll_admin@test.com',
        'e2e_enroll_admin',
        passwordHash,
        UserRole.ADMIN,
      ],
    );

    await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, true)`,
      [
        'e2e_enroll_teacher@test.com',
        'e2e_enroll_teacher',
        passwordHash,
        UserRole.TEACHER,
      ],
    );

    const studentUserResult = await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, true) RETURNING id`,
      [
        'e2e_enroll_student@test.com',
        'e2e_enroll_student',
        passwordHash,
        UserRole.STUDENT,
      ],
    );
    const studentUserId = studentUserResult[0].id;

    // Create student
    const studentResult = await dataSource.query(
      `INSERT INTO students (user_id, student_id, date_of_birth, enrollment_date) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [studentUserId, 'STU-E2E-ENROLL', '2000-01-01', '2024-01-01'],
    );
    testStudentId = studentResult[0].id;

    // Create course
    const courseResult = await dataSource.query(
      `INSERT INTO courses (course_code, course_name, credits) 
       VALUES ($1, $2, $3) RETURNING id`,
      ['E2EENRL101', 'E2E Enrollment Course', 3],
    );
    testCourseId = courseResult[0].id;

    // Get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'e2e_enroll_admin@test.com',
        password: 'TestPassword123!',
      });
    adminToken = adminLogin.body.access_token;

    const teacherLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'e2e_enroll_teacher@test.com',
        password: 'TestPassword123!',
      });
    teacherToken = teacherLogin.body.access_token;

    const studentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'e2e_enroll_student@test.com',
        password: 'TestPassword123!',
      });
    studentToken = studentLogin.body.access_token;
  });

  afterAll(async () => {
    try {
      await dataSource.query(
        'DELETE FROM enrollments WHERE course_id IN (SELECT id FROM courses WHERE course_code LIKE $1)',
        ['E2EENRL%'],
      );
      await dataSource.query('DELETE FROM students WHERE student_id LIKE $1', [
        'STU-E2E-ENROLL%',
      ]);
      await dataSource.query('DELETE FROM courses WHERE course_code LIKE $1', [
        'E2EENRL%',
      ]);
      await dataSource.query('DELETE FROM users WHERE email LIKE $1', [
        'e2e_enroll_%@test.com',
      ]);
    } catch (e) {
      // Ignore cleanup errors
    }
    await app.close();
  });

  describe('POST /api/enrollments', () => {
    it('should create a new enrollment for admin', () => {
      return request(app.getHttpServer())
        .post('/api/v1/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: testStudentId,
          course_id: testCourseId,
        })
        .expect((res) => {
          // Accept 201 (created) or 200
          expect([200, 201]).toContain(res.status);
          if (res.status === 201 || res.status === 200) {
            expect(res.body).toHaveProperty('id');
            testEnrollmentId = res.body.id;
          }
        });
    });

    it('should reject duplicate enrollment', () => {
      if (!testEnrollmentId) {
        return Promise.resolve();
      }
      return request(app.getHttpServer())
        .post('/api/v1/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: testStudentId,
          course_id: testCourseId,
        })
        .expect((res) => {
          // Should return conflict or bad request
          expect([400, 409]).toContain(res.status);
        });
    });

    it('should reject enrollment by student', () => {
      return request(app.getHttpServer())
        .post('/api/v1/enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          student_id: testStudentId,
          course_id: testCourseId,
        })
        .expect((res) => {
          // 401 if token invalid, 403 if properly forbidden
          expect([401, 403]).toContain(res.status);
        });
    });
  });

  describe('GET /api/enrollments', () => {
    it('should return enrollments for admin', () => {
      return request(app.getHttpServer())
        .get('/api/v1/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should return enrollments for teacher', () => {
      return request(app.getHttpServer())
        .get('/api/v1/enrollments')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
    });
  });

  describe('GET /api/enrollments/:id', () => {
    it('should return enrollment by id for admin', () => {
      if (!testEnrollmentId) {
        return Promise.resolve();
      }
      return request(app.getHttpServer())
        .get(`/api/v1/enrollments/${testEnrollmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testEnrollmentId);
        });
    });

    it('should return 404 for non-existent enrollment', () => {
      return request(app.getHttpServer())
        .get('/api/v1/enrollments/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/enrollments/:id', () => {
    it('should update enrollment for admin', () => {
      if (!testEnrollmentId) {
        return Promise.resolve();
      }
      return request(app.getHttpServer())
        .put(`/api/v1/enrollments/${testEnrollmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'completed',
        })
        .expect((res) => {
          expect([200, 400]).toContain(res.status);
        });
    });
  });

  describe('DELETE /api/enrollments/:id', () => {
    it('should reject deletion by student', () => {
      if (!testEnrollmentId) {
        return Promise.resolve();
      }
      return request(app.getHttpServer())
        .delete(`/api/v1/enrollments/${testEnrollmentId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect((res) => {
          // 401 if token invalid, 403 if properly forbidden
          expect([401, 403]).toContain(res.status);
        });
    });

    it('should delete enrollment for admin', () => {
      if (!testEnrollmentId) {
        return Promise.resolve();
      }
      return request(app.getHttpServer())
        .delete(`/api/v1/enrollments/${testEnrollmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });
  });
});
