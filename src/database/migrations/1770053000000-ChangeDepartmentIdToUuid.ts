import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeDepartmentIdToUuid1770053000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable uuid-ossp extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Get the actual primary key constraint name for departments table
    const pkResult = await queryRunner.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'departments' 
      AND constraint_type = 'PRIMARY KEY'
    `);
    const pkConstraintName = pkResult[0]?.constraint_name || 'departments_pkey';

    // Get all foreign key constraints that reference departments table
    const fkResults = await queryRunner.query(`
      SELECT 
        con.conname as constraint_name,
        rel.relname as table_name
      FROM pg_constraint con
      INNER JOIN pg_class rel ON rel.oid = con.conrelid
      INNER JOIN pg_class ref ON ref.oid = con.confrelid
      WHERE ref.relname = 'departments'
      AND con.contype = 'f'
    `);

    // Step 1: Drop all foreign key constraints that reference departments
    for (const fk of fkResults) {
      await queryRunner.query(
        `ALTER TABLE "${fk.table_name}" DROP CONSTRAINT IF EXISTS "${fk.constraint_name}"`,
      );
    }

    // Step 2: Add temporary UUID columns
    await queryRunner.query(
      `ALTER TABLE "departments" ADD COLUMN "id_uuid" UUID DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN "department_id_uuid" UUID`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD COLUMN "department_id_uuid" UUID`,
    );

    // Step 3: Update the UUID columns with converted values
    await queryRunner.query(
      `UPDATE "departments" SET "id_uuid" = uuid_generate_v4()`,
    );
    await queryRunner.query(`
      UPDATE "students" s
      SET "department_id_uuid" = (
        SELECT d."id_uuid"
        FROM "departments" d
        WHERE d."id" = s."department_id"
      )
      WHERE s."department_id" IS NOT NULL
    `);
    await queryRunner.query(`
      UPDATE "courses" c
      SET "department_id_uuid" = (
        SELECT d."id_uuid"
        FROM "departments" d
        WHERE d."id" = c."department_id"
      )
      WHERE c."department_id" IS NOT NULL
    `);

    // Step 4: Drop the old primary key constraint
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT "${pkConstraintName}"`,
    );

    // Step 5: Drop old integer columns
    await queryRunner.query(`ALTER TABLE "departments" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "department_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" DROP COLUMN "department_id"`,
    );

    // Step 6: Rename UUID columns to original names
    await queryRunner.query(
      `ALTER TABLE "departments" RENAME COLUMN "id_uuid" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" RENAME COLUMN "department_id_uuid" TO "department_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" RENAME COLUMN "department_id_uuid" TO "department_id"`,
    );

    // Step 7: Add new primary key constraint
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "PK_departments" PRIMARY KEY ("id")`,
    );

    // Step 8: Set NOT NULL constraint
    await queryRunner.query(
      `ALTER TABLE "departments" ALTER COLUMN "id" SET NOT NULL`,
    );

    // Step 9: Recreate foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "FK_students_departmentId"
      FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "courses"
      ADD CONSTRAINT "FK_courses_departmentId"
      FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL
    `);

    // Step 10: Recreate indexes
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_students_department_id" ON "students"("department_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_courses_department_id" ON "courses"("department_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Get all foreign key constraints that reference departments table
    const fkResults = await queryRunner.query(`
      SELECT 
        con.conname as constraint_name,
        rel.relname as table_name
      FROM pg_constraint con
      INNER JOIN pg_class rel ON rel.oid = con.conrelid
      INNER JOIN pg_class ref ON ref.oid = con.confrelid
      WHERE ref.relname = 'departments'
      AND con.contype = 'f'
    `);

    // Step 1: Drop all foreign key constraints
    for (const fk of fkResults) {
      await queryRunner.query(
        `ALTER TABLE "${fk.table_name}" DROP CONSTRAINT IF EXISTS "${fk.constraint_name}"`,
      );
    }

    // Step 2: Drop indexes
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_students_department_id"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_courses_department_id"`);

    // Step 3: Add temporary integer columns
    await queryRunner.query(
      `ALTER TABLE "departments" ADD COLUMN "id_int" SERIAL`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN "department_id_int" INT`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" ADD COLUMN "department_id_int" INT`,
    );

    // Step 4: Update integer columns (Note: This will lose the original IDs)
    await queryRunner.query(`
      WITH numbered_departments AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY "createdAt") as row_num
        FROM departments
      )
      UPDATE departments d
      SET id_int = nd.row_num
      FROM numbered_departments nd
      WHERE d.id = nd.id
    `);

    await queryRunner.query(`
      UPDATE "students" s
      SET "department_id_int" = (
        SELECT d."id_int"
        FROM "departments" d
        WHERE d."id" = s."department_id"
      )
      WHERE s."department_id" IS NOT NULL
    `);

    await queryRunner.query(`
      UPDATE "courses" c
      SET "department_id_int" = (
        SELECT d."id_int"
        FROM "departments" d
        WHERE d."id" = c."department_id"
      )
      WHERE c."department_id" IS NOT NULL
    `);

    // Step 5: Drop primary key constraint
    await queryRunner.query(
      `ALTER TABLE "departments" DROP CONSTRAINT "PK_departments"`,
    );

    // Step 6: Drop UUID columns
    await queryRunner.query(`ALTER TABLE "departments" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "students" DROP COLUMN "department_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" DROP COLUMN "department_id"`,
    );

    // Step 7: Rename integer columns to original names
    await queryRunner.query(
      `ALTER TABLE "departments" RENAME COLUMN "id_int" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" RENAME COLUMN "department_id_int" TO "department_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "courses" RENAME COLUMN "department_id_int" TO "department_id"`,
    );

    // Step 8: Add primary key constraint
    await queryRunner.query(
      `ALTER TABLE "departments" ADD CONSTRAINT "departments_pkey" PRIMARY KEY ("id")`,
    );

    // Step 9: Recreate foreign key constraints
    await queryRunner.query(`
      ALTER TABLE "students"
      ADD CONSTRAINT "FK_students_departmentId"
      FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "courses"
      ADD CONSTRAINT "FK_courses_departmentId"
      FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE SET NULL
    `);

    // Step 10: Recreate indexes
    await queryRunner.query(
      `CREATE INDEX "idx_students_department_id" ON "students"("department_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_courses_department_id" ON "courses"("department_id")`,
    );
  }
}
