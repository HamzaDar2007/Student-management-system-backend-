import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, IsNull, Not, Repository } from 'typeorm';

import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { StudentListQueryDto } from './dto/student-list-query.dto';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Grade } from '../grades/entities/grade.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { CacheService, CacheKeys } from '../../common/services/cache.service';

// Cache TTL values in milliseconds
const CACHE_TTL = {
  STUDENT: 300000, // 5 minutes
  STUDENTS_LIST: 60000, // 1 minute (shorter for lists)
};

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
    private readonly cacheService: CacheService,
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
        bloodGroup: dto.blood_group ?? null,
        nationality: dto.nationality ?? null,
        emergencyContactName: dto.emergency_contact_name ?? null,
        emergencyContactPhone: dto.emergency_contact_phone ?? null,
        emergencyContactRelationship:
          dto.emergency_contact_relationship ?? null,
        guardianName: dto.guardian_name ?? null,
        guardianPhone: dto.guardian_phone ?? null,
        guardianEmail: dto.guardian_email ?? null,
        guardianRelationship: dto.guardian_relationship ?? null,
        medicalConditions: dto.medical_conditions ?? null,
        allergies: dto.allergies ?? null,
        currentYear: dto.current_year ?? null,
        currentSemester: dto.current_semester ?? null,
      }),
    );

    // Return the student with relations loaded
    return this.studentRepo.findOne({
      where: { id: student.id },
      relations: ['user', 'department'],
    });
  }

  async findAll(query: StudentListQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.department_id) where.departmentId = query.department_id;
    if (query.semester) where.semester = query.semester;
    if (query.gender) where.gender = query.gender;
    if (query.year) where.currentYear = query.year;

    // Handle enrollment status filter
    if (query.enrollment_status) {
      if (query.enrollment_status === 'active') {
        where.deletedAt = null;
      } else if (query.enrollment_status === 'inactive') {
        // This would need a specific status field, for now treat as non-deleted
        where.deletedAt = null;
      } else if (query.enrollment_status === 'graduated') {
        // This would need a specific status field
        // For now, we'll skip this filter
      }
    }

    const search = query.search?.trim();
    if (search) {
      const [items, total] = await this.studentRepo.findAndCount({
        where: [{ ...where, studentId: ILike(`%${search}%`) }],
        relations: ['user', 'department'],
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

    const [items, total] = await this.studentRepo.findAndCount({
      where,
      relations: ['user', 'department'],
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
    const cacheKey = CacheKeys.student(id);

    return this.cacheService.getOrSet(
      cacheKey,
      async () => {
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
      },
      CACHE_TTL.STUDENT,
    );
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
      gender: dto.gender !== undefined ? dto.gender : student.gender,
      address: dto.address !== undefined ? dto.address : student.address,
      phone: dto.phone !== undefined ? dto.phone : student.phone,
      emergencyContact:
        dto.emergency_contact !== undefined
          ? dto.emergency_contact
          : student.emergencyContact,
      enrollmentDate: dto.enrollment_date ?? student.enrollmentDate,
      departmentId:
        dto.department_id !== undefined
          ? dto.department_id
          : student.departmentId,
      semester: dto.semester !== undefined ? dto.semester : student.semester,
    });

    const updated = await this.studentRepo.save(student);

    // Invalidate cache
    await this.cacheService.delete(CacheKeys.student(id));

    return updated;
  }

  async remove(id: number) {
    const student = await this.studentRepo.findOne({ where: { id } });
    if (!student) throw new NotFoundException('Student not found');
    await this.studentRepo.softRemove(student);

    // Invalidate cache
    await this.cacheService.delete(CacheKeys.student(id));

    return { deleted: true };
  }

  async restore(id: number) {
    const student = await this.studentRepo.findOne({
      where: { id },
      withDeleted: true,
    });
    if (!student) throw new NotFoundException('Student not found');
    if (!student.deletedAt)
      throw new ConflictException('Student is not deleted');
    await this.studentRepo.restore(id);
    return this.studentRepo.findOne({
      where: { id },
      relations: ['user', 'departmentEntity'],
    });
  }

  async findDeleted() {
    const items = await this.studentRepo.find({
      where: { deletedAt: Not(IsNull()) },
      withDeleted: true,
      relations: ['user', 'department'],
      order: { id: 'DESC' },
    });

    return {
      data: items,
      meta: {
        total: items.length,
        page: 1,
        limit: items.length,
        lastPage: 1,
      },
    };
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

  async exportToCSV(query: StudentListQueryDto): Promise<string> {
    const { data } = await this.findAll(query);

    // CSV headers
    const headers = [
      'ID',
      'Student ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Date of Birth',
      'Gender',
      'Address',
      'Blood Group',
      'Nationality',
      'Emergency Contact Name',
      'Emergency Contact Phone',
      'Emergency Contact Relationship',
      'Guardian Name',
      'Guardian Phone',
      'Guardian Email',
      'Guardian Relationship',
      'Medical Conditions',
      'Allergies',
      'Department',
      'Semester',
      'Current Year',
      'Current Semester',
      'Enrollment Date',
      'Status',
    ];

    // CSV rows
    const rows = data.map((student) => [
      student.id,
      student.studentId,
      student.user?.firstName || '',
      student.user?.lastName || '',
      student.user?.email || '',
      student.phone || '',
      student.dateOfBirth || '',
      student.gender || '',
      student.address || '',
      student.bloodGroup || '',
      student.nationality || '',
      student.emergencyContactName || '',
      student.emergencyContactPhone || '',
      student.emergencyContactRelationship || '',
      student.guardianName || '',
      student.guardianPhone || '',
      student.guardianEmail || '',
      student.guardianRelationship || '',
      student.medicalConditions || '',
      student.allergies || '',
      student.department?.name || '',
      student.semester || '',
      student.currentYear || '',
      student.currentSemester || '',
      student.enrollmentDate,
      student.deletedAt ? 'Inactive' : 'Active',
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','),
      ),
    ].join('\n');

    return csvContent;
  }

  async importFromCSV(file: Express.Multer.File) {
    if (!file) {
      throw new ConflictException('No file provided');
    }

    const content = file.buffer.toString('utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new ConflictException('CSV file is empty or invalid');
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = lines[i]
          .split(',')
          .map((v) => v.trim().replace(/"/g, ''));
        const row: any = {};

        headers.forEach((header, index) => {
          row[header] = values[index] || null;
        });

        // Map CSV fields to DTO fields
        const dto: CreateStudentDto = {
          student_id: row['Student ID'] || row['studentId'],
          enrollment_date: row['Enrollment Date'] || row['enrollmentDate'],
          user_id: row['user_id'] || undefined,
          date_of_birth:
            row['Date of Birth'] || row['dateOfBirth'] || undefined,
          gender: row['Gender'] || row['gender'] || undefined,
          address: row['Address'] || row['address'] || undefined,
          phone: row['Phone'] || row['phone'] || undefined,
          emergency_contact:
            row['Emergency Contact'] || row['emergencyContact'] || undefined,
          blood_group: row['Blood Group'] || row['bloodGroup'] || undefined,
          nationality: row['Nationality'] || row['nationality'] || undefined,
          emergency_contact_name:
            row['Emergency Contact Name'] ||
            row['emergencyContactName'] ||
            undefined,
          emergency_contact_phone:
            row['Emergency Contact Phone'] ||
            row['emergencyContactPhone'] ||
            undefined,
          emergency_contact_relationship:
            row['Emergency Contact Relationship'] ||
            row['emergencyContactRelationship'] ||
            undefined,
          guardian_name:
            row['Guardian Name'] || row['guardianName'] || undefined,
          guardian_phone:
            row['Guardian Phone'] || row['guardianPhone'] || undefined,
          guardian_email:
            row['Guardian Email'] || row['guardianEmail'] || undefined,
          guardian_relationship:
            row['Guardian Relationship'] ||
            row['guardianRelationship'] ||
            undefined,
          medical_conditions:
            row['Medical Conditions'] || row['medicalConditions'] || undefined,
          allergies: row['Allergies'] || row['allergies'] || undefined,
          department_id: row['department_id']
            ? parseInt(row['department_id'])
            : undefined,
          semester: row['semester'] ? parseInt(row['semester']) : undefined,
          current_year:
            row['Current Year'] || row['currentYear']
              ? parseInt(row['Current Year'] || row['currentYear'])
              : undefined,
          current_semester:
            row['Current Semester'] || row['currentSemester']
              ? parseInt(row['Current Semester'] || row['currentSemester'])
              : undefined,
        };

        await this.create(dto);
        results.success++;
      } catch (error) {
        results.failed++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        results.errors.push(`Row ${i + 1}: ${errorMessage}`);
      }
    }

    return results;
  }

  async bulkDelete(studentIds: number[]) {
    if (!studentIds || studentIds.length === 0) {
      throw new ConflictException('No student IDs provided');
    }

    const result = await this.studentRepo.softDelete(studentIds);

    // Invalidate cache for all affected students
    for (const id of studentIds) {
      await this.cacheService.delete(CacheKeys.student(id));
    }
    await this.cacheService.invalidateByPrefix(CacheKeys.studentsPrefix);

    return {
      success: true,
      deleted: result.affected || 0,
    };
  }

  async bulkActivate(studentIds: number[]) {
    if (!studentIds || studentIds.length === 0) {
      throw new ConflictException('No student IDs provided');
    }

    const result = await this.studentRepo.restore(studentIds);

    // Invalidate cache for all affected students
    for (const id of studentIds) {
      await this.cacheService.delete(CacheKeys.student(id));
    }
    await this.cacheService.invalidateByPrefix(CacheKeys.studentsPrefix);

    return {
      success: true,
      activated: result.affected || 0,
    };
  }

  async bulkDeactivate(studentIds: number[]) {
    // Same as bulk delete (soft delete)
    return this.bulkDelete(studentIds);
  }
}
