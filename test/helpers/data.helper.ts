import { DataSource } from 'typeorm';
import { User, UserRole } from '../../src/modules/users/entities/user.entity';
import { Student, Gender } from '../../src/modules/students/entities/student.entity';
import { TeacherProfile, AcademicRank } from '../../src/modules/teachers/entities/teacher-profile.entity';
import { Course } from '../../src/modules/courses/entities/course.entity';
import { Enrollment, EnrollmentStatus } from '../../src/modules/enrollments/entities/enrollment.entity';
import { Grade } from '../../src/modules/grades/entities/grade.entity';
import { Attendance, AttendanceStatus } from '../../src/modules/attendance/entities/attendance.entity';
import { Faculty } from '../../src/modules/faculties/entities/faculty.entity';
import { Department } from '../../src/modules/departments/entities/department.entity';
import { AcademicTerm } from '../../src/modules/academic-terms/entities/academic-term.entity';
import { Classroom, ClassroomType } from '../../src/modules/scheduling/entities/classroom.entity';
import { Schedule } from '../../src/modules/scheduling/entities/schedule.entity';

/**
 * Create a test student profile
 */
export async function createTestStudent(
  dataSource: DataSource,
  userId: number | null = null,
  prefix: string = 'test',
): Promise<Student> {
  const studentRepo = dataSource.getRepository(Student);
  const timestamp = Date.now();
  const studentId = `STU${new Date().getFullYear()}${timestamp.toString().slice(-4)}`;

  return studentRepo.save(
    studentRepo.create({
      userId,
      studentId,
      dateOfBirth: '2000-01-15',
      gender: Gender.MALE,
      address: `${prefix} Test Address`,
      phone: '03001234567',
      emergencyContact: 'Test Contact: 03009876543',
      enrollmentDate: new Date().toISOString().split('T')[0],
      semester: 1,
    }),
  );
}

/**
 * Create a test teacher profile
 */
export async function createTestTeacherProfile(
  dataSource: DataSource,
  userId: number,
  prefix: string = 'test',
): Promise<TeacherProfile> {
  const teacherRepo = dataSource.getRepository(TeacherProfile);
  const timestamp = Date.now();

  return teacherRepo.save(
    teacherRepo.create({
      userId,
      employeeId: `EMP${timestamp.toString().slice(-6)}`,
      rank: AcademicRank.ASSISTANT_PROFESSOR,
      specialization: `${prefix} Computer Science`,
      officeLocation: 'Room 101',
      officeHours: 'Mon-Fri 9-11 AM',
      phone: '03001111111',
      bio: `${prefix} Test teacher bio`,
      hireDate: '2020-01-01',
      isActive: true,
    }),
  );
}

/**
 * Create a test course
 */
export async function createTestCourse(
  dataSource: DataSource,
  createdBy: number | null = null,
  teacherIds: number[] = [],
  prefix: string = 'test',
): Promise<Course> {
  const courseRepo = dataSource.getRepository(Course);
  const userRepo = dataSource.getRepository(User);
  const timestamp = Date.now();
  const courseCode = `${prefix.toUpperCase().slice(0, 2)}${timestamp.toString().slice(-4)}`;

  const course = courseRepo.create({
    courseCode,
    courseName: `${prefix} Test Course ${timestamp}`,
    description: `${prefix} course description`,
    credits: 3,
    semester: 1,
    maxStudents: 50,
    isActive: true,
    createdBy,
  });

  if (teacherIds.length > 0) {
    course.teachers = await userRepo.findBy(
      teacherIds.map((id) => ({ id })),
    );
  }

  return courseRepo.save(course);
}

/**
 * Create a test enrollment
 */
export async function createTestEnrollment(
  dataSource: DataSource,
  studentId: number,
  courseId: number,
): Promise<Enrollment> {
  const enrollmentRepo = dataSource.getRepository(Enrollment);

  return enrollmentRepo.save(
    enrollmentRepo.create({
      studentId,
      courseId,
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: EnrollmentStatus.ACTIVE,
      attendancePercentage: '100.00',
    }),
  );
}

