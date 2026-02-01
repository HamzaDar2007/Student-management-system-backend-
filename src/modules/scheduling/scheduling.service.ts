import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Schedule } from './entities/schedule.entity';
import { Classroom, ClassroomType } from './entities/classroom.entity';
import { CreateSchedulingDto } from './dto/create-scheduling.dto';
import { UpdateSchedulingDto } from './dto/update-scheduling.dto';
import { CreateClassroomDto } from './dto/create-classroom.dto';
import { UpdateClassroomDto } from './dto/update-classroom.dto';
import { SchedulingQueryDto } from './dto/scheduling-query.dto';
import { Course } from '../courses/entities/course.entity';

@Injectable()
export class SchedulingService {
  constructor(
    @InjectRepository(Schedule)
    private readonly scheduleRepo: Repository<Schedule>,
    @InjectRepository(Classroom)
    private readonly classroomRepo: Repository<Classroom>,
    @InjectRepository(Course)
    private readonly courseRepo: Repository<Course>,
  ) {}

  // Schedule methods
  async create(dto: CreateSchedulingDto) {
    const course = await this.courseRepo.findOne({
      where: { id: dto.course_id },
    });
    if (!course) throw new NotFoundException('Course not found');

    const classroom = await this.classroomRepo.findOne({
      where: { id: dto.classroom_id },
    });
    if (!classroom) throw new NotFoundException('Classroom not found');

    // Check for time conflicts in the same classroom
    const conflict = await this.checkScheduleConflict(
      dto.classroom_id,
      dto.day_of_week,
      dto.start_time,
      dto.end_time,
    );
    if (conflict) {
      throw new ConflictException(
        'Schedule conflict: classroom is already booked at this time',
      );
    }

    const schedule = this.scheduleRepo.create({
      courseId: dto.course_id,
      classroomId: dto.classroom_id,
      dayOfWeek: dto.day_of_week,
      startTime: dto.start_time,
      endTime: dto.end_time,
    });

    return this.scheduleRepo.save(schedule);
  }

  async findAll(query: SchedulingQueryDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const queryBuilder = this.scheduleRepo
      .createQueryBuilder('schedule')
      .leftJoinAndSelect('schedule.course', 'course')
      .leftJoinAndSelect('schedule.classroom', 'classroom')
      .skip(skip)
      .take(limit)
      .orderBy('schedule.dayOfWeek', 'ASC')
      .addOrderBy('schedule.startTime', 'ASC');

    if (query.teacherId) {
      queryBuilder
        .innerJoin('course.teachers', 'teacher')
        .andWhere('teacher.id = :teacherId', { teacherId: query.teacherId });
    }

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const schedule = await this.scheduleRepo.findOne({
      where: { id },
      relations: ['course', 'classroom'],
    });
    if (!schedule) throw new NotFoundException('Schedule not found');
    return schedule;
  }

