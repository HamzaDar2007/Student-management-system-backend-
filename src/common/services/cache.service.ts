import { Injectable, Inject, Logger } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

// Define the cache interface with all methods we use
interface CacheManager {
  get<T>(key: string): Promise<T | undefined>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  del(key: string): Promise<void>;
  reset(): Promise<void>;
  store?: {
    keys?: (pattern: string) => Promise<string[]>;
  };
}

/**
 * Service for managing cache operations with Redis.
 * Provides methods for get, set, delete, and cache invalidation.
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: CacheManager,
  ) {}

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cacheManager.get<T>(key);
      if (value) {
        this.logger.debug(`Cache HIT: ${key}`);
      } else {
        this.logger.debug(`Cache MISS: ${key}`);
      }
      return value;
    } catch (error) {
      this.logger.error(`Cache GET error for key ${key}:`, error);
      return undefined;
    }
  }

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in milliseconds (optional)
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(key, value, ttl);
      this.logger.debug(`Cache SET: ${key}${ttl ? ` (TTL: ${ttl}ms)` : ''}`);
    } catch (error) {
      this.logger.error(`Cache SET error for key ${key}:`, error);
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      this.logger.debug(`Cache DELETE: ${key}`);
    } catch (error) {
      this.logger.error(`Cache DELETE error for key ${key}:`, error);
    }
  }

  /**
   * Delete all cache entries matching a pattern (prefix)
   * Note: This is a simple implementation that stores keys to invalidate
   */
  async invalidateByPrefix(prefix: string): Promise<void> {
    try {
      // Get keys from the store - this works with Redis store
      const store = this.cacheManager.store;
      if (store && store.keys) {
        const keys: string[] = await store.keys(`${prefix}*`);
        if (keys && keys.length > 0) {
          await Promise.all(
            keys.map((key: string) => this.cacheManager.del(key)),
          );
          this.logger.debug(
            `Cache INVALIDATE: ${keys.length} keys with prefix "${prefix}"`,
          );
        }
      }
    } catch (error) {
      this.logger.error(`Cache INVALIDATE error for prefix ${prefix}:`, error);
    }
  }

  /**
   * Clear all cache
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
      this.logger.debug('Cache RESET: All cache cleared');
    } catch (error) {
      this.logger.error('Cache RESET error:', error);
    }
  }

  /**
   * Get or set pattern - fetch from cache or execute callback and cache result
   */
  async getOrSet<T>(
    key: string,
    callback: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await callback();
    await this.set(key, value, ttl);
    return value;
  }
}

/**
 * Cache key generators for consistent key naming
 */
export const CacheKeys = {
  // Students
  student: (id: string) => `student:${id}`,
  studentByUserId: (userId: number) => `student:user:${userId}`,
  studentsList: (page: number, limit: number) =>
    `students:list:${page}:${limit}`,
  studentsPrefix: 'student',

  // Courses
  course: (id: number) => `course:${id}`,
  coursesList: (page: number, limit: number) => `courses:list:${page}:${limit}`,
  coursesPrefix: 'course',

  // Teachers
  teacher: (id: number) => `teacher:${id}`,
  teachersList: (page: number, limit: number) =>
    `teachers:list:${page}:${limit}`,
  teachersPrefix: 'teacher',

  // Users
  user: (id: number) => `user:${id}`,
  userByEmail: (email: string) => `user:email:${email}`,
  usersPrefix: 'user',

  // Academic Terms
  academicTerm: (id: number) => `academic-term:${id}`,
  currentAcademicTerm: 'academic-term:current',
  academicTermsPrefix: 'academic-term',

  // Departments
  department: (id: number) => `department:${id}`,
  departmentsList: () => `departments:list`,
  departmentsPrefix: 'department',

  // Faculties
  faculty: (id: number) => `faculty:${id}`,
  facultiesList: () => `faculties:list`,
  facultiesPrefix: 'faculty',

  // Enrollments
  enrollment: (id: number) => `enrollment:${id}`,
  enrollmentsByStudent: (studentId: string) =>
    `enrollments:student:${studentId}`,
  enrollmentsByCourse: (courseId: number) => `enrollments:course:${courseId}`,
  enrollmentsPrefix: 'enrollment',

  // Grades
  grade: (id: number) => `grade:${id}`,
  gradesByStudent: (studentId: string) => `grades:student:${studentId}`,
  gradesByCourse: (courseId: number) => `grades:course:${courseId}`,
  gradesPrefix: 'grade',

  // Scheduling
  schedule: (id: number) => `schedule:${id}`,
  schedulesByCourse: (courseId: number) => `schedules:course:${courseId}`,
  schedulesPrefix: 'schedule',
};
