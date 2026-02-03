import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeScheduleIdToUuid1770059000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Enable UUID extension if not already enabled
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Check for any foreign keys that reference schedules.id
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
        AND ccu.table_name = 'schedules'
        AND ccu.column_name = 'id'
    `);

    // Drop any foreign key constraints that reference schedules.id
    for (const fk of fkCheck) {
      await queryRunner.query(
        `ALTER TABLE "${fk.table_name}" DROP CONSTRAINT "${fk.constraint_name}"`,
      );
    }

    // Add a temporary UUID column
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD COLUMN "id_uuid" UUID DEFAULT uuid_generate_v4()`,
    );

    // Populate the UUID column with new UUIDs
    await queryRunner.query(
      `UPDATE "schedules" SET "id_uuid" = uuid_generate_v4()`,
    );

    // Drop the primary key constraint
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP CONSTRAINT "schedules_pkey"`,
    );

    // Drop the old id column
    await queryRunner.query(`ALTER TABLE "schedules" DROP COLUMN "id"`);

    // Rename the UUID column to id
    await queryRunner.query(
      `ALTER TABLE "schedules" RENAME COLUMN "id_uuid" TO "id"`,
    );

    // Add the new primary key constraint
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "PK_schedules" PRIMARY KEY ("id")`,
    );

    // Set the column to NOT NULL and add default
    await queryRunner.query(
      `ALTER TABLE "schedules" ALTER COLUMN "id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );

    // Recreate any foreign keys that were dropped
    for (const fk of fkCheck) {
      await queryRunner.query(`
        ALTER TABLE "${fk.table_name}"
        ADD CONSTRAINT "${fk.constraint_name}"
        FOREIGN KEY ("${fk.column_name}")
        REFERENCES "schedules" ("id")
        ON DELETE CASCADE
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Check for any foreign keys that reference schedules.id
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
        AND ccu.table_name = 'schedules'
        AND ccu.column_name = 'id'
    `);

    // Drop any foreign key constraints
    for (const fk of fkCheck) {
      await queryRunner.query(
        `ALTER TABLE "${fk.table_name}" DROP CONSTRAINT "${fk.constraint_name}"`,
      );
    }

    // Add a temporary integer id column
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD COLUMN "id_int" SERIAL`,
    );

    // Drop the primary key constraint
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP CONSTRAINT "PK_schedules"`,
    );

    // Drop the UUID id column
    await queryRunner.query(`ALTER TABLE "schedules" DROP COLUMN "id"`);

    // Rename the integer column to id
    await queryRunner.query(
      `ALTER TABLE "schedules" RENAME COLUMN "id_int" TO "id"`,
    );

    // Add the primary key constraint
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")`,
    );

    // Recreate any foreign keys
    for (const fk of fkCheck) {
      await queryRunner.query(`
        ALTER TABLE "${fk.table_name}"
        ADD CONSTRAINT "${fk.constraint_name}"
        FOREIGN KEY ("${fk.column_name}")
        REFERENCES "schedules" ("id")
        ON DELETE CASCADE
      `);
    }
  }
}
