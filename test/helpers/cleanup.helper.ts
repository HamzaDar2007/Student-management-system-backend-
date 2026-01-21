import { DataSource } from 'typeorm';

/**
 * Clean up all test data from the database
 * Order matters due to foreign key constraints
 */
export async function cleanupAllTestData(dataSource: DataSource): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    // Disable foreign key checks temporarily
    await queryRunner.query('SET CONSTRAINTS ALL DEFERRED');

    // Delete in reverse order of dependencies
    await queryRunner.query('DELETE FROM audit_logs');
    await queryRunner.query('DELETE FROM schedules');
    await queryRunner.query('DELETE FROM classrooms');
    await queryRunner.query('DELETE FROM attendance');
    await queryRunner.query('DELETE FROM grades');
    await queryRunner.query('DELETE FROM enrollments');
    await queryRunner.query('DELETE FROM course_teachers');
    await queryRunner.query('DELETE FROM course_prerequisites');
    await queryRunner.query('DELETE FROM courses');
    await queryRunner.query('DELETE FROM teacher_profiles');
    await queryRunner.query('DELETE FROM students');
    await queryRunner.query('DELETE FROM departments');
    await queryRunner.query('DELETE FROM faculties');
    await queryRunner.query('DELETE FROM academic_terms');
    await queryRunner.query('DELETE FROM users');

    // Re-enable foreign key checks
    await queryRunner.query('SET CONSTRAINTS ALL IMMEDIATE');
  } finally {
    await queryRunner.release();
  }
}

/**
 * Clean up test data by prefix pattern
 */
export async function cleanupTestDataByPrefix(
  dataSource: DataSource,
  prefix: string,
): Promise<void> {
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();

  try {
    await queryRunner.query('SET CONSTRAINTS ALL DEFERRED');

    // Delete audit logs for test users
    await queryRunner.query(`
      DELETE FROM audit_logs 
      WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)
    `, [`${prefix}_%@test.com`]);

    // Delete schedules for test courses
    await queryRunner.query(`
      DELETE FROM schedules 
      WHERE course_id IN (SELECT id FROM courses WHERE course_code LIKE $1)
    `, [`${prefix.toUpperCase().slice(0, 2)}%`]);

    // Delete attendance for test students
    await queryRunner.query(`
      DELETE FROM attendance 
      WHERE student_id IN (SELECT id FROM students WHERE address LIKE $1)
    `, [`${prefix}%`]);

    // Delete grades for test students
    await queryRunner.query(`
      DELETE FROM grades 
      WHERE student_id IN (SELECT id FROM students WHERE address LIKE $1)
    `, [`${prefix}%`]);

    // Delete enrollments for test students
    await queryRunner.query(`
      DELETE FROM enrollments 
      WHERE student_id IN (SELECT id FROM students WHERE address LIKE $1)
    `, [`${prefix}%`]);

    // Delete course_teachers for test courses
    await queryRunner.query(`
      DELETE FROM course_teachers 
      WHERE course_id IN (SELECT id FROM courses WHERE course_code LIKE $1)
    `, [`${prefix.toUpperCase().slice(0, 2)}%`]);

    // Delete test courses
    await queryRunner.query(`
      DELETE FROM courses WHERE course_code LIKE $1
    `, [`${prefix.toUpperCase().slice(0, 2)}%`]);

    // Delete teacher profiles for test users
    await queryRunner.query(`
      DELETE FROM teacher_profiles 
      WHERE user_id IN (SELECT id FROM users WHERE email LIKE $1)
    `, [`${prefix}_%@test.com`]);

    // Delete test students
    await queryRunner.query(`
      DELETE FROM students WHERE address LIKE $1
    `, [`${prefix}%`]);

    // Delete test classrooms
    await queryRunner.query(`
      DELETE FROM classrooms WHERE room_number LIKE $1
    `, [`${prefix.toUpperCase().slice(0, 1)}%`]);

    // Delete test departments
    await queryRunner.query(`
      DELETE FROM departments WHERE code LIKE $1
    `, [`${prefix.toUpperCase().slice(0, 2)}D%`]);

    // Delete test faculties
    await queryRunner.query(`
      DELETE FROM faculties WHERE code LIKE $1
    `, [`${prefix.toUpperCase().slice(0, 2)}%`]);

    // Delete test academic terms
    await queryRunner.query(`
      DELETE FROM academic_terms WHERE name LIKE $1
    `, [`${prefix}%`]);

    // Delete test users
    await queryRunner.query(`
      DELETE FROM users WHERE email LIKE $1
    `, [`${prefix}_%@test.com`]);

    await queryRunner.query('SET CONSTRAINTS ALL IMMEDIATE');
  } finally {
    await queryRunner.release();
  }
}

/**
 * Reset auto-increment sequences (useful after cleanup)
 */
export async function resetSequences(dataSource: DataSource): Promise<void> {
  const tables = [
    'users', 'students', 'teacher_profiles', 'courses', 'enrollments',
    'grades', 'attendance', 'faculties', 'departments', 'academic_terms',
    'classrooms', 'schedules', 'audit_logs',
  ];

  for (const table of tables) {
    try {
      await dataSource.query(`
        SELECT setval(pg_get_serial_sequence('${table}', 'id'), 
          COALESCE((SELECT MAX(id) FROM ${table}), 1), 
          COALESCE((SELECT MAX(id) FROM ${table}) IS NOT NULL, false)
        )
      `);
    } catch {
      // Ignore errors for tables that might not exist
    }
  }
}
