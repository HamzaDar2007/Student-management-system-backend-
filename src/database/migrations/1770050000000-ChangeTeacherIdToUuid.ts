import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeTeacherIdToUuid1770050000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing teacher_profiles table and recreate with UUID id
    await queryRunner.query(`DROP TABLE IF EXISTS "teacher_profiles" CASCADE`);

    // Recreate teacher_profiles table with UUID id
    await queryRunner.query(`
      CREATE TABLE "teacher_profiles" (
        "id" uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
        "user_id" uuid UNIQUE NOT NULL,
        "employee_id" VARCHAR(20) UNIQUE NOT NULL,
        "rank" teacher_profiles_rank_enum DEFAULT 'lecturer',
        "specialization" VARCHAR(100),
        "office_location" VARCHAR(100),
        "office_hours" TEXT,
        "phone" VARCHAR(20),
        "bio" TEXT,
        "hire_date" DATE,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      )
    `);

    // Create indexes
    await queryRunner.query(
      `CREATE INDEX "idx_teacher_profiles_user" ON "teacher_profiles"("user_id")`,
    );

    // Add foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "teacher_profiles"
      ADD CONSTRAINT "FK_teacher_profiles_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    // Update trigger for updated_at
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_teacher_profiles_updated_at ON teacher_profiles;
      CREATE TRIGGER trg_teacher_profiles_updated_at
      BEFORE UPDATE ON "teacher_profiles"
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at()
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the table
    await queryRunner.query(`DROP TABLE IF EXISTS "teacher_profiles" CASCADE`);

    // Recreate with integer id (original structure)
    await queryRunner.query(`
      CREATE TABLE "teacher_profiles" (
        "id" SERIAL PRIMARY KEY,
        "user_id" uuid UNIQUE NOT NULL,
        "employee_id" VARCHAR(20) UNIQUE NOT NULL,
        "rank" teacher_profiles_rank_enum DEFAULT 'lecturer',
        "specialization" VARCHAR(100),
        "office_location" VARCHAR(100),
        "office_hours" TEXT,
        "phone" VARCHAR(20),
        "bio" TEXT,
        "hire_date" DATE,
        "is_active" BOOLEAN DEFAULT true,
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW(),
        "deleted_at" TIMESTAMPTZ
      )
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_teacher_profiles_user" ON "teacher_profiles"("user_id")`,
    );

    await queryRunner.query(`
      ALTER TABLE "teacher_profiles"
      ADD CONSTRAINT "FK_teacher_profiles_user_id"
      FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
    `);

    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_teacher_profiles_updated_at ON teacher_profiles;
      CREATE TRIGGER trg_teacher_profiles_updated_at
      BEFORE UPDATE ON "teacher_profiles"
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at()
    `);
  }
}
