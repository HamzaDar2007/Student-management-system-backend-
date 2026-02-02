import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeStudentIdToUuid1770048256810 implements MigrationInterface {
  name = 'ChangeStudentIdToUuid1770048256810';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Step 1: Drop foreign key constraints that reference students
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "FK_307813fe255896d6ebf3e6cd55c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" DROP CONSTRAINT IF EXISTS "FK_9acca493883cee3b9e8f9e01cd1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "FK_6200532f3ef99f639a27bdcae7f"`,
    );

    // Step 2: Add temporary UUID columns
    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN "id_uuid" uuid DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD COLUMN "student_id_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD COLUMN "student_id_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD COLUMN "student_id_uuid" uuid`,
    );

    // Step 3: Copy data to UUID columns
    await queryRunner.query(
      `UPDATE "students" SET "id_uuid" = uuid_generate_v4()`,
    );
    await queryRunner.query(`
            UPDATE "enrollments" e
            SET "student_id_uuid" = s."id_uuid"
            FROM "students" s
            WHERE e."student_id" = s."id"
        `);
    await queryRunner.query(`
            UPDATE "grades" g
            SET "student_id_uuid" = s."id_uuid"
            FROM "students" s
            WHERE g."student_id" = s."id"
        `);
    await queryRunner.query(`
            UPDATE "attendance" a
            SET "student_id_uuid" = s."id_uuid"
            FROM "students" s
            WHERE a."student_id" = s."id"
        `);

    // Step 4: Drop old primary key and columns
    // Get the actual primary key constraint name
    const pkResult: Array<{ constraint_name: string }> =
      await queryRunner.query(`
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name = 'students' 
            AND constraint_type = 'PRIMARY KEY'
        `);
    const pkName = pkResult[0]?.constraint_name || 'students_pkey';

    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "${pkName}"`,
    );
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP COLUMN "student_id"`,
    );
    await queryRunner.query(`ALTER TABLE "grades" DROP COLUMN "student_id"`);
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP COLUMN "student_id"`,
    );

    // Step 5: Rename UUID columns to original names
    await queryRunner.query(
      `ALTER TABLE "students" RENAME COLUMN "id_uuid" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" RENAME COLUMN "student_id_uuid" TO "student_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" RENAME COLUMN "student_id_uuid" TO "student_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" RENAME COLUMN "student_id_uuid" TO "student_id"`,
    );

    // Step 6: Add primary key constraint
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "PK_7d7f07271ad4ce999880713f05e" PRIMARY KEY ("id")`,
    );

    // Step 7: Set NOT NULL constraints
    await queryRunner.query(
      `ALTER TABLE "students" ALTER COLUMN "id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ALTER COLUMN "student_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ALTER COLUMN "student_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ALTER COLUMN "student_id" SET NOT NULL`,
    );

    // Step 8: Re-add foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_307813fe255896d6ebf3e6cd55c" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_9acca493883cee3b9e8f9e01cd1" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_6200532f3ef99f639a27bdcae7f" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Step 1: Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "FK_6200532f3ef99f639a27bdcae7f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" DROP CONSTRAINT IF EXISTS "FK_9acca493883cee3b9e8f9e01cd1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "FK_307813fe255896d6ebf3e6cd55c"`,
    );

    // Step 2: Drop primary key
    await queryRunner.query(
      `ALTER TABLE "students" DROP CONSTRAINT "PK_7d7f07271ad4ce999880713f05e"`,
    );

    // Step 3: Add temporary integer columns
    await queryRunner.query(
      `ALTER TABLE "students" ADD COLUMN "id_int" SERIAL`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD COLUMN "student_id_int" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD COLUMN "student_id_int" integer`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD COLUMN "student_id_int" integer`,
    );

    // Note: Data migration back to integer IDs would lose UUID mappings
    // This is for rollback purposes only and may require manual intervention

    // Step 4: Drop UUID columns
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP COLUMN "student_id"`,
    );
    await queryRunner.query(`ALTER TABLE "grades" DROP COLUMN "student_id"`);
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP COLUMN "student_id"`,
    );
    await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "id"`);

    // Step 5: Rename integer columns
    await queryRunner.query(
      `ALTER TABLE "attendance" RENAME COLUMN "student_id_int" TO "student_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" RENAME COLUMN "student_id_int" TO "student_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" RENAME COLUMN "student_id_int" TO "student_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "students" RENAME COLUMN "id_int" TO "id"`,
    );

    // Step 6: Add back primary key
    await queryRunner.query(
      `ALTER TABLE "students" ADD CONSTRAINT "students_pkey" PRIMARY KEY ("id")`,
    );

    // Step 7: Add foreign keys back
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_307813fe255896d6ebf3e6cd55c" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_9acca493883cee3b9e8f9e01cd1" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_6200532f3ef99f639a27bdcae7f" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
  }
}
