import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Course } from '../../courses/entities/course.entity';
import { Grade } from '../../grades/entities/grade.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  STUDENT = 'student',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_users_email')
  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Index('idx_users_username')
  @Column({ type: 'varchar', length: 50, unique: true })
  username: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash: string;

  @Index('idx_users_role')
  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Column({ name: 'first_name', type: 'varchar', length: 50, nullable: true })
  firstName?: string | null;

  @Column({ name: 'last_name', type: 'varchar', length: 50, nullable: true })
  lastName?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => Student, (student) => student.user)
  studentProfile?: Student;

  @OneToMany(() => Course, (course) => course.createdByUser)
  createdCourses?: Course[];

  @OneToMany(() => Grade, (grade) => grade.gradedByUser)
  gradedItems?: Grade[];

  @OneToMany(() => Attendance, (att) => att.recordedByUser)
  recordedAttendance?: Attendance[];

  @ManyToMany(() => Course, (course) => course.teachers)
  teachingCourses?: Course[];
}
