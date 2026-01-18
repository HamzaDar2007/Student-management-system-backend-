import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

@Entity({ name: 'academic_terms' })
export class AcademicTerm {
    @PrimaryGeneratedColumn()
    id: number;

    @Index('idx_academic_terms_name')
    @Column({ type: 'varchar', length: 50, unique: true })
    name: string; // e.g., "Fall 2024"

    @Column({ name: 'start_date', type: 'date' })
    startDate: Date;

    @Column({ name: 'end_date', type: 'date' })
    endDate: Date;

    @Column({ name: 'is_active', type: 'boolean', default: false })
    isActive: boolean;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
