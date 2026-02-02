import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';

import { Course } from './entities/course.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseListQueryDto } from './dto/course-list-query.dto';

@Injectable()
export class CoursesService {
  constructor(
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
  ) {}

  async create(dto: CreateCourseDto) {
    const exists = await this.courseRepo.findOne({
      where: { courseCode: dto.courseCode },
    });
    if (exists) throw new ConflictException('course_code already exists');

    const course = this.courseRepo.create({
      courseCode: dto.courseCode,
      courseName: dto.courseName,
      description: dto.description ?? null,
      credits: dto.credits,
      departmentId: dto.departmentId ?? null,
      semester: dto.semester ?? null,
      maxStudents: dto.maxStudents ?? 50,
      isActive: dto.isActive ?? true,
    });

    if (dto.teacherIds && dto.teacherIds.length > 0) {
      const teachers = await this.userRepo.find({
        where: { id: In(dto.teacherIds), role: UserRole.TEACHER },
      });
      if (teachers.length !== dto.teacherIds.length) {
        throw new NotFoundException(
          'Some teacher IDs not found or not teachers',
        );
      }
      course.teachers = teachers;
    }

    return this.courseRepo.save(course);
  }

  async findAll(query: CourseListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const qb = this.courseRepo
      .createQueryBuilder('course')
      .leftJoinAndSelect('course.teachers', 'teacher');

    if (query.isActive !== undefined) {
      qb.andWhere('course.isActive = :active', { active: query.isActive });
    }
    if (query.semester) {
      qb.andWhere('course.semester = :semester', { semester: query.semester });
    }
    if (query.departmentId) {
      qb.andWhere('course.departmentId = :departmentId', {
        departmentId: query.departmentId,
      });
    }
    if (query.teacherId) {
      qb.andWhere('teacher.id = :teacherId', { teacherId: query.teacherId });
    }

    if (query.search) {
      qb.andWhere(
        '(course.courseCode ILIKE :search OR course.courseName ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    if (query.includeDeleted) {
      qb.withDeleted();
    }

    qb.orderBy('course.id', 'DESC').skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

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
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['teachers'],
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['teachers'],
    });
    if (!course) throw new NotFoundException('Course not found');

    if (dto.courseCode && dto.courseCode !== course.courseCode) {
      const used = await this.courseRepo.findOne({
        where: { courseCode: dto.courseCode },
      });
      if (used) throw new ConflictException('course_code already exists');
    }

    Object.assign(course, {
      courseCode: dto.courseCode ?? course.courseCode,
      courseName: dto.courseName ?? course.courseName,
      description:
        dto.description !== undefined ? dto.description : course.description,
      credits: dto.credits ?? course.credits,
      departmentId:
        dto.departmentId !== undefined ? dto.departmentId : course.departmentId,
      semester: dto.semester !== undefined ? dto.semester : course.semester,
      maxStudents:
        dto.maxStudents !== undefined ? dto.maxStudents : course.maxStudents,
      isActive: dto.isActive !== undefined ? dto.isActive : course.isActive,
    });

    if (dto.teacherIds !== undefined) {
      if (dto.teacherIds.length === 0) {
        course.teachers = [];
      } else {
        const teachers = await this.userRepo.find({
          where: { id: In(dto.teacherIds), role: UserRole.TEACHER },
        });
        if (teachers.length !== dto.teacherIds.length) {
          throw new NotFoundException(
            'Some teacher IDs not found or not teachers',
          );
        }
        course.teachers = teachers;
      }
    }

    return this.courseRepo.save(course);
  }

  async remove(id: string) {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    await this.courseRepo.softRemove(course);
    return { deleted: true };
  }

  async restore(id: string) {
    const course = await this.courseRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!course) throw new NotFoundException('Course not found');
    if (!course.deletedAt) throw new ConflictException('Course is not deleted');
    await this.courseRepo.restore(id);
    return this.courseRepo.findOne({
      where: { id },
      relations: ['departmentEntity', 'createdByUser', 'teachers'],
    });
  }

  async findDeleted() {
    return this.courseRepo.find({
      where: { deletedAt: Not(IsNull()) },
      withDeleted: true,
      relations: ['departmentEntity', 'createdByUser'],
    });
  }

  async getStudents(courseId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    return this.enrollmentRepo.find({
      where: { courseId },
      relations: ['student', 'student.user'],
      order: { id: 'DESC' },
    });
  }

  async getAttendance(courseId: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    return this.attendanceRepo.find({
      where: { courseId },
      relations: ['student', 'recordedByUser'],
      order: { date: 'DESC' },
    });
  }
}
