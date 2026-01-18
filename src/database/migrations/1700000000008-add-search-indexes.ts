import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSearchIndexes1700000000008 implements MigrationInterface {
  name = 'AddSearchIndexes1700000000008';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Useful for LIKE / ILIKE searches on email/username
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);`,
    );

    // Student official id lookups
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_students_student_id;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_username;`);
    await queryRunner.query(`DROP INDEX IF EXISTS idx_users_email;`);
  }
}
