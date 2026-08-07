# Quick Start - Resolving Port 3000 Conflict

## Problem
You encountered the error: "http://localhost:3000 is occupied by other project" when trying to start the frontend.

## Solutions

### Solution 1: Change Frontend Port (Recommended - Quickest)
1. Edit `frontend/.env` file:
   ```
   REACT_APP_API_URL=http://localhost:5000/api
   PORT=3001    # Changed from 3000 to 3001
   ```
2. Start the frontend:
   ```powershell
   cd frontend
   npm start
   ```
3. Access the application at: http://localhost:3001

### Solution 2: Stop the Conflicting Process
1. Find what's using port 3000:
   ```powershell
   netstat -ano | findstr :3000
   ```
2. Note the PID (Process ID) from the output
3. Stop the process:
   ```powershell
   taskkill /PID <PID> /F
   ```
4. Start the frontend normally:
   ```powershell
   cd frontend
   npm start
   ```

### Solution 3: Use Docker Compose (Recommended for Full Setup)
This avoids port conflicts entirely by managing ports internally:
```powershell
docker-compose up --build
```
Then access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000/api

## Files Created to Help You

1. **START_FRONTEND.ps1** - PowerShell script that helps you start the frontend while handling port conflicts
2. **START_SYSTEM.bat** - Windows batch file with similar functionality
3. **SETUP_AND_START.ps1** - Complete setup script that guides you through installation and startup
4. **FIX_BACKEND.bat** - Script to fix backend dependency and setup issues
5. **FIX_FRONTEND.bat** - Script to fix frontend dependency issues
6. **FIX_ALL.bat** - Complete fix script for both backend and frontend
7. **INSTALL_DEPS.bat** - Simple script to install missing dependencies
8. **INSTALL_DEPS.ps1** - PowerShell version of dependency installer
9. **STARTUP_GUIDE.md** - Detailed guide with troubleshooting tips
10. **QUICK_START.md** - Port conflict resolution
11. **SETUP_SUMMARY.md** - All fixes documented
12. **Frontend and Backend .env files** - Pre-configured environment files to avoid port conflicts

## Recommended Quick Start

If you just want to get the system running quickly to verify everything works:

```powershell
# Option A: Using the helper script (recommended for port conflict resolution)
.\START_FRONTEND.ps1

# Option B: Using Docker Compose (avoids all port conflicts)
docker-compose up --build
```

## Default Login Credentials (after database setup)

- **Admin**: admin@experimindlabs.com / password123
- **HR Manager**: hr@experimindlabs.com / password123
- **Mentor**: mentor@experimindlabs.com / password123
- **Intern**: intern@experimindlabs.com / password123

## Next Steps

After getting the system running, refer to:
- STARTUP_GUIDE.md for detailed usage and troubleshooting
- PRODUCTION_READINESS.md for deployment preparation
- README.md for complete project documentation