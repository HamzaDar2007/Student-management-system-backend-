import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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
      where: { id: dto.student_id },
    });
    if (!student) throw new NotFoundException('Student not found');

    const course = await this.courseRepo.findOne({
      where: { id: dto.course_id },
    });
    if (!course) throw new NotFoundException('Course not found');

    const exists = await this.enrollmentRepo.findOne({
      where: { studentId: dto.student_id, courseId: dto.course_id },
    });
    if (exists) throw new ConflictException('Enrollment already exists');

    if (course.maxStudents) {
      const count = await this.enrollmentRepo.count({
        where: { courseId: dto.course_id, status: EnrollmentStatus.ACTIVE },
      });
      if (count >= course.maxStudents) {
        throw new ConflictException('Course has reached max students');
      }
    }

    const enrollment = await this.enrollmentRepo.save(
      this.enrollmentRepo.create({
        studentId: dto.student_id,
        courseId: dto.course_id,
        enrollmentDate: dto.enrollment_date ?? new Date().toISOString().slice(0, 10),
        status: EnrollmentStatus.ACTIVE,
      }),
    );

    return enrollment;
  }

  async findAll(query: EnrollmentListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.student_id) where.studentId = query.student_id;
    if (query.course_id) where.courseId = query.course_id;
    if (query.status) where.status = query.status;

    const [items, total] = await this.enrollmentRepo.findAndCount({
      where,
      relations: ['student', 'student.user', 'course'],
      order: { id: 'DESC' },
      skip,
      take: limit,
    });

    return { page, limit, total, items };
  }

  async findOne(id: number) {
    const enrollment = await this.enrollmentRepo.findOne({
      where: { id },
      relations: ['student', 'student.user', 'course'],
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    return enrollment;
  }

  async update(id: number, dto: UpdateEnrollmentDto) {
    const enrollment = await this.enrollmentRepo.findOne({ where: { id } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    if (dto.student_id !== undefined && dto.student_id !== enrollment.studentId) {
      const student = await this.studentRepo.findOne({
        where: { id: dto.student_id },
      });
      if (!student) throw new NotFoundException('Student not found');
      enrollment.studentId = dto.student_id;
    }

    if (dto.course_id !== undefined && dto.course_id !== enrollment.courseId) {
      const course = await this.courseRepo.findOne({
        where: { id: dto.course_id },
      });
      if (!course) throw new NotFoundException('Course not found');
      enrollment.courseId = dto.course_id;
    }

    if (dto.enrollment_date) enrollment.enrollmentDate = dto.enrollment_date;
    if (dto.status) enrollment.status = dto.status;
    if (dto.grade !== undefined) enrollment.grade = dto.grade;

    return this.enrollmentRepo.save(enrollment);
  }

  async remove(id: number) {
    const enrollment = await this.enrollmentRepo.findOne({ where: { id } });
    if (!enrollment) throw new NotFoundException('Enrollment not found');
    await this.enrollmentRepo.remove(enrollment);
    return { deleted: true };
  }

  async updateGrade(id: number, grade: string, gradedById: number) {
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

    return { enrollment: await this.enrollmentRepo.save(enrollment), grade: gradeRecord };
  }
}
