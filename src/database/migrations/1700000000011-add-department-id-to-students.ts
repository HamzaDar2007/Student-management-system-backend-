import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDepartmentIdToStudents1700000000011 implements MigrationInterface {
  name = 'AddDepartmentIdToStudents1700000000011';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add department_id column to students table (without FK since departments table may not exist yet)
    await queryRunner.query(`
      ALTER TABLE students
      ADD COLUMN IF NOT EXISTS department_id INTEGER;
    `);

    // Create index on department_id
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_students_department_id ON students(department_id);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_students_department_id;`);
    await queryRunner.query(`ALTER TABLE students DROP COLUMN IF EXISTS department_id;`);
  }
}
