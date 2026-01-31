import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/modules/users/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { setupE2EApp } from './helpers/app-setup.helper';

describe('Students (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let adminUserId: number;
  let studentUserId: number;
  let testStudentId: number;
  const uniqueId = Date.now().toString().slice(-4);

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupE2EApp(app);

    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    // Create admin user
    const adminResult = await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, first_name, last_name, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id`,
      [
        'e2e_students_admin@test.com',
        'e2e_students_admin',
        passwordHash,
        UserRole.ADMIN,
        'Admin',
        'Test',
      ],
    );
    adminUserId = adminResult[0].id;

    // Create teacher user
    await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, true) RETURNING id`,
      [
        'e2e_students_teacher@test.com',
        'e2e_students_teacher',
        passwordHash,
        UserRole.TEACHER,
      ],
    );

    // Create student user (for linking)
    const studentResult = await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, true) RETURNING id`,
      [
        'e2e_students_student@test.com',
        'e2e_students_student',
        passwordHash,
        UserRole.STUDENT,
      ],
    );
    studentUserId = studentResult[0].id;

    // Get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'e2e_students_admin@test.com',
        password: 'TestPassword123!',
      });
    adminToken = adminLogin.body.access_token;

    const teacherLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'e2e_students_teacher@test.com',
        password: 'TestPassword123!',
      });
    teacherToken = teacherLogin.body.access_token;

    const studentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: 'e2e_students_student@test.com',
        password: 'TestPassword123!',
      });
    studentToken = studentLogin.body.access_token;
  });

  afterAll(async () => {
    try {
      // Clean up - delete student profiles first due to FK constraints
      await dataSource.query(`DELETE FROM students WHERE student_id LIKE $1`, [
        `STU2024${uniqueId}%`,
      ]);
      await dataSource.query('DELETE FROM users WHERE email LIKE $1', [
        'e2e_students_%@test.com',
      ]);
    } catch (e) {
      // Ignore cleanup errors
    }
    await app.close();
  });

  describe('POST /api/students', () => {
    it('should create a new student for admin', () => {
      // Student ID format must be: STU + 4-digit year + 3+ digit sequence (e.g., STU2024001)
      return request(app.getHttpServer())
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          user_id: studentUserId,
          student_id: `STU2024${uniqueId}`,
          date_of_birth: '2000-01-15',
          enrollment_date: '2024-09-01',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.studentId).toBe(`STU2024${uniqueId}`);
          testStudentId = res.body.id;
        });
    });

    it('should reject creation by non-admin', () => {
      return request(app.getHttpServer())
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          student_id: 'STU2024999',
          date_of_birth: '2000-01-15',
          enrollment_date: '2024-09-01',
        })
        .expect(403);
    });

    it('should reject invalid student_id format', () => {
      return request(app.getHttpServer())
        .post('/api/v1/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: 'invalid-format',
          date_of_birth: '2000-01-15',
          enrollment_date: '2024-09-01',
        })
        .expect(400);
    });
  });

  describe('GET /api/students', () => {
    it('should return paginated students for admin', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should return paginated students for teacher', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
    });

    it('should reject request from students', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should support search by student ID', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students')
        .query({ search: `STU2024${uniqueId}` })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students')
        .query({ page: 1, limit: 5 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(5);
        });
    });
  });

  describe('GET /api/students/:id', () => {
    it('should return student by id for admin', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/students/${testStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testStudentId);
          expect(res.body).toHaveProperty('studentId');
        });
    });

    it('should return student by id for teacher', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/students/${testStudentId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
    });

    it('should return 404 for non-existent student', () => {
      return request(app.getHttpServer())
        .get('/api/v1/students/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/students/:id', () => {
    it('should update student for admin', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/students/${testStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          address: '123 Test Street',
          phone: '+12345678901234',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.address).toBe('123 Test Street');
        });
    });

    it('should reject update by non-admin', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/students/${testStudentId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({ address: 'New Address' })
        .expect(403);
    });
  });

  describe('GET /api/students/:id/grades', () => {
    it('should return student grades for admin', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/students/${testStudentId}/grades`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });

    it('should return student grades for teacher', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/students/${testStudentId}/grades`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
    });
  });

  describe('GET /api/students/:id/attendance', () => {
    it('should return student attendance for admin', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/students/${testStudentId}/attendance`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
        });
    });
  });

  describe('DELETE /api/students/:id', () => {
    it('should reject deletion by non-admin', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/students/${testStudentId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });

    // Note: Actual deletion test should be last
    it('should delete student for admin', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/students/${testStudentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('deleted', true);
        });
    });
  });
});
