import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Faculty } from './entities/faculty.entity';
import { CreateFacultyDto } from './dto/create-faculty.dto';
import { UpdateFacultyDto } from './dto/update-faculty.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class FacultiesService {
  constructor(
    @InjectRepository(Faculty)
    private readonly facultyRepo: Repository<Faculty>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateFacultyDto) {
    const existingName = await this.facultyRepo.findOne({
      where: { name: dto.name },
    });
    if (existingName)
      throw new ConflictException('Faculty name already exists');

    const existingCode = await this.facultyRepo.findOne({
      where: { code: dto.code },
    });
    if (existingCode)
      throw new ConflictException('Faculty code already exists');

    let dean: User | null = null;
    if (dto.dean_id) {
      dean = await this.userRepo.findOne({ where: { id: dto.dean_id } });
      if (!dean) throw new NotFoundException('Dean user not found');
    }

    const faculty = this.facultyRepo.create({
      name: dto.name,
      code: dto.code,
      dean: dean ?? undefined,
    });

    return this.facultyRepo.save(faculty);
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.facultyRepo.findAndCount({
      relations: ['dean', 'departments'],
      order: { id: 'DESC' },
      skip,
      take: limit,
    });
    return { page, limit, total, items };
  }

  async findOne(id: number) {
    const faculty = await this.facultyRepo.findOne({
      where: { id },
      relations: ['dean', 'departments'],
    });
    if (!faculty) throw new NotFoundException('Faculty not found');
    return faculty;
  }

  async update(id: number, dto: UpdateFacultyDto) {
    const faculty = await this.facultyRepo.findOne({ where: { id } });
    if (!faculty) throw new NotFoundException('Faculty not found');

    if (dto.name && dto.name !== faculty.name) {
      const existing = await this.facultyRepo.findOne({
        where: { name: dto.name },
      });
      if (existing) throw new ConflictException('Faculty name already exists');
    }

    if (dto.code && dto.code !== faculty.code) {
      const existing = await this.facultyRepo.findOne({
        where: { code: dto.code },
      });
      if (existing) throw new ConflictException('Faculty code already exists');
    }

    if (dto.dean_id !== undefined) {
      if (dto.dean_id === null) {
        faculty.dean = null as unknown as User;
      } else {
        const dean = await this.userRepo.findOne({
          where: { id: dto.dean_id },
        });
        if (!dean) throw new NotFoundException('Dean user not found');
        faculty.dean = dean;
      }
    }

    Object.assign(faculty, {
      name: dto.name ?? faculty.name,
      code: dto.code ?? faculty.code,
    });

    return this.facultyRepo.save(faculty);
  }

  async remove(id: number) {
    const faculty = await this.facultyRepo.findOne({
      where: { id },
      relations: ['departments'],
    });
    if (!faculty) throw new NotFoundException('Faculty not found');

    if (faculty.departments && faculty.departments.length > 0) {
      throw new ConflictException(
        'Cannot delete faculty with existing departments',
      );
    }

    await this.facultyRepo.softRemove(faculty);
    return { deleted: true };
  }
}
