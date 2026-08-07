# Experimind Labs Intern Management System - Startup Guide

## Quick Start

### Option 1: Using Docker Compose (Recommended)
This is the easiest way to get the full system running with all dependencies.

```powershell
# From the project root directory
docker-compose up --build
```

The system will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Option 2: Local Development (Manual Setup)

#### Prerequisites
- Node.js 18+ and npm
- PostgreSQL
- Redis

#### Backend Setup
```powershell
cd backend
npm install
npm run dev
```

#### Frontend Setup
```powershell
cd frontend
npm install
npm start
```

## Handling Port Conflicts

If you encounter the error "http://localhost:3000 is occupied by other project", you have several options:

### Solution 1: Change Frontend Port (Recommended)
1. Edit the frontend/.env file:
   ```env
   REACT_APP_API_URL=http://localhost:5000/api
   PORT=3001  # Changed from 3000 to 3001
   ```
2. Start the frontend:
   ```powershell
   cd frontend
   npm start
   ```
3. Access the application at: http://localhost:3001

### Solution 2: Stop the Existing Process
1. Find what's using port 3000:
   ```powershell
   netstat -ano | findstr :3000
   ```
2. Kill the process (replace PID with the actual process ID):
   ```powershell
   taskkill /PID <PID> /F
   ```
3. Start the frontend normally:
   ```powershell
   cd frontend
   npm start
   ```

### Solution 3: Use Docker Compose (Avoids Port Conflicts)
As mentioned above, Docker Compose manages ports internally and avoids conflicts with your host machine's ports.

## Environment Files

Make sure you have created the environment files:
- frontend/.env (created from frontend/.env.example)
- backend/.env (created from backend/.env.example)

These files have been pre-created for you with appropriate default values.

## Default Login Credentials

After setting up the database with seed data, you can log in with:

### Admin
- Email: admin@experimindlabs.com
- Password: password123

### HR Manager
- Email: hr@experimindlabs.com
- Password: password123

### Mentor
- Email: mentor@experimindlabs.com
- Password: password123

### Intern
- Email: intern@experimindlabs.com
- Password: password123

## Database Setup

If you're not using Docker Compose, you'll need to set up the database manually:

1. Create a PostgreSQL database named "intern_management"
2. Run the Prisma migrations:
   ```powershell
   cd backend
   npx prisma migrate dev
   ```
3. Seed the database with initial data:
   ```powershell
   npx prisma db seed
   ```

## Troubleshooting

### "Cannot find module" errors
Make sure you've run `npm install` in both the backend and frontend directories.
If you encounter issues with missing modules like `express-async-handler`, `morgan`, or `react-scripts`, run the fix scripts:
```powershell
# For backend dependency issues
.\FIX_BACKEND.bat

# For frontend dependency issues  
.\FIX_FRONTEND.bat

# For complete system fix
.\FIX_ALL.bat

# Or install dependencies directly
.\INSTALL_DEPS.bat
```

### Prisma Migration Errors
If you encounter issues with Prisma migrations, try:
```powershell
npx prisma migrate reset --force
```

### Port Already in Use
Refer to the "Handling Port Conflicts" section above.

### Docker Issues
Make sure Docker Desktop is running and you have sufficient permissions to execute Docker commands.

### Specific Error: "Cannot find module './seed.ts'"
If you see this error when running `npx prisma db seed`, it's usually a path issue. Try running the command from the backend directory:
```powershell
cd backend
npx prisma db seed
```

## Production Deployment

For production deployment, refer to the PRODUCTION_READINESS.md file which contains comprehensive guidelines for:
- Security hardening
- Performance optimization
- Monitoring and logging
- Database considerations
- CI/CD pipeline setup
- Backup and disaster recovery
- Testing and validation
- Go-live checklist

## Support

If you encounter any issues, please check:
1. The PRODUCTION_READINESS.md file for detailed deployment guidance
2. The troubleshooting section above
3. Ensure all prerequisites are installed and running
4. Check that environment files are correctly configured

Happy coding!