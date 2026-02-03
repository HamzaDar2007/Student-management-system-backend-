import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Department } from '../../departments/entities/department.entity';

@Entity({ name: 'faculties' })
export class Faculty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index('idx_faculties_name')
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Index('idx_faculties_code')
  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @Column({ name: 'deanId', type: 'uuid', nullable: true })
  deanId?: string | null;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'deanId' })
  dean?: User | null;

  @OneToMany(() => Department, (dept) => dept.faculty)
  departments: Department[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date | null;
}
