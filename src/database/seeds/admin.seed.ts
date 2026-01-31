import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

async function seedAdmin() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_DATABASE || 'student_management',
  });

  try {
    await dataSource.initialize();
    console.log('📦 Database connected');

    const passwordHash = await bcrypt.hash('Admin@123', 10);

    // Check if admin already exists
    const existingAdmin = (await dataSource.query(
      `SELECT * FROM users WHERE email = $1`,
      ['admin@system.com'],
    )) as unknown as Record<string, unknown>[];

    if (Array.isArray(existingAdmin) && existingAdmin.length > 0) {
      console.log('');
      console.log('⚠️  Admin user already exists');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:    admin@system.com');
      console.log('🔑 Password: Admin@123');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      await dataSource.destroy();
      return;
    }

    // Create admin user
    await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, first_name, last_name, is_active, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        'admin@system.com',
        'admin',
        passwordHash,
        'admin',
        'System',
        'Administrator',
        true,
        true,
      ],
    );

    console.log('');
    console.log('✅ Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:    admin@system.com');
    console.log('🔑 Password: Admin@123');
    console.log('👤 Role:     admin');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log('⚠️  Please change the password after first login!');

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    process.exit(1);
  }
}

void seedAdmin();
