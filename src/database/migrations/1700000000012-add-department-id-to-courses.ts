import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepartmentIdToCourses1700000000012 implements MigrationInterface {
  name = 'AddDepartmentIdToCourses1700000000012';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add department_id column to courses table
    await queryRunner.query(`
      ALTER TABLE courses
      ADD COLUMN IF NOT EXISTS department_id INTEGER;
    `);

    // Create index on department_id
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_courses_department_id ON courses(department_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_courses_department_id;`);
    await queryRunner.query(
      `ALTER TABLE courses DROP COLUMN IF EXISTS department_id;`,
    );
  }
}
