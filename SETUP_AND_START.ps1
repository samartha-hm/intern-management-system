# Experimind Labs Intern Management System - Complete Setup Script
# This script guides you through setting up and starting the entire system

Write-Host "Experimind Labs Intern Management System - Complete Setup" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Green
Write-Host ""

# Check if we're in the right directory
if (-Not (Test-Path "frontend\package.json")) {
    Write-Host "Error: Please run this script from the project root directory." -ForegroundColor Red
    Write-Host "Current location: $(Get-Location)" -ForegroundColor Yellow
    exit 1
}

Write-Host "This script will help you set up and start the Intern Management System." -ForegroundColor Yellow
Write-Host ""
Write-Host "Steps we'll go through:" -ForegroundColor Cyan
Write-Host "1. Check prerequisites" -ForegroundColor Cyan
Write-Host "2. Install backend dependencies" -ForegroundColor Cyan
Write-Host "3. Setup database" -ForegroundColor Cyan
Write-Host "4. Install frontend dependencies" -ForegroundColor Cyan
Write-Host "5. Configure environment variables (if needed)" -ForegroundColor Cyan
Write-Host "6. Start the system" -ForegroundColor Cyan
Write-Host ""

$continue = Read-Host "Do you want to continue? (y/n)"
if ($current -notin @('y', 'Y', 'yes', 'Yes')) {
    Write-Host "Setup cancelled." -ForegroundColor Yellow
    exit 0
}

# Step 1: Check prerequisites
Write-Host "`nStep 1: Checking prerequisites..." -ForegroundColor Green

# Check for Node.js
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js not found. Please install Node.js 18+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check for npm
try {
    $npmVersion = npm --version
    Write-Host "✓ npm found: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ npm not found. Please install Node.js which includes npm." -ForegroundColor Red
    exit 1
}

# Check for Docker (optional but recommended)
if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "✓ Docker found" -ForegroundColor Green
    $useDocker = $true
} else {
    Write-Host "○ Docker not found (optional but recommended for database)" -ForegroundColor Yellow
    $useDocker = $false
}

# Step 2: Install backend dependencies
Write-Host "`nStep 2: Installing backend dependencies..." -ForegroundColor Green
cd backend
if (Test-Path "node_modules") {
    Write-Host "Node modules already exist. Skipping npm install." -ForegroundColor Yellow
} else {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install backend dependencies." -ForegroundColor Red
        exit 1
    }
}
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green

# Step 3: Setup database
Write-Host "`nStep 3: Setting up database..." -ForegroundColor Green
if ($useDocker) {
    Write-Host "Starting PostgreSQL and Redis containers..." -ForegroundColor Yellow
    docker-compose up -d db redis
    # Wait a moment for containers to start
    Start-Sleep -Seconds 10
    Write-Host "✓ Database containers started" -ForegroundColor Green
} else {
    Write-Host "Please ensure PostgreSQL and Redis are running locally." -ForegroundColor Yellow
    Write-Host "Default connection strings:" -ForegroundColor Yellow
    Write-Host "  PostgreSQL: postgresql://postgres:postgres_password@localhost:5432/intern_management" -ForegroundColor Yellow
    Write-Host "  Redis: redis://localhost:6379" -ForegroundColor Yellow
    $dbReady = Read-Host "Are your database services running? (y/n)"
    if ($dbReady -notin @('y', 'Y', 'yes', 'Yes')) {
        Write-Host "Please start your database services and run the setup again." -ForegroundColor Red
        exit 1
    }
}

# Run Prisma migrations
Write-Host "Running database migrations..." -ForegroundColor Yellow
npx prisma migrate dev --name init
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to run migrations." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Database migrations completed" -ForegroundColor Green

# Seed database
Write-Host "Seeding database with initial data..." -ForegroundColor Yellow
npx prisma db seed
if ($LASTEXITCODE -ne 0) {
    Write-Host "Failed to seed database." -ForegroundColor Red
    exit 1
}
Write-Host "✓ Database seeded successfully" -ForegroundColor Green

# Step 4: Install frontend dependencies
Write-Host "`nStep 4: Installing frontend dependencies..." -ForegroundColor Green
cd ..\frontend
if (Test-Path "node_modules") {
    Write-Host "Node modules already exist. Skipping npm install." -ForegroundColor Yellow
} else {
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Failed to install frontend dependencies." -ForegroundColor Red
        exit 1
    }
}
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green

