import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeFacultyIdToUuid1770052000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Get the actual primary key constraint name for faculties table
    const pkResult = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'faculties' 
      AND constraint_type = 'PRIMARY KEY'
    `);
    const pkConstraintName = pkResult[0]?.constraint_name || 'faculties_pkey';

    // Get the actual foreign key constraint name for departments.facultyId
    const fkResult = await queryRunner.query(`
      SELECT con.conname as constraint_name
      FROM pg_constraint con
      INNER JOIN pg_class rel ON rel.oid = con.conrelid
      INNER JOIN pg_class ref ON ref.oid = con.confrelid
      WHERE rel.relname = 'departments'
      AND ref.relname = 'faculties'
      AND con.contype = 'f'
    `);
    const fkConstraintName =
      fkResult[0]?.constraint_name || 'FK_8eb1debd52cf31a5efa81f9b87a';

    // Step 1: Drop foreign key constraint from departments table
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "${fkConstraintName}"`,
    );

    // Step 2: Add temporary UUID columns
    await queryRunner.query(
      `ALTER TABLE "faculties" ADD COLUMN "id_uuid" UUID DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" ADD COLUMN "facultyId_uuid" UUID`,
    );

    // Step 3: Update the UUID columns with converted values
    await queryRunner.query(
      `UPDATE "faculties" SET "id_uuid" = uuid_generate_v4()`,
    );
    await queryRunner.query(`
      UPDATE "departments" d
      SET "facultyId_uuid" = (
        SELECT f."id_uuid"
        FROM "faculties" f
        WHERE f."id" = d."facultyId"
      )
      WHERE d."facultyId" IS NOT NULL
    `);

    // Step 4: Drop the old primary key constraint
    await queryRunner.query(
      `ALTER TABLE "faculties" DROP CONSTRAINT "${pkConstraintName}"`,
    );

    // Step 5: Drop old integer columns
    await queryRunner.query(`ALTER TABLE "faculties" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "departments" DROP COLUMN "facultyId"`,
    );

    // Step 6: Rename UUID columns to original names
    await queryRunner.query(
      `ALTER TABLE "faculties" RENAME COLUMN "id_uuid" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" RENAME COLUMN "facultyId_uuid" TO "facultyId"`,
    );

    // Step 7: Add new primary key constraint
    await queryRunner.query(
      `ALTER TABLE "faculties" ADD CONSTRAINT "PK_faculties" PRIMARY KEY ("id")`,
    );

    // Step 8: Set NOT NULL constraints
    await queryRunner.query(
      `ALTER TABLE "faculties" ALTER COLUMN "id" SET NOT NULL`,
    );

    // Step 9: Recreate foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "departments"
      ADD CONSTRAINT "FK_departments_facultyId"
      FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE SET NULL
    `);

    // Step 10: Recreate index
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_departments_faculty_id" ON "departments"("facultyId")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get constraint names
    const fkResult = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'departments' 
      AND constraint_type = 'FOREIGN KEY'
      AND constraint_name LIKE '%faculty%'
    `);
    const fkConstraintName =
      fkResult[0]?.constraint_name || 'FK_departments_facultyId';

    // Step 1: Drop foreign key constraint
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT IF EXISTS "${fkConstraintName}"`,
    );

    // Step 2: Drop index
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_departments_faculty_id"`,
    );

    // Step 3: Add temporary integer columns
    await queryRunner.query(
      `ALTER TABLE "faculties" ADD COLUMN "id_int" SERIAL`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" ADD COLUMN "facultyId_int" INT`,
    );

    // Step 4: Update integer columns (Note: This will lose the original IDs)
    // Create a mapping based on the order of UUIDs
    await queryRunner.query(`
      WITH numbered_faculties AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") as row_num
        FROM faculties
      )
      UPDATE faculties f
      SET id_int = nf.row_num
      FROM numbered_faculties nf
      WHERE f.id = nf.id
    `);

    await queryRunner.query(`
      UPDATE "departments" d
      SET "facultyId_int" = (
        SELECT f."id_int"
        FROM "faculties" f
        WHERE f."id" = d."facultyId"
      )
      WHERE d."facultyId" IS NOT NULL
    `);

    // Step 5: Drop primary key constraint
    await queryRunner.query(
      `ALTER TABLE "faculties" DROP CONSTRAINT "PK_faculties"`,
    );

    // Step 6: Drop UUID columns
    await queryRunner.query(`ALTER TABLE "faculties" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "departments" DROP COLUMN "facultyId"`,
    );

    // Step 7: Rename integer columns to original names
    await queryRunner.query(
      `ALTER TABLE "faculties" RENAME COLUMN "id_int" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "departments" RENAME COLUMN "facultyId_int" TO "facultyId"`,
    );

    // Step 8: Add primary key constraint
    await queryRunner.query(
      `ALTER TABLE "faculties" ADD CONSTRAINT "faculties_pkey" PRIMARY KEY ("id")`,
    );

    // Step 9: Recreate foreign key constraint
    await queryRunner.query(`
      ALTER TABLE "departments"
      ADD CONSTRAINT "FK_departments_facultyId"
      FOREIGN KEY ("facultyId") REFERENCES "faculties"("id") ON DELETE SET NULL
    `);

    // Step 10: Recreate index
    await queryRunner.query(
      `CREATE INDEX "idx_departments_faculty_id" ON "departments"("facultyId")`,
    );
  }
}
