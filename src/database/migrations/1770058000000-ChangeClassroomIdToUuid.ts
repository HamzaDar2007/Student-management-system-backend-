import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeClassroomIdToUuid1770058000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Check for any foreign keys that reference classrooms.id
    const fkCheck = await queryRunner.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'classrooms'
        AND ccu.column_name = 'id'
    `);

    // Drop any foreign key constraints that reference classrooms.id
    for (const fk of fkCheck) {
      await queryRunner.query(
        `ALTER TABLE "${fk.table_name}" DROP CONSTRAINT "${fk.constraint_name}"`,
      );
    }

    // Add temporary UUID columns for both classrooms.id and schedules.classroom_id
    await queryRunner.query(
      `ALTER TABLE "classrooms" ADD COLUMN "id_uuid" UUID`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD COLUMN "classroom_id_uuid" UUID`,
    );

    // Populate the UUID columns with new UUIDs
    await queryRunner.query(
      `UPDATE "classrooms" SET "id_uuid" = uuid_generate_v4()`,
    );

    // Update schedules.classroom_id_uuid to match the new classrooms UUIDs
    await queryRunner.query(`
      UPDATE "schedules" s
      SET "classroom_id_uuid" = c."id_uuid"
      FROM "classrooms" c
      WHERE s."classroom_id" = c."id"
    `);

    // Drop the primary key constraint on classrooms
    await queryRunner.query(
      `ALTER TABLE "classrooms" DROP CONSTRAINT "classrooms_pkey"`,
    );

    // Drop the old id column
    await queryRunner.query(`ALTER TABLE "classrooms" DROP COLUMN "id"`);

    // Rename the UUID column to id
    await queryRunner.query(
      `ALTER TABLE "classrooms" RENAME COLUMN "id_uuid" TO "id"`,
    );

    // Add the new primary key constraint
    await queryRunner.query(
      `ALTER TABLE "classrooms" ADD CONSTRAINT "PK_classrooms" PRIMARY KEY ("id")`,
    );

    // Set the column to NOT NULL
    await queryRunner.query(
      `ALTER TABLE "classrooms" ALTER COLUMN "id" SET NOT NULL`,
    );

    // Now update schedules.classroom_id
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP COLUMN "classroom_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" RENAME COLUMN "classroom_id_uuid" TO "classroom_id"`,
    );

    // Recreate any foreign keys that were dropped
    for (const fk of fkCheck) {
      await queryRunner.query(`
        ALTER TABLE "${fk.table_name}"
        ADD CONSTRAINT "${fk.constraint_name}"
        FOREIGN KEY ("${fk.column_name}")
        REFERENCES "classrooms" ("id")
        ON DELETE SET NULL
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check for any foreign keys that reference classrooms.id
    const fkCheck = await queryRunner.query(`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'classrooms'
        AND ccu.column_name = 'id'
    `);

    // Drop any foreign key constraints
    for (const fk of fkCheck) {
      await queryRunner.query(
        `ALTER TABLE "${fk.table_name}" DROP CONSTRAINT "${fk.constraint_name}"`,
      );
    }

    // Add temporary integer columns
    await queryRunner.query(
      `ALTER TABLE "classrooms" ADD COLUMN "id_int" SERIAL`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD COLUMN "classroom_id_int" INT`,
    );

    // Update schedules to match the new integer IDs
    await queryRunner.query(`
      UPDATE "schedules" s
      SET "classroom_id_int" = c."id_int"
      FROM "classrooms" c
      WHERE s."classroom_id" = c."id"
    `);

    // Drop the primary key constraint
    await queryRunner.query(
      `ALTER TABLE "classrooms" DROP CONSTRAINT "PK_classrooms"`,
    );

    // Drop the UUID id column
    await queryRunner.query(`ALTER TABLE "classrooms" DROP COLUMN "id"`);

    // Rename the integer column to id
    await queryRunner.query(
      `ALTER TABLE "classrooms" RENAME COLUMN "id_int" TO "id"`,
    );

    // Add the primary key constraint
    await queryRunner.query(
      `ALTER TABLE "classrooms" ADD CONSTRAINT "classrooms_pkey" PRIMARY KEY ("id")`,
    );

    // Update schedules.classroom_id
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP COLUMN "classroom_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" RENAME COLUMN "classroom_id_int" TO "classroom_id"`,
    );

    // Recreate any foreign keys
    for (const fk of fkCheck) {
      await queryRunner.query(`
        ALTER TABLE "${fk.table_name}"
        ADD CONSTRAINT "${fk.constraint_name}"
        FOREIGN KEY ("${fk.column_name}")
        REFERENCES "classrooms" ("id")
        ON DELETE SET NULL
      `);
    }
  }
}
