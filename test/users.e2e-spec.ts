import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/modules/users/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { setupE2EApp } from './helpers/app-setup.helper';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let adminUserId: number;
  let teacherUserId: number;
  let studentUserId: number;
  let createdUserId: number;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupE2EApp(app);

    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Create test users with different roles
    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    // Create admin user
    const adminResult = await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, first_name, last_name, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id`,
      [
        'e2e_admin@test.com',
        'e2e_admin',
        passwordHash,
        UserRole.ADMIN,
        'Admin',
        'Test',
      ],
    );
    adminUserId = adminResult[0].id;

    // Create teacher user
    const teacherResult = await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, first_name, last_name, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id`,
      [
        'e2e_teacher@test.com',
        'e2e_teacher',
        passwordHash,
        UserRole.TEACHER,
        'Teacher',
        'Test',
      ],
    );
    teacherUserId = teacherResult[0].id;

    // Create student user
    const studentResult = await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, first_name, last_name, is_active) 
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING id`,
      [
        'e2e_student@test.com',
        'e2e_student',
        passwordHash,
        UserRole.STUDENT,
        'Student',
        'Test',
      ],
    );
    studentUserId = studentResult[0].id;

    // Login to get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'e2e_admin@test.com', password: 'TestPassword123!' });
    adminToken = adminLogin.body.access_token;

    const teacherLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'e2e_teacher@test.com', password: 'TestPassword123!' });
    teacherToken = teacherLogin.body.access_token;

    const studentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'e2e_student@test.com', password: 'TestPassword123!' });
    studentToken = studentLogin.body.access_token;
  });

  afterAll(async () => {
    // Clean up test users
    try {
      if (createdUserId) {
        await dataSource.query('DELETE FROM users WHERE id = $1', [
          createdUserId,
        ]);
      }
      await dataSource.query('DELETE FROM users WHERE email LIKE $1', [
        'e2e_%@test.com',
      ]);
    } catch (e) {
      // Ignore cleanup errors
    }
    await app.close();
  });

  describe('GET /api/users', () => {
    it('should return paginated users for admin', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('items');
          expect(res.body).toHaveProperty('total');
          expect(res.body).toHaveProperty('page');
          expect(res.body).toHaveProperty('limit');
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });

    it('should filter users by role', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .query({ role: UserRole.ADMIN })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          res.body.items.forEach((user: any) => {
            expect(user.role).toBe(UserRole.ADMIN);
          });
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .query({ page: 1, limit: 5 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(5);
          expect(res.body.items.length).toBeLessThanOrEqual(5);
        });
    });

    it('should reject request from non-admin users', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);
    });

    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer()).get('/api/v1/users').expect(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id for admin', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${studentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', studentUserId);
          expect(res.body).toHaveProperty('email');
          expect(res.body).not.toHaveProperty('passwordHash');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user for admin', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'e2e_newuser@test.com',
          username: 'e2e_newuser',
          password: 'NewPassword123!',
          role: UserRole.STUDENT,
          firstName: 'New',
          lastName: 'User',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body.email).toBe('e2e_newuser@test.com');
          createdUserId = res.body.id;
        });
    });

    it('should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'e2e_admin@test.com',
          username: 'different_username',
          password: 'Password123!',
          role: UserRole.STUDENT,
        })
        .expect(409);
    });

    it('should reject creation by non-admin', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          email: 'another@test.com',
          username: 'another',
          password: 'Password123!',
          role: UserRole.STUDENT,
        })
        .expect(403);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user for admin', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/users/${studentUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Updated',
          lastName: 'Student',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.firstName).toBe('Updated');
          expect(res.body.lastName).toBe('Student');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .put('/api/v1/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Test' })
        .expect(404);
    });
  });

  describe('DELETE /api/users/:id', () => {
    let deleteUserId: number;

    beforeAll(async () => {
      const passwordHash = await bcrypt.hash('TestPassword123!', 10);
      const result = await dataSource.query(
        `INSERT INTO users (email, username, password_hash, role, is_active) 
         VALUES ($1, $2, $3, $4, true) RETURNING id`,
        [
          'e2e_todelete@test.com',
          'e2e_todelete',
          passwordHash,
          UserRole.STUDENT,
        ],
      );
      deleteUserId = result[0].id;
    });

    it('should delete user for admin', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('deleted', true);
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should reject deletion by non-admin', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/users/${studentUserId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);
    });
  });
});
