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
import { AuditLog } from '../src/modules/audit/entities/audit.entity';

describe('AuditController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminAuth: AuthTokens;
  let teacherAuth: AuthTokens;
  let studentAuth: AuthTokens;
  const TEST_PREFIX = 'audit_e2e';

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

    // Create some audit logs for testing
    const auditRepo = dataSource.getRepository(AuditLog);
    await auditRepo.save([
      auditRepo.create({
        userId: adminAuth.user.id,
        action: 'CREATE',
        resource: 'Student',
        resourceId: '1',
        payload: { test: 'data' },
      }),
      auditRepo.create({
        userId: adminAuth.user.id,
        action: 'UPDATE',
        resource: 'Course',
        resourceId: '1',
        payload: { updated: true },
      }),
      auditRepo.create({
        userId: teacherAuth.user.id,
        action: 'CREATE',
        resource: 'Grade',
        resourceId: '1',
        payload: { score: 85 },
      }),
    ]);
  });

  afterAll(async () => {
    // Clean up audit logs
    const auditRepo = dataSource.getRepository(AuditLog);
    await auditRepo
      .createQueryBuilder()
      .delete()
      .where('user_id IN (:...ids)', {
        ids: [adminAuth.user.id, teacherAuth.user.id],
      })
      .execute();

    await deleteTestUsers(dataSource, TEST_PREFIX);
    await app.close();
  });

  describe('GET /api/audit', () => {
    const endpoint = '/api/v1/audit';

    it('admin should get audit logs', async () => {
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

    it('should filter by user_id', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .query({ user_id: adminAuth.user.id })
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      response.body.items.forEach((log: any) => {
        expect(log.userId).toBe(adminAuth.user.id);
      });
    });

    it('should filter by action', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .query({ action: 'CREATE' })
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      response.body.items.forEach((log: any) => {
        expect(log.action).toBe('CREATE');
      });
    });

    it('should filter by resource', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .query({ resource: 'Student' })
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      response.body.items.forEach((log: any) => {
        expect(log.resource).toBe('Student');
      });
    });

    it('should support pagination', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .query({ page: 1, limit: 2 })
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.items.length).toBeLessThanOrEqual(2);
    });

    it('teacher should be rejected', async () => {
      await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(403);
    });

    it('student should be rejected', async () => {
      await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${studentAuth.accessToken}`)
        .expect(403);
    });

    it('unauthenticated should be rejected', async () => {
      await request(app.getHttpServer()).get(endpoint).expect(401);
    });
  });

  describe('GET /api/audit/:id', () => {
    let auditLogId: number;

    beforeAll(async () => {
      const auditRepo = dataSource.getRepository(AuditLog);
      const log = await auditRepo.save(
        auditRepo.create({
          userId: adminAuth.user.id,
          action: 'DELETE',
          resource: 'TestResource',
          resourceId: '999',
        }),
      );
      auditLogId = log.id;
    });

    it('admin should get audit log by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/audit/${auditLogId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(auditLogId);
      expect(response.body.action).toBe('DELETE');
      expect(response.body.resource).toBe('TestResource');
    });

    it('should return 404 for non-existent log', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/audit/999999')
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(404);
    });

    it('non-admin should be rejected', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/audit/${auditLogId}`)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(403);
    });
  });

  describe('GET /api/audit/resource/:resource/:resourceId', () => {
    beforeAll(async () => {
      const auditRepo = dataSource.getRepository(AuditLog);
      await auditRepo.save([
        auditRepo.create({
          userId: adminAuth.user.id,
          action: 'CREATE',
          resource: 'SpecificResource',
          resourceId: '42',
        }),
        auditRepo.create({
          userId: adminAuth.user.id,
          action: 'UPDATE',
          resource: 'SpecificResource',
          resourceId: '42',
        }),
      ]);
    });

    it('should return logs for specific resource', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/audit/resource/SpecificResource/42')
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((log: any) => {
        expect(log.resource).toBe('SpecificResource');
        expect(log.resourceId).toBe('42');
      });
    });

    it('non-admin should be rejected', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/audit/resource/Student/1')
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(403);
    });
  });

  describe('GET /api/audit/user/:userId', () => {
    it('should return logs for specific user', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/audit/user/${adminAuth.user.id}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      response.body.forEach((log: any) => {
        expect(log.userId).toBe(adminAuth.user.id);
      });
    });

    it('should return empty array for user with no logs', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/audit/user/999999')
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('non-admin should be rejected', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/audit/user/${adminAuth.user.id}`)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(403);
    });
  });
});
