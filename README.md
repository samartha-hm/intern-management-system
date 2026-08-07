# 🚀 Experimind Labs - Intern Management System

A production-ready, full-stack enterprise web application engineered to manage the complete intern lifecycle at Experimind Labs — from recruitment and onboarding to attendance verification, daily work logging, evaluation, and contract completion.

---

## 📋 Table of Contents
- [System Architecture](#system-architecture)
- [Key Features](#key-features)
- [Security Hardening & Safety](#security-hardening--safety)
- [Technology Stack](#technology-stack)
- [Live Cloud Deployment (Vercel + Supabase)](#live-cloud-deployment-vercel--supabase)
- [Local Development Setup](#local-development-setup)
- [Database Schema & Seed Accounts](#database-schema--seed-accounts)
- [API Route Reference](#api-route-reference)
- [License](#license)

---

## 🏗️ System Architecture

```mermaid
graph TD
    A["🌐 React 18 Frontend<br/>(Vercel Global CDN)"] -->|HTTPS / REST API| B["⚡ Express.js Serverless API<br/>(Vercel Functions)"]
    B -->|Prisma ORM / Session Pooler| C["🐘 Supabase PostgreSQL<br/>(Cloud Database)"]
    
    subgraph Office Kiosk Displays
        D["📍 Entrance Kiosk Screen<br/>/qr-kiosk/entrance"]
        E["📍 Exit Kiosk Screen<br/>/qr-kiosk/exit"]
    end

    F["📱 Intern Mobile / Laptop"] -->|Camera Viewfinder Scan| D
    F -->|Work Diary Submission + Exit Scan| E
```

---

## ✨ Key Features

### 1. 📷 Office QR Attendance Clock & Dual Kiosk Screens
- **Dedicated Entrance Kiosk (`/qr-kiosk/entrance`)**: Displays a real-time, high-contrast green QR wallpaper for morning check-ins.
- **Dedicated Exit Kiosk (`/qr-kiosk/exit`)**: Displays a real-time red QR wallpaper for evening check-outs.
- **Camera Viewfinder Modal**: Interns scan the office screens directly using their web/mobile camera scanner.
- **Mandatory Work Diary at Checkout**: Check-out is gated by a simple, clean form requiring **"Today's Work Summary"** before the exit timestamp is confirmed.

### 2. 📊 Personalized Intern Tenure & Program Tracking
- **Contract Duration Counter**: Tracks assigned start and end dates (e.g. `Jun 1, 2026` to `Aug 31, 2026` = `65 Total Days`).
- **Tenure Progress Bar**: Displays contract elapsed days vs total program tenure (e.g. `45 of 65 Days Completed (69.2%)`).
- **Personalized Attendance Rate**: Calculates attendance compliance exclusively against the intern's elapsed program days (e.g. `95.6%`).

### 3. 👥 Role-Based Access Control (RBAC)
Customized landing pages and permissions for 4 distinct user roles:
- **Admin**: Full system management, user provisioning, role configuration, reports, and attendance audit.
- **HR**: Recruitment, application reviews, intern lifecycle tracking, and compliance metrics.
- **Mentor**: Supervision of assigned interns, daily work diary approvals, and performance reviews.
- **Intern**: Daily attendance clock-in/out, work diary log history, and profile management.

---

## 🛡️ Security Hardening & Safety

The application has been hardened against common security threats for production readiness:

- 🔒 **Public Self-Registration Guard**: Public signups at `/api/auth/register` strictly force `role: 'INTERN'`, preventing unauthorized administrative privilege escalation.
- 🚫 **Deactivated Account Invalidation**: `authMiddleware.ts` enforces `isActive: true` checks on every request, immediately blocking deactivated accounts.
- ⚡ **URL & CORS Sanitization**: Automatic sanitization of API URLs prevents double-slash redirects that break browser CORS preflight requests.
- 🌐 **Vercel Serverless Prisma Engine**: Configured Prisma `binaryTargets = ["native", "rhel-openssl-3.0.x"]` and `postinstall` scripts to guarantee Linux query engines are bundled in AWS Lambda / Vercel functions.

---

## 💻 Technology Stack

### Frontend
- **Framework**: React 18+ with TypeScript
- **UI Component Library**: Ant Design 5.0 (v5 design tokens & borderless cards)
- **State Management**: Redux Toolkit & Redux Persist
- **Data Fetching**: React Query (TanStack Query)
- **Charts**: Recharts
- **Icons**: `@ant-design/icons`

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js with TypeScript
- **ORM**: Prisma ORM v5
- **Database**: PostgreSQL (Supabase Cloud or Local Docker)
- **Authentication**: JWT + Refresh Token Rotation
- **Security**: Helmet, CORS origin validation, bcryptjs password hashing

---

## 🌐 Live Cloud Deployment (Vercel + Supabase)

### 1. Database Setup (Supabase)
1. Create a free project on [Supabase](https://supabase.com).
2. Go to **Project Settings -> Database -> Connection String** and copy the **Session Pooler** string (port `5432`):
   ```env
   DATABASE_URL="postgresql://postgres.jfwxbsfjgzjcuwdivvor:%401s2s3s4s5S@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres"
   ```
3. Push schema & seed initial data:
   ```bash
   cd backend
   npx prisma db push
   npx prisma db seed
   ```

### 2. Backend API Deployment (Vercel)
1. Import repository `samartha-hm/intern-management-system` on [Vercel](https://vercel.com).
2. Set **Root Directory** to `backend`.
3. Add Environment Variables:
   - `DATABASE_URL`: *(Your Supabase connection string)*
   - `JWT_SECRET`: `your_super_secret_jwt_key`
   - `REFRESH_TOKEN_SECRET`: `your_super_secret_refresh_token`
   - `NODE_ENV`: `production`

### 3. Frontend Deployment (Vercel)
1. Import the same repository on Vercel.
2. Set **Root Directory** to `frontend`.
3. Add Environment Variable:
   - `REACT_APP_API_URL`: `https://<your-backend-vercel-url>/api`

---

## 🚀 Local Development Setup

### Prerequisites
- Node.js 18+
- Docker & Docker Compose *(optional for local DB)*

### 1. Clone & Install
```bash
git clone https://github.com/samartha-hm/intern-management-system.git
cd intern-management-system

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment Files
- Copy `backend/.env.example` to `backend/.env`
- Copy `frontend/.env.example` to `frontend/.env`

### 3. Start Local Development
```bash
# Start backend (Term 1)
cd backend
npm run dev

# Start frontend (Term 2)
cd frontend
npm start
```
- Frontend runs at: `http://localhost:3001`
- Backend API runs at: `http://localhost:5000/api`

---

## 🔑 Database Schema & Seed Accounts

### Seeded Credentials (Default Development / Test)
| Role | Email | Default Password |
|---|---|---|
| **Admin** | `admin@experimindlabs.com` | `password123` |
| **HR** | `hr@experimindlabs.com` | `password123` |
| **Mentor** | `mentor@experimindlabs.com` | `password123` |
| **Intern** | `intern@experimindlabs.com` | `password123` |

---

## 📡 API Route Reference

### Authentication
- `POST /api/auth/login` — Authenticate user & issue tokens
- `POST /api/auth/register` — Self-registration (strictly INTERN role)
- `POST /api/auth/logout` — Invalidate user session
- `GET /api/auth/me` — Fetch current user profile

### Attendance & Work Diary
- `POST /api/attendance/check-in` — Entrance QR clock-in
- `POST /api/attendance/check-out` — Exit QR clock-out
- `GET /api/attendance/my` — Get logged-in intern attendance logs
- `GET /api/attendance` — Audit all attendance logs (Mentor/HR/Admin)
- `POST /api/work-diary` — Submit daily work summary
- `GET /api/work-diary/my` — View personal work diary timeline
- `PUT /api/work-diary/:id/review` — Review/Approve work diary entries

### User & Internship Management
- `GET /api/users` — List system users & manage intern program durations
- `GET /api/internships` — List active internship cohorts
- `GET /api/applications` — Manage candidate applications

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

© 2026 Experimind Labs. All rights reserved.