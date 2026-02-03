import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { Enrollment, EnrollmentStatus } from './entities/enrollment.entity';
import { Student } from '../students/entities/student.entity';
import { Course } from '../courses/entities/course.entity';
import { Grade } from '../grades/entities/grade.entity';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { EnrollmentListQueryDto } from './dto/enrollment-list-query.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
  ) {}

  async create(dto: CreateEnrollmentDto) {
    const student = await this.studentRepo.findOne({
      where: { id: dto.studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const course = await this.courseRepo.findOne({
      where: { id: dto.courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    const exists = await this.enrollmentRepo.findOne({
      where: { studentId: dto.studentId, courseId: dto.courseId },
    });
    if (exists) throw new ConflictException('Enrollment already exists');

    if (course.maxStudents) {
      const count = await this.enrollmentRepo.count({
        where: { courseId: dto.courseId, status: EnrollmentStatus.ACTIVE },
      });
      if (count >= course.maxStudents) {
        throw new ConflictException('Course has reached max students');
      }
    }

    const enrollment = await this.enrollmentRepo.save(
      this.enrollmentRepo.create({
        studentId: dto.studentId,
        courseId: dto.courseId,
        enrollmentDate:
          dto.enrollmentDate ?? new Date().toISOString().slice(0, 10),
        status: EnrollmentStatus.ACTIVE,
      }),
    );

    return enrollment;
  }

  async findAll(query: EnrollmentListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Enrollment> = {};
    if (query.studentId) where.studentId = query.studentId;
    if (query.courseId) where.courseId = query.courseId;
    if (query.status) where.status = query.status;

    const [items, total] = await this.enrollmentRepo.findAndCount({
      where,
      relations: ['student', 'student.user', 'course'],
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
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id },
      relations: ['student', 'student.user', 'course'],
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  async update(id: string, dto: UpdateEnrollmentDto) {
    const enrollment = await this.enrollmentRepo.findOne({ where: { id } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (dto.studentId !== undefined && dto.studentId !== enrollment.studentId) {
      const student = await this.studentRepo.findOne({
        where: { id: dto.studentId },
      });
      if (!student) throw new NotFoundException('Student not found');
      enrollment.studentId = dto.studentId;
    }

    if (dto.courseId !== undefined && dto.courseId !== enrollment.courseId) {
      const course = await this.courseRepo.findOne({
        where: { id: dto.courseId },
      });
      if (!course) throw new NotFoundException('Course not found');
      enrollment.courseId = dto.courseId;
    }

    if (dto.enrollmentDate) enrollment.enrollmentDate = dto.enrollmentDate;
    if (dto.status) enrollment.status = dto.status;
    if (dto.grade !== undefined) enrollment.grade = dto.grade;

    return this.enrollmentRepo.save(enrollment);
  }

  async remove(id: string) {
    const enrollment = await this.enrollmentRepo.findOne({ where: { id } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    await this.enrollmentRepo.remove(enrollment);
    return { deleted: true };
  }

  async updateGrade(id: string, grade: string, gradedById: string) {
    const enrollment = await this.enrollmentRepo.findOne({ where: { id } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    enrollment.grade = grade;
    await this.enrollmentRepo.save(enrollment);

    const gradeRecord = await this.gradeRepo.save(
      this.gradeRepo.create({
        studentId: enrollment.studentId,
        courseId: enrollment.courseId,
        assessmentType: 'final',
        assessmentName: 'Final Grade',
        maxScore: '100.00',
        scoreObtained: grade,
        gradedBy: gradedById,
        gradedAt: new Date(),
      }),
    );

    return {
      enrollment: await this.enrollmentRepo.save(enrollment),
      grade: gradeRecord,
    };
  }
}
