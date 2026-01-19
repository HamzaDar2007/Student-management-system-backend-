import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SchedulingService } from './scheduling.service';
import { SchedulingController } from './scheduling.controller';
import { Schedule } from './entities/schedule.entity';
import { Classroom } from './entities/classroom.entity';
import { Course } from '../courses/entities/course.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Schedule, Classroom, Course])],
  controllers: [SchedulingController],
  providers: [SchedulingService],
  exports: [SchedulingService],
})
export class SchedulingModule {}
