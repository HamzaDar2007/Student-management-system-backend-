import {
    Column,
    CreateDateColumn,
    Entity,
    ManyToOne,
    PrimaryGeneratedColumn,
    JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity({ name: 'audit_logs' })
export class AuditLog {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'user_id', type: 'int', nullable: true })
    userId: number | null;

    @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
    @JoinColumn({ name: 'user_id' })
    user: User | null;

    @Column({ type: 'varchar', length: 50 })
    action: string; // e.g., 'CREATE', 'UPDATE', 'DELETE'

    @Column({ type: 'varchar', length: 100 })
    resource: string; // e.g., 'Student', 'Grade'

    @Column({ name: 'resource_id', type: 'varchar', length: 50, nullable: true })
    resourceId: string | null;

    @Column({ type: 'jsonb', nullable: true })
    payload: any;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;
}
