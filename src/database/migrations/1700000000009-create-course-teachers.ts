import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCourseTeachers1700000000009 implements MigrationInterface {
  name = 'CreateCourseTeachers1700000000009';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS course_teachers (
        course_id  INTEGER NOT NULL,
        teacher_id INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        PRIMARY KEY (course_id, teacher_id),
        CONSTRAINT fk_course_teachers_course
          FOREIGN KEY (course_id) REFERENCES courses(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_course_teachers_teacher
          FOREIGN KEY (teacher_id) REFERENCES users(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_course_teachers_course_id
      ON course_teachers(course_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_course_teachers_teacher_id
      ON course_teachers(teacher_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS course_teachers;`);
  }
}
