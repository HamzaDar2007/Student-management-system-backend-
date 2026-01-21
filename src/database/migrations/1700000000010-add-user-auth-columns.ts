import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserAuthColumns1700000000010 implements MigrationInterface {
  name = 'AddUserAuthColumns1700000000010';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add authentication-related columns to users table
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS refresh_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS email_verification_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255),
      ADD COLUMN IF NOT EXISTS password_reset_expires TIMESTAMPTZ;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN IF EXISTS refresh_token,
      DROP COLUMN IF EXISTS email_verified,
      DROP COLUMN IF EXISTS email_verification_token,
      DROP COLUMN IF EXISTS password_reset_token,
      DROP COLUMN IF EXISTS password_reset_expires;
    `);
  }
}
