import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentListQueryDto } from './dto/student-list-query.dto';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Grade } from '../grades/entities/grade.entity';
import { Attendance } from '../attendance/entities/attendance.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepo: Repository<Student>,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepo: Repository<Enrollment>,
    @InjectRepository(Grade) private readonly gradeRepo: Repository<Grade>,
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
  ) {}

  async create(dto: CreateStudentDto) {
    const exists = await this.studentRepo.findOne({
      where: { studentId: dto.student_id },
    });
    if (exists) throw new ConflictException('student_id already exists');

    const student = await this.studentRepo.save(
      this.studentRepo.create({
        userId: dto.user_id ?? null,
        studentId: dto.student_id,
        dateOfBirth: dto.date_of_birth ?? null,
        gender: dto.gender ?? null,
        address: dto.address ?? null,
        phone: dto.phone ?? null,
        emergencyContact: dto.emergency_contact ?? null,
        enrollmentDate: dto.enrollment_date,
        departmentId: dto.department_id ?? null,
        semester: dto.semester ?? null,
      }),
    );

    return student;
  }

  async findAll(query: StudentListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.department_id) where.departmentId = query.department_id;
    if (query.semester) where.semester = query.semester;

    const search = query.search?.trim();
    if (search) {
      const [items, total] = await this.studentRepo.findAndCount({
        where: [
          { ...where, studentId: ILike(`%${search}%`) },
        ],
        relations: ['user'],
        order: { id: 'DESC' },
        skip,
        take: limit,
      });
      return { page, limit, total, items };
    }

    const [items, total] = await this.studentRepo.findAndCount({
      where,
      relations: ['user'],
      order: { id: 'DESC' },
      skip,
      take: limit,
    });

    return { page, limit, total, items };
  }

  async findOne(id: number) {
    const student = await this.studentRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!student) throw new NotFoundException('Student not found');

    const enrollments = await this.enrollmentRepo.find({
      where: { studentId: id },
      relations: ['course'],
      order: { id: 'DESC' },
    });

    return { ...student, enrollments };
  }

  async update(id: number, dto: UpdateStudentDto) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');

    if (dto.student_id && dto.student_id !== student.studentId) {
      const used = await this.studentRepo.findOne({
        where: { studentId: dto.student_id },
      });
      if (used) throw new ConflictException('student_id already exists');
    }

    Object.assign(student, {
      userId: dto.user_id !== undefined ? dto.user_id : student.userId,
      studentId: dto.student_id ?? student.studentId,
      dateOfBirth: dto.date_of_birth ?? student.dateOfBirth,
      gender: dto.gender !== undefined ? (dto.gender as any) : student.gender,
      address: dto.address !== undefined ? dto.address : student.address,
      phone: dto.phone !== undefined ? dto.phone : student.phone,
      emergencyContact:
        dto.emergency_contact !== undefined
          ? dto.emergency_contact
          : student.emergencyContact,
      enrollmentDate: dto.enrollment_date ?? student.enrollmentDate,
      departmentId:
        dto.department_id !== undefined ? dto.department_id : student.departmentId,
      semester: dto.semester !== undefined ? dto.semester : student.semester,
    });

    return this.studentRepo.save(student);
  }

  async remove(id: number) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    await this.studentRepo.remove(student);
    return { deleted: true };
  }

  async getGrades(studentId: number) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    return this.gradeRepo.find({
      where: { studentId },
      relations: ['course', 'gradedByUser'],
      order: { id: 'DESC' },
    });
  }

  async getAttendance(studentId: number) {
    const student = await this.studentRepo.findOne({
      where: { id: studentId },
    });
    if (!student) throw new NotFoundException('Student not found');

    return this.attendanceRepo.find({
      where: { studentId },
      relations: ['course', 'recordedByUser'],
      order: { id: 'DESC' },
    });
  }
}
