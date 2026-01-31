import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/modules/users/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import { setupE2EApp } from './helpers/app-setup.helper';
import {
  createAdminAndLogin,
  createTeacherAndLogin,
  createStudentAndLogin,
  deleteTestUsers,
  AuthTokens,
  cleanupTestDataByPrefix,
} from './helpers';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminAuth: AuthTokens;
  let teacherAuth: AuthTokens;
  let studentAuth: AuthTokens;
  let createdUserId: number;
  const TEST_PREFIX = 'users_e2e';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupE2EApp(app);

    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    // Proactive cleanup
    await cleanupTestDataByPrefix(dataSource, TEST_PREFIX);

    // Create test users with different roles using helpers
    adminAuth = await createAdminAndLogin(app, dataSource, TEST_PREFIX);
    teacherAuth = await createTeacherAndLogin(app, dataSource, TEST_PREFIX);
    studentAuth = await createStudentAndLogin(app, dataSource, TEST_PREFIX);
  });

  afterAll(async () => {
    // Clean up test users
    try {
      if (createdUserId) {
        await dataSource.query('DELETE FROM users WHERE id = $1', [
          createdUserId,
        ]);
      }
      await cleanupTestDataByPrefix(dataSource, TEST_PREFIX);
    } catch (e) {
      // Ignore cleanup errors
    }
    await app.close();
  });

  describe('GET /api/users', () => {
    it('should return paginated users for admin', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('meta');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    it('should filter users by role', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .query({ role: UserRole.ADMIN })
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200)
        .expect((res) => {
          res.body.data.forEach((user: any) => {
            expect(user.role).toBe(UserRole.ADMIN);
          });
        });
    });

    it('should support pagination', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .query({ page: 1, limit: 5 })
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.meta.page).toBe(1);
          expect(res.body.meta.limit).toBe(5);
          expect(res.body.data.length).toBeLessThanOrEqual(5);
        });
    });

    it('should reject request from non-admin users', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users')
        .set('Authorization', `Bearer ${studentAuth.accessToken}`)
        .expect(403);
    });

    it('should reject unauthenticated request', () => {
      return request(app.getHttpServer()).get('/api/v1/users').expect(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should return user by id for admin', () => {
      return request(app.getHttpServer())
        .get(`/api/v1/users/${studentAuth.user.id}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', studentAuth.user.id);
          expect(res.body).toHaveProperty('email');
          expect(res.body).not.toHaveProperty('passwordHash');
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .get('/api/v1/users/99999')
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(404);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user for admin', () => {
      return request(app.getHttpServer())
        .post('/api/v1/users')
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
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
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
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
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
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
        .put(`/api/v1/users/${studentAuth.user.id}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
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
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
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
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('deleted', true);
        });
    });

    it('should return 404 for non-existent user', () => {
      return request(app.getHttpServer())
        .delete('/api/v1/users/99999')
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(404);
    });

    it('should reject deletion by non-admin', () => {
      return request(app.getHttpServer())
        .delete(`/api/v1/users/${studentAuth.user.id}`)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(403);
    });
  });
});
