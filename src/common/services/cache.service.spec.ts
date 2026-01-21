import { Test, TestingModule } from '@nestjs/testing';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { CacheService, CacheKeys } from './cache.service';

describe('CacheService', () => {
  let service: CacheService;
  let cacheManager: Cache;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    reset: jest.fn(),
    store: {
      keys: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<CacheService>(CacheService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('get', () => {
    it('should retrieve a value from cache', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      mockCacheManager.get.mockResolvedValue(value);

      const result = await service.get(key);

      expect(mockCacheManager.get).toHaveBeenCalledWith(key);
      expect(result).toEqual(value);
    });

    it('should return undefined for non-existent key', async () => {
      mockCacheManager.get.mockResolvedValue(undefined);

      const result = await service.get('non-existent');

      expect(result).toBeUndefined();
    });
  });

  describe('set', () => {
    it('should store a value in cache with default TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test' };

      await service.set(key, value);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, undefined);
    });

    it('should store a value in cache with custom TTL', async () => {
      const key = 'test-key';
      const value = { data: 'test' };
      const ttl = 60000;

      await service.set(key, value, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, value, ttl);
    });
  });

  describe('delete', () => {
    it('should delete a value from cache', async () => {
      const key = 'test-key';

      await service.delete(key);

      expect(mockCacheManager.del).toHaveBeenCalledWith(key);
    });
  });

  describe('reset', () => {
    it('should reset the entire cache', async () => {
      await service.reset();

      expect(mockCacheManager.reset).toHaveBeenCalled();
    });
  });

  describe('invalidateByPrefix', () => {
    it('should delete all keys matching the prefix', async () => {
      const prefix = 'student:';
      const keys = ['student:1', 'student:2', 'student:3'];
      mockCacheManager.store.keys.mockResolvedValue(keys);

      await service.invalidateByPrefix(prefix);

      expect(mockCacheManager.store.keys).toHaveBeenCalled();
      expect(mockCacheManager.del).toHaveBeenCalledTimes(3);
      keys.forEach((key) => {
        expect(mockCacheManager.del).toHaveBeenCalledWith(key);
      });
    });

    it('should not delete anything if no keys match', async () => {
      mockCacheManager.store.keys.mockResolvedValue([]);

      await service.invalidateByPrefix('non-existent:');

      expect(mockCacheManager.del).not.toHaveBeenCalled();
    });

    it('should handle undefined keys gracefully', async () => {
      mockCacheManager.store.keys.mockResolvedValue(undefined);

      await service.invalidateByPrefix('test:');

      expect(mockCacheManager.del).not.toHaveBeenCalled();
    });
  });

  describe('getOrSet', () => {
    it('should return cached value if exists', async () => {
      const key = 'test-key';
      const cachedValue = { data: 'cached' };
      mockCacheManager.get.mockResolvedValue(cachedValue);
      const factory = jest.fn().mockResolvedValue({ data: 'new' });

      const result = await service.getOrSet(key, factory);

      expect(result).toEqual(cachedValue);
      expect(factory).not.toHaveBeenCalled();
      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });

    it('should call factory and cache result if not cached', async () => {
      const key = 'test-key';
      const newValue = { data: 'new' };
      mockCacheManager.get.mockResolvedValue(undefined);
      const factory = jest.fn().mockResolvedValue(newValue);

      const result = await service.getOrSet(key, factory);

      expect(result).toEqual(newValue);
      expect(factory).toHaveBeenCalled();
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        key,
        newValue,
        undefined,
      );
    });

    it('should use custom TTL when provided', async () => {
      const key = 'test-key';
      const newValue = { data: 'new' };
      const ttl = 60000;
      mockCacheManager.get.mockResolvedValue(undefined);
      const factory = jest.fn().mockResolvedValue(newValue);

      await service.getOrSet(key, factory, ttl);

      expect(mockCacheManager.set).toHaveBeenCalledWith(key, newValue, ttl);
    });
  });
});

