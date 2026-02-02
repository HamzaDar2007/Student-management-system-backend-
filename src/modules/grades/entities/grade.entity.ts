import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Student } from '../../students/entities/student.entity';
import { Course } from '../../courses/entities/course.entity';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'grades' })
export class Grade {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_grades_student_course')
  @Column({ name: 'student_id', type: 'uuid' })
  studentId: string;

  @ManyToOne(() => Student, (s) => s.grades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @Index('idx_grades_course')
  @Column({ name: 'course_id', type: 'uuid' })
  courseId: string;

  @ManyToOne(() => Course, (c) => c.grades, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'course_id' })
  course: Course;

  @Column({ name: 'assessment_type', type: 'varchar', length: 50 })
  assessmentType: string;

  @Column({ name: 'assessment_name', type: 'varchar', length: 100 })
  assessmentName: string;

  @Column({ name: 'max_score', type: 'decimal', precision: 5, scale: 2 })
  maxScore: string;

  @Column({ name: 'score_obtained', type: 'decimal', precision: 5, scale: 2 })
  scoreObtained: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: '100.00' })
  weightage: string;

  @Column({ name: 'graded_by', type: 'uuid', nullable: true })
  gradedBy?: string | null;

  @ManyToOne(() => User, (u) => u.gradedItems, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'graded_by' })
  gradedByUser?: User | null;

  @Index('idx_grades_graded_at')
  @Column({ name: 'graded_at', type: 'timestamptz', default: () => 'NOW()' })
  gradedAt: Date;
}