# Step 5: Check/configure environment variables
Write-Host "`nStep 5: Checking environment configuration..." -ForegroundColor Green

# Check backend .env
cd ..\backend
if (-Not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Created backend/.env from .env.example" -ForegroundColor Yellow
        Write-Host "Please edit backend/.env to configure your database connection and other settings." -ForegroundColor Yellow
    } else {
        Write-Host "Warning: No .env.example found. You'll need to create backend/.env manually." -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ Backend environment file exists" -ForegroundColor Green
}

# Check frontend .env
cd ..\frontend
if (-Not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Created frontend/.env from .env.example" -ForegroundColor Yellow
    } else {
        # This likely doesn't exist for frontend, but checking anyway
    {
        Copy-Item ".env.example" ".env"
        Write-Host "Created frontend/.env from .env.example" -ForegroundColor Yellow
    } else {
        # Create basic frontend .env
        "REACT_APP_API_URL=http://localhost:5000/api" | Out-File -FilePath ".env" -Encoding utf8
        Write-Host "Created frontend/.env with default API URL" -ForegroundColor Yellow
        Write-Host "You can edit frontend/.env if your backend runs on a different URL." -ForegroundColor Yellow
    }
} else {
    Write-Host "✓ Frontend environment file exists" -ForegroundColor Green
}

# Step 6: Start the system
Write-Host "`nStep 6: Starting the system..." -ForegroundColor Green
Write-Host ""
Write-Host "How would you like to start the system?" -ForegroundColor Cyan
Write-Host "1. Start both frontend and backend (development mode)" -ForegroundColor Yellow
Write-Host "2. Start with Docker Compose (includes database)" -ForegroundColor Yellow
Write-Host "3. Start backend only" -ForegroundColor Yellow
Write-Host "4. Start frontend only" -ForegroundColor Yellow
Write-Host ""

$startChoice = Read-Host "Choose an option (1, 2, 3, or 4)"

switch ($startChoice) {
    "1" {
        Write-Host "`nStarting backend and frontend..." -ForegroundColor Green
        Write-Host "Backend will be available at: http://localhost:5000" -ForegroundColor Yellow
        Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Yellow
        Write-Host "Press Ctrl+C in either terminal to stop the services." -ForegroundColor Yellow
        Write-Host ""

        # Start backend in a new process
        Start-Process powershell -ArgumentList "-NoExit", "$(Get-Location)\backend"; npm run dev" -WindowStyle Normal

        # Start frontend
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd ""$(Get-Location)\frontend""; npm start" -WindowStyle Normal
    }
    "2" {
        Write-Host "`nStarting with Docker Compose..." -ForegroundColor Green
        Write-Host "This will start all services including database and redis." -ForegroundColor Yellow
        Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Yellow
        Write-Host "Backend API will be available at: http://localhost:5000/api" -ForegroundColor Yellow
        Write-Host "Use 'docker-compose down' to stop all services." -ForegroundColor Yellow
        cd .. # Go back to root
        docker-compose up --build
    }
    "3" {
        Write-Host "`nStarting backend only..." -ForegroundColor Green
        Write-Host "Backend will be available at: http://localhost:5000" -ForegroundColor Yellow
        Write-Host "API documentation at: http://localhost:5000/api-docs" -ForegroundColor Yellow
        cd backend
        npm run dev
    }
    "4" {
        Write-Host "`nStarting frontend only..." -ForegroundColor Green
        Write-Host "Frontend will be available at: http://localhost:3000" -ForegroundColor Yellow
        Write-Host "Make sure the backend is running on http://localhost:5000" -ForegroundColor Yellow
        cd frontend
        npm start
    }
    default {
        Write-Host "Invalid option selected." -ForegroundColor Red
    }
}

Write-Host "`nSetup complete!" -ForegroundColor Green
Write-Host "For detailed information about the system, see:" -ForegroundColor Cyan
Write-Host "- README.md: Project overview and features" -ForegroundColor Cyan
Write-Host "- STARTUP_GUIDE.md: Detailed startup and troubleshooting guide" -ForegroundColor Cyan
Write-Host "- PRODUCTION_READINESS.md: Production deployment guidelines" -ForegroundColor Cyan