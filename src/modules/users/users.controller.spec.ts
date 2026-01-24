import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserListQueryDto } from './dto/user-list-query.dto';
import { UserRole } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: jest.Mocked<UsersService>;

  const mockUser = {
    id: 1,
    email: 'test@test.com',
    username: 'testuser',
    firstName: 'Test',
    lastName: 'User',
    role: UserRole.STUDENT,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get(UsersService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const dto: CreateUserDto = {
        email: 'new@test.com',
        password: 'Password123!',
        username: 'newuser',
        firstName: 'New',
        lastName: 'User',
        role: UserRole.STUDENT,
      };
      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await controller.create(dto);

      expect(usersService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockUser);
    });
  });

  describe('findAll', () => {
    it('should return paginated list of users', async () => {
      const query: UserListQueryDto = { page: 1, limit: 10 };
      const expected = {
        items: [mockUser],
        total: 1,
        page: 1,
        limit: 10,
      };
      mockUsersService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(usersService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });

    it('should handle empty query', async () => {
      const query: UserListQueryDto = {};
      const expected = { items: [], total: 0, page: 1, limit: 20 };
      mockUsersService.findAll.mockResolvedValue(expected);

      const result = await controller.findAll(query);

      expect(usersService.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(1);

      expect(usersService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const dto: UpdateUserDto = { firstName: 'Updated' };
      const updatedUser = { ...mockUser, firstName: 'Updated' };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.update(1, dto);

      expect(usersService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedUser);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      const expected = { message: 'User deleted successfully' };
      mockUsersService.remove.mockResolvedValue(expected);

      const result = await controller.remove(1);

      expect(usersService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });
});
