import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { User, UserRole } from '../../src/modules/users/entities/user.entity';

export interface TestUser {
  id: number;
  email: string;
  username: string;
  password: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: TestUser;
}

const TEST_PASSWORD = 'TestPass123!';

/**
 * Create a test user directly in the database
 */
export async function createTestUser(
  dataSource: DataSource,
  role: UserRole,
  prefix: string = 'test',
): Promise<TestUser> {
  const userRepo = dataSource.getRepository(User);
  const timestamp = Date.now();
  const email = `${prefix}_${role}_${timestamp}@test.com`;
  const username = `${prefix}_${role}_${timestamp}`;
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  const user = await userRepo.save(
    userRepo.create({
      email,
      username,
      passwordHash,
      role,
      firstName: `Test${role}`,
      lastName: 'User',
      isActive: true,
      emailVerified: true,
    }),
  );

  return {
    id: user.id,
    email,
    username,
    password: TEST_PASSWORD,
    role,
  };
}

/**
 * Login and get auth tokens for a user
 */
export async function getAuthToken(
  app: INestApplication,
  email: string,
  password: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  const response = await request(app.getHttpServer())
    .post('/api/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    accessToken: response.body.access_token,
    refreshToken: response.body.refresh_token,
  };
}

/**
 * Create an admin user and return auth tokens
 */
export async function createAdminAndLogin(
  app: INestApplication,
  dataSource: DataSource,
  prefix: string = 'test',
): Promise<AuthTokens> {
  const user = await createTestUser(dataSource, UserRole.ADMIN, prefix);
  const tokens = await getAuthToken(app, user.email, user.password);
  return { ...tokens, user };
}

/**
 * Create a teacher user and return auth tokens
 */
export async function createTeacherAndLogin(
  app: INestApplication,
  dataSource: DataSource,
  prefix: string = 'test',
): Promise<AuthTokens> {
  const user = await createTestUser(dataSource, UserRole.TEACHER, prefix);
  const tokens = await getAuthToken(app, user.email, user.password);
  return { ...tokens, user };
}

/**
 * Create a student user and return auth tokens
 */
export async function createStudentAndLogin(
  app: INestApplication,
  dataSource: DataSource,
  prefix: string = 'test',
): Promise<AuthTokens> {
  const user = await createTestUser(dataSource, UserRole.STUDENT, prefix);
  const tokens = await getAuthToken(app, user.email, user.password);
  return { ...tokens, user };
}

/**
 * Delete test users by prefix
 */
export async function deleteTestUsers(
  dataSource: DataSource,
  prefix: string,
): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  await userRepo
    .createQueryBuilder()
    .delete()
    .where('email LIKE :pattern', { pattern: `${prefix}_%@test.com` })
    .execute();
}
