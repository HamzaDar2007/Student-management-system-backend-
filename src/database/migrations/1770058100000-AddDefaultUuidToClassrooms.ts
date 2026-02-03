import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDefaultUuidToClassrooms1770058100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "classrooms" ALTER COLUMN "id" SET DEFAULT uuid_generate_v4()`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "classrooms" ALTER COLUMN "id" DROP DEFAULT`,
    );
  }
}
