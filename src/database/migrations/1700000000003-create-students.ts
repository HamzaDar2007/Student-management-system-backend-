import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateStudents1700000000003 implements MigrationInterface {
  name = 'CreateStudents1700000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS students (
        id                SERIAL PRIMARY KEY,
        user_id           INTEGER UNIQUE,
        student_id        VARCHAR(20) NOT NULL UNIQUE,
        date_of_birth     DATE,
        gender            gender_enum,
        address           TEXT,
        phone             VARCHAR(20),
        emergency_contact VARCHAR(100),
        enrollment_date   DATE NOT NULL,
        department        VARCHAR(100),
        semester          INTEGER,
        created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_students_user
          FOREIGN KEY (user_id) REFERENCES users(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_students_department ON students(department);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_students_semester ON students(semester);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_students_enrollment_date ON students(enrollment_date);
    `);

    // updated_at trigger
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_students_updated_at ON students;
      CREATE TRIGGER trg_students_updated_at
      BEFORE UPDATE ON students
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS students;`);
  }
}
