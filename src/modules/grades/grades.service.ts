import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';

import { Grade } from './entities/grade.entity';
import { Student } from '../students/entities/student.entity';
import { Course } from '../courses/entities/course.entity';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { GradeListQueryDto } from './dto/grade-list-query.dto';

@Injectable()
export class GradesService {
  constructor(
    @InjectRepository(Grade)
    private readonly gradeRepo: Repository<Grade>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  async create(dto: CreateGradeDto, gradedById: number) {
    const student = await this.studentRepo.findOne({
      where: { id: dto.student_id },
    });
    if (!student) throw new NotFoundException('Student not found');

    const course = await this.courseRepo.findOne({
      where: { id: dto.course_id },
    });
    if (!course) throw new NotFoundException('Course not found');

    const grade = await this.gradeRepo.save(
      this.gradeRepo.create({
        studentId: dto.student_id,
        courseId: dto.course_id,
        assessmentType: dto.assessment_type,
        assessmentName: dto.assessment_name,
        maxScore: dto.max_score.toFixed(2),
        scoreObtained: dto.score_obtained.toFixed(2),
        weightage: dto.weightage ? dto.weightage.toFixed(2) : '100.00',
        gradedBy: dto.graded_by ?? gradedById,
        gradedAt: new Date(),
      }),
    );

    return grade;
  }

  async findAll(query: GradeListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Grade> = {};
    if (query.student_id) where.studentId = query.student_id;
    if (query.course_id) where.courseId = query.course_id;
    if (query.assessment_type) where.assessmentType = query.assessment_type;

    const [items, total] = await this.gradeRepo.findAndCount({
      where,
      relations: ['student', 'student.user', 'course', 'gradedByUser'],
      order: { id: 'DESC' },
      skip,
      take: limit,
    });

    return { page, limit, total, items };
  }

  async findOne(id: number) {
    const grade = await this.gradeRepo.findOne({
      where: { id },
      relations: ['student', 'student.user', 'course', 'gradedByUser'],
    });
    if (!grade) throw new NotFoundException('Grade not found');
    return grade;
  }

  async update(id: number, dto: UpdateGradeDto, gradedById: number) {
    const grade = await this.gradeRepo.findOne({ where: { id } });
    if (!grade) throw new NotFoundException('Grade not found');

    if (dto.student_id !== undefined) {
      const student = await this.studentRepo.findOne({
        where: { id: dto.student_id },
      });
      if (!student) throw new NotFoundException('Student not found');
      grade.studentId = dto.student_id;
    }

    if (dto.course_id !== undefined) {
      const course = await this.courseRepo.findOne({
        where: { id: dto.course_id },
      });
      if (!course) throw new NotFoundException('Course not found');
      grade.courseId = dto.course_id;
    }

    Object.assign(grade, {
      assessmentType: dto.assessment_type ?? grade.assessmentType,
      assessmentName: dto.assessment_name ?? grade.assessmentName,
      maxScore:
        dto.max_score !== undefined ? dto.max_score.toFixed(2) : grade.maxScore,
      scoreObtained:
        dto.score_obtained !== undefined
          ? dto.score_obtained.toFixed(2)
          : grade.scoreObtained,
      weightage:
        dto.weightage !== undefined
          ? dto.weightage.toFixed(2)
          : grade.weightage,
      gradedBy: gradedById,
      gradedAt: new Date(),
    });

    return this.gradeRepo.save(grade);
  }

  async remove(id: number) {
    const grade = await this.gradeRepo.findOne({ where: { id } });
    if (!grade) throw new NotFoundException('Grade not found');
    await this.gradeRepo.remove(grade);
    return { deleted: true };
  }

  async getCourseGrades(courseId: number, assessmentType?: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const where: FindOptionsWhere<Grade> = { courseId };
    if (assessmentType) where.assessmentType = assessmentType;

    return this.gradeRepo.find({
      where,
      relations: ['student', 'student.user', 'gradedByUser'],
      order: { id: 'DESC' },
    });
  }
}
