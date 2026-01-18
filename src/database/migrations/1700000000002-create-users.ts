import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUsers1700000000002 implements MigrationInterface {
  name = 'CreateUsers1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS users (
        id              SERIAL PRIMARY KEY,
        email           VARCHAR(100) NOT NULL UNIQUE,
        username        VARCHAR(50)  NOT NULL UNIQUE,
        password_hash   VARCHAR(255) NOT NULL,
        role            user_role_enum NOT NULL DEFAULT 'student',
        first_name      VARCHAR(50),
        last_name       VARCHAR(50),
        is_active       BOOLEAN NOT NULL DEFAULT TRUE,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
    `);

    // updated_at trigger
    await queryRunner.query(`
      DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
      CREATE TRIGGER trg_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION set_updated_at();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS users;`);
  }
}
