import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Enrollment } from '../../enrollments/entities/enrollment.entity';
import { Grade } from '../../grades/entities/grade.entity';
import { Attendance } from '../../attendance/entities/attendance.entity';
import { Department } from '../../departments/entities/department.entity';

@Entity({ name: 'courses' })
export class Course {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'course_code', type: 'varchar', length: 20, unique: true })
  courseCode: string;

  @Column({ name: 'course_name', type: 'varchar', length: 100 })
  courseName: string;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ type: 'int' })
  credits: number;

  @Column({ name: 'department_id', type: 'int', nullable: true })
  departmentId?: number | null;

  @ManyToOne(() => Department, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  departmentEntity?: Department | null;

  @Index('idx_courses_semester')
  @Column({ type: 'int', nullable: true })
  semester?: number | null;

  @Column({ name: 'max_students', type: 'int', default: 50 })
  maxStudents: number;

  @Index('idx_courses_is_active')
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // created_by FK -> users.id (nullable) ON DELETE SET NULL
  @Column({ name: 'created_by', type: 'uuid', nullable: true })
  createdBy?: string | null;

  @ManyToOne(() => User, (u) => u.createdCourses, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  createdByUser?: User | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;

  // Relations
  @OneToMany(() => Enrollment, (e) => e.course)
  enrollments?: Enrollment[];

  @OneToMany(() => Grade, (g) => g.course)
  grades?: Grade[];

  @OneToMany(() => Attendance, (a) => a.course)
  attendanceRecords?: Attendance[];

  @ManyToMany(() => User, (user) => user.teachingCourses, { cascade: false })
  @JoinTable({
    name: 'course_teachers',
    joinColumn: { name: 'course_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'teacher_id', referencedColumnName: 'id' },
  })
  teachers?: User[];

  // Self-referencing relationship for prerequisites
  @ManyToMany(() => Course, (course) => course.dependentCourses)
  @JoinTable({
    name: 'course_prerequisites',
    joinColumn: { name: 'course_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'prerequisite_id', referencedColumnName: 'id' },
  })
  prerequisites?: Course[];

  @ManyToMany(() => Course, (course) => course.prerequisites)
  dependentCourses?: Course[];
}
