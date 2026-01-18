import {
    Column,
    CreateDateColumn,
    Entity,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from 'typeorm';

export enum ClassroomType {
    LECTURE = 'lecture',
    LAB = 'lab',
    SEMINAR = 'seminar',
    VIRTUAL = 'virtual',
}

@Entity({ name: 'classrooms' })
export class Classroom {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ name: 'room_number', type: 'varchar', length: 20, unique: true })
    roomNumber: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    building?: string | null;

    @Column({ type: 'int' })
    capacity: number;

    @Column({ type: 'enum', enum: ClassroomType, default: ClassroomType.LECTURE })
    type: ClassroomType;

    @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
    createdAt: Date;

    @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
    updatedAt: Date;
}
