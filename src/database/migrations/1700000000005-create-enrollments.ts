import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEnrollments1700000000005 implements MigrationInterface {
  name = 'CreateEnrollments1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS enrollments (
        id                     SERIAL PRIMARY KEY,
        student_id             INTEGER NOT NULL,
        course_id              INTEGER NOT NULL,
        enrollment_date        DATE NOT NULL DEFAULT CURRENT_DATE,
        status                 enrollment_status_enum NOT NULL DEFAULT 'active',
        grade                  VARCHAR(2),
        grade_points           DECIMAL(3,2),
        attendance_percentage  DECIMAL(5,2) NOT NULL DEFAULT 100.00,
        created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_enrollments_student
          FOREIGN KEY (student_id) REFERENCES students(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_enrollments_course
          FOREIGN KEY (course_id) REFERENCES courses(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT uq_enrollments_student_course
          UNIQUE (student_id, course_id),
        CONSTRAINT chk_enrollments_attendance_percentage
          CHECK (attendance_percentage >= 0 AND attendance_percentage <= 100),
        CONSTRAINT chk_enrollments_grade_points
          CHECK (grade_points IS NULL OR (grade_points >= 0 AND grade_points <= 4.00))
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_enrollments_enrollment_date ON enrollments(enrollment_date);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS enrollments;`);
  }
}
