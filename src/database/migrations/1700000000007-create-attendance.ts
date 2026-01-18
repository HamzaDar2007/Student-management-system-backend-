import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAttendance1700000000007 implements MigrationInterface {
  name = 'CreateAttendance1700000000007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id           SERIAL PRIMARY KEY,
        student_id   INTEGER NOT NULL,
        course_id    INTEGER NOT NULL,
        date         DATE NOT NULL,
        status       attendance_status_enum NOT NULL,
        notes        TEXT,
        recorded_by  INTEGER,
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_attendance_student
          FOREIGN KEY (student_id) REFERENCES students(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_attendance_course
          FOREIGN KEY (course_id) REFERENCES courses(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_attendance_recorded_by
          FOREIGN KEY (recorded_by) REFERENCES users(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,
        CONSTRAINT uq_attendance_student_course_date
          UNIQUE (student_id, course_id, date)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_attendance_course_date ON attendance(course_id, date);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS attendance;`);
  }
}
