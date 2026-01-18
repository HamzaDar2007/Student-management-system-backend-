import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitEnumsAndTriggers1700000000001 implements MigrationInterface {
  name = 'InitEnumsAndTriggers1700000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enums
    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE user_role_enum AS ENUM ('admin', 'teacher', 'student');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE gender_enum AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE enrollment_status_enum AS ENUM ('active', 'dropped', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryRunner.query(`
      DO $$ BEGIN
        CREATE TYPE attendance_status_enum AS ENUM ('present', 'absent', 'late', 'excused');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Trigger function to keep updated_at current
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION set_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop trigger function
    await queryRunner.query(`DROP FUNCTION IF EXISTS set_updated_at();`);

    // Drop enums
    await queryRunner.query(`DROP TYPE IF EXISTS attendance_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS enrollment_status_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS gender_enum;`);
    await queryRunner.query(`DROP TYPE IF EXISTS user_role_enum;`);
  }
}
