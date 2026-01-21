import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import dataSource from '../../config/data-source';

import { User, UserRole } from '../../modules/users/entities/user.entity';
import {
  Student,
  Gender,
} from '../../modules/students/entities/student.entity';
import { Course } from '../../modules/courses/entities/course.entity';
import {
  Enrollment,
  EnrollmentStatus,
} from '../../modules/enrollments/entities/enrollment.entity';
import { Grade } from '../../modules/grades/entities/grade.entity';
import {
  Attendance,
  AttendanceStatus,
} from '../../modules/attendance/entities/attendance.entity';
import { Department } from '../../modules/departments/entities/department.entity';
import { Faculty } from '../../modules/faculties/entities/faculty.entity';

function yyyyMmDd(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

async function runSeed() {
  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const studentRepo = dataSource.getRepository(Student);
  const courseRepo = dataSource.getRepository(Course);
  const enrollmentRepo = dataSource.getRepository(Enrollment);
  const gradeRepo = dataSource.getRepository(Grade);
  const attendanceRepo = dataSource.getRepository(Attendance);
  const departmentRepo = dataSource.getRepository(Department);
  const facultyRepo = dataSource.getRepository(Faculty);

  console.log('✅ Connected. Seeding data...');

  // -----------------------
  // 0) Clean existing data (optional but helpful for dev)
  // Order matters because of FK dependencies.
  // -----------------------
  await attendanceRepo.delete({});
  await gradeRepo.delete({});
  await enrollmentRepo.delete({});
  await courseRepo.delete({});
  await studentRepo.delete({});
  await userRepo.delete({});
  await departmentRepo.delete({});
  await facultyRepo.delete({});

  // -----------------------
  // 1) Password hashing
  // -----------------------
  const saltRounds = 10;
  const defaultPassword = 'SecurePass123';
  const passwordHash = await bcrypt.hash(defaultPassword, saltRounds);

  // -----------------------
  // 2) Create Admin + Teachers
  // -----------------------
  const admin = userRepo.create({
    email: 'admin@school.com',
    username: 'admin',
    passwordHash,
    role: UserRole.ADMIN,
    firstName: 'System',
    lastName: 'Admin',
    isActive: true,
  });

  const teacher1 = userRepo.create({
    email: 'teacher1@school.com',
    username: 'teacher1',
    passwordHash,
    role: UserRole.TEACHER,
    firstName: 'Ayesha',
    lastName: 'Khan',
    isActive: true,
  });

  const teacher2 = userRepo.create({
    email: 'teacher2@school.com',
    username: 'teacher2',
    passwordHash,
    role: UserRole.TEACHER,
    firstName: 'Bilal',
    lastName: 'Ahmed',
    isActive: true,
  });

  await userRepo.save([admin, teacher1, teacher2]);

  // -----------------------
  // 2.1) Create Faculty and Departments
  // -----------------------
  const faculty = await facultyRepo.save(
    facultyRepo.create({
      name: 'Faculty of Computing',
      code: 'FOC',
    }),
  );

  const csDept = await departmentRepo.save(
    departmentRepo.create({
      name: 'Computer Science',
      code: 'CS',
      faculty: faculty,
    }),
  );

  const seDept = await departmentRepo.save(
    departmentRepo.create({
      name: 'Software Engineering',
      code: 'SE',
      faculty: faculty,
    }),
  );

  const itDept = await departmentRepo.save(
    departmentRepo.create({
      name: 'Information Technology',
      code: 'IT',
      faculty: faculty,
    }),
  );

  // -----------------------
  // 3) Create Student Users + Student Profiles
  // -----------------------
  const studentUsers = await userRepo.save(
    userRepo.create([
      {
        email: 'student1@school.com',
        username: 'student1',
        passwordHash,
        role: UserRole.STUDENT,
        firstName: 'Ali',
        lastName: 'Raza',
        isActive: true,
      },
      {
        email: 'student2@school.com',
        username: 'student2',
        passwordHash,
        role: UserRole.STUDENT,
        firstName: 'Sara',
        lastName: 'Iqbal',
        isActive: true,
      },
      {
        email: 'student3@school.com',
        username: 'student3',
        passwordHash,
        role: UserRole.STUDENT,
        firstName: 'Usman',
        lastName: 'Shah',
        isActive: true,
      },
      {
        email: 'student4@school.com',
        username: 'student4',
        passwordHash,
        role: UserRole.STUDENT,
        firstName: 'Hira',
        lastName: 'Malik',
        isActive: true,
      },
      {
        email: 'student5@school.com',
        username: 'student5',
        passwordHash,
        role: UserRole.STUDENT,
        firstName: 'Zain',
        lastName: 'Butt',
        isActive: true,
      },
    ]),
  );

  // Create student profiles linked to those users
  // NOTE: student_id format: STU + YEAR + SEQUENCE (e.g., STU2024001)
  const enrollmentDate = '2024-01-15';

  const studentProfiles = await studentRepo.save(
    studentRepo.create([
      {
        userId: studentUsers[0].id,
        studentId: 'STU2024001',
        dateOfBirth: '2004-01-10',
        gender: Gender.MALE,
        address: 'House 1, Main Street',
        phone: '03000000001',
        emergencyContact: 'Father: 03000011111',
        enrollmentDate,
        departmentId: csDept.id,
        semester: 1,
      },
      {
        userId: studentUsers[1].id,
        studentId: 'STU2024002',
        dateOfBirth: '2003-06-12',
        gender: Gender.FEMALE,
        address: 'House 2, Main Street',
        phone: '03000000002',
        emergencyContact: 'Mother: 03000022222',
        enrollmentDate,
        departmentId: csDept.id,
        semester: 1,
      },
      {
        userId: studentUsers[2].id,
        studentId: 'STU2024003',
        dateOfBirth: '2002-03-05',
        gender: Gender.MALE,
        address: 'House 3, Main Street',
        phone: '03000000003',
        emergencyContact: 'Brother: 03000033333',
        enrollmentDate,
        departmentId: seDept.id,
        semester: 2,
      },
      {
        userId: studentUsers[3].id,
        studentId: 'STU2024004',
        dateOfBirth: '2001-09-09',
        gender: Gender.FEMALE,
        address: 'House 4, Main Street',
        phone: '03000000004',
        emergencyContact: 'Father: 03000044444',
        enrollmentDate,
        departmentId: itDept.id,
        semester: 2,
      },
      {
        userId: studentUsers[4].id,
        studentId: 'STU2024005',
        dateOfBirth: '2004-11-21',
        gender: Gender.OTHER,
        address: 'House 5, Main Street',
        phone: '03000000005',
        emergencyContact: 'Guardian: 03000055555',
        enrollmentDate,
        departmentId: csDept.id,
        semester: 1,
      },
    ]),
  );

  // -----------------------
  // 4) Create Courses (with teachers assigned)
  // -----------------------
  const courses = await courseRepo.save(
    courseRepo.create([
      {
        courseCode: 'CS101',
        courseName: 'Introduction to Programming',
        description: 'Basic programming concepts',
        credits: 3,
        departmentId: csDept.id,
        semester: 1,
        maxStudents: 60,
        isActive: true,
        createdBy: admin.id,
        teachers: [teacher1], // Assigned teacher(s)
      },
      {
        courseCode: 'CS102',
        courseName: 'Data Structures',
        description: 'Arrays, stacks, queues, linked lists, trees',
        credits: 3,
        departmentId: csDept.id,
        semester: 2,
        maxStudents: 60,
        isActive: true,
        createdBy: teacher1.id,
        teachers: [teacher1],
      },
      {
        courseCode: 'SE201',
        courseName: 'Software Engineering Fundamentals',
        description: 'Requirements, design, testing, agile',
        credits: 3,
        departmentId: seDept.id,
        semester: 2,
        maxStudents: 50,
        isActive: true,
        createdBy: teacher2.id,
        teachers: [teacher2],
      },
      {
        courseCode: 'IT110',
        courseName: 'Networking Basics',
        description: 'Intro to networks, OSI, TCP/IP',
        credits: 2,
        departmentId: itDept.id,
        semester: 1,
        maxStudents: 50,
        isActive: true,
        createdBy: admin.id,
        teachers: [teacher1, teacher2], // Multiple teachers example
      },
    ]),
  );

  // -----------------------
  // 5) Create Enrollments (Unique student_id + course_id)
  // -----------------------
  const enrollments: Enrollment[] = [];

  // Enroll all CS students into CS101
  for (const s of studentProfiles) {
    enrollments.push(
      enrollmentRepo.create({
        studentId: s.id,
        courseId: courses[0].id, // CS101
        enrollmentDate: '2024-01-15',
        status: EnrollmentStatus.ACTIVE,
        attendancePercentage: '100.00',
      }),
    );
  }

  // Add some extra enrollments
  enrollments.push(
    enrollmentRepo.create({
      studentId: studentProfiles[0].id,
      courseId: courses[1].id, // CS102
      enrollmentDate: '2024-02-01',
      status: EnrollmentStatus.ACTIVE,
      attendancePercentage: '95.00',
    }),
    enrollmentRepo.create({
      studentId: studentProfiles[2].id,
      courseId: courses[2].id, // SE201
      enrollmentDate: '2024-02-01',
      status: EnrollmentStatus.ACTIVE,
      attendancePercentage: '92.50',
    }),
    enrollmentRepo.create({
      studentId: studentProfiles[3].id,
      courseId: courses[3].id, // IT110
      enrollmentDate: '2024-02-01',
      status: EnrollmentStatus.ACTIVE,
      attendancePercentage: '88.00',
    }),
  );

  await enrollmentRepo.save(enrollments);

  // -----------------------
  // 6) Sample Grades
  // -----------------------
  const grades: Grade[] = [];

  // Midterm for CS101 for first 3 students
  grades.push(
    gradeRepo.create({
      studentId: studentProfiles[0].id,
      courseId: courses[0].id,
      assessmentType: 'midterm',
      assessmentName: 'Midterm Exam',
      maxScore: '100.00',
      scoreObtained: '85.00',
      weightage: '30.00',
      gradedBy: teacher1.id,
      gradedAt: new Date(),
    }),
    gradeRepo.create({
      studentId: studentProfiles[1].id,
      courseId: courses[0].id,
      assessmentType: 'midterm',
      assessmentName: 'Midterm Exam',
      maxScore: '100.00',
      scoreObtained: '78.00',
      weightage: '30.00',
      gradedBy: teacher1.id,
      gradedAt: new Date(),
    }),
    gradeRepo.create({
      studentId: studentProfiles[2].id,
      courseId: courses[0].id,
      assessmentType: 'midterm',
      assessmentName: 'Midterm Exam',
      maxScore: '100.00',
      scoreObtained: '90.00',
      weightage: '30.00',
      gradedBy: teacher2.id,
      gradedAt: new Date(),
    }),
  );

  await gradeRepo.save(grades);

  // -----------------------
  // 7) Sample Attendance (bulk-like rows)
  // Unique constraint: (student_id, course_id, date)
  // -----------------------
  const today = new Date('2024-02-15T00:00:00.000Z');
  const d1 = yyyyMmDd(today);
  const d2 = yyyyMmDd(new Date('2024-02-16T00:00:00.000Z'));

  const attendanceRows: Attendance[] = [];

  // Day 1: CS101 attendance for first 4 students
  attendanceRows.push(
    attendanceRepo.create({
      studentId: studentProfiles[0].id,
      courseId: courses[0].id,
      date: d1,
      status: AttendanceStatus.PRESENT,
      notes: null,
      recordedBy: teacher1.id,
    }),
    attendanceRepo.create({
      studentId: studentProfiles[1].id,
      courseId: courses[0].id,
      date: d1,
      status: AttendanceStatus.ABSENT,
      notes: 'Medical leave',
      recordedBy: teacher1.id,
    }),
    attendanceRepo.create({
      studentId: studentProfiles[2].id,
      courseId: courses[0].id,
      date: d1,
      status: AttendanceStatus.PRESENT,
      notes: null,
      recordedBy: teacher1.id,
    }),
    attendanceRepo.create({
      studentId: studentProfiles[3].id,
      courseId: courses[0].id,
      date: d1,
      status: AttendanceStatus.LATE,
      notes: 'Arrived 10 min late',
      recordedBy: teacher1.id,
    }),
  );

  // Day 2: CS101 attendance for first 2 students
  attendanceRows.push(
    attendanceRepo.create({
      studentId: studentProfiles[0].id,
      courseId: courses[0].id,
      date: d2,
      status: AttendanceStatus.PRESENT,
      recordedBy: teacher1.id,
    }),
    attendanceRepo.create({
      studentId: studentProfiles[1].id,
      courseId: courses[0].id,
      date: d2,
      status: AttendanceStatus.EXCUSED,
      notes: 'Official event',
      recordedBy: teacher1.id,
    }),
  );

  await attendanceRepo.save(attendanceRows);

  // -----------------------
  // Final output
  // -----------------------
  console.log('✅ Seed complete!');
  console.log('Login accounts (password:', defaultPassword, ')');
  console.log('Admin:', admin.email);
  console.log('Teacher 1:', teacher1.email);
  console.log('Teacher 2:', teacher2.email);
  console.log('Students:', studentUsers.map((u) => u.email).join(', '));

  await dataSource.destroy();
}

runSeed().catch(async (err) => {
  console.error('❌ Seed failed:', err);
  try {
    await dataSource.destroy();
  } catch {
    // ignore
  }
  process.exit(1);
});
