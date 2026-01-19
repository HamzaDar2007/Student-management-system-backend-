# Students Management System - Backend API

A comprehensive RESTful API for managing students, courses, enrollments, grades, attendance, and academic administration built with NestJS.

## 🚀 Features

- **Authentication & Authorization**
  - JWT-based authentication with access & refresh tokens
  - Role-based access control (Admin, Teacher, Student)
  - Email verification and password reset

- **User Management**
  - User CRUD operations
  - Profile management
  - Password hashing with bcrypt

- **Academic Management**
  - Students management with enrollment tracking
  - Teachers management with course assignments
  - Courses with capacity and scheduling
  - Enrollments with grade tracking
  - Grades with multiple assessment types
  - Attendance tracking with bulk operations

- **Administrative**
  - Faculties and Departments management
  - Academic Terms/Semesters
  - Course Scheduling with conflict detection
  - Classroom management
  - Audit logging for all operations

- **Infrastructure**
  - Rate limiting protection
  - Health checks (liveness, readiness)
  - Swagger API documentation
  - Global exception handling

## 🛠️ Tech Stack

- **Framework:** NestJS v11
- **Database:** PostgreSQL with TypeORM
- **Authentication:** Passport.js with JWT
- **Validation:** class-validator & class-transformer
- **Documentation:** Swagger/OpenAPI
- **Security:** Helmet, Rate Limiting, XSS Protection
- **Email:** Nodemailer

## 📋 Prerequisites

- Node.js >= 18
- PostgreSQL >= 14
- npm or yarn

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd students-management/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   # Application
   NODE_ENV=development
   PORT=3000
   
   # Database
   DB_HOST=localhost
   DB_PORT=5432
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_DATABASE=students_management
   
   # JWT
   JWT_SECRET=your-secret-key
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_SECRET=your-refresh-secret
   JWT_REFRESH_EXPIRES_IN=7d
   
   # Email (optional)
   SMTP_HOST=smtp.example.com
   SMTP_PORT=587
   SMTP_USER=your-email
   SMTP_PASS=your-password
   MAIL_FROM=noreply@example.com
   
   # Rate Limiting
   THROTTLE_TTL=60000
   THROTTLE_LIMIT=100
   ```

4. **Run database migrations**
   ```bash
   npm run migration:run
   ```

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

## 🚀 Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3000`

## 📚 API Documentation

Once the server is running, access the Swagger documentation at:
- **Swagger UI:** `http://localhost:3000/api/docs`

## 🔐 Authentication

Most endpoints require JWT authentication. To authenticate:

1. **Register or Login**
   ```bash
   POST /api/auth/login
   {
     "email": "admin@example.com",
     "password": "password123"
   }
   ```

2. **Use the token**
   ```bash
   Authorization: Bearer <your_jwt_token>
   ```

### Default Users (after seeding)
| Role    | Email              | Password    |
|---------|-------------------|-------------|
| Admin   | admin@example.com | Admin123!   |
| Teacher | teacher@example.com | Teacher123! |
| Student | student@example.com | Student123! |

## 📁 Project Structure

```
src/
├── common/                  # Shared utilities
│   ├── decorators/         # Custom decorators
│   ├── dto/                # Shared DTOs
│   ├── filters/            # Exception filters
│   ├── guards/             # Auth guards
│   ├── interceptors/       # Interceptors
│   ├── pipes/              # Custom pipes
│   ├── services/           # Shared services
│   └── validators/         # Custom validators
├── config/                  # Configuration
├── database/
│   ├── migrations/         # TypeORM migrations
│   └── seeds/              # Database seeders
├── modules/
│   ├── academic-terms/     # Academic terms/semesters
│   ├── attendance/         # Attendance tracking
│   ├── audit/              # Audit logging
│   ├── auth/               # Authentication
│   ├── courses/            # Course management
│   ├── departments/        # Department management
│   ├── enrollments/        # Enrollment management
│   ├── faculties/          # Faculty management
│   ├── grades/             # Grade management
│   ├── health/             # Health checks
│   ├── scheduling/         # Course scheduling
│   ├── students/           # Student management
│   ├── teachers/           # Teacher management
│   └── users/              # User management
├── app.module.ts
└── main.ts
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📦 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh-token` | Refresh access token |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/verify-email` | Verify email |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout |

### Users (Admin only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| POST | `/api/users` | Create user |
| GET | `/api/users/:id` | Get user by ID |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Delete user |

### Students
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List students |
| POST | `/api/students` | Create student |
| GET | `/api/students/:id` | Get student |
| PUT | `/api/students/:id` | Update student |
| DELETE | `/api/students/:id` | Delete student |
| GET | `/api/students/:id/grades` | Get student grades |
| GET | `/api/students/:id/attendance` | Get student attendance |

### Courses
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | List courses |
| POST | `/api/courses` | Create course |
| GET | `/api/courses/:id` | Get course |
| PUT | `/api/courses/:id` | Update course |
| DELETE | `/api/courses/:id` | Delete course |
| GET | `/api/courses/:id/students` | Get enrolled students |
| GET | `/api/courses/:id/attendance` | Get course attendance |

### Health Checks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Full health check |
| GET | `/api/health/liveness` | Liveness probe |
| GET | `/api/health/readiness` | Readiness probe |

## 🔒 Security

- **Helmet:** Security headers
- **Rate Limiting:** 100 requests per minute per IP
- **CORS:** Configurable origin
- **XSS Protection:** Input sanitization
- **Password Hashing:** bcrypt with salt rounds
- **JWT:** Short-lived access tokens with refresh token rotation

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run start:dev` | Start in development mode |
| `npm run start:prod` | Start in production mode |
| `npm run build` | Build the application |
| `npm run test` | Run unit tests |
| `npm run test:e2e` | Run E2E tests |
| `npm run migration:generate` | Generate migration |
| `npm run migration:run` | Run migrations |
| `npm run migration:revert` | Revert last migration |
| `npm run seed` | Seed the database |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code with Prettier |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.
