import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { User } from '../users/entities/user.entity';
import { Student } from '../students/entities/student.entity';
import { TeacherProfile } from '../teachers/entities/teacher-profile.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollments/entities/enrollment.entity';
import { Attendance } from '../attendance/entities/attendance.entity';
import { Schedule } from '../scheduling/entities/schedule.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Student,
      TeacherProfile,
      Course,
      Enrollment,
      Attendance,
      Schedule,
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