  async findByCourse(courseId: number) {
    return this.scheduleRepo.find({
      where: { courseId },
      relations: ['classroom'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async findByClassroom(classroomId: number) {
    return this.scheduleRepo.find({
      where: { classroomId },
      relations: ['course'],
      order: { dayOfWeek: 'ASC', startTime: 'ASC' },
    });
  }

  async update(id: number, dto: UpdateSchedulingDto) {
    const schedule = await this.scheduleRepo.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException('Schedule not found');

    if (dto.course_id && dto.course_id !== schedule.courseId) {
      const course = await this.courseRepo.findOne({
        where: { id: dto.course_id },
      });
      if (!course) throw new NotFoundException('Course not found');
    }

    if (dto.classroom_id && dto.classroom_id !== schedule.classroomId) {
      const classroom = await this.classroomRepo.findOne({
        where: { id: dto.classroom_id },
      });
      if (!classroom) throw new NotFoundException('Classroom not found');
    }

    // Check for conflicts if time/classroom changed
    const classroomId = dto.classroom_id ?? schedule.classroomId;
    const dayOfWeek = dto.day_of_week ?? schedule.dayOfWeek;
    const startTime = dto.start_time ?? schedule.startTime;
    const endTime = dto.end_time ?? schedule.endTime;

    const conflict = await this.checkScheduleConflict(
      classroomId,
      dayOfWeek,
      startTime,
      endTime,
      id,
    );
    if (conflict) {
      throw new ConflictException(
        'Schedule conflict: classroom is already booked at this time',
      );
    }

    Object.assign(schedule, {
      courseId: dto.course_id ?? schedule.courseId,
      classroomId: dto.classroom_id ?? schedule.classroomId,
      dayOfWeek: dto.day_of_week ?? schedule.dayOfWeek,
      startTime: dto.start_time ?? schedule.startTime,
      endTime: dto.end_time ?? schedule.endTime,
    });

    return this.scheduleRepo.save(schedule);
  }

  async remove(id: number) {
    const schedule = await this.scheduleRepo.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException('Schedule not found');
    await this.scheduleRepo.softRemove(schedule);
    return { deleted: true };
  }

  // Classroom methods
  async createClassroom(dto: CreateClassroomDto) {
    const existing = await this.classroomRepo.findOne({
      where: { roomNumber: dto.room_number },
    });
    if (existing) throw new ConflictException('Room number already exists');

    const classroom = this.classroomRepo.create({
      roomNumber: dto.room_number,
      building: dto.building ?? null,
      capacity: dto.capacity,
      type: dto.type ?? ClassroomType.LECTURE,
    });

    return this.classroomRepo.save(classroom);
  }

  async findAllClassrooms(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [items, total] = await this.classroomRepo.findAndCount({
      order: { roomNumber: 'ASC' },
      skip,
      take: limit,
    });
    return {
      data: items,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async findOneClassroom(id: number) {
    const classroom = await this.classroomRepo.findOne({ where: { id } });
    if (!classroom) throw new NotFoundException('Classroom not found');
    return classroom;
  }

  async updateClassroom(id: number, dto: UpdateClassroomDto) {
    const classroom = await this.classroomRepo.findOne({ where: { id } });
    if (!classroom) throw new NotFoundException('Classroom not found');

    if (dto.room_number && dto.room_number !== classroom.roomNumber) {
      const existing = await this.classroomRepo.findOne({
        where: { roomNumber: dto.room_number },
      });
      if (existing) throw new ConflictException('Room number already exists');
    }

    Object.assign(classroom, {
      roomNumber: dto.room_number ?? classroom.roomNumber,
      building: dto.building !== undefined ? dto.building : classroom.building,
      capacity: dto.capacity ?? classroom.capacity,
      type: dto.type ?? classroom.type,
    });

    return this.classroomRepo.save(classroom);
  }

  async removeClassroom(id: number) {
    const classroom = await this.classroomRepo.findOne({ where: { id } });
    if (!classroom) throw new NotFoundException('Classroom not found');

    // Check if classroom has schedules
    const schedules = await this.scheduleRepo.find({
      where: { classroomId: id },
    });
    if (schedules.length > 0) {
      throw new ConflictException(
        'Cannot delete classroom with existing schedules',
      );
    }

    await this.classroomRepo.softRemove(classroom);
    return { deleted: true };
  }

  async restoreClassroom(id: number) {
    const classroom = await this.classroomRepo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!classroom) {
      throw new NotFoundException(`Classroom with ID ${id} not found`);
    }

    if (!classroom.deletedAt) {
      throw new ConflictException(`Classroom with ID ${id} is not deleted`);
    }

    return this.classroomRepo.restore(id);
  }

  async restore(id: number) {
    const schedule = await this.scheduleRepo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!schedule) {
      throw new NotFoundException(`Schedule with ID ${id} not found`);
    }

    if (!schedule.deletedAt) {
      throw new ConflictException(`Schedule with ID ${id} is not deleted`);
    }

    return this.scheduleRepo.restore(id);
  }

  // Helper method to check for schedule conflicts
  private async checkScheduleConflict(
    classroomId: number,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: number,
  ): Promise<boolean> {
    const query = this.scheduleRepo
      .createQueryBuilder('schedule')
      .where('schedule.classroomId = :classroomId', { classroomId })
      .andWhere('schedule.dayOfWeek = :dayOfWeek', { dayOfWeek })
      .andWhere(
        '(schedule.startTime < :endTime AND schedule.endTime > :startTime)',
        { startTime, endTime },
      );

    if (excludeId) {
      query.andWhere('schedule.id != :excludeId', { excludeId });
    }

    const conflict = await query.getOne();
    return !!conflict;
  }
}
