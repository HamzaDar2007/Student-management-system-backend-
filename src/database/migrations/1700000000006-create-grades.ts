import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateGrades1700000000006 implements MigrationInterface {
  name = 'CreateGrades1700000000006';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS grades (
        id               SERIAL PRIMARY KEY,
        student_id       INTEGER NOT NULL,
        course_id        INTEGER NOT NULL,
        assessment_type  VARCHAR(50) NOT NULL,
        assessment_name  VARCHAR(100) NOT NULL,
        max_score        DECIMAL(5,2) NOT NULL,
        score_obtained   DECIMAL(5,2) NOT NULL,
        weightage        DECIMAL(5,2) NOT NULL DEFAULT 100.00,
        graded_by        INTEGER,
        graded_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        CONSTRAINT fk_grades_student
          FOREIGN KEY (student_id) REFERENCES students(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_grades_course
          FOREIGN KEY (course_id) REFERENCES courses(id)
          ON DELETE CASCADE
          ON UPDATE CASCADE,
        CONSTRAINT fk_grades_graded_by
          FOREIGN KEY (graded_by) REFERENCES users(id)
          ON DELETE SET NULL
          ON UPDATE CASCADE,
        CONSTRAINT chk_grades_scores
          CHECK (max_score > 0 AND score_obtained >= 0 AND score_obtained <= max_score),
        CONSTRAINT chk_grades_weightage
          CHECK (weightage > 0 AND weightage <= 100)
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_grades_student_course ON grades(student_id, course_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_grades_course ON grades(course_id);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_grades_graded_at ON grades(graded_at);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS grades;`);
  }
}
