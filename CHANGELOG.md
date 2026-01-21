# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Docker support with multi-stage Dockerfile
- Docker Compose for production and development environments
- GitHub Actions CI/CD pipeline
- Release workflow with automatic changelog generation
- EditorConfig for consistent code formatting
- Common utilities test suite (112 tests)
  - Guards: RolesGuard, JwtAuthGuard
  - Filters: HttpExceptionFilter
  - Pipes: XssPipe
  - Interceptors: AuditInterceptor
  - Validators: IsStrongPassword, IsStudentId, MinAge
  - Services: MailService, StorageService
  - DTOs: PaginationDto

### Changed

- Improved project documentation

### Fixed

- Academic terms service TypeORM empty criteria error
- Audit service findOne now throws NotFoundException
- Scheduling controller route ordering
- Scheduling tests field name mismatch

## [1.0.0] - 2026-01-21

### Added

- Initial release
- User authentication with JWT and refresh tokens
- Role-based access control (Admin, Teacher, Student)
- Student management module
- Teacher management module
- Course management module
- Enrollment system
- Grade management
- Attendance tracking
- Academic terms management
- Class scheduling with classroom management
- Faculty and department management
- Audit logging system
- Health check endpoints
- Swagger/OpenAPI documentation
- Email service for notifications
- File storage service
- XSS protection
- Rate limiting
- Database migrations and seeding
- Comprehensive test suite (399 unit tests, 214 E2E tests)
