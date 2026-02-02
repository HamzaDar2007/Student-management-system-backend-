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
    const user = await this.userRepo.findOne({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== UserRole.TEACHER) {
      throw new ConflictException('User must have teacher role');
    }

    const existingByUser = await this.profileRepo.findOne({
      where: { userId: dto.userId },
    });
    if (existingByUser)
      throw new ConflictException(
        'Teacher profile already exists for this user',
      );

    const existingByEmpId = await this.profileRepo.findOne({
      where: { employeeId: dto.employeeId },
    });
    if (existingByEmpId)
      throw new ConflictException('Employee ID already exists');

    const profile = await this.profileRepo.save(
      this.profileRepo.create({
        userId: dto.userId,
        employeeId: dto.employeeId,
        rank: dto.rank,
        specialization: dto.specialization ?? null,
        officeLocation: dto.officeLocation ?? null,
        officeHours: dto.officeHours ?? null,
        phone: dto.phone ?? null,
        bio: dto.bio ?? null,
        hireDate: dto.hireDate ?? null,
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

  async findOne(id: string) {
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

  async update(id: string, dto: UpdateTeacherProfileDto) {
    const profile = await this.profileRepo.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Teacher profile not found');

    if (dto.employeeId && dto.employeeId !== profile.employeeId) {
      const existing = await this.profileRepo.findOne({
        where: { employeeId: dto.employeeId },
      });
      if (existing) throw new ConflictException('Employee ID already exists');
    }

    Object.assign(profile, {
      employeeId: dto.employeeId ?? profile.employeeId,
      rank: dto.rank ?? profile.rank,
      specialization:
        dto.specialization !== undefined
          ? dto.specialization
          : profile.specialization,
      officeLocation:
        dto.officeLocation !== undefined
          ? dto.officeLocation
          : profile.officeLocation,
      officeHours:
        dto.officeHours !== undefined ? dto.officeHours : profile.officeHours,
      phone: dto.phone !== undefined ? dto.phone : profile.phone,
      bio: dto.bio !== undefined ? dto.bio : profile.bio,
      hireDate: dto.hireDate !== undefined ? dto.hireDate : profile.hireDate,
      isActive: dto.isActive !== undefined ? dto.isActive : profile.isActive,
    });

    return this.profileRepo.save(profile);
  }

  async remove(id: string) {
    const profile = await this.profileRepo.findOne({ where: { id } });
    if (!profile) throw new NotFoundException('Teacher profile not found');
    await this.profileRepo.softRemove(profile);
    return { deleted: true };
  }

  async restore(id: string) {
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
