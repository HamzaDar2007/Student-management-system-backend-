import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeGradeIdToUuid1770056000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Get the actual primary key constraint name for grades table
    const pkResult = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'grades' 
      AND constraint_type = 'PRIMARY KEY'
    `);
    const pkConstraintName = pkResult[0]?.constraint_name || 'grades_pkey';

    // Get all foreign key constraints that reference grades table
    const fkResults = await queryRunner.query(`
      SELECT 
        con.conname as constraint_name,
        rel.relname as table_name
      FROM pg_constraint con
      INNER JOIN pg_class rel ON rel.oid = con.conrelid
      INNER JOIN pg_class ref ON ref.oid = con.confrelid
      WHERE ref.relname = 'grades'
      AND con.contype = 'f'
    `);

    // Step 1: Drop all foreign key constraints that reference grades
    for (const fk of fkResults) {
      await queryRunner.query(
        `ALTER TABLE "${fk.table_name}" DROP CONSTRAINT IF EXISTS "${fk.constraint_name}"`,
      );
    }

    // Step 2: Add temporary UUID column
    await queryRunner.query(
      `ALTER TABLE "grades" ADD COLUMN "id_uuid" UUID DEFAULT uuid_generate_v4()`,
    );

    // Step 3: Update the UUID column with new values
    await queryRunner.query(
      `UPDATE "grades" SET "id_uuid" = uuid_generate_v4()`,
    );

    // Step 4: Drop the old primary key constraint
    await queryRunner.query(
      `ALTER TABLE "grades" DROP CONSTRAINT "${pkConstraintName}"`,
    );

    // Step 5: Drop old integer column
    await queryRunner.query(`ALTER TABLE "grades" DROP COLUMN "id"`);

    // Step 6: Rename UUID column to original name
    await queryRunner.query(
      `ALTER TABLE "grades" RENAME COLUMN "id_uuid" TO "id"`,
    );

    // Step 7: Add new primary key constraint
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "PK_grades" PRIMARY KEY ("id")`,
    );

    // Step 8: Set NOT NULL constraint
    await queryRunner.query(
      `ALTER TABLE "grades" ALTER COLUMN "id" SET NOT NULL`,
    );

    // Note: No foreign keys to recreate as no other tables reference grades
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Add temporary integer column
    await queryRunner.query(`ALTER TABLE "grades" ADD COLUMN "id_int" SERIAL`);

    // Step 2: Update integer column (Note: This will lose the original IDs)
    await queryRunner.query(`
      WITH numbered_grades AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY "graded_at") as row_num
        FROM grades
      )
      UPDATE grades g
      SET id_int = ng.row_num
      FROM numbered_grades ng
      WHERE g.id = ng.id
    `);

    // Step 3: Drop primary key constraint
    await queryRunner.query(`ALTER TABLE "grades" DROP CONSTRAINT "PK_grades"`);

    // Step 4: Drop UUID column
    await queryRunner.query(`ALTER TABLE "grades" DROP COLUMN "id"`);

    // Step 5: Rename integer column to original name
    await queryRunner.query(
      `ALTER TABLE "grades" RENAME COLUMN "id_int" TO "id"`,
    );

    // Step 6: Add primary key constraint
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "grades_pkey" PRIMARY KEY ("id")`,
    );
  }
}
