import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { Grade } from '../../grades/entities/grade.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { Department } from '../../departments/entities/department.entity';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer_not_to_say',
}

@Entity({ name: 'students' })
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // UNIQUE user_id (nullable) with FK ON DELETE SET NULL
  @Column({ name: 'user_id', type: 'uuid', unique: true, nullable: true })
  userId?: string | null;

  @OneToOne(() => User, (user) => user.studentProfile, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user?: User | null;

  @Index('idx_students_student_id')
  @Column({ name: 'student_id', type: 'varchar', length: 20, unique: true })
  studentId: string;

  @Column({ name: 'date_of_birth', type: 'date', nullable: true })
  dateOfBirth?: string | null;

  @Column({ type: 'enum', enum: Gender, nullable: true })
  gender?: Gender | null;

  @Column({ type: 'text', nullable: true })
  address?: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string | null;

  @Column({
    name: 'emergency_contact',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  emergencyContact?: string | null;

  @Index('idx_students_enrollment_date')
  @Column({ name: 'enrollment_date', type: 'date' })
  enrollmentDate: string;

  @Column({ name: 'department_id', type: 'uuid', nullable: true })
  departmentId?: string | null;

  @ManyToOne(() => Department, (dept) => dept.students, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department?: Department | null;

  @Index('idx_students_semester')
  @Column({ type: 'int', nullable: true })
  semester?: number | null;

  @Column({ name: 'blood_group', type: 'varchar', length: 10, nullable: true })
  bloodGroup?: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  nationality?: string | null;

  @Column({
    name: 'emergency_contact_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  emergencyContactName?: string | null;

  @Column({
    name: 'emergency_contact_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  emergencyContactPhone?: string | null;

  @Column({
    name: 'emergency_contact_relationship',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  emergencyContactRelationship?: string | null;

  @Column({
    name: 'guardian_name',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  guardianName?: string | null;

  @Column({
    name: 'guardian_phone',
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  guardianPhone?: string | null;

  @Column({
    name: 'guardian_email',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  guardianEmail?: string | null;

  @Column({
    name: 'guardian_relationship',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  guardianRelationship?: string | null;

  @Column({ name: 'medical_conditions', type: 'text', nullable: true })
  medicalConditions?: string | null;

  @Column({ type: 'text', nullable: true })
  allergies?: string | null;

  @Column({ name: 'current_year', type: 'int', nullable: true })
  currentYear?: number | null;

  @Column({ name: 'current_semester', type: 'int', nullable: true })
  currentSemester?: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;

  // Relations
  @OneToMany(() => Enrollment, (e) => e.student)
  enrollments?: Enrollment[];

  @OneToMany(() => Grade, (g) => g.student)
  grades?: Grade[];

  @OneToMany(() => Attendance, (a) => a.student)
  attendanceRecords?: Attendance[];
}
