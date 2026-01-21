import { Test, TestingModule } from '@nestjs/testing';
import { DepartmentsController } from './departments.controller';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

describe('DepartmentsController', () => {
  let controller: DepartmentsController;
  let departmentsService: jest.Mocked<DepartmentsService>;

  const mockDepartment = {
    id: 1,
    code: 'CS',
    name: 'Computer Science',
    description: 'Department of Computer Science',
    faculty_id: 1,
    head_id: null,
    created_at: new Date(),
    updated_at: new Date(),
    faculty: {
      id: 1,
      name: 'Engineering',
    },
  };

  const mockDepartmentsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DepartmentsController],
      providers: [
        {
          provide: DepartmentsService,
          useValue: mockDepartmentsService,
        },
      ],
    }).compile();

    controller = module.get<DepartmentsController>(DepartmentsController);
    departmentsService = module.get(DepartmentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a department', async () => {
      const dto: CreateDepartmentDto = {
        code: 'EE',
        name: 'Electrical Engineering',
        faculty_id: 1,
      };
      mockDepartmentsService.create.mockResolvedValue(mockDepartment);

      const result = await controller.create(dto);

      expect(departmentsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockDepartment);
    });
  });

  describe('findAll', () => {
    it('should return all departments', async () => {
      const departments = [mockDepartment];
      mockDepartmentsService.findAll.mockResolvedValue(departments);

      const result = await controller.findAll();

      expect(departmentsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(departments);
    });

    it('should return empty array when no departments', async () => {
      mockDepartmentsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a department by id', async () => {
      mockDepartmentsService.findOne.mockResolvedValue(mockDepartment);

      const result = await controller.findOne('1');

      expect(departmentsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockDepartment);
    });
  });

  describe('update', () => {
    it('should update a department', async () => {
      const dto: UpdateDepartmentDto = { name: 'Updated Department' };
      const updatedDepartment = { ...mockDepartment, name: 'Updated Department' };
      mockDepartmentsService.update.mockResolvedValue(updatedDepartment);

      const result = await controller.update('1', dto);

      expect(departmentsService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedDepartment);
    });
  });

  describe('remove', () => {
    it('should remove a department', async () => {
      const expected = { message: 'Department deleted successfully' };
      mockDepartmentsService.remove.mockResolvedValue(expected);

      const result = await controller.remove('1');

      expect(departmentsService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });
});
