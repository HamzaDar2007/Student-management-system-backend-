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

  async create(dto: CreateGradeDto, gradedById: string) {
    const student = await this.studentRepo.findOne({
      where: { id: dto.studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    const course = await this.courseRepo.findOne({
      where: { id: dto.courseId },
    });
    if (!course) throw new NotFoundException('Course not found');

    const grade = await this.gradeRepo.save(
      this.gradeRepo.create({
        studentId: dto.studentId,
        courseId: dto.courseId,
        assessmentType: dto.assessmentType,
        assessmentName: dto.assessmentName,
        maxScore: dto.maxScore.toFixed(2),
        scoreObtained: dto.scoreObtained.toFixed(2),
        weightage: dto.weightage ? dto.weightage.toFixed(2) : '100.00',
        gradedBy: dto.gradedBy ?? gradedById,
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
    if (query.studentId) where.studentId = query.studentId;
    if (query.courseId) where.courseId = query.courseId;
    if (query.assessmentType) where.assessmentType = query.assessmentType;

    const [items, total] = await this.gradeRepo.findAndCount({
      where,
      relations: ['student', 'student.user', 'course', 'gradedByUser'],
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
    const grade = await this.gradeRepo.findOne({
      where: { id },
      relations: ['student', 'student.user', 'course', 'gradedByUser'],
    });
    if (!grade) throw new NotFoundException('Grade not found');
    return grade;
  }

  async update(id: string, dto: UpdateGradeDto, gradedById: string) {
    const grade = await this.gradeRepo.findOne({ where: { id } });
    if (!grade) throw new NotFoundException('Grade not found');

    if (dto.studentId !== undefined) {
      const student = await this.studentRepo.findOne({
        where: { id: dto.studentId },
      });
      if (!student) throw new NotFoundException('Student not found');
      grade.studentId = dto.studentId;
    }

    if (dto.courseId !== undefined) {
      const course = await this.courseRepo.findOne({
        where: { id: dto.courseId },
      });
      if (!course) throw new NotFoundException('Course not found');
      grade.courseId = dto.courseId;
    }

    Object.assign(grade, {
      assessmentType: dto.assessmentType ?? grade.assessmentType,
      assessmentName: dto.assessmentName ?? grade.assessmentName,
      maxScore:
        dto.maxScore !== undefined ? dto.maxScore.toFixed(2) : grade.maxScore,
      scoreObtained:
        dto.scoreObtained !== undefined
          ? dto.scoreObtained.toFixed(2)
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

  async remove(id: string) {
    const grade = await this.gradeRepo.findOne({ where: { id } });
    if (!grade) throw new NotFoundException('Grade not found');
    await this.gradeRepo.remove(grade);
    return { deleted: true };
  }

  async getCourseGrades(courseId: string, assessmentType?: string) {
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
