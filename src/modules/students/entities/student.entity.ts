import {
  Column,
  CreateDateColumn,
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
  @PrimaryGeneratedColumn()
  id: number;

  // UNIQUE user_id (nullable) with FK ON DELETE SET NULL
  @Column({ name: 'user_id', type: 'int', unique: true, nullable: true })
  userId?: number | null;

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

  @Column({ name: 'emergency_contact', type: 'varchar', length: 100, nullable: true })
  emergencyContact?: string | null;

  @Index('idx_students_enrollment_date')
  @Column({ name: 'enrollment_date', type: 'date' })
  enrollmentDate: string;

  @Column({ name: 'department_id', type: 'int', nullable: true })
  departmentId?: number | null;

  @ManyToOne(() => Department, (dept) => dept.students, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  departmentEntity?: Department | null;

  @Index('idx_students_semester')
  @Column({ type: 'int', nullable: true })
  semester?: number | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => Enrollment, (e) => e.student)
  enrollments?: Enrollment[];

  @OneToMany(() => Grade, (g) => g.student)
  grades?: Grade[];

  @OneToMany(() => Attendance, (a) => a.student)
  attendanceRecords?: Attendance[];
}
