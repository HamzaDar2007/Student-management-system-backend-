import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Course } from '../../courses/entities/course.entity';
import { User } from '../../users/entities/user.entity';

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

@Entity({ name: 'attendance' })
@Unique('uq_attendance_student_course_date', ['studentId', 'courseId', 'date'])
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_attendance_student_date')
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, (s) => s.attendanceRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Index('idx_attendance_course_date')
  @Column({ name: 'course_id', type: 'int' })
  courseId: number;

  @ManyToOne(() => Course, (c) => c.attendanceRecords, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ type: 'date' })
  date: string;

  @Index('idx_attendance_status')
  @Column({ type: 'enum', enum: AttendanceStatus })
  status: AttendanceStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'recorded_by', type: 'uuid', nullable: true })
  recordedBy?: string | null;

  @ManyToOne(() => User, (u) => u.recordedAttendance, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'recorded_by' })
  recordedByUser?: User | null;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'NOW()' })
  createdAt: Date;
}
