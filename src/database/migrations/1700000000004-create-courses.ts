import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCourses1700000000004 implements MigrationInterface {
  name = 'CreateCourses1700000000004';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id            SERIAL PRIMARY KEY,
        course_code   VARCHAR(20)  NOT NULL UNIQUE,
        course_name   VARCHAR(100) NOT NULL,
        description   TEXT,
        credits       INTEGER NOT NULL,
        department    VARCHAR(100),
        semester      INTEGER,
        max_students  INTEGER NOT NULL DEFAULT 50,
        is_active     BOOLEAN NOT NULL DEFAULT TRUE,
        created_by    INTEGER,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_courses_created_by
          FOREIGN KEY (created_by) REFERENCES users(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,
        CONSTRAINT chk_courses_credits
          CHECK (credits >= 1 AND credits <= 6),
        CONSTRAINT chk_courses_max_students
          CHECK (max_students >= 1 AND max_students <= 200)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_courses_department ON courses(department);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_courses_semester ON courses(semester);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
    `);

    // updated_at trigger
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_courses_updated_at ON courses;
      CREATE TRIGGER trg_courses_updated_at
      BEFORE UPDATE ON courses
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS courses;`);
  }
}
