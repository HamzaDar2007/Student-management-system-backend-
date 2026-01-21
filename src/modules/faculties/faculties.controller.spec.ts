import { Test, TestingModule } from '@nestjs/testing';
import { FacultiesController } from './faculties.controller';
import { FacultiesService } from './faculties.service';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';

describe('FacultiesController', () => {
  let controller: FacultiesController;
  let facultiesService: jest.Mocked<FacultiesService>;

  const mockFaculty = {
    id: 1,
    name: 'Faculty of Engineering',
    code: 'ENG',
    description: 'Engineering faculty',
    dean_id: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockFacultiesService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FacultiesController],
      providers: [
        {
          provide: FacultiesService,
          useValue: mockFacultiesService,
        },
      ],
    }).compile();

    controller = module.get<FacultiesController>(FacultiesController);
    facultiesService = module.get(FacultiesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a faculty', async () => {
      const dto: CreateFacultyDto = {
        name: 'Faculty of Science',
        code: 'SCI',
      };
      mockFacultiesService.create.mockResolvedValue(mockFaculty);

      const result = await controller.create(dto);

      expect(facultiesService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockFaculty);
    });
  });

  describe('findAll', () => {
    it('should return all faculties', async () => {
      const faculties = [mockFaculty];
      mockFacultiesService.findAll.mockResolvedValue(faculties);

      const result = await controller.findAll();

      expect(facultiesService.findAll).toHaveBeenCalled();
      expect(result).toEqual(faculties);
    });

    it('should return empty array when no faculties', async () => {
      mockFacultiesService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return a faculty by id', async () => {
      mockFacultiesService.findOne.mockResolvedValue(mockFaculty);

      const result = await controller.findOne('1');

      expect(facultiesService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockFaculty);
    });
  });

  describe('update', () => {
    it('should update a faculty', async () => {
      const dto: UpdateFacultyDto = { name: 'Updated Faculty' };
      const updatedFaculty = { ...mockFaculty, name: 'Updated Faculty' };
      mockFacultiesService.update.mockResolvedValue(updatedFaculty);

      const result = await controller.update('1', dto);

      expect(facultiesService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedFaculty);
    });
  });

  describe('remove', () => {
    it('should remove a faculty', async () => {
      const expected = { message: 'Faculty deleted successfully' };
      mockFacultiesService.remove.mockResolvedValue(expected);

      const result = await controller.remove('1');

      expect(facultiesService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });
});
