import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAccountLockoutFields1737500000000 implements MigrationInterface {
  name = 'AddAccountLockoutFields1737500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "failed_login_attempts" integer NOT NULL DEFAULT 0
    `);

    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "locked_until" TIMESTAMP WITH TIME ZONE
    `);

    await queryRunner.query(`
      ALTER TABLE "users" 
      ADD COLUMN "last_failed_login" TIMESTAMP WITH TIME ZONE
    `);

    // Add index for efficient lockout queries
    await queryRunner.query(`
      CREATE INDEX "idx_users_locked_until" ON "users" ("locked_until") 
      WHERE "locked_until" IS NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_users_locked_until"`);
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "last_failed_login"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "locked_until"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN IF EXISTS "failed_login_attempts"`,
    );
  }
}
