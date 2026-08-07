# Experimind Labs Intern Management System

A comprehensive web application designed to streamline the entire intern lifecycle management for Experimind Labs, from recruitment and onboarding to performance tracking and offboarding.

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Running the Application](#running-the-application)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)
- [Contributing](#contributing)
- [License](#license)

## Overview

The Internship Management System provides a centralized platform for managing all aspects of internship programs, including:
- Intern recruitment and application management
- Internship assignment and tracking
- Mentor-mentee matching
- Project and task management
- Performance evaluation and feedback
- Document management and compliance
- Reporting and analytics

## Features

### Core Modules
1. **User Management** - Role-based access control for admins, HR, mentors, and interns
2. **Internship Management** - Create, manage, and track internship programs
3. **Application System** - Online application submission and tracking
4. **Document Management** - Secure storage and retrieval of intern documents
5. **Project & Task Management** - Assign and track intern projects and tasks
6. **Evaluation System** - Performance evaluations and feedback collection
7. **Notification System** - Email and in-app notifications
8. **Reporting & Analytics** - Comprehensive dashboards and exportable reports

## Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: Redux Toolkit with Redux Persist
- **UI Library**: Ant Design 5.0
- **Data Fetching**: React Query
- **Forms**: React Hook Form with Zod validation
- **Charts**: Recharts
- **HTTP Client**: Axios

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Refresh Tokens
- **Validation**: Joi
- **File Storage**: Local storage (AWS S3 ready)
- **Email Service**: Placeholder for SendGrid/SMTP
- **Real-time**: Socket.IO ready
- **Caching**: Redis ready

### DevOps & Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **CI/CD**: GitHub Actions ready
- **Monitoring**: Prometheus + Grafana ready
- **Logging**: Winston + ELK Stack ready
- **Testing**: Jest + React Testing Library

## Architecture

### System Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Frontend App  │◄──►│   API Gateway    │◄──►│   Load Balancer  │
│  (React SPA)    │    │   (Express.js)   │    │   (NGINX)        │
└─────────────────┘    └──────────┬───────┘    └──────────┬───────┘
                                 │                           │
                   ┌─────────────▼─────────────┐   ┌───────▼────────────┐
                   │   Authentication Service  │   │   File Storage     │
                   │   (JWT, bcrypt)           │   │   (Local/AWS S3)   │
                   └─────────────┬─────────────┘   └────────┬───────────┘
                                 │                        │
                   ┌─────────────▼─────────────┐   ┌───────▼────────────┐
                   │   Application Logic       │   │   Caching Layer    │
                   │   (Services & Controllers)│   │   (Redis)          │
                   └─────────────┬─────────────┘   └────────┬───────────┘
                                 │                        │
                   ┌─────────────▼─────────────┐   ┌───────▼────────────┐
                   │   Database Layer          │   │   Message Queue    │
                   │   (PostgreSQL + Prisma)   │   │   (RabbitMQ)       │
                   └───────────────────────────┘   └────────────────────┘
```

### Database Schema Overview

#### Core Tables
- **users**: Stores all system users (interns, mentors, admins, HR)
- **internships**: Internship program details
- **applications**: Internship applications
- **projects**: Assigned projects for interns
- **tasks**: Individual tasks within projects
- **evaluations**: Performance evaluations and feedback
- **documents**: Stored files and metadata
- **notifications**: System notifications
- **notifications**: System notifications and alerts

## Getting Started

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ and npm (for local development)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd experimindlabs-intern-management-system
   ```

2. **Install dependencies** (for local development)
   ```bash
   # Backend
   cd backend
   npm install
   
   # Frontend
   cd ../frontend
   npm install
   ```

3. **Set up environment variables**
   - Copy `.env.example` to `.env` in both `backend` and `frontend` directories
   - Configure the variables according to your environment

### Environment Variables

#### Backend Environment Variables (.env)
```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/intern_management"

# JWT Authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your_super_secret_refresh_token_key_here_change_in_production
REFRESH_TOKEN_EXPIRES_IN=7d

# Email Configuration (for development, use ethereal or mailtrap)
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=your_ethereal_user
EMAIL_PASS=your_ethereal_password
EMAIL_FROM=Intern Management System <noreply@experimindlabs.com>

# File Upload
MAX_FILE_SIZE=10485760 # 10MB
ALLOWED_FILE_TYPES=image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000 # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Redis (for caching and sessions)
REDIS_URL=redis://localhost:6379
```

#### Frontend Environment Variables (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Running the Application

#### Option 1: Using Docker Compose (Recommended)
```bash
# From the root directory
docker-compose up --build

# The application will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000/api
```

#### Option 2: Local Development
1. **Start the database** (PostgreSQL and Redis)
   ```bash
   # Using Docker for just the databases
   docker run -d --name postgres -e POSTGRES_DB=intern_management -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=password -p 5432:5432 postgres:15-alpine
   docker run -d --name redis -p 6379:6379 redis:7-alpine
   ```

2. **Set up the database**
   ```bash
   cd backend
   npx prisma migrate dev --name init
   npx prisma generate
   ```

3. **Seed the database** (optional but recommended for testing)
   ```bash
   npm run prisma:seed
   ```

4. **Start the backend server**
   ```bash
   npm run dev
   ```

5. **Start the frontend development server** (in a new terminal)
   ```bash
   cd ../frontend
   npm start
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000/api

### Default Login Credentials (after seeding)
- **Admin**: admin@experimindlabs.com / password123
- **HR**: hr@experimindlabs.com / password123
- **Mentor**: mentor@experimindlabs.com / password123
- **Intern**: intern@experimindlabs.com / password123

## Development

### Code Structure
- `backend/` - Node.js/Express/TypeScript backend
- `frontend/` - React/TypeScript frontend
- `prisma/` - Database schema and migrations

### Backend Development
```bash
cd backend
npm run dev  # Starts the server with hot reload
npm run lint  # Runs ESLint
npm run format  # Formats code with Prettier
```

### Frontend Development
```bash
cd frontend
npm start  # Starts the development server
npm test  # Runs tests
npm run lint  # Runs ESLint
npm run format  # Formats code with Prettier
```

### Database Operations
```bash
cd backend
npx prisma migrate dev  # Create and apply migrations
npx prisma generate  # Generate Prisma client
npx prisma studio  # Open Prisma GUI
```

## Testing

### Backend Tests
```bash
cd backend
npm test  # Run Jest tests
```

### Frontend Tests
```bash
cd frontend
npm test  # Run Jest tests
```

### Test Coverage
To generate coverage reports:
```bash
# Backend
cd backend
npm test -- --coverage

# Frontend
cd frontend
npm test -- --coverage
```

## Deployment

### Docker Deployment
The application is designed to be easily deployed with Docker Compose:

```bash
docker-compose up -d
```

### Production Considerations
For production deployment, consider:
1. Using managed PostgreSQL (AWS RDS, Google Cloud SQL, etc.)
2. Using managed Redis (AWS ElastiCache, Redis Cloud, etc.)
3. Using object storage (AWS S3, Google Cloud Storage, etc.)
4. Setting up proper SSL/TLS termination
5. Configuring CDN for static assets
6. Implementing proper monitoring and alerting
7. Using environment-specific configuration files
8. Setting up proper logging and error tracking

### CI/CD
The repository is ready for GitHub Actions or similar CI/CD systems. Example workflows would include:
- Running tests on pull requests
- Building Docker images on merge to main
- Deploying to staging/production environments

## API Documentation

Once the backend is running, you can access the API documentation at:
- Swagger UI: http://localhost:5000/api-docs
- ReDoc: http://localhost:5000/redoc

### Authentication
All API endpoints (except auth endpoints) require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

### Rate Limiting
The API implements rate limiting to prevent abuse:
- 100 requests per 15 minutes per IP address
- Stricter limits on authentication endpoints

## Contributing

We welcome contributions to improve the Intern Management System! Please follow these guidelines:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Commit your changes: `git commit -m 'Add some amazing feature'`
5. Push to the branch: `git push origin feature/amazing-feature`
6. Open a Pull Request

Please ensure your code follows our coding standards and includes appropriate tests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Experimind Labs IT Department
- Email: it@experimindlabs.com
- Phone: +1 (555) 123-4567

## Acknowledgments

- Thanks to the open-source community for the fantastic libraries and frameworks used
- Special thanks to the Experimind Labs team for their vision and support