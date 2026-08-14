# Quick Start Guide: Experimind Labs Intern Management System

## �� 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd intern-management-system
```

2. **Backend Setup**
```bash
cd backend
npm install
# Create .env file from .env.example
cp .env.example .env
# Edit .env with your database credentials
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install
# Create .env file from .env.example
cp .env.example .env
```

### Database Setup

1. **Generate Prisma client**
```bash
cd backend
prisma generate
```

2. **Run migrations** (including device binding)
```bash
prisma migrate dev --name init
prisma migrate dev --name add-device-id-to-attendance
prisma migrate deploy
```

3. **Seed the database**
```bash
prisma db seed
```

### Running the Application

1. **Start backend**
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

2. **Start frontend**
```bash
cd frontend
npm start
# Application runs on http://localhost:3001
```

## �� 🔐 Default Credentials

### Regular Users
- **Admin**: admin@experimindlabs.com / password123
- **HR**: hr@experimindlabs.com / password123
- **Mentor**: mentor@experimindlabs.com / password123
- **Intern**: intern@experimindlabs.com / password123

### Kiosk/Tablet User
- **Kiosk**: kiosk@experimindlabs.com / EXP@123labs

## �� 📱 Tablet Kiosk Usage

1. Login with kiosk credentials at http://localhost:3001/login
2. System automatically redirects to swipe interface
3. Swipe left/right to navigate between:
   - Entrance QR Code (Check-In)
   - Exit QR Code (Check-Out)
4. Both pages show simplified UI with only QR code and scanner

## �� 🔒 Attendance Security

The device binding feature ensures:
- Only one person can use a device for active attendance session
- Check-in blocked if device already in use by another user
- Check-out requires same device used for check-in
- Device becomes available after check-out

## �� 🧪 Testing

### Tablet Kiosk
1. Login as kiosk@experimindlabs.com / EXP@123labs
2. Verify swipe navigation works
3. Confirm simplified UI (QR + scanner only)

### Device Binding
1. Have Intern A check in on Device 1
2. Have Intern B attempt check-in on Device 1 → Should fail
3. Have Intern A check out from Device 1
4. Have Intern B check in on Device 1 → Should succeed
5. Have Intern A check in on Device 2, attempt check-out on Device 3 → Should fail
6. Have Intern A check out from Device 2 → Should succeed

## �� 📚 Documentation

- [IMPLEMENTATION_COMPLETE.md](IMPLEMENTATION_COMPLETE.md) - Detailed implementation summary
- [FINAL_SUMMARY.md](FINAL_SUMMARY.md) - Feature overview
- [DEVICE_BINDING_SUMMARY.md](DEVICE_BINDING_SUMMARY.md) - Security feature details
- [IMPLEMENTATION_VERIFICATION.md](IMPLEMENTATION_VERIFICATION.md) - Verification checklist

## �� 🛠��️ Troubleshooting

### Common Issues
1. **Port conflicts**: Frontend runs on 3001, backend on 5000
2. **Environment variables**: Ensure .env files are properly configured
3. **Database connection**: Verify PostgreSQL is running and credentials correct
4. **Prisma generation**: Run `prisma generate` after schema changes

### Logs
- Backend: Check console output or logs directory
- Frontend: Check browser console for errors

## �� 📞 Support

For issues or questions, refer to the implementation documentation or contact the development team.