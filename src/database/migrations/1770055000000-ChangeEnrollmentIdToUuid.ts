import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeEnrollmentIdToUuid1770055000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Get the actual primary key constraint name for enrollments table
    const pkResult = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'enrollments' 
      AND constraint_type = 'PRIMARY KEY'
    `);
    const pkConstraintName = pkResult[0]?.constraint_name || 'enrollments_pkey';

    // Get all foreign key constraints that reference enrollments table
    const fkResults = await queryRunner.query(`
      SELECT 
        con.conname as constraint_name,
        rel.relname as table_name
      FROM pg_constraint con
      INNER JOIN pg_class rel ON rel.oid = con.conrelid
      INNER JOIN pg_class ref ON ref.oid = con.confrelid
      WHERE ref.relname = 'enrollments'
      AND con.contype = 'f'
    `);

    // Step 1: Drop all foreign key constraints that reference enrollments
    for (const fk of fkResults) {
      await queryRunner.query(
        `ALTER TABLE "${fk.table_name}" DROP CONSTRAINT IF EXISTS "${fk.constraint_name}"`,
      );
    }

    // Step 2: Add temporary UUID column
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD COLUMN "id_uuid" UUID DEFAULT uuid_generate_v4()`,
    );

    // Step 3: Update the UUID column with new values
    await queryRunner.query(
      `UPDATE "enrollments" SET "id_uuid" = uuid_generate_v4()`,
    );

    // Step 4: Drop the old primary key constraint
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "${pkConstraintName}"`,
    );

    // Step 5: Drop old integer column
    await queryRunner.query(`ALTER TABLE "enrollments" DROP COLUMN "id"`);

    // Step 6: Rename UUID column to original name
    await queryRunner.query(
      `ALTER TABLE "enrollments" RENAME COLUMN "id_uuid" TO "id"`,
    );

    // Step 7: Add new primary key constraint
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "PK_enrollments" PRIMARY KEY ("id")`,
    );

    // Step 8: Set NOT NULL constraint
    await queryRunner.query(
      `ALTER TABLE "enrollments" ALTER COLUMN "id" SET NOT NULL`,
    );

    // Step 9: Recreate unique constraint if needed
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_enrollments_student_course" 
      ON "enrollments"("student_id", "course_id")
    `);

    // Note: No foreign keys to recreate as no other tables reference enrollments
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add temporary integer column
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD COLUMN "id_int" SERIAL`,
    );

    // Step 2: Update integer column (Note: This will lose the original IDs)
    await queryRunner.query(`
      WITH numbered_enrollments AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY "created_at") as row_num
        FROM enrollments
      )
      UPDATE enrollments e
      SET id_int = ne.row_num
      FROM numbered_enrollments ne
      WHERE e.id = ne.id
    `);

    // Step 3: Drop primary key constraint
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "PK_enrollments"`,
    );

    // Step 4: Drop UUID column
    await queryRunner.query(`ALTER TABLE "enrollments" DROP COLUMN "id"`);

    // Step 5: Rename integer column to original name
    await queryRunner.query(
      `ALTER TABLE "enrollments" RENAME COLUMN "id_int" TO "id"`,
    );

    // Step 6: Add primary key constraint
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")`,
    );

    // Step 7: Recreate unique constraint
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_enrollments_student_course" 
      ON "enrollments"("student_id", "course_id")
    `);
  }
}
