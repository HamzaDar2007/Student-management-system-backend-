import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import { UserRole } from '../src/modules/users/entities/user.entity';
import * as bcrypt from 'bcryptjs';
import * as path from 'path';
import * as fs from 'fs';
import { setupE2EApp } from './helpers/app-setup.helper';

describe('Uploads (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let adminToken: string;
  let teacherToken: string;
  let studentToken: string;
  let adminUserId: number;
  let teacherUserId: number;
  let studentUserId: number;
  const uniqueId = Date.now().toString().slice(-6);
  const uploadedFiles: string[] = [];

  // Create a test file buffer (small PNG image)
  const createTestImageBuffer = (): Buffer => {
    // Minimal valid PNG (1x1 pixel, red)
    return Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
      0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xde, 0x00, 0x00, 0x00,
      0x0c, 0x49, 0x44, 0x41, 0x54, 0x08, 0xd7, 0x63, 0xf8, 0xcf, 0xc0, 0x00,
      0x00, 0x00, 0x03, 0x00, 0x01, 0x00, 0x05, 0xfe, 0xd4, 0xef, 0x00, 0x00,
      0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
    ]);
  };

  // Create a test PDF buffer
  const createTestPdfBuffer = (): Buffer => {
    // Minimal valid PDF
    return Buffer.from(
      '%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\nxref\n0 4\n0000000000 65535 f\n0000000009 00000 n\n0000000052 00000 n\n0000000101 00000 n\ntrailer<</Size 4/Root 1 0 R>>\nstartxref\n178\n%%EOF',
    );
  };

  // Create a test text file buffer
  const createTestTextBuffer = (): Buffer => {
    return Buffer.from('This is a test file content for E2E testing.');
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    setupE2EApp(app);

    await app.init();
    dataSource = moduleFixture.get<DataSource>(DataSource);

    const passwordHash = await bcrypt.hash('TestPassword123!', 10);

    // Create admin user
    const adminResult = await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, first_name, last_name, is_active, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, true, true) RETURNING id`,
      [
        `e2e_uploads_admin_${uniqueId}@test.com`,
        `e2e_uploads_admin_${uniqueId}`,
        passwordHash,
        UserRole.ADMIN,
        'Admin',
        'Test',
      ],
    );
    adminUserId = adminResult[0].id;

    // Create teacher user
    const teacherResult = await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, first_name, last_name, is_active, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, true, true) RETURNING id`,
      [
        `e2e_uploads_teacher_${uniqueId}@test.com`,
        `e2e_uploads_teacher_${uniqueId}`,
        passwordHash,
        UserRole.TEACHER,
        'Teacher',
        'Test',
      ],
    );
    teacherUserId = teacherResult[0].id;

    // Create student user
    const studentResult = await dataSource.query(
      `INSERT INTO users (email, username, password_hash, role, first_name, last_name, is_active, email_verified) 
       VALUES ($1, $2, $3, $4, $5, $6, true, true) RETURNING id`,
      [
        `e2e_uploads_student_${uniqueId}@test.com`,
        `e2e_uploads_student_${uniqueId}`,
        passwordHash,
        UserRole.STUDENT,
        'Student',
        'Test',
      ],
    );
    studentUserId = studentResult[0].id;

    // Get tokens
    const adminLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: `e2e_uploads_admin_${uniqueId}@test.com`,
        password: 'TestPassword123!',
      });
    adminToken = adminLogin.body.access_token;

    const teacherLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: `e2e_uploads_teacher_${uniqueId}@test.com`,
        password: 'TestPassword123!',
      });
    teacherToken = teacherLogin.body.access_token;

    const studentLogin = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: `e2e_uploads_student_${uniqueId}@test.com`,
        password: 'TestPassword123!',
      });
    studentToken = studentLogin.body.access_token;
  });

  afterAll(async () => {
    try {
      // Clean up uploaded files
      const uploadDir = process.env.UPLOAD_DIR || './uploads';
      for (const fileKey of uploadedFiles) {
        const filePath = path.join(uploadDir, fileKey);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }

      // Clean up test e2e folder if empty
      const testFolder = path.join(uploadDir, `e2e_test_${uniqueId}`);
      if (fs.existsSync(testFolder)) {
        const files = fs.readdirSync(testFolder);
        if (files.length === 0) {
          fs.rmdirSync(testFolder);
        }
      }

      // Clean up test users
      await dataSource.query('DELETE FROM users WHERE email LIKE $1', [
        `e2e_uploads_%_${uniqueId}@test.com`,
      ]);
    } catch (e) {
      // Ignore cleanup errors
    }
    await app.close();
  });

  describe('POST /api/uploads (Single File Upload)', () => {
    it('should upload a PNG image successfully as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', createTestImageBuffer(), {
          filename: 'test-image.png',
          contentType: 'image/png',
        })
        .field('folder', `e2e_test_${uniqueId}`)
        .expect(201);

      expect(response.body).toHaveProperty(
        'message',
        'File uploaded successfully',
      );
      expect(response.body).toHaveProperty('file');
      expect(response.body.file).toHaveProperty('url');
      expect(response.body.file).toHaveProperty('key');
      expect(response.body.file).toHaveProperty(
        'originalName',
        'test-image.png',
      );
      expect(response.body.file).toHaveProperty('mimeType', 'image/png');

      // Track uploaded file for cleanup
      uploadedFiles.push(response.body.file.key);
    });

    it('should upload a PDF document successfully as teacher', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${teacherToken}`)
        .attach('file', createTestPdfBuffer(), {
          filename: 'test-document.pdf',
          contentType: 'application/pdf',
        })
        .field('folder', `e2e_test_${uniqueId}`)
        .expect(201);

      expect(response.body).toHaveProperty(
        'message',
        'File uploaded successfully',
      );
      expect(response.body.file).toHaveProperty(
        'originalName',
        'test-document.pdf',
      );
      expect(response.body.file).toHaveProperty('mimeType', 'application/pdf');

      uploadedFiles.push(response.body.file.key);
    });

    it('should upload a text file successfully', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', createTestTextBuffer(), {
          filename: 'test-file.txt',
          contentType: 'text/plain',
        })
        .field('folder', `e2e_test_${uniqueId}`)
        .expect(201);

      expect(response.body.file).toHaveProperty(
        'originalName',
        'test-file.txt',
      );
      expect(response.body.file).toHaveProperty('mimeType', 'text/plain');

      uploadedFiles.push(response.body.file.key);
    });

    it('should use default folder when not specified', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', createTestTextBuffer(), {
          filename: 'default-folder-test.txt',
          contentType: 'text/plain',
        })
        .expect(201);

      expect(response.body.file.key).toMatch(/^general\//);

      uploadedFiles.push(response.body.file.key);
    });

    it('should reject upload from student (forbidden)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('file', createTestTextBuffer(), {
          filename: 'student-upload.txt',
          contentType: 'text/plain',
        })
        .field('folder', `e2e_test_${uniqueId}`)
        .expect(403);
    });

    it('should reject upload without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .attach('file', createTestTextBuffer(), {
          filename: 'no-auth.txt',
          contentType: 'text/plain',
        })
        .expect(401);
    });

    it('should reject upload with invalid file type', async () => {
      // Create a buffer with an unsupported type (e.g., executable)
      const invalidBuffer = Buffer.from('MZ'); // PE/EXE header

      await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', invalidBuffer, {
          filename: 'malicious.exe',
          contentType: 'application/x-msdownload',
        })
        .field('folder', `e2e_test_${uniqueId}`)
        .expect(400); // Bad Request from FileTypeValidator
    });
  });

  describe('POST /api/uploads/multiple (Multiple Files Upload)', () => {
    it('should upload multiple files successfully as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads/multiple')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('files', createTestImageBuffer(), 'multi-1.png')
        .attach('files', createTestTextBuffer(), 'multi-2.txt')
        .field('folder', `e2e_test_${uniqueId}`)
        .expect(201);

      expect(response.body).toHaveProperty('message');
      expect(response.body.message).toContain('uploaded successfully');
      expect(response.body).toHaveProperty('files');
      expect(response.body.files).toHaveLength(2);
      expect(response.body).toHaveProperty('count', 2);

      // Track uploaded files for cleanup
      response.body.files.forEach((file: { key: string }) => {
        uploadedFiles.push(file.key);
      });
    });

    it('should upload multiple files as teacher', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads/multiple')
        .set('Authorization', `Bearer ${teacherToken}`)
        .attach('files', createTestPdfBuffer(), {
          filename: 'teacher-doc-1.pdf',
          contentType: 'application/pdf',
        })
        .attach('files', createTestPdfBuffer(), {
          filename: 'teacher-doc-2.pdf',
          contentType: 'application/pdf',
        })
        .field('folder', `e2e_test_${uniqueId}`)
        .expect(201);

      expect(response.body.files).toHaveLength(2);

      response.body.files.forEach((file: { key: string }) => {
        uploadedFiles.push(file.key);
      });
    });

    it('should reject multiple upload from student', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/uploads/multiple')
        .set('Authorization', `Bearer ${studentToken}`)
        .attach('files', createTestTextBuffer(), 'student-1.txt')
        .attach('files', createTestTextBuffer(), 'student-2.txt')
        .expect(403);
    });

    it('should reject multiple upload without authentication', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/uploads/multiple')
        .attach('files', createTestTextBuffer(), 'no-auth-1.txt')
        .expect(401);
    });
  });

  describe('GET /api/uploads/:folder/:filename (Download File)', () => {
    let testFileKey: string;
    let testFolder: string;
    let testFilename: string;

    beforeAll(async () => {
      // Upload a file to test download
      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', createTestTextBuffer(), {
          filename: 'download-test.txt',
          contentType: 'text/plain',
        })
        .field('folder', `e2e_test_${uniqueId}`)
        .expect(201);

      testFileKey = response.body.file.key;
      uploadedFiles.push(testFileKey);

      // Extract folder and filename from key
      const parts = testFileKey.split('/');
      testFolder = parts[0];
      testFilename = parts[1];
    });

    it('should download a file successfully (public access)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/uploads/${testFolder}/${testFilename}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/plain');
      // Use .text instead of .body.toString() for text responses in supertest
      expect(response.text).toBe(
        'This is a test file content for E2E testing.',
      );
    });

    it('should download file as student (read access allowed)', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/uploads/${testFolder}/${testFilename}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/plain');
    });

    it('should return 404 for non-existent file', async () => {
      await request(app.getHttpServer())
        .get(`/api/v1/uploads/${testFolder}/non-existent-file.txt`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('should return 404 for non-existent folder', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/uploads/non-existent-folder/file.txt')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('GET /api/uploads/exists/:folder/:filename (Check File Exists)', () => {
    let existingFolder: string;
    let existingFilename: string;

    beforeAll(async () => {
      // Upload a file to test existence check
      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', createTestTextBuffer(), {
          filename: 'exists-test.txt',
          contentType: 'text/plain',
        })
        .field('folder', `e2e_test_${uniqueId}`)
        .expect(201);

      const fileKey = response.body.file.key;
      uploadedFiles.push(fileKey);

      const parts = fileKey.split('/');
      existingFolder = parts[0];
      existingFilename = parts[1];
    });

    it('should return exists: true for existing file', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/uploads/exists/${existingFolder}/${existingFilename}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('exists', true);
      expect(response.body).toHaveProperty('url');
    });

    it('should return exists: false for non-existent file', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/uploads/exists/${existingFolder}/non-existent.txt`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('exists', false);
      expect(response.body).toHaveProperty('url', null);
    });

    it('should allow student to check file existence', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/uploads/exists/${existingFolder}/${existingFilename}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('exists', true);
    });
  });

  describe('DELETE /api/uploads/:folder/:filename (Delete File)', () => {
    let deleteFileKey: string;
    let deleteFolder: string;
    let deleteFilename: string;

    beforeEach(async () => {
      // Upload a new file for each delete test
      const response = await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', createTestTextBuffer(), {
          filename: `delete-test-${Date.now()}.txt`,
          contentType: 'text/plain',
        })
        .field('folder', `e2e_test_${uniqueId}`)
        .expect(201);

      deleteFileKey = response.body.file.key;
      const parts = deleteFileKey.split('/');
      deleteFolder = parts[0];
      deleteFilename = parts[1];
    });

    it('should delete a file successfully as admin', async () => {
      const response = await request(app.getHttpServer())
        .delete(`/api/v1/uploads/${deleteFolder}/${deleteFilename}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty(
        'message',
        'File deleted successfully',
      );
      expect(response.body).toHaveProperty('deleted', true);

      // Verify file is deleted
      const existsCheck = await request(app.getHttpServer())
        .get(`/api/v1/uploads/exists/${deleteFolder}/${deleteFilename}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(existsCheck.body.exists).toBe(false);
    });

    it('should reject delete from teacher (admin only)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/uploads/${deleteFolder}/${deleteFilename}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      // Track for cleanup since it wasn't deleted
      uploadedFiles.push(deleteFileKey);
    });

    it('should reject delete from student (admin only)', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/uploads/${deleteFolder}/${deleteFilename}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      uploadedFiles.push(deleteFileKey);
    });

    it('should reject delete without authentication', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/uploads/${deleteFolder}/${deleteFilename}`)
        .expect(401);

      uploadedFiles.push(deleteFileKey);
    });

    it('should return 404 when deleting non-existent file', async () => {
      // Delete the file first
      await request(app.getHttpServer())
        .delete(`/api/v1/uploads/${deleteFolder}/${deleteFilename}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Try to delete again
      await request(app.getHttpServer())
        .delete(`/api/v1/uploads/${deleteFolder}/${deleteFilename}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('Authorization Edge Cases', () => {
    it('should reject requests with invalid token', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', 'Bearer invalid-token')
        .attach('file', createTestTextBuffer(), 'test.txt')
        .expect(401);
    });

    it('should reject requests with expired token format', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', 'Bearer ')
        .attach('file', createTestTextBuffer(), 'test.txt')
        .expect(401);
    });

    it('should reject requests with malformed authorization header', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/uploads')
        .set('Authorization', 'InvalidFormat token')
        .attach('file', createTestTextBuffer(), 'test.txt')
        .expect(401);
    });
  });
});
