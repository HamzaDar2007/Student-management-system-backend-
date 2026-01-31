import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { UsersService } from './users.service';
import { User, UserRole } from './entities/user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: any;

  const mockUser = {
    id: 1,
    email: 'test@example.com',
    username: 'testuser',
    passwordHash: '$2a$10$abcdefghijklmnopqrstuv',
    role: UserRole.STUDENT,
    isActive: true,
    firstName: 'Test',
    lastName: 'User',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Sanitized version (without passwordHash)
  const { passwordHash: _, ...sanitizedUser } = mockUser;

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    softRemove: jest.fn(),
    restore: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockUser], 1]),
    })),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return paginated users', async () => {
      mockUserRepository.findAndCount.mockResolvedValue([[mockUser], 1]);
      const query = { page: 1, limit: 10 };

      const result = await service.findAll(query);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('meta');
      expect(result.meta).toHaveProperty('total');
      expect(result.meta).toHaveProperty('page');
      expect(result.meta).toHaveProperty('limit');
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findOne(1);

      expect(result).toEqual(sanitizedUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    const createUserDto = {
      email: 'new@example.com',
      username: 'newuser',
      password: 'Password123!',
      role: UserRole.STUDENT,
      firstName: 'New',
      lastName: 'User',
    };

    it('should create a new user', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      mockUserRepository.create.mockReturnValue(createUserDto);
      mockUserRepository.save.mockResolvedValue({
        id: 2,
        ...createUserDto,
      });

      const result = await service.create(createUserDto);

      expect(result).toHaveProperty('id');
      expect(result.email).toBe(createUserDto.email);
    });

    it('should throw ConflictException if email exists', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('update', () => {
    const updateUserDto = {
      firstName: 'Updated',
      lastName: 'Name',
    };

    it('should update a user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.save.mockResolvedValue({
        ...mockUser,
        firstName: updateUserDto.firstName,
        lastName: updateUserDto.lastName,
      });

      const result = await service.update(1, updateUserDto);

      expect(result.firstName).toBe(updateUserDto.firstName);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockUserRepository.softRemove.mockResolvedValue(mockUser);

      const result = await service.remove(1);

      expect(result).toEqual({ deleted: true });
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('restore', () => {
    it('should restore a soft-deleted user', async () => {
      const deletedUser = { ...mockUser, deletedAt: new Date() };
      mockUserRepository.findOne
        .mockResolvedValueOnce(deletedUser)
        .mockResolvedValueOnce(mockUser);
      mockUserRepository.restore.mockResolvedValue({ affected: 1 });

      const result = await service.restore(1);

      expect(result).toBeDefined();
      expect(mockUserRepository.restore).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.restore(999)).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if user is not deleted', async () => {
      mockUserRepository.findOne.mockResolvedValue({
        ...mockUser,
        deletedAt: null,
      });

      await expect(service.restore(1)).rejects.toThrow(ConflictException);
    });
  });

  describe('findDeleted', () => {
    it('should return all soft-deleted users', async () => {
      const deletedUsers = [
        { ...mockUser, deletedAt: new Date() },
        { ...mockUser, id: 2, deletedAt: new Date() },
      ];
      mockUserRepository.find.mockResolvedValue(deletedUsers);

      const result = await service.findDeleted();

      expect(result).toHaveLength(2);
      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: expect.any(Object),
        withDeleted: true,
      });
    });
  });
});
