import { Test, TestingModule } from '@nestjs/testing';
import { AcademicTermsController } from './academic-terms.controller';
import { AcademicTermsService } from './academic-terms.service';
import { CreateAcademicTermDto } from './dto/create-academic-term.dto';
import { UpdateAcademicTermDto } from './dto/update-academic-term.dto';

describe('AcademicTermsController', () => {
  let controller: AcademicTermsController;
  let academicTermsService: jest.Mocked<AcademicTermsService>;

  const mockAcademicTerm = {
    id: 1,
    name: 'Fall 2024',
    start_date: new Date('2024-09-01'),
    end_date: new Date('2024-12-15'),
    is_current: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockAcademicTermsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicTermsController],
      providers: [
        {
          provide: AcademicTermsService,
          useValue: mockAcademicTermsService,
        },
      ],
    }).compile();

    controller = module.get<AcademicTermsController>(AcademicTermsController);
    academicTermsService = module.get(AcademicTermsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create an academic term', async () => {
      const dto: CreateAcademicTermDto = {
        name: 'Spring 2025',
        start_date: '2025-01-15',
        end_date: '2025-05-15',
      };
      mockAcademicTermsService.create.mockResolvedValue(mockAcademicTerm);

      const result = await controller.create(dto);

      expect(academicTermsService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockAcademicTerm);
    });
  });

  describe('findAll', () => {
    it('should return all academic terms', async () => {
      const terms = [mockAcademicTerm];
      mockAcademicTermsService.findAll.mockResolvedValue(terms);

      const result = await controller.findAll();

      expect(academicTermsService.findAll).toHaveBeenCalled();
      expect(result).toEqual(terms);
    });

    it('should return empty array when no terms', async () => {
      mockAcademicTermsService.findAll.mockResolvedValue([]);

      const result = await controller.findAll();

      expect(result).toEqual([]);
    });
  });

  describe('findOne', () => {
    it('should return an academic term by id', async () => {
      mockAcademicTermsService.findOne.mockResolvedValue(mockAcademicTerm);

      const result = await controller.findOne('1');

      expect(academicTermsService.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAcademicTerm);
    });
  });

  describe('update', () => {
    it('should update an academic term', async () => {
      const dto: UpdateAcademicTermDto = { name: 'Updated Term' };
      const updatedTerm = { ...mockAcademicTerm, name: 'Updated Term' };
      mockAcademicTermsService.update.mockResolvedValue(updatedTerm);

      const result = await controller.update('1', dto);

      expect(academicTermsService.update).toHaveBeenCalledWith(1, dto);
      expect(result).toEqual(updatedTerm);
    });
  });

  describe('remove', () => {
    it('should remove an academic term', async () => {
      const expected = { message: 'Academic term deleted successfully' };
      mockAcademicTermsService.remove.mockResolvedValue(expected);

      const result = await controller.remove('1');

      expect(academicTermsService.remove).toHaveBeenCalledWith(1);
      expect(result).toEqual(expected);
    });
  });
});
