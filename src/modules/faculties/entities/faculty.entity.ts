import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Department } from '../../departments/entities/department.entity';

@Entity({ name: 'faculties' })
export class Faculty {
  @PrimaryGeneratedColumn()
  id: number;

  @Index('idx_faculties_name')
  @Column({ type: 'varchar', length: 100, unique: true })
  name: string;

  @Index('idx_faculties_code')
  @Column({ type: 'varchar', length: 20, unique: true })
  code: string;

  @ManyToOne(() => User, { nullable: true })
  dean: User;

  @OneToMany(() => Department, (dept) => dept.faculty)
  departments: Department[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
