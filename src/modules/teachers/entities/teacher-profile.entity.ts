import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum AcademicRank {
  ASSISTANT_PROFESSOR = 'assistant_professor',
  ASSOCIATE_PROFESSOR = 'associate_professor',
  PROFESSOR = 'professor',
  LECTURER = 'lecturer',
  ADJUNCT = 'adjunct',
}

@Entity({ name: 'teacher_profiles' })
export class TeacherProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_teacher_profiles_user')
  @Column({ name: 'user_id', type: 'uuid', unique: true })
  userId: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'employee_id', type: 'varchar', length: 20, unique: true })
  employeeId: string;

  @Column({ type: 'enum', enum: AcademicRank, default: AcademicRank.LECTURER })
  rank: AcademicRank;

  @Column({ type: 'varchar', length: 100, nullable: true })
  specialization?: string | null;

  @Column({
    name: 'office_location',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  officeLocation?: string | null;

  @Column({ name: 'office_hours', type: 'text', nullable: true })
  officeHours?: string | null; // JSON string or free text

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string | null;

  @Column({ type: 'text', nullable: true })
  bio?: string | null;

  @Column({ name: 'hire_date', type: 'date', nullable: true })
  hireDate?: string | null;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
