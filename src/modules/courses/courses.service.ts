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
      where: { courseCode: dto.course_code },
    });
    if (exists) throw new ConflictException('course_code already exists');

    const course = this.courseRepo.create({
      courseCode: dto.course_code,
      courseName: dto.course_name,
      description: dto.description ?? null,
      credits: dto.credits,
      departmentId: dto.department_id ?? null,
      semester: dto.semester ?? null,
      maxStudents: dto.max_students ?? 50,
      isActive: dto.is_active ?? true,
    });

    if (dto.teacher_ids && dto.teacher_ids.length > 0) {
      const teachers = await this.userRepo.find({
        where: { id: In(dto.teacher_ids), role: UserRole.TEACHER },
      });
      if (teachers.length !== dto.teacher_ids.length) {
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

    if (query.is_active !== undefined) {
      qb.andWhere('course.isActive = :active', { active: query.is_active });
    }
    if (query.semester) {
      qb.andWhere('course.semester = :semester', { semester: query.semester });
    }
    if (query.department_id) {
      qb.andWhere('course.departmentId = :departmentId', {
        departmentId: query.department_id,
      });
    }
    if (query.teacher_id) {
      qb.andWhere('teacher.id = :teacherId', { teacherId: query.teacher_id });
    }

    qb.orderBy('course.id', 'DESC').skip(skip).take(limit);

    const [items, total] = await qb.getManyAndCount();

    return { page, limit, total, items };
  }

  async findOne(id: number) {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['teachers'],
    });
    if (!course) throw new NotFoundException('Course not found');
    return course;
  }

  async update(id: number, dto: UpdateCourseDto) {
    const course = await this.courseRepo.findOne({
      where: { id },
      relations: ['teachers'],
    });
    if (!course) throw new NotFoundException('Course not found');

    if (dto.course_code && dto.course_code !== course.courseCode) {
      const used = await this.courseRepo.findOne({
        where: { courseCode: dto.course_code },
      });
      if (used) throw new ConflictException('course_code already exists');
    }

    Object.assign(course, {
      courseCode: dto.course_code ?? course.courseCode,
      courseName: dto.course_name ?? course.courseName,
      description:
        dto.description !== undefined ? dto.description : course.description,
      credits: dto.credits ?? course.credits,
      departmentId:
        dto.department_id !== undefined
          ? dto.department_id
          : course.departmentId,
      semester: dto.semester !== undefined ? dto.semester : course.semester,
      maxStudents:
        dto.max_students !== undefined ? dto.max_students : course.maxStudents,
      isActive: dto.is_active !== undefined ? dto.is_active : course.isActive,
    });

    if (dto.teacher_ids !== undefined) {
      if (dto.teacher_ids.length === 0) {
        course.teachers = [];
      } else {
        const teachers = await this.userRepo.find({
          where: { id: In(dto.teacher_ids), role: UserRole.TEACHER },
        });
        if (teachers.length !== dto.teacher_ids.length) {
          throw new NotFoundException(
            'Some teacher IDs not found or not teachers',
          );
        }
        course.teachers = teachers;
      }
    }

    return this.courseRepo.save(course);
  }

  async remove(id: number) {
    const course = await this.courseRepo.findOne({ where: { id } });
    if (!course) throw new NotFoundException('Course not found');
    await this.courseRepo.softRemove(course);
    return { deleted: true };
  }

  async restore(id: number) {
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

  async getStudents(courseId: number) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    return this.enrollmentRepo.find({
      where: { courseId },
      relations: ['student', 'student.user'],
      order: { id: 'DESC' },
    });
  }

  async getAttendance(courseId: number) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    return this.attendanceRepo.find({
      where: { courseId },
      relations: ['student', 'recordedByUser'],
      order: { date: 'DESC' },
    });
  }
}
