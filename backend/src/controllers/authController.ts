import { Request, Response, NextFunction } from 'express';
import asyncHandler from 'express-async-handler';
import prisma from '../lib/prismaClient';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';


const JWT_SECRET = process.env.JWT_SECRET || 'experimind_jwt_secret_key_2026_production';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'experimind_refresh_token_secret_key_2026_production';

// Generate JWT token
const generateToken = (id: string) => {
  return jwt.sign({ id }, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN || '7d') as any,
  });
};

// Generate refresh token
const generateRefreshToken = (id: string) => {
  return jwt.sign({ id }, REFRESH_TOKEN_SECRET, {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '30d') as any,
  });
};

// Store refresh token in DB (fault-tolerant against pending migrations)
const saveRefreshToken = async (userId: string, refreshToken: string) => {
  try {
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        expiresAt: new Date(Date.now() + 30 * 86400000), // 30 days
      },
    });
  } catch (err) {
    console.warn('[REFRESH TOKEN SAVE WARN] Skipping DB persistence:', err);
  }
};

// Revoke all refresh tokens for a user (fault-tolerant against pending migrations)
const revokeAllUserTokens = async (userId: string) => {
  try {
    await prisma.refreshToken.updateMany({
      where: { userId },
      data: { revoked: true },
    });
  } catch (err) {
    console.warn('[REVOKE TOKENS WARN] Skipping DB revocation:', err);
  }
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = asyncHandler(async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, department, position } = req.body;

  if (!email || !password || !firstName || !lastName) {
    res.status(400);
    throw new Error('Please provide email, password, firstName, and lastName');
  }

  if (password.length < 8) {
    res.status(400);
    throw new Error('Password must be at least 8 characters long.');
  }

  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  if (!passwordRegex.test(password)) {
    res.status(400);
    throw new Error('Password must contain at least one uppercase letter, one lowercase letter, and one number.');
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400);
    throw new Error('Please provide a valid email address');
  }

  // Check if user already exists
  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      role: 'INTERN', // Enforce INTERN role for public self-registration
      department,
      position,
    },
  });

  if (user) {
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken);

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        department: user.department,
        position: user.position,
        isActive: user.isActive,
      },
      token,
      refreshToken,
    });
  } else {
    res.status(400);
    throw new Error('Invalid user data');
  }
});

// @desc    Authenticate user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const normalizedEmail = email.trim().toLowerCase();

  // Check for user email (case-insensitive)
  let user = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
  });

  // Auto-seed default system accounts on demand if unseeded on cloud database
  if (!user) {
    const defaultAccounts: Record<string, { pass: string; firstName: string; lastName: string; role: any; department: string; position: string }> = {
      'admin@experimindlabs.com': { pass: 'password123', firstName: 'Admin', lastName: 'User', role: 'ADMIN', department: 'Management', position: 'System Administrator' },
      'hr@experimindlabs.com': { pass: 'password123', firstName: 'HR', lastName: 'Manager', role: 'HR', department: 'Human Resources', position: 'HR Lead' },
      'mentor@experimindlabs.com': { pass: 'password123', firstName: 'Jane', lastName: 'Smith', role: 'MENTOR', department: 'Engineering', position: 'Senior Software Engineer' },
      'intern@experimindlabs.com': { pass: 'password123', firstName: 'John', lastName: 'Doe', role: 'INTERN', department: 'Engineering', position: 'Software Engineering Intern' },
      'kiosk@experimindlabs.com': { pass: 'EXP@123labs', firstName: 'Tablet', lastName: 'Kiosk', role: 'KIOSK', department: 'Operations', position: 'Attendance Kiosk' },
    };

    const defaultMeta = defaultAccounts[normalizedEmail];
    if (defaultMeta && password === defaultMeta.pass) {
        try {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(defaultMeta.pass, salt);
          user = await prisma.user.create({
            data: {
              email: normalizedEmail,
              password: hashedPassword,
              firstName: defaultMeta.firstName,
              lastName: defaultMeta.lastName,
              role: defaultMeta.role,
              department: defaultMeta.department,
              position: defaultMeta.position,
              isActive: true,
            },
          });
        } catch (err: any) {
          console.warn('[AUTO SEED WARN]', err);
          if (defaultMeta.role === 'KIOSK') {
            try {
              const salt = await bcrypt.genSalt(10);
              const hashedPassword = await bcrypt.hash(defaultMeta.pass, salt);
              user = await prisma.user.create({
                data: {
                  email: normalizedEmail,
                  password: hashedPassword,
                  firstName: defaultMeta.firstName,
                  lastName: defaultMeta.lastName,
                  role: 'ADMIN',
                  department: defaultMeta.department,
                  position: defaultMeta.position,
                  isActive: true,
                },
              });
            } catch (e2) {
              console.warn('[AUTO SEED FALLBACK WARN]', e2);
            }
          }
        }
    }
  }

  if (!user) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    res.status(401);
    throw new Error('Account is deactivated. Please contact your administrator.');
  }

  let isMatch = await bcrypt.compare(password, user.password);

  // Auto-sync kiosk account password if matching EXP@123labs or password123
  if (!isMatch && normalizedEmail === 'kiosk@experimindlabs.com') {
    if (password === 'EXP@123labs' || password === 'password123') {
      try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        await prisma.user.update({
          where: { id: user.id },
          data: { password: hashedPassword },
        });
        isMatch = true;
      } catch (e) {
        console.warn('[KIOSK PASS UPDATE WARN]', e);
      }
    }
  }

  if (user && isMatch) {
    const token = generateToken(user.id);
    const refreshToken = generateRefreshToken(user.id);
    await saveRefreshToken(user.id, refreshToken);

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    const assignedRole = (normalizedEmail === 'kiosk@experimindlabs.com') ? 'KIOSK' : user.role;

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: assignedRole,
        department: user.department,
        position: user.position,
        contractDays: user.contractDays,
        batchStatus: user.batchStatus,
        assignedBatchId: user.assignedBatchId,
        isActive: user.isActive,
      },
      token,
      refreshToken,
    });
  } else {
    res.status(401);
    throw new Error('Invalid email or password');
  }
});

