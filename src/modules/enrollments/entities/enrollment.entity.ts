import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Course } from '../../courses/entities/course.entity';

export enum EnrollmentStatus {
  ACTIVE = 'active',
  DROPPED = 'dropped',
  COMPLETED = 'completed',
}

@Entity({ name: 'enrollments' })
@Unique('uq_enrollments_student_course', ['studentId', 'courseId'])
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_enrollments_student_id')
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, (s) => s.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Index('idx_enrollments_course_id')
  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Course, (c) => c.enrollments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Index('idx_enrollments_enrollment_date')
  @Column({
    name: 'enrollment_date',
    type: 'date',
    default: () => 'CURRENT_DATE',
  })
  enrollmentDate: string;

  @Index('idx_enrollments_status')
  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.ACTIVE,
  })
  status: EnrollmentStatus;

  @Column({ type: 'varchar', length: 2, nullable: true })
  grade?: string | null;

  @Column({
    name: 'grade_points',
    type: 'decimal',
    precision: 3,
    scale: 2,
    nullable: true,
  })
  gradePoints?: string | null;

  @Column({
    name: 'attendance_percentage',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: '100.00',
  })
  attendancePercentage: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
