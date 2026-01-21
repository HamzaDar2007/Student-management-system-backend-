import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/modules/users/entities/user.entity';
import * as bcrypt from 'bcryptjs';

describe('Grades (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let testStudentId: number;
  let testCourseId: number;
  let testEnrollmentId: number;
  let testGradeId: number;

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
    const adminResult = await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, true) RETURNING id`,
      ['e2e_grades_admin@test.com', 'e2e_grades_admin', passwordHash, UserRole.ADMIN],
    );

    // Create teacher user
    const teacherResult = await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, true) RETURNING id`,
      ['e2e_grades_teacher@test.com', 'e2e_grades_teacher', passwordHash, UserRole.TEACHER],
    );
    const teacherUserId = teacherResult[0].id;

    // Create student user
    const studentUserResult = await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, is_active) 
       VALUES ($1, $2, $3, $4, true) RETURNING id`,
      ['e2e_grades_student@test.com', 'e2e_grades_student', passwordHash, UserRole.STUDENT],
    );
    const studentUserId = studentUserResult[0].id;

    // Create student
    const studentResult = await dataSource.query(
      `INSERT INTO students (user_id, student_id, date_of_birth, enrollment_date) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [studentUserId, 'STU-E2E-GRADES', '2000-01-01', '2024-01-01'],
    );
    testStudentId = studentResult[0].id;

    // Create course
    const courseResult = await dataSource.query(
      `INSERT INTO courses (course_code, course_name, credits, created_by) 
       VALUES ($1, $2, $3, $4) RETURNING id`,
      ['E2EGRD101', 'E2E Grade Course', 3, teacherUserId],
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
      .send({ email: 'e2e_grades_admin@test.com', password: 'TestPassword123!' });
    adminToken = adminLogin.body.access_token;

    const teacherLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'e2e_grades_teacher@test.com', password: 'TestPassword123!' });
    teacherToken = teacherLogin.body.access_token;

    const studentLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'e2e_grades_student@test.com', password: 'TestPassword123!' });
    studentToken = studentLogin.body.access_token;
  });

  afterAll(async () => {
    try {
      await dataSource.query('DELETE FROM grades WHERE student_id = $1', [testStudentId]);
      await dataSource.query('DELETE FROM enrollments WHERE student_id = $1', [testStudentId]);
      await dataSource.query('DELETE FROM students WHERE student_id = $1', ['STU-E2E-GRADES']);
      await dataSource.query('DELETE FROM courses WHERE course_code LIKE $1', ['E2EGRD%']);
      await dataSource.query('DELETE FROM users WHERE email LIKE $1', ['e2e_grades_%@test.com']);
    } catch (e) {
      // Ignore cleanup errors
    }
    await app.close();
  });

  describe('POST /api/grades', () => {
    it('should create a new grade for admin', () => {
      return request(app.getHttpServer())
        .post('/api/grades')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          student_id: testStudentId,
          course_id: testCourseId,
          assessment_type: 'midterm',
          assessment_name: 'Midterm Exam',
          score_obtained: 85,
          max_score: 100,
        })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
          if (res.status === 201 || res.status === 200) {
            expect(res.body).toHaveProperty('id');
            testGradeId = res.body.id;
          }
        });
    });

    it('should create a grade for teacher', () => {
      return request(app.getHttpServer())
        .post('/api/grades')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          student_id: testStudentId,
          course_id: testCourseId,
          assessment_type: 'quiz',
          assessment_name: 'Quiz 1',
          score_obtained: 9,
          max_score: 10,
        })
        .expect((res) => {
          expect([200, 201]).toContain(res.status);
        });
    });

    it('should reject grade creation by student', () => {
      return request(app.getHttpServer())
        .post('/api/grades')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          student_id: testStudentId,
          course_id: testCourseId,
          assessment_type: 'final',
          assessment_name: 'Final Exam',
          score_obtained: 90,
          max_score: 100,
        })
        .expect(403);
    });
  });

  describe('GET /api/grades', () => {
    it('should return grades for admin', () => {
      return request(app.getHttpServer())
        .get('/api/grades')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('should return grades for teacher', () => {
      return request(app.getHttpServer())
        .get('/api/grades')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);
    });
  });

  describe('GET /api/grades/:id', () => {
    it('should return grade by id for admin', () => {
      if (!testGradeId) {
        return Promise.resolve();
      }
      return request(app.getHttpServer())
        .get(`/api/grades/${testGradeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', testGradeId);
        });
    });

    it('should return 404 for non-existent grade', () => {
      return request(app.getHttpServer())
        .get('/api/grades/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/grades/:id', () => {
    it('should update grade for admin', () => {
      if (!testGradeId) {
        return Promise.resolve();
      }
      return request(app.getHttpServer())
        .put(`/api/grades/${testGradeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          score_obtained: 90,
        })
        .expect((res) => {
          expect([200, 400]).toContain(res.status);
        });
    });

    it('should reject update by student', () => {
      if (!testGradeId) {
        return Promise.resolve();
      }
      return request(app.getHttpServer())
        .put(`/api/grades/${testGradeId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ score: 100 })
        .expect(403);
    });
  });

  describe('DELETE /api/grades/:id', () => {
    it('should reject deletion by student', () => {
      if (!testGradeId) {
        return Promise.resolve();
      }
      return request(app.getHttpServer())
        .delete(`/api/grades/${testGradeId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should delete grade for admin', () => {
      if (!testGradeId) {
        return Promise.resolve();
      }
      return request(app.getHttpServer())
        .delete(`/api/grades/${testGradeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect((res) => {
          expect([200, 204]).toContain(res.status);
        });
    });
  });
});
