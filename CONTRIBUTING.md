# Contributing to Students Management System

Thank you for considering contributing to the Students Management System! This document provides guidelines and information to help you contribute effectively.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)

## Code of Conduct

Please be respectful and inclusive in all interactions. We are committed to providing a welcoming environment for everyone.

## Getting Started

### Prerequisites

- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **PostgreSQL**: v14 or higher
- **Redis**: v6 or higher (optional, for caching)
- **Git**: Latest version

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/students-management.git
   cd students-management/backend
   ```
3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/ORIGINAL_OWNER/students-management.git
   ```

## Development Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Configure the following required variables:

```dotenv
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=student_management
DB_SYNCHRONIZE=false

# JWT
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your-secure-refresh-secret
JWT_REFRESH_EXPIRES_IN=7d

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 3. Database Setup

```bash
# Create the database
createdb student_management

# Run migrations (if applicable)
npm run migration:run

# Or for development, enable synchronize in .env
DB_SYNCHRONIZE=true
```

### 4. Start Development Server

```bash
npm run start:dev
```

The API will be available at `http://localhost:3000/api/v1/`.

## Project Structure

```
src/
├── common/              # Shared utilities, decorators, guards, pipes
│   ├── decorators/      # Custom decorators (@Roles, @CurrentUser, etc.)
│   ├── filters/         # Exception filters
│   ├── guards/          # Auth guards, role guards
│   ├── interceptors/    # Response transformation, logging
│   └── pipes/           # Validation pipes, XSS sanitization
├── config/              # Configuration modules
├── modules/             # Feature modules
│   ├── auth/            # Authentication (JWT, login, register)
│   ├── users/           # User management
│   ├── students/        # Student profiles
│   ├── courses/         # Course management
│   ├── enrollments/     # Course enrollments
│   ├── grades/          # Grade management
│   ├── attendance/      # Attendance tracking
│   ├── teachers/        # Teacher profiles
│   ├── faculties/       # Faculty management
│   ├── departments/     # Department management
│   ├── scheduling/      # Class scheduling
│   ├── uploads/         # File uploads
│   └── audit/           # Audit logging
└── main.ts              # Application entry point
```

## Coding Standards

### TypeScript

- Use TypeScript strict mode
- Define interfaces for all data structures
- Avoid `any` type - use proper typing or generics
- Use meaningful variable and function names

### NestJS Conventions

- Follow NestJS module structure
- Use dependency injection
- Implement proper DTOs for request/response
- Use decorators appropriately

### Style Guide

- ESLint and Prettier are configured
- Run `npm run lint` before committing
- Run `npm run format` to auto-format code

```bash
# Check for linting issues
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code
npm run format
```

### File Naming

- Use kebab-case for file names: `user-profile.service.ts`
- Use PascalCase for classes: `UserProfileService`
- Use camelCase for variables and functions
- Suffix files appropriately: `.controller.ts`, `.service.ts`, `.module.ts`, `.dto.ts`, `.entity.ts`

## Testing Guidelines

### Running Tests

```bash
# Unit tests
npm test

# Unit tests with coverage
npm run test:cov

# Watch mode
npm run test:watch

# E2E tests (requires database)
npm run test:e2e
```

### Writing Unit Tests

- Place test files next to source files: `user.service.ts` → `user.service.spec.ts`
- Use descriptive test names
- Follow AAA pattern (Arrange, Act, Assert)
- Mock external dependencies

```typescript
describe('UserService', () => {
  describe('findOne', () => {
    it('should return a user when found', async () => {
      // Arrange
      const userId = 1;
      const mockUser = { id: userId, email: 'test@example.com' };
      mockRepository.findOne.mockResolvedValue(mockUser);

      // Act
      const result = await service.findOne(userId);

      // Assert
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      // Arrange
      mockRepository.findOne.mockResolvedValue(null);

      // Act & Assert
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });
});
```

### Writing E2E Tests

- Place E2E tests in the `test/` directory
- Use meaningful test data with unique identifiers
- Clean up test data after tests complete
- Use API versioning prefix: `/api/v1/`

```typescript
describe('Users (e2e)', () => {
  it('should create a new user', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(createUserDto)
      .expect(201);

    expect(response.body).toHaveProperty('id');
    expect(response.body.email).toBe(createUserDto.email);
  });
});
```

### Test Coverage

We aim for:

- **80%+** overall coverage
- **90%+** coverage for services
- **100%** coverage for critical business logic

## Commit Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks (dependencies, configs)
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Examples

```
feat(auth): add refresh token rotation

fix(students): correct GPA calculation formula

docs(readme): update installation instructions

test(grades): add unit tests for grade calculation service

chore(deps): upgrade NestJS to v11
```

### Commit Hooks

Husky is configured to run:

- **pre-commit**: Lint staged files
- **commit-msg**: Validate commit message format

## Pull Request Process

### 1. Create a Feature Branch

```bash
git checkout -b feat/your-feature-name
```

### 2. Make Your Changes

- Write clean, tested code
- Follow coding standards
- Update documentation if needed

### 3. Run Quality Checks

```bash
# Run all checks
npm run lint
npm test
npm run test:cov  # Ensure coverage meets standards
```

### 4. Push and Create PR

```bash
git push origin feat/your-feature-name
```

Then create a Pull Request on GitHub with:

- Clear title following commit convention
- Description of changes
- Link to related issues
- Screenshots (if UI changes)

### 5. Code Review

- Address reviewer feedback
- Keep discussions professional
- Update PR based on feedback

### 6. Merge

Once approved:

- Squash and merge is preferred
- Delete feature branch after merge

## Issue Reporting

### Bug Reports

Use the bug report template and include:

- Clear title and description
- Steps to reproduce
- Expected vs actual behavior
- Environment details (Node version, OS)
- Error logs if applicable

### Feature Requests

Use the feature request template and include:

- Clear title and description
- Use case / motivation
- Proposed solution (if any)
- Alternatives considered

### Questions

For general questions:

- Check existing issues and documentation first
- Use the Q&A discussion category
- Be specific and provide context

## API Documentation

Swagger documentation is available at `/api/v1/docs` when the server is running.

### Adding New Endpoints

1. Define DTOs with validation decorators
2. Add Swagger decorators to controllers
3. Document response types and error codes
4. Update Postman collection if applicable

## Database Changes

### Creating Migrations

```bash
npm run migration:generate -- -n MigrationName
```

### Running Migrations

```bash
npm run migration:run
```

### Reverting Migrations

```bash
npm run migration:revert
```

## Need Help?

- Check the [README.md](./README.md) for project overview
- Review existing code for patterns and conventions
- Open an issue for questions or discussions
- Reach out to maintainers

---

Thank you for contributing! 🎉
