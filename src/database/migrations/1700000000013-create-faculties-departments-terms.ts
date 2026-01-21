import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFacultiesDepartmentsTerms1700000000013 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create faculties table
    await queryRunner.query(`
            CREATE TABLE "faculties" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(100) NOT NULL UNIQUE,
                "code" VARCHAR(20) NOT NULL UNIQUE,
                "deanId" INT REFERENCES "users"("id") ON DELETE SET NULL,
                "created_at" TIMESTAMPTZ DEFAULT NOW(),
                "updated_at" TIMESTAMPTZ DEFAULT NOW()
            )
        `);

    // Create departments table
    await queryRunner.query(`
            CREATE TABLE "departments" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(100) NOT NULL UNIQUE,
                "code" VARCHAR(20) NOT NULL UNIQUE,
                "facultyId" INT REFERENCES "faculties"("id") ON DELETE SET NULL,
                "created_at" TIMESTAMPTZ DEFAULT NOW(),
                "updated_at" TIMESTAMPTZ DEFAULT NOW()
            )
        `);

    // Create academic_terms table
    await queryRunner.query(`
            CREATE TABLE "academic_terms" (
                "id" SERIAL PRIMARY KEY,
                "name" VARCHAR(100) NOT NULL UNIQUE,
                "start_date" DATE NOT NULL,
                "end_date" DATE NOT NULL,
                "is_active" BOOLEAN DEFAULT FALSE,
                "created_at" TIMESTAMPTZ DEFAULT NOW(),
                "updated_at" TIMESTAMPTZ DEFAULT NOW()
            )
        `);

    // Create teacher_profiles_rank_enum type
    await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "teacher_profiles_rank_enum" AS ENUM (
                    'professor', 'associate_professor', 'assistant_professor', 'lecturer', 'teaching_assistant'
                );
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$
        `);

    // Create teacher_profiles table
    await queryRunner.query(`
            CREATE TABLE "teacher_profiles" (
                "id" SERIAL PRIMARY KEY,
                "user_id" INT NOT NULL UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
                "employee_id" VARCHAR(50) NOT NULL UNIQUE,
                "rank" teacher_profiles_rank_enum DEFAULT 'lecturer',
                "specialization" VARCHAR(200),
                "office_location" VARCHAR(100),
                "office_hours" VARCHAR(200),
                "phone" VARCHAR(20),
                "bio" TEXT,
                "hire_date" DATE,
                "is_active" BOOLEAN DEFAULT TRUE,
                "created_at" TIMESTAMPTZ DEFAULT NOW(),
                "updated_at" TIMESTAMPTZ DEFAULT NOW()
            )
        `);

    // Create classrooms_type_enum type
    await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE "classrooms_type_enum" AS ENUM ('lecture', 'lab', 'seminar', 'virtual');
            EXCEPTION
                WHEN duplicate_object THEN NULL;
            END $$
        `);

    // Create classrooms table
    await queryRunner.query(`
            CREATE TABLE "classrooms" (
                "id" SERIAL PRIMARY KEY,
                "room_number" VARCHAR(20) NOT NULL UNIQUE,
                "building" VARCHAR(100),
                "capacity" INT NOT NULL,
                "type" classrooms_type_enum DEFAULT 'lecture',
                "created_at" TIMESTAMPTZ DEFAULT NOW(),
                "updated_at" TIMESTAMPTZ DEFAULT NOW()
            )
        `);

    // Create schedules table
    await queryRunner.query(`
            CREATE TABLE "schedules" (
                "id" SERIAL PRIMARY KEY,
                "course_id" INT NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
                "classroom_id" INT REFERENCES "classrooms"("id") ON DELETE SET NULL,
                "day_of_week" INT NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
                "start_time" TIME NOT NULL,
                "end_time" TIME NOT NULL,
                "created_at" TIMESTAMPTZ DEFAULT NOW(),
                "updated_at" TIMESTAMPTZ DEFAULT NOW()
            )
        `);

    // Create audit_logs table
    await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id" SERIAL PRIMARY KEY,
                "user_id" INT REFERENCES "users"("id") ON DELETE SET NULL,
                "action" VARCHAR(50) NOT NULL,
                "resource" VARCHAR(100) NOT NULL,
                "resource_id" VARCHAR(50),
                "payload" JSONB,
                "created_at" TIMESTAMPTZ DEFAULT NOW()
            )
        `);

    // Create course_prerequisites table
    await queryRunner.query(`
            CREATE TABLE "course_prerequisites" (
                "course_id" INT NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
                "prerequisite_id" INT NOT NULL REFERENCES "courses"("id") ON DELETE CASCADE,
                PRIMARY KEY ("course_id", "prerequisite_id")
            )
        `);

    // Add indexes
    await queryRunner.query(
      `CREATE INDEX "idx_faculties_name" ON "faculties"("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_faculties_code" ON "faculties"("code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_departments_name" ON "departments"("name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_departments_code" ON "departments"("code")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_departments_faculty_id" ON "departments"("facultyId")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_teacher_profiles_user_id" ON "teacher_profiles"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_schedules_course_id" ON "schedules"("course_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_schedules_classroom_id" ON "schedules"("classroom_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_user_id" ON "audit_logs"("user_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_resource" ON "audit_logs"("resource", "resource_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_audit_logs_created_at" ON "audit_logs"("created_at")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "course_prerequisites"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "schedules"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "classrooms"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "teacher_profiles"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "academic_terms"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "departments"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "faculties"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "classrooms_type_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "teacher_profiles_rank_enum"`);
  }
}