/**
 * Create a test grade
 */
export async function createTestGrade(
  dataSource: DataSource,
  studentId: number,
  courseId: number,
  gradedBy: number | null = null,
  prefix: string = 'test',
): Promise<Grade> {
  const gradeRepo = dataSource.getRepository(Grade);

  return gradeRepo.save(
    gradeRepo.create({
      studentId,
      courseId,
      assessmentType: `${prefix}_midterm`,
      assessmentName: `${prefix} Midterm Exam`,
      scoreObtained: '85',
      maxScore: '100',
      weightage: '30',
      gradedBy,
      gradedAt: new Date(),
    }),
  );
}

/**
 * Create a test attendance record
 */
export async function createTestAttendance(
  dataSource: DataSource,
  studentId: number,
  courseId: number,
  recordedBy: number | null = null,
  date: string = new Date().toISOString().split('T')[0],
): Promise<Attendance> {
  const attendanceRepo = dataSource.getRepository(Attendance);

  return attendanceRepo.save(
    attendanceRepo.create({
      studentId,
      courseId,
      date,
      status: AttendanceStatus.PRESENT,
      recordedBy,
    }),
  );
}

/**
 * Create a test faculty
 */
export async function createTestFaculty(
  dataSource: DataSource,
  prefix: string = 'test',
): Promise<Faculty> {
  const facultyRepo = dataSource.getRepository(Faculty);
  const timestamp = Date.now();

  return facultyRepo.save(
    facultyRepo.create({
      name: `${prefix} Faculty ${timestamp}`,
      code: `${prefix.toUpperCase().slice(0, 2)}${timestamp.toString().slice(-4)}`,
    }),
  );
}

/**
 * Create a test department
 */
export async function createTestDepartment(
  dataSource: DataSource,
  faculty: Faculty,
  prefix: string = 'test',
): Promise<Department> {
  const departmentRepo = dataSource.getRepository(Department);
  const timestamp = Date.now();

  return departmentRepo.save(
    departmentRepo.create({
      name: `${prefix} Department ${timestamp}`,
      code: `${prefix.toUpperCase().slice(0, 2)}D${timestamp.toString().slice(-3)}`,
      faculty,
    }),
  );
}

/**
 * Create a test academic term
 */
export async function createTestAcademicTerm(
  dataSource: DataSource,
  prefix: string = 'test',
): Promise<AcademicTerm> {
  const termRepo = dataSource.getRepository(AcademicTerm);
  const timestamp = Date.now();
  const year = new Date().getFullYear();

  return termRepo.save(
    termRepo.create({
      name: `${prefix} Term ${timestamp}`,
      startDate: `${year}-01-01`,
      endDate: `${year}-06-30`,
      isActive: false,
    }),
  );
}

/**
 * Create a test classroom
 */
export async function createTestClassroom(
  dataSource: DataSource,
  prefix: string = 'test',
): Promise<Classroom> {
  const classroomRepo = dataSource.getRepository(Classroom);
  const timestamp = Date.now();

  return classroomRepo.save(
    classroomRepo.create({
      roomNumber: `${prefix.toUpperCase().slice(0, 1)}${timestamp.toString().slice(-4)}`,
      building: `${prefix} Building`,
      capacity: 50,
      type: ClassroomType.LECTURE,
    }),
  );
}

/**
 * Create a test schedule
 */
export async function createTestSchedule(
  dataSource: DataSource,
  courseId: number,
  classroomId: number,
): Promise<Schedule> {
  const scheduleRepo = dataSource.getRepository(Schedule);

  return scheduleRepo.save(
    scheduleRepo.create({
      courseId,
      classroomId,
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '10:30',
    }),
  );
}
