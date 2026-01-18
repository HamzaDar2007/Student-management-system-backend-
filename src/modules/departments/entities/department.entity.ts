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
import { Faculty } from '../../faculties/entities/faculty.entity';
import { Student } from '../../students/entities/student.entity';

@Entity({ name: 'departments' })
export class Department {
    @PrimaryGeneratedColumn()
    id: number;

    @Index('idx_departments_name')
    @Column({ type: 'varchar', length: 100, unique: true })
    name: string;

    @Index('idx_departments_code')
    @Column({ type: 'varchar', length: 20, unique: true })
    code: string;

    @ManyToOne(() => Faculty, (faculty) => faculty.departments)
    faculty: Faculty;

    @OneToMany(() => Student, (student) => student.departmentEntity)
    students: Student[];

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
