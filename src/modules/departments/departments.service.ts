import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './entities/department.entity';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Faculty } from '../faculties/entities/faculty.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(Faculty)
    private readonly facultyRepo: Repository<Faculty>,
  ) {}

  async create(dto: CreateDepartmentDto) {
    const existingName = await this.departmentRepo.findOne({
      where: { name: dto.name },
    });
    if (existingName)
      throw new ConflictException('Department name already exists');

    const existingCode = await this.departmentRepo.findOne({
      where: { code: dto.code },
    });
    if (existingCode)
      throw new ConflictException('Department code already exists');

    let faculty: Faculty | null = null;
    if (dto.facultyId) {
      faculty = await this.facultyRepo.findOne({
        where: { id: dto.facultyId },
      });
      if (!faculty) throw new NotFoundException('Faculty not found');
    }

    const department = this.departmentRepo.create({
      name: dto.name,
      code: dto.code,
      faculty: faculty ?? undefined,
    });

    return this.departmentRepo.save(department);
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.departmentRepo.findAndCount({
      relations: ['faculty', 'students'],
      order: { id: 'DESC' },
      skip,
      take: limit,
    });
    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const department = await this.departmentRepo.findOne({
      where: { id },
      relations: ['faculty', 'students'],
    });
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto) {
    const department = await this.departmentRepo.findOne({ where: { id } });
    if (!department) throw new NotFoundException('Department not found');

    if (dto.name && dto.name !== department.name) {
      const existing = await this.departmentRepo.findOne({
        where: { name: dto.name },
      });
      if (existing)
        throw new ConflictException('Department name already exists');
    }

    if (dto.code && dto.code !== department.code) {
      const existing = await this.departmentRepo.findOne({
        where: { code: dto.code },
      });
      if (existing)
        throw new ConflictException('Department code already exists');
    }

    if (dto.facultyId !== undefined) {
      if (dto.facultyId === null) {
        department.faculty = null as unknown as Faculty;
      } else {
        const faculty = await this.facultyRepo.findOne({
          where: { id: dto.facultyId },
        });
        if (!faculty) throw new NotFoundException('Faculty not found');
        department.faculty = faculty;
      }
    }

    Object.assign(department, {
      name: dto.name ?? department.name,
      code: dto.code ?? department.code,
    });

    return this.departmentRepo.save(department);
  }

  async remove(id: string) {
    const department = await this.findOne(id);
    // Check if department has students
    if (department.students && department.students.length > 0) {
      throw new ConflictException(
        'Cannot delete department with existing students',
      );
    }
    return this.departmentRepo.softDelete(id);
  }

  async restore(id: string) {
    const department = await this.departmentRepo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!department) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    if (!department.deletedAt) {
      throw new ConflictException(`Department with ID ${id} is not deleted`);
    }

    return this.departmentRepo.restore(id);
  }
}
