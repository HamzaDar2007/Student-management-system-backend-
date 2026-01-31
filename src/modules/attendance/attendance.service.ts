import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, FindOptionsWhere, In, Repository } from 'typeorm';

import { Attendance } from './entities/attendance.entity';
import { Student } from '../students/entities/student.entity';
import { Course } from '../courses/entities/course.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { AttendanceListQueryDto } from './dto/attendance-list-query.dto';
import { BulkAttendanceDto } from './dto/bulk-attendance.dto';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  async create(dto: CreateAttendanceDto, recordedById: number) {
    const student = await this.studentRepo.findOne({
      where: { id: dto.student_id },
    });
    if (!student) throw new NotFoundException('Student not found');

    const course = await this.courseRepo.findOne({
      where: { id: dto.course_id },
    });
    if (!course) throw new NotFoundException('Course not found');

    const existing = await this.attendanceRepo.findOne({
      where: {
        studentId: dto.student_id,
        courseId: dto.course_id,
        date: dto.date,
      },
    });
    if (existing)
      throw new ConflictException(
        'Attendance record already exists for this date',
      );

    const attendance = await this.attendanceRepo.save(
      this.attendanceRepo.create({
        studentId: dto.student_id,
        courseId: dto.course_id,
        date: dto.date,
        status: dto.status,
        notes: dto.notes ?? null,
        recordedBy: recordedById,
      }),
    );

    return attendance;
  }

  async bulkCreate(dto: BulkAttendanceDto, recordedById: number) {
    const course = await this.courseRepo.findOne({
      where: { id: dto.course_id },
    });
    if (!course) throw new NotFoundException('Course not found');

    const results: Attendance[] = [];

    for (const record of dto.records) {
      const student = await this.studentRepo.findOne({
        where: { id: record.student_id },
      });
      if (!student) continue;

      const existing = await this.attendanceRepo.findOne({
        where: {
          studentId: record.student_id,
          courseId: dto.course_id,
          date: dto.date,
        },
      });

      if (existing) {
        existing.status = record.status;
        existing.notes = record.notes ?? existing.notes;
        existing.recordedBy = recordedById;
        results.push(await this.attendanceRepo.save(existing));
      } else {
        const newRecord = await this.attendanceRepo.save(
          this.attendanceRepo.create({
            studentId: record.student_id,
            courseId: dto.course_id,
            date: dto.date,
            status: record.status,
            notes: record.notes ?? null,
            recordedBy: recordedById,
          }),
        );
        results.push(newRecord);
      }
    }

    return { recorded: results.length, records: results };
  }

  async findAll(query: AttendanceListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<Attendance> = {};
    if (query.student_id) where.studentId = query.student_id;
    if (query.course_id) where.courseId = query.course_id;
    if (query.status) where.status = query.status;
    if (query.start_date && query.end_date) {
      where.date = Between(query.start_date, query.end_date);
    }

    const [items, total] = await this.attendanceRepo.findAndCount({
      where,
      relations: ['student', 'student.user', 'course', 'recordedByUser'],
      order: { date: 'DESC', id: 'DESC' },
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
    const attendance = await this.attendanceRepo.findOne({
      where: { id },
      relations: ['student', 'student.user', 'course', 'recordedByUser'],
    });
    if (!attendance) throw new NotFoundException('Attendance not found');
    return attendance;
  }

  async update(id: number, dto: UpdateAttendanceDto, recordedById: number) {
    const attendance = await this.attendanceRepo.findOne({ where: { id } });
    if (!attendance) throw new NotFoundException('Attendance not found');

    if (dto.student_id !== undefined) {
      const student = await this.studentRepo.findOne({
        where: { id: dto.student_id },
      });
      if (!student) throw new NotFoundException('Student not found');
      attendance.studentId = dto.student_id;
    }

    if (dto.course_id !== undefined) {
      const course = await this.courseRepo.findOne({
        where: { id: dto.course_id },
      });
      if (!course) throw new NotFoundException('Course not found');
      attendance.courseId = dto.course_id;
    }

    Object.assign(attendance, {
      date: dto.date ?? attendance.date,
      status: dto.status ?? attendance.status,
      notes: dto.notes !== undefined ? dto.notes : attendance.notes,
      recordedBy: recordedById,
    });

    return this.attendanceRepo.save(attendance);
  }

  async remove(id: number) {
    const attendance = await this.attendanceRepo.findOne({ where: { id } });
    if (!attendance) throw new NotFoundException('Attendance not found');
    await this.attendanceRepo.remove(attendance);
    return { deleted: true };
  }

  async getReport(courseId: number, startDate?: string, endDate?: string) {
    const course = await this.courseRepo.findOne({ where: { id: courseId } });
    if (!course) throw new NotFoundException('Course not found');

    const qb = this.attendanceRepo
      .createQueryBuilder('a')
      .select('a.student_id', 'studentId')
      .addSelect('COUNT(*)', 'totalClasses')
      .addSelect(
        `SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)`,
        'presentCount',
      )
      .addSelect(
        `SUM(CASE WHEN a.status = 'absent' THEN 1 ELSE 0 END)`,
        'absentCount',
      )
      .addSelect(
        `SUM(CASE WHEN a.status = 'late' THEN 1 ELSE 0 END)`,
        'lateCount',
      )
      .addSelect(
        `SUM(CASE WHEN a.status = 'excused' THEN 1 ELSE 0 END)`,
        'excusedCount',
      )
      .where('a.course_id = :courseId', { courseId })
      .groupBy('a.student_id');

    if (startDate && endDate) {
      qb.andWhere('a.date BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      });
    }

    const rawData = await qb.getRawMany<{
      studentId: number;
      totalClasses: string;
      presentCount: string;
      absentCount: string;
      lateCount: string;
      excusedCount: string;
    }>();

    const studentIds = rawData.map((r) => r.studentId);
    const students = await this.studentRepo.find({
      where: studentIds.length > 0 ? { id: In(studentIds) } : {},
      relations: ['user'],
    });

    const studentsMap = new Map(students.map((s) => [s.id, s]));

    return rawData.map((row) => {
      const totalClasses = parseInt(row.totalClasses, 10);
      const presentCount = parseInt(row.presentCount, 10);
      const lateCount = parseInt(row.lateCount, 10);
      const absentCount = parseInt(row.absentCount, 10);
      const excusedCount = parseInt(row.excusedCount, 10);

      return {
        student: studentsMap.get(row.studentId) || null,
        totalClasses,
        presentCount,
        absentCount,
        lateCount,
        excusedCount,
        attendanceRate:
          totalClasses > 0
            ? ((presentCount + lateCount) / totalClasses) * 100
            : 0,
      };
    });
  }
}
