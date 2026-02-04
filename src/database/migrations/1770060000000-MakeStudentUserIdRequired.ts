import { MigrationInterface, QueryRunner } from 'typeorm';

export class MakeStudentUserIdRequired1770060000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // First, delete any students without a user_id (or you could assign them a user_id)
    await queryRunner.query(`
      DELETE FROM "students" WHERE "user_id" IS NULL
    `);

    // Make the column NOT NULL
    await queryRunner.query(`
      ALTER TABLE "students" ALTER COLUMN "user_id" SET NOT NULL
    `);

    // Update the foreign key constraint to CASCADE instead of SET NULL
    await queryRunner.query(`
      ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "FK_students_user_id"
    `);

    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "FK_students_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "FK_students_user_id"
    `);

    // Make the column nullable again
    await queryRunner.query(`
      ALTER TABLE "students" ALTER COLUMN "user_id" DROP NOT NULL
    `);

    // Recreate the foreign key constraint with SET NULL
    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "FK_students_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
    `);
  }
}
