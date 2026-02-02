import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeUserIdToUuid1769950212953 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Step 1: Drop foreign key constraints in related tables
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT IF EXISTS "FK_c14488f46704b1c5aacfb12d232"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" DROP CONSTRAINT IF EXISTS "FK_c7ae80ef91a8460f3c17d13db0a"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" DROP CONSTRAINT IF EXISTS "FK_d7e7b24f01c6f6e6a0d5b8f3e3f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "FK_f6e8e0f3e3f3e3f3e3f3e3f3e3f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_teachers" DROP CONSTRAINT IF EXISTS "FK_e4e7b24f01c6f6e6a0d5b8f3e3f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "FK_audit_logs_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_profiles" DROP CONSTRAINT IF EXISTS "FK_teacher_profiles_user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "faculties" DROP CONSTRAINT IF EXISTS "FK_53c37afba02c0b401dbb540db6e"`,
    );

    // Step 2: Create a temporary UUID column in users table
    await queryRunner.query(
      `ALTER TABLE "users" ADD COLUMN "id_uuid" uuid DEFAULT uuid_generate_v4()`,
    );

    // Step 3: Populate the UUID column with new UUIDs for existing rows
    await queryRunner.query(
      `UPDATE "users" SET "id_uuid" = uuid_generate_v4()`,
    );

    // Step 4: Add temporary UUID columns in related tables
    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN "user_id_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD COLUMN "created_by_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD COLUMN "graded_by_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD COLUMN "recorded_by_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_teachers" ADD COLUMN "teacher_id_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" ADD COLUMN "user_id_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_profiles" ADD COLUMN "user_id_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "faculties" ADD COLUMN "deanId_uuid" uuid`,
    );

    // Step 5: Migrate data from integer to UUID by matching the old integer IDs
    // Note: This creates a mapping - in production you might want to preserve relationships differently
    await queryRunner.query(`
            UPDATE "students" s
            SET "user_id_uuid" = u."id_uuid"
            FROM "users" u
            WHERE s."user_id" = u."id"
        `);

    await queryRunner.query(`
            UPDATE "courses" c
            SET "created_by_uuid" = u."id_uuid"
            FROM "users" u
            WHERE c."created_by" = u."id"
        `);

    await queryRunner.query(`
            UPDATE "grades" g
            SET "graded_by_uuid" = u."id_uuid"
            FROM "users" u
            WHERE g."graded_by" = u."id"
        `);

    await queryRunner.query(`
            UPDATE "attendance" a
            SET "recorded_by_uuid" = u."id_uuid"
            FROM "users" u
            WHERE a."recorded_by" = u."id"
        `);

    await queryRunner.query(`
            UPDATE "course_teachers" ct
            SET "teacher_id_uuid" = u."id_uuid"
            FROM "users" u
            WHERE ct."teacher_id" = u."id"
        `);

    await queryRunner.query(`
            UPDATE "audit_logs" al
            SET "user_id_uuid" = u."id_uuid"
            FROM "users" u
            WHERE al."user_id" = u."id"
        `);

    await queryRunner.query(`
            UPDATE "teacher_profiles" tp
            SET "user_id_uuid" = u."id_uuid"
            FROM "users" u
            WHERE tp."user_id" = u."id"
        `);

    await queryRunner.query(`
            UPDATE "faculties" f
            SET "deanId_uuid" = u."id_uuid"
            FROM "users" u
            WHERE f."deanId" = u."id"
        `);

    // Step 6: Drop old integer columns in related tables
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "user_id"`);
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "created_by"`);
    await queryRunner.query(`ALTER TABLE "grades" DROP COLUMN "graded_by"`);
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP COLUMN "recorded_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_teachers" DROP COLUMN "teacher_id"`,
    );
    await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN "user_id"`);
    await queryRunner.query(
      `ALTER TABLE "teacher_profiles" DROP COLUMN "user_id"`,
    );
    await queryRunner.query(`ALTER TABLE "faculties" DROP COLUMN "deanId"`);

    // Step 7: Rename UUID columns to original names
    await queryRunner.query(
      `ALTER TABLE "students" RENAME COLUMN "user_id_uuid" TO "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" RENAME COLUMN "created_by_uuid" TO "created_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" RENAME COLUMN "graded_by_uuid" TO "graded_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" RENAME COLUMN "recorded_by_uuid" TO "recorded_by"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_teachers" RENAME COLUMN "teacher_id_uuid" TO "teacher_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "audit_logs" RENAME COLUMN "user_id_uuid" TO "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "teacher_profiles" RENAME COLUMN "user_id_uuid" TO "user_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "faculties" RENAME COLUMN "deanId_uuid" TO "deanId"`,
    );

    // Step 8: Drop the old integer ID column from users table
    // First, get the actual primary key constraint name
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const pkResult = await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'users' 
            AND constraint_type = 'PRIMARY KEY'
        `);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (pkResult && pkResult.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const pkName = pkResult[0].constraint_name;
      await queryRunner.query(
        `ALTER TABLE "users" DROP CONSTRAINT "${pkName}"`,
      );
    }

    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "id"`);

    // Step 9: Rename the UUID column to 'id' and make it the primary key
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "id_uuid" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ADD CONSTRAINT "PK_users" PRIMARY KEY ("id")`,
    );

    // Step 10: Re-create foreign key constraints
    await queryRunner.query(`
            ALTER TABLE "students"
            ADD CONSTRAINT "FK_c14488f46704b1c5aacfb12d232"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
        `);

    await queryRunner.query(`
            ALTER TABLE "courses"
            ADD CONSTRAINT "FK_c7ae80ef91a8460f3c17d13db0a"
            FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL
        `);

    await queryRunner.query(`
            ALTER TABLE "grades"
            ADD CONSTRAINT "FK_d7e7b24f01c6f6e6a0d5b8f3e3f"
            FOREIGN KEY ("graded_by") REFERENCES "users"("id") ON DELETE SET NULL
        `);

    await queryRunner.query(`
            ALTER TABLE "attendance"
            ADD CONSTRAINT "FK_f6e8e0f3e3f3e3f3e3f3e3f3e3f"
            FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE SET NULL
        `);

    await queryRunner.query(`
            ALTER TABLE "course_teachers"
            ADD CONSTRAINT "FK_e4e7b24f01c6f6e6a0d5b8f3e3f"
            FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "audit_logs"
            ADD CONSTRAINT "FK_audit_logs_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL
        `);

    await queryRunner.query(`
            ALTER TABLE "teacher_profiles"
            ADD CONSTRAINT "FK_teacher_profiles_user_id"
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

    await queryRunner.query(`
            ALTER TABLE "faculties"
            ADD CONSTRAINT "FK_53c37afba02c0b401dbb540db6e"
            FOREIGN KEY ("deanId") REFERENCES "users"("id") ON DELETE SET NULL
        `);

    // Step 11: Recreate unique constraint on students.user_id
    await queryRunner.query(
      `CREATE UNIQUE INDEX "REL_c14488f46704b1c5aacfb12d23" ON "students" ("user_id")`,
    );
  }

  public down(_queryRunner: QueryRunner): Promise<void> {
    // This migration is not easily reversible as we lose the integer IDs
    // You would need to create a new integer column and regenerate sequential IDs
    throw new Error(
      'This migration cannot be automatically reverted. Manual intervention required.',
    );
  }
}
