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
import { createTestCourse, createTestClassroom, createTestSchedule } from './helpers/data.helper';
import { Classroom } from '../src/modules/scheduling/entities/classroom.entity';
import { Schedule } from '../src/modules/scheduling/entities/schedule.entity';

describe('SchedulingController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminAuth: AuthTokens;
  let teacherAuth: AuthTokens;
  let studentAuth: AuthTokens;
  const TEST_PREFIX = 'sched_e2e';

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
  });

  afterAll(async () => {
    // Clean up test schedules
    const scheduleRepo = dataSource.getRepository(Schedule);
    await scheduleRepo.createQueryBuilder().delete().execute();

    // Clean up test classrooms
    const classroomRepo = dataSource.getRepository(Classroom);
    await classroomRepo
      .createQueryBuilder()
      .delete()
      .where('room_number LIKE :pattern', { pattern: `${TEST_PREFIX.toUpperCase().slice(0, 1)}%` })
      .execute();

    await deleteTestUsers(dataSource, TEST_PREFIX);
    await app.close();
  });

  // ========================================
  // CLASSROOM ENDPOINTS
  // ========================================

  describe('POST /scheduling/classrooms', () => {
    const endpoint = '/scheduling/classrooms';

    it('admin should create classroom', async () => {
      const timestamp = Date.now();
      const response = await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          room_number: `${TEST_PREFIX.toUpperCase().slice(0, 1)}${timestamp.toString().slice(-4)}`,
          building: `${TEST_PREFIX} Building`,
          capacity: 50,
          type: 'lecture',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.building).toContain(TEST_PREFIX);
    });

    it('should reject duplicate room_number', async () => {
      const timestamp = Date.now();
      const roomNumber = `${TEST_PREFIX.toUpperCase().slice(0, 1)}${timestamp.toString().slice(-4)}`;

      // Create first classroom
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          room_number: roomNumber,
          building: 'Building A',
          capacity: 30,
          type: 'lecture',
        })
        .expect(201);

      // Try duplicate
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          room_number: roomNumber,
          building: 'Building B',
          capacity: 40,
          type: 'lab',
        })
        .expect(409);
    });

    it('non-admin should be rejected', async () => {
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .send({
          room_number: 'UNAUTH01',
          building: 'Building',
          capacity: 30,
          type: 'lecture',
        })
        .expect(403);
    });
  });

  describe('GET /scheduling/classrooms', () => {
    const endpoint = '/scheduling/classrooms';

    beforeAll(async () => {
      await createTestClassroom(dataSource, TEST_PREFIX);
      await createTestClassroom(dataSource, TEST_PREFIX);
    });

    it('admin should get all classrooms', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      const items = response.body.items || response.body;
      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThan(0);
    });

    it('teacher should access classrooms', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(200);

      const items = response.body.items || response.body;
      expect(Array.isArray(items)).toBe(true);
    });

    it('student should access classrooms', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${studentAuth.accessToken}`)
        .expect(200);

      const items = response.body.items || response.body;
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe('GET /scheduling/classrooms/:id', () => {
    let testClassroomId: number;

    beforeAll(async () => {
      const classroom = await createTestClassroom(dataSource, TEST_PREFIX);
      testClassroomId = classroom.id;
    });

    it('should get classroom by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/scheduling/classrooms/${testClassroomId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(testClassroomId);
      expect(response.body).toHaveProperty('roomNumber');
      expect(response.body).toHaveProperty('building');
      expect(response.body).toHaveProperty('capacity');
    });

    it('should return 404 for non-existent classroom', async () => {
      await request(app.getHttpServer())
        .get('/scheduling/classrooms/999999')
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(404);
    });
  });

  describe('PATCH /scheduling/classrooms/:id', () => {
    let testClassroomId: number;

    beforeAll(async () => {
      const classroom = await createTestClassroom(dataSource, TEST_PREFIX);
      testClassroomId = classroom.id;
    });

    it('admin should update classroom', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/scheduling/classrooms/${testClassroomId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          building: `${TEST_PREFIX} Updated Building`,
          capacity: 75,
        })
        .expect(200);

      expect(response.body.building).toBe(`${TEST_PREFIX} Updated Building`);
      expect(response.body.capacity).toBe(75);
    });

    it('non-admin should be rejected', async () => {
      await request(app.getHttpServer())
        .patch(`/scheduling/classrooms/${testClassroomId}`)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .send({ capacity: 100 })
        .expect(403);
    });
  });

  describe('DELETE /scheduling/classrooms/:id', () => {
    it('admin should delete classroom', async () => {
      const classroom = await createTestClassroom(dataSource, TEST_PREFIX);

      await request(app.getHttpServer())
        .delete(`/scheduling/classrooms/${classroom.id}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      // Verify deleted
      await request(app.getHttpServer())
        .get(`/scheduling/classrooms/${classroom.id}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(404);
    });

    it('non-admin should be rejected', async () => {
      const classroom = await createTestClassroom(dataSource, TEST_PREFIX);

      await request(app.getHttpServer())
        .delete(`/scheduling/classrooms/${classroom.id}`)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(403);
    });
  });

  // ========================================
  // SCHEDULE ENDPOINTS
  // ========================================

  describe('POST /scheduling', () => {
    const endpoint = '/scheduling';
    let testCourseId: number;
    let testClassroomId: number;

    beforeAll(async () => {
      const course = await createTestCourse(dataSource, adminAuth.user.id, [], TEST_PREFIX);
      testCourseId = course.id;
      const classroom = await createTestClassroom(dataSource, TEST_PREFIX);
      testClassroomId = classroom.id;
    });

    it('admin should create schedule', async () => {
      const response = await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          course_id: testCourseId,
          classroom_id: testClassroomId,
          day_of_week: 1, // Monday
          start_time: '09:00',
          end_time: '10:30',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.courseId).toBe(testCourseId);
      expect(response.body.classroomId).toBe(testClassroomId);
    });

    it('should validate time format', async () => {
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          course_id: testCourseId,
          classroom_id: testClassroomId,
          day_of_week: 2,
          start_time: 'invalid',
          end_time: '10:30',
        })
        .expect(400);
    });

    it('should validate day_of_week (0-6)', async () => {
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          course_id: testCourseId,
          classroom_id: testClassroomId,
          day_of_week: 7, // Invalid
          start_time: '09:00',
          end_time: '10:30',
        })
        .expect(400);
    });

    it('non-admin should be rejected', async () => {
      await request(app.getHttpServer())
        .post(endpoint)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .send({
          course_id: testCourseId,
          classroom_id: testClassroomId,
          day_of_week: 3,
          start_time: '11:00',
          end_time: '12:30',
        })
        .expect(403);
    });
  });

  describe('GET /scheduling', () => {
    const endpoint = '/scheduling';

    beforeAll(async () => {
      const course = await createTestCourse(dataSource, adminAuth.user.id, [], TEST_PREFIX);
      const classroom = await createTestClassroom(dataSource, TEST_PREFIX);
      await createTestSchedule(dataSource, course.id, classroom.id);
    });

    it('admin should get all schedules', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      const items = response.body.items || response.body;
      expect(Array.isArray(items)).toBe(true);
    });

    it('teacher should access schedules', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(200);

      const items = response.body.items || response.body;
      expect(Array.isArray(items)).toBe(true);
    });

    it('student should access schedules', async () => {
      const response = await request(app.getHttpServer())
        .get(endpoint)
        .set('Authorization', `Bearer ${studentAuth.accessToken}`)
        .expect(200);

      const items = response.body.items || response.body;
      expect(Array.isArray(items)).toBe(true);
    });
  });

  describe('GET /scheduling/:id', () => {
    let testScheduleId: number;

    beforeAll(async () => {
      const course = await createTestCourse(dataSource, adminAuth.user.id, [], TEST_PREFIX);
      const classroom = await createTestClassroom(dataSource, TEST_PREFIX);
      const schedule = await createTestSchedule(dataSource, course.id, classroom.id);
      testScheduleId = schedule.id;
    });

    it('should get schedule by ID', async () => {
      const response = await request(app.getHttpServer())
        .get(`/scheduling/${testScheduleId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      expect(response.body.id).toBe(testScheduleId);
      expect(response.body).toHaveProperty('dayOfWeek');
      expect(response.body).toHaveProperty('startTime');
      expect(response.body).toHaveProperty('endTime');
    });

    it('should return 404 for non-existent schedule', async () => {
      await request(app.getHttpServer())
        .get('/scheduling/999999')
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(404);
    });
  });

  describe('GET /scheduling/course/:courseId', () => {
    let testCourseId: number;

    beforeAll(async () => {
      const course = await createTestCourse(dataSource, adminAuth.user.id, [], TEST_PREFIX);
      testCourseId = course.id;
      const classroom = await createTestClassroom(dataSource, TEST_PREFIX);
      await createTestSchedule(dataSource, course.id, classroom.id);
    });

    it('should return course schedules', async () => {
      const response = await request(app.getHttpServer())
        .get(`/scheduling/course/${testCourseId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      const items = response.body.items || response.body;
      expect(Array.isArray(items)).toBe(true);
      items.forEach((schedule: any) => {
        expect(schedule.courseId).toBe(testCourseId);
      });
    });
  });

  describe('GET /scheduling/classrooms/:id/schedules', () => {
    let testClassroomId: number;

    beforeAll(async () => {
      const course = await createTestCourse(dataSource, adminAuth.user.id, [], TEST_PREFIX);
      const classroom = await createTestClassroom(dataSource, TEST_PREFIX);
      testClassroomId = classroom.id;
      await createTestSchedule(dataSource, course.id, classroom.id);
    });

    it('should return classroom schedules', async () => {
      const response = await request(app.getHttpServer())
        .get(`/scheduling/classrooms/${testClassroomId}/schedules`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      const items = response.body.items || response.body;
      expect(Array.isArray(items)).toBe(true);
      items.forEach((schedule: any) => {
        expect(schedule.classroomId).toBe(testClassroomId);
      });
    });
  });

  describe('PATCH /scheduling/:id', () => {
    let testScheduleId: number;

    beforeAll(async () => {
      const course = await createTestCourse(dataSource, adminAuth.user.id, [], TEST_PREFIX);
      const classroom = await createTestClassroom(dataSource, TEST_PREFIX);
      const schedule = await createTestSchedule(dataSource, course.id, classroom.id);
      testScheduleId = schedule.id;
    });

    it('admin should update schedule', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/scheduling/${testScheduleId}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .send({
          day_of_week: 3,
          start_time: '14:00',
          end_time: '15:30',
        })
        .expect(200);

      expect(response.body.dayOfWeek).toBe(3);
      expect(response.body.startTime).toBe('14:00');
      expect(response.body.endTime).toBe('15:30');
    });

    it('non-admin should be rejected', async () => {
      await request(app.getHttpServer())
        .patch(`/scheduling/${testScheduleId}`)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .send({ day_of_week: 5 })
        .expect(403);
    });
  });

  describe('DELETE /scheduling/:id', () => {
    it('admin should delete schedule', async () => {
      const course = await createTestCourse(dataSource, adminAuth.user.id, [], TEST_PREFIX);
      const classroom = await createTestClassroom(dataSource, TEST_PREFIX);
      const schedule = await createTestSchedule(dataSource, course.id, classroom.id);

      await request(app.getHttpServer())
        .delete(`/scheduling/${schedule.id}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(200);

      // Verify deleted
      await request(app.getHttpServer())
        .get(`/scheduling/${schedule.id}`)
        .set('Authorization', `Bearer ${adminAuth.accessToken}`)
        .expect(404);
    });

    it('non-admin should be rejected', async () => {
      const course = await createTestCourse(dataSource, adminAuth.user.id, [], TEST_PREFIX);
      const classroom = await createTestClassroom(dataSource, TEST_PREFIX);
      const schedule = await createTestSchedule(dataSource, course.id, classroom.id);

      await request(app.getHttpServer())
        .delete(`/scheduling/${schedule.id}`)
        .set('Authorization', `Bearer ${teacherAuth.accessToken}`)
        .expect(403);
    });
  });
});