describe('CacheKeys', () => {
  describe('student', () => {
    it('should generate correct key for student', () => {
      expect(CacheKeys.student(1)).toBe('student:1');
      expect(CacheKeys.student(123)).toBe('student:123');
    });
  });

  describe('studentByUserId', () => {
    it('should generate correct key for student by user id', () => {
      expect(CacheKeys.studentByUserId(1)).toBe('student:user:1');
    });
  });

  describe('studentsList', () => {
    it('should generate correct key for students list', () => {
      expect(CacheKeys.studentsList(1, 10)).toBe('students:list:1:10');
      expect(CacheKeys.studentsList(2, 20)).toBe('students:list:2:20');
    });
  });

  describe('course', () => {
    it('should generate correct key for course', () => {
      expect(CacheKeys.course(1)).toBe('course:1');
      expect(CacheKeys.course(456)).toBe('course:456');
    });
  });

  describe('coursesList', () => {
    it('should generate correct key for courses list', () => {
      expect(CacheKeys.coursesList(1, 10)).toBe('courses:list:1:10');
      expect(CacheKeys.coursesList(3, 25)).toBe('courses:list:3:25');
    });
  });

  describe('user', () => {
    it('should generate correct key for user by id', () => {
      expect(CacheKeys.user(1)).toBe('user:1');
    });
  });

  describe('userByEmail', () => {
    it('should generate correct key for user by email', () => {
      expect(CacheKeys.userByEmail('test@example.com')).toBe(
        'user:email:test@example.com',
      );
    });
  });

  describe('teacher', () => {
    it('should generate correct key for teacher', () => {
      expect(CacheKeys.teacher(1)).toBe('teacher:1');
    });
  });

  describe('teachersList', () => {
    it('should generate correct key for teachers list', () => {
      expect(CacheKeys.teachersList(1, 10)).toBe('teachers:list:1:10');
      expect(CacheKeys.teachersList(2, 15)).toBe('teachers:list:2:15');
    });
  });

  describe('department', () => {
    it('should generate correct key for department', () => {
      expect(CacheKeys.department(1)).toBe('department:1');
    });
  });

  describe('departmentsList', () => {
    it('should generate correct key for departments list', () => {
      expect(CacheKeys.departmentsList()).toBe('departments:list');
    });
  });

  describe('academicTerm', () => {
    it('should generate correct key for academic term', () => {
      expect(CacheKeys.academicTerm(1)).toBe('academic-term:1');
    });
  });

  describe('currentAcademicTerm', () => {
    it('should generate correct key for current academic term', () => {
      expect(CacheKeys.currentAcademicTerm).toBe('academic-term:current');
    });
  });

  describe('enrollment', () => {
    it('should generate correct key for enrollment', () => {
      expect(CacheKeys.enrollment(1)).toBe('enrollment:1');
    });
  });

  describe('enrollmentsByStudent', () => {
    it('should generate correct key for student enrollments', () => {
      expect(CacheKeys.enrollmentsByStudent(1)).toBe('enrollments:student:1');
    });
  });

  describe('enrollmentsByCourse', () => {
    it('should generate correct key for course enrollments', () => {
      expect(CacheKeys.enrollmentsByCourse(1)).toBe('enrollments:course:1');
    });
  });

  describe('faculty', () => {
    it('should generate correct key for faculty', () => {
      expect(CacheKeys.faculty(1)).toBe('faculty:1');
    });
  });

  describe('facultiesList', () => {
    it('should generate correct key for faculties list', () => {
      expect(CacheKeys.facultiesList()).toBe('faculties:list');
    });
  });

  describe('grade', () => {
    it('should generate correct key for grade', () => {
      expect(CacheKeys.grade(1)).toBe('grade:1');
    });
  });

  describe('gradesByStudent', () => {
    it('should generate correct key for student grades', () => {
      expect(CacheKeys.gradesByStudent(1)).toBe('grades:student:1');
    });
  });

  describe('gradesByCourse', () => {
    it('should generate correct key for course grades', () => {
      expect(CacheKeys.gradesByCourse(1)).toBe('grades:course:1');
    });
  });

  describe('schedule', () => {
    it('should generate correct key for schedule', () => {
      expect(CacheKeys.schedule(1)).toBe('schedule:1');
    });
  });

  describe('schedulesByCourse', () => {
    it('should generate correct key for course schedules', () => {
      expect(CacheKeys.schedulesByCourse(1)).toBe('schedules:course:1');
    });
  });

  describe('prefixes', () => {
    it('should have correct prefix strings', () => {
      expect(CacheKeys.studentsPrefix).toBe('student');
      expect(CacheKeys.coursesPrefix).toBe('course');
      expect(CacheKeys.teachersPrefix).toBe('teacher');
      expect(CacheKeys.usersPrefix).toBe('user');
      expect(CacheKeys.academicTermsPrefix).toBe('academic-term');
      expect(CacheKeys.departmentsPrefix).toBe('department');
      expect(CacheKeys.facultiesPrefix).toBe('faculty');
      expect(CacheKeys.enrollmentsPrefix).toBe('enrollment');
      expect(CacheKeys.gradesPrefix).toBe('grade');
      expect(CacheKeys.schedulesPrefix).toBe('schedule');
    });
  });
});
