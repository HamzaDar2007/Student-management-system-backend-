import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TeacherProfile } from './entities/teacher-profile.entity';
import { CreateTeacherProfileDto } from './dto/create-teacher-profile.dto';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class TeachersService {
  constructor(
    @InjectRepository(TeacherProfile)
    private readonly profileRepo: Repository<TeacherProfile>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateTeacherProfileDto) {
    const user = await this.userRepo.findOne({ where: { id: dto.user_id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.TEACHER) {
      throw new ConflictException('User must have teacher role');
    }

    const existingByUser = await this.profileRepo.findOne({
      where: { userId: dto.user_id },
    });
    if (existingByUser)
      throw new ConflictException(
        'Teacher profile already exists for this user',
      );

    const existingByEmpId = await this.profileRepo.findOne({
      where: { employeeId: dto.employee_id },
    });
    if (existingByEmpId)
      throw new ConflictException('Employee ID already exists');

    const profile = await this.profileRepo.save(
      this.profileRepo.create({
        userId: dto.user_id,
        employeeId: dto.employee_id,
        rank: dto.rank,
        specialization: dto.specialization ?? null,
        officeLocation: dto.office_location ?? null,
        officeHours: dto.office_hours ?? null,
        phone: dto.phone ?? null,
        bio: dto.bio ?? null,
        hireDate: dto.hire_date ?? null,
      }),
    );

    return profile;
  }

  async findAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.profileRepo.findAndCount({
      relations: ['user'],
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

  async findOne(id: number) {
    const profile = await this.profileRepo.findOne({
      where: { id },
      relations: ['user', 'user.teachingCourses'],
    });
    if (!profile) throw new NotFoundException('Teacher profile not found');
    return profile;
  }

  async findByUserId(userId: string) {
    const profile = await this.profileRepo.findOne({
      where: { userId },
      relations: ['user', 'user.teachingCourses'],
    });
    if (!profile) throw new NotFoundException('Teacher profile not found');
    return profile;
  }

  async update(id: number, dto: UpdateTeacherProfileDto) {
    const profile = await this.profileRepo.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Teacher profile not found');

    if (dto.employee_id && dto.employee_id !== profile.employeeId) {
      const existing = await this.profileRepo.findOne({
        where: { employeeId: dto.employee_id },
      });
      if (existing) throw new ConflictException('Employee ID already exists');
    }

    Object.assign(profile, {
      employeeId: dto.employee_id ?? profile.employeeId,
      rank: dto.rank ?? profile.rank,
      specialization:
        dto.specialization !== undefined
          ? dto.specialization
          : profile.specialization,
      officeLocation:
        dto.office_location !== undefined
          ? dto.office_location
          : profile.officeLocation,
      officeHours:
        dto.office_hours !== undefined ? dto.office_hours : profile.officeHours,
      phone: dto.phone !== undefined ? dto.phone : profile.phone,
      bio: dto.bio !== undefined ? dto.bio : profile.bio,
      hireDate: dto.hire_date !== undefined ? dto.hire_date : profile.hireDate,
      isActive: dto.is_active !== undefined ? dto.is_active : profile.isActive,
    });

    return this.profileRepo.save(profile);
  }

  async remove(id: number) {
    const profile = await this.profileRepo.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Teacher profile not found');
    await this.profileRepo.softRemove(profile);
    return { deleted: true };
  }

  async restore(id: number) {
    const profile = await this.profileRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!profile) throw new NotFoundException('Teacher profile not found');
    if (!profile.deletedAt)
      throw new ConflictException('Teacher profile is not deleted');

    await this.profileRepo.restore(id);
    return { restored: true };
  }
}
