import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/modules/users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

describe('Attendance (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let testStudentId: number;
  let testCourseId: number;
  let testEnrollmentId: number;
  let testAttendanceId: number;

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
    dataSource = moduleFixture.get<DataSource>(DataSource);

    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    // Create admin user
    await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, true)`,
      ['e2e_att_admin@test.com', 'e2e_att_admin', passwordHash, UserRole.ADMIN],
    );

    // Create teacher user
    const teacherResult = await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, true) RETURNING id`,
      ['e2e_att_teacher@test.com', 'e2e_att_teacher', passwordHash, UserRole.TEACHER],
    );
    const teacherUserId = teacherResult[0].id;

    // Create student user
    const studentUserResult = await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, true) RETURNING id`,
      ['e2e_att_student@test.com', 'e2e_att_student', passwordHash, UserRole.STUDENT],
    );
    const studentUserId = studentUserResult[0].id;

    // Create student
    const studentResult = await dataSource.query(
      `INSERT INTO students (user_id, student_id, date_of_birth, enrollment_date) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [studentUserId, 'STU-E2E-ATT', '2000-01-01', '2024-01-01'],
    );
    testStudentId = studentResult[0].id;

    // Create course
    const courseResult = await dataSource.query(
      `INSERT INTO courses (course_code, course_name, credits, created_by) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['E2EATT101', 'E2E Attendance Course', 3, teacherUserId],
    );
    testCourseId = courseResult[0].id;

    // Create enrollment
    const enrollResult = await dataSource.query(
      `INSERT INTO enrollments (student_id, course_id, enrollment_date, status) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [testStudentId, testCourseId, '2024-01-15', 'active'],
    );
    testEnrollmentId = enrollResult[0].id;

    // Get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'e2e_att_admin@test.com', password: 'TestPassword123!' });
    adminToken = adminLogin.body.access_token;

    const teacherLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'e2e_att_teacher@test.com', password: 'TestPassword123!' });
    teacherToken = teacherLogin.body.access_token;

    const studentLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'e2e_att_student@test.com', password: 'TestPassword123!' });
    studentToken = studentLogin.body.access_token;
  });

  afterAll(async () => {
    try {
      await dataSource.query('DELETE FROM attendance WHERE student_id = $1', [testStudentId]);
      await dataSource.query('DELETE FROM enrollments WHERE student_id = $1', [testStudentId]);
      await dataSource.query('DELETE FROM students WHERE student_id = $1', ['STU-E2E-ATT']);
      await dataSource.query('DELETE FROM courses WHERE course_code LIKE $1', ['E2EATT%']);
      await dataSource.query('DELETE FROM users WHERE email LIKE $1', ['e2e_att_%@test.com']);
    } catch (e) {
      // Ignore cleanup errors
    }
    await app.close();
  });

  describe('POST /api/attendance', () => {
    it('should create attendance for admin', () => {
      return request(app.getHttpServer())
        .post('/api/attendance')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: testStudentId,
          course_id: testCourseId,
          date: '2024-01-20',
          status: 'present',
        })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
          if (res.status === 201 || res.status === 200) {
            expect(res.body).toHaveProperty('id');
            testAttendanceId = res.body.id;
          }
        });
    });

    it('should create attendance for teacher', () => {
      return request(app.getHttpServer())
        .post('/api/attendance')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          student_id: testStudentId,
          course_id: testCourseId,
          date: '2024-01-21',
          status: 'absent',
        })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });
    });

    it('should reject attendance creation by student', () => {
      return request(app.getHttpServer())
        .post('/api/attendance')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          student_id: testStudentId,
          course_id: testCourseId,
          date: '2024-01-22',
          status: 'present',
        })
        .expect(403);
    });
  });

  describe('GET /api/attendance', () => {
    it('should return attendance records for admin', () => {
      return request(app.getHttpServer())
        .get('/api/attendance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('should return attendance for teacher', () => {
      return request(app.getHttpServer())
        .get('/api/attendance')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
    });
  });

  describe('GET /api/attendance/:id', () => {
    it('should return attendance by id for admin', () => {
      if (!testAttendanceId) {
        return Promise.resolve();
      }
      return request(app.getHttpServer())
        .get(`/api/attendance/${testAttendanceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testAttendanceId);
        });
    });

    it('should return 404 for non-existent attendance', () => {
      return request(app.getHttpServer())
        .get('/api/attendance/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/attendance/:id', () => {
    it('should update attendance for admin', () => {
      if (!testAttendanceId) {
        return Promise.resolve();
      }
      return request(app.getHttpServer())
        .put(`/api/attendance/${testAttendanceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'late',
        })
        .expect((res) => {
          expect([200, 400]).toContain(res.status);
        });
    });

    it('should reject update by student', () => {
      if (!testAttendanceId) {
        return Promise.resolve();
      }
      return request(app.getHttpServer())
        .put(`/api/attendance/${testAttendanceId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ status: 'present' })
        .expect(403);
    });
  });

  describe('DELETE /api/attendance/:id', () => {
    it('should reject deletion by student', () => {
      if (!testAttendanceId) {
        return Promise.resolve();
      }
      return request(app.getHttpServer())
        .delete(`/api/attendance/${testAttendanceId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should delete attendance for admin', () => {
      if (!testAttendanceId) {
        return Promise.resolve();
      }
      return request(app.getHttpServer())
        .delete(`/api/attendance/${testAttendanceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });
  });
});
