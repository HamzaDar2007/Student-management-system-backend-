import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeCourseIdToUuid1770051000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Ensure uuid-ossp extension exists
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // Drop foreign key constraints from related tables
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "FK_7958090039c8a7895bd4239ee4e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "FK_b79d0bf01779fdf9cfb6b092af3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" DROP CONSTRAINT IF EXISTS "FK_ae63cf5e8e96f961c0e5c456094"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" DROP CONSTRAINT IF EXISTS "FK_9a927cab52e881e0aa78f8a181b"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "FK_54e68b197176642a08a65cb5f64"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "FK_0ce01e85e94ccecea83365bb36f"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" DROP CONSTRAINT IF EXISTS "FK_b1e10ac4dc72412af1c3f4d736d"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_teachers" DROP CONSTRAINT IF EXISTS "FK_course_teachers_course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_teachers" DROP CONSTRAINT IF EXISTS "FK_043a14eb69bfca44f1863b2d552"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" DROP CONSTRAINT IF EXISTS "FK_course_prerequisites_course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" DROP CONSTRAINT IF EXISTS "FK_2caff7cd02b6e0bb6f87a7b7ac4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" DROP CONSTRAINT IF EXISTS "FK_course_prerequisites_prerequisite_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" DROP CONSTRAINT IF EXISTS "FK_62edaabbf461a782f824e98a602"`,
    );

    // Add temporary UUID columns
    await queryRunner.query(
      `ALTER TABLE "courses" ADD COLUMN "id_uuid" uuid DEFAULT uuid_generate_v4()`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD COLUMN "course_id_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD COLUMN "course_id_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD COLUMN "course_id_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD COLUMN "course_id_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_teachers" ADD COLUMN "course_id_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" ADD COLUMN "course_id_uuid" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" ADD COLUMN "prerequisite_id_uuid" uuid`,
    );

    // Generate UUIDs for existing courses
    await queryRunner.query(
      `UPDATE "courses" SET "id_uuid" = uuid_generate_v4()`,
    );

    // Update foreign key references with corresponding UUIDs
    await queryRunner.query(`
            UPDATE "enrollments" e
            SET "course_id_uuid" = c."id_uuid"
            FROM "courses" c
            WHERE e."course_id" = c."id"
        `);

    await queryRunner.query(`
            UPDATE "grades" g
            SET "course_id_uuid" = c."id_uuid"
            FROM "courses" c
            WHERE g."course_id" = c."id"
        `);

    await queryRunner.query(`
            UPDATE "attendance" a
            SET "course_id_uuid" = c."id_uuid"
            FROM "courses" c
            WHERE a."course_id" = c."id"
        `);

    await queryRunner.query(`
            UPDATE "schedules" s
            SET "course_id_uuid" = c."id_uuid"
            FROM "courses" c
            WHERE s."course_id" = c."id"
        `);

    await queryRunner.query(`
            UPDATE "course_teachers" ct
            SET "course_id_uuid" = c."id_uuid"
            FROM "courses" c
            WHERE ct."course_id" = c."id"
        `);

    await queryRunner.query(`
            UPDATE "course_prerequisites" cp
            SET "course_id_uuid" = c."id_uuid"
            FROM "courses" c
            WHERE cp."course_id" = c."id"
        `);

    await queryRunner.query(`
            UPDATE "course_prerequisites" cp
            SET "prerequisite_id_uuid" = c."id_uuid"
            FROM "courses" c
            WHERE cp."prerequisite_id" = c."id"
        `);

    // Drop old primary key constraint (query the actual constraint name first)
    const pkResult = await queryRunner.query(`
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'courses'
            AND constraint_type = 'PRIMARY KEY'
        `);
    if (pkResult && pkResult.length > 0) {
      await queryRunner.query(
        `ALTER TABLE "courses" DROP CONSTRAINT "${pkResult[0].constraint_name}"`,
      );
    }

    // Drop old columns
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP COLUMN "course_id"`,
    );
    await queryRunner.query(`ALTER TABLE "grades" DROP COLUMN "course_id"`);
    await queryRunner.query(`ALTER TABLE "attendance" DROP COLUMN "course_id"`);
    await queryRunner.query(`ALTER TABLE "schedules" DROP COLUMN "course_id"`);
    await queryRunner.query(
      `ALTER TABLE "course_teachers" DROP COLUMN "course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" DROP COLUMN "course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" DROP COLUMN "prerequisite_id"`,
    );

    // Rename UUID columns to original names
    await queryRunner.query(
      `ALTER TABLE "courses" RENAME COLUMN "id_uuid" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" RENAME COLUMN "course_id_uuid" TO "course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" RENAME COLUMN "course_id_uuid" TO "course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" RENAME COLUMN "course_id_uuid" TO "course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" RENAME COLUMN "course_id_uuid" TO "course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_teachers" RENAME COLUMN "course_id_uuid" TO "course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" RENAME COLUMN "course_id_uuid" TO "course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" RENAME COLUMN "prerequisite_id_uuid" TO "prerequisite_id"`,
    );

    // Add primary key constraint
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id")`,
    );

    // Set NOT NULL constraints
    await queryRunner.query(
      `ALTER TABLE "courses" ALTER COLUMN "id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ALTER COLUMN "course_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ALTER COLUMN "course_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ALTER COLUMN "course_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ALTER COLUMN "course_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_teachers" ALTER COLUMN "course_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" ALTER COLUMN "course_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" ALTER COLUMN "prerequisite_id" SET NOT NULL`,
    );

    // Recreate foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_7958090039c8a7895bd4239ee4e" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_ae63cf5e8e96f961c0e5c456094" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_54e68b197176642a08a65cb5f64" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "schedules" ADD CONSTRAINT "FK_b1e10ac4dc72412af1c3f4d736d" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_teachers" ADD CONSTRAINT "FK_course_teachers_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" ADD CONSTRAINT "FK_course_prerequisites_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" ADD CONSTRAINT "FK_course_prerequisites_prerequisite_id" FOREIGN KEY ("prerequisite_id") REFERENCES "courses"("id") ON DELETE CASCADE`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign key constraints
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT IF EXISTS "FK_7958090039c8a7895bd4239ee4e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" DROP CONSTRAINT IF EXISTS "FK_ae63cf5e8e96f961c0e5c456094"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" DROP CONSTRAINT IF EXISTS "FK_54e68b197176642a08a65cb5f64"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_teachers" DROP CONSTRAINT IF EXISTS "FK_course_teachers_course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" DROP CONSTRAINT IF EXISTS "FK_course_prerequisites_course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" DROP CONSTRAINT IF EXISTS "FK_course_prerequisites_prerequisite_id"`,
    );

    // Add temporary integer columns
    await queryRunner.query(`ALTER TABLE "courses" ADD COLUMN "id_int" SERIAL`);
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD COLUMN "course_id_int" INT`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD COLUMN "course_id_int" INT`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD COLUMN "course_id_int" INT`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_teachers" ADD COLUMN "course_id_int" INT`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" ADD COLUMN "course_id_int" INT`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" ADD COLUMN "prerequisite_id_int" INT`,
    );

    // Update foreign key references (will lose data mapping)
    await queryRunner.query(`
            UPDATE "enrollments" e
            SET "course_id_int" = c."id_int"
            FROM "courses" c
            WHERE e."course_id" = c."id"
        `);

    await queryRunner.query(`
            UPDATE "grades" g
            SET "course_id_int" = c."id_int"
            FROM "courses" c
            WHERE g."course_id" = c."id"
        `);

    await queryRunner.query(`
            UPDATE "attendance" a
            SET "course_id_int" = c."id_int"
            FROM "courses" c
            WHERE a."course_id" = c."id"
        `);

    await queryRunner.query(`
            UPDATE "course_teachers" ct
            SET "course_id_int" = c."id_int"
            FROM "courses" c
            WHERE ct."course_id" = c."id"
        `);

    await queryRunner.query(`
            UPDATE "course_prerequisites" cp
            SET "course_id_int" = c."id_int"
            FROM "courses" c
            WHERE cp."course_id" = c."id"
        `);

    await queryRunner.query(`
            UPDATE "course_prerequisites" cp
            SET "prerequisite_id_int" = c."id_int"
            FROM "courses" c
            WHERE cp."prerequisite_id" = c."id"
        `);

    // Drop old primary key
    await queryRunner.query(
      `ALTER TABLE "courses" DROP CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9"`,
    );

    // Drop UUID columns
    await queryRunner.query(`ALTER TABLE "courses" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP COLUMN "course_id"`,
    );
    await queryRunner.query(`ALTER TABLE "grades" DROP COLUMN "course_id"`);
    await queryRunner.query(`ALTER TABLE "attendance" DROP COLUMN "course_id"`);
    await queryRunner.query(
      `ALTER TABLE "course_teachers" DROP COLUMN "course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" DROP COLUMN "course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" DROP COLUMN "prerequisite_id"`,
    );

    // Rename integer columns
    await queryRunner.query(
      `ALTER TABLE "courses" RENAME COLUMN "id_int" TO "id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" RENAME COLUMN "course_id_int" TO "course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" RENAME COLUMN "course_id_int" TO "course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" RENAME COLUMN "course_id_int" TO "course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_teachers" RENAME COLUMN "course_id_int" TO "course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" RENAME COLUMN "course_id_int" TO "course_id"`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" RENAME COLUMN "prerequisite_id_int" TO "prerequisite_id"`,
    );

    // Add primary key
    await queryRunner.query(
      `ALTER TABLE "courses" ADD CONSTRAINT "PK_3f70a487cc718ad8eda4e6d58c9" PRIMARY KEY ("id")`,
    );

    // Set NOT NULL
    await queryRunner.query(
      `ALTER TABLE "courses" ALTER COLUMN "id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ALTER COLUMN "course_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ALTER COLUMN "course_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ALTER COLUMN "course_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_teachers" ALTER COLUMN "course_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" ALTER COLUMN "course_id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" ALTER COLUMN "prerequisite_id" SET NOT NULL`,
    );

    // Recreate foreign keys
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_7958090039c8a7895bd4239ee4e" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "grades" ADD CONSTRAINT "FK_ae63cf5e8e96f961c0e5c456094" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "attendance" ADD CONSTRAINT "FK_54e68b197176642a08a65cb5f64" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_teachers" ADD CONSTRAINT "FK_course_teachers_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" ADD CONSTRAINT "FK_course_prerequisites_course_id" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE`,
    );
    await queryRunner.query(
      `ALTER TABLE "course_prerequisites" ADD CONSTRAINT "FK_course_prerequisites_prerequisite_id" FOREIGN KEY ("prerequisite_id") REFERENCES "courses"("id") ON DELETE CASCADE`,
    );
  }
}