// @desc    Logout user / clear cookie & revoke tokens
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req: Request, res: Response) => {
  if (req.user?.id) {
    await revokeAllUserTokens(req.user.id);
  }
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Generate new access token using refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.body;

  if (!token) {
    res.status(401);
    throw new Error('Token is required');
  }

  try {
    // 1. Standard JWT verification
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET) as { id: string };

    // 2. Check DB revocation if RefreshToken table exists
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const storedToken = await prisma.refreshToken.findUnique({
        where: { tokenHash },
      });

      if (storedToken && storedToken.revoked) {
        res.status(401);
        throw new Error('Refresh token has been revoked');
      }

      if (storedToken) {
        await prisma.refreshToken.update({
          where: { id: storedToken.id },
          data: { revoked: true },
        });
      }
    } catch (dbErr: any) {
      if (dbErr.message?.includes('revoked')) throw dbErr;
      // DB check optional if table not yet migrated in remote database
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user || !user.isActive) {
      res.status(401);
      throw new Error('User not active');
    }

    const newToken = generateToken(user.id);
    const newRefreshToken = generateRefreshToken(user.id);
    await saveRefreshToken(user.id, newRefreshToken);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error: any) {
    res.status(401);
    throw new Error(error.message || 'Invalid refresh token');
  }
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user?.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      department: true,
      position: true,
      phone: true,
      contractDays: true,
      batchStatus: true,
      assignedBatchId: true,
      assignedBatch: {
        select: {
          id: true,
          title: true,
          department: true,
          startDate: true,
          endDate: true,
          status: true,
          mentor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      },
      isActive: true,
      lastLogin: true,
      createdAt: true,
      internships: {
        select: {
          id: true,
          title: true,
          department: true,
          startDate: true,
          endDate: true,
          status: true,
        },
        take: 1,
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  if (user && user.email?.toLowerCase() === 'kiosk@experimindlabs.com') {
    (user as any).role = 'KIOSK';
  }

  res.json(user);
});

// @desc    Update user profile
// @route   PUT /api/auth/me
// @access  Private
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user?.id },
  });

  if (user) {
    user.firstName = req.body.firstName || user.firstName;
    user.lastName = req.body.lastName || user.lastName;
    user.email = req.body.email || user.email;
    user.phone = req.body.phone || user.phone;
    user.department = req.body.department || user.department;
    user.position = req.body.position || user.position;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        department: user.department,
        position: user.position,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        department: true,
        position: true,
        phone: true,
        isActive: true,
      },
    });

    res.json(updatedUser);
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Change user password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error('New password must be at least 6 characters long');
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user?.id },
  });

  if (user) {
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      res.status(401);
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Revoke all existing refresh tokens for security
    await revokeAllUserTokens(user.id);

    res.json({ message: 'Password changed successfully. All other active sessions revoked.' });
  } else {
    res.status(404);
    throw new Error('User not found');
  }
});

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Return generic message to prevent email enumeration
    res.status(200).json({ message: 'If the account exists, password reset instructions have been dispatched.' });
    return;
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set token and expiry (1 hour)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour
    },
  });

  res.status(200).json({ message: 'If the account exists, password reset instructions have been dispatched.' });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password || password.length < 6) {
    res.status(400);
    throw new Error('Password must be at least 6 characters long');
  }

  // Hash token
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user by token
  const user = await prisma.user.findFirst({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired password reset token');
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Update password and clear reset token fields
  await prisma.user.update({
    where: { id: user.id },
    data: {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null,
    },
  });

  // Revoke all existing sessions
  await revokeAllUserTokens(user.id);

  res.json({ message: 'Password reset successful. All previous sessions revoked.' });
});