import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = Router();

/**
 * POST /api/auth/register
 * Body: { fullName, phoneNumber, email, password }
 * Creates a new owner user (no company yet — company setup is a separate step).
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, phoneNumber, email, password } = req.body;

    // --- Validation ---
    if (!fullName || !phoneNumber || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Full name, phone number, email, and password are required.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
      return;
    }

    // Check for existing user
    const existingUser = await User.findOne({
      $or: [
        { phoneNumber },
        { email: email.toLowerCase().trim() },
      ],
    });

    if (existingUser) {
      const field = existingUser.phoneNumber === phoneNumber ? 'phone number' : 'email';
      res.status(409).json({
        success: false,
        message: `An account with this ${field} already exists.`,
      });
      return;
    }

    // Create the owner user (companyId is null until company setup)
    const user = await User.create({
      fullName,
      phoneNumber,
      email: email.toLowerCase().trim(),
      password,
      role: 'owner',
      companyId: null,
      branches: [],
      createdBy: null,
    });

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const jwtExpiresInDays = parseInt(process.env.JWT_EXPIRES_IN || '7', 10);
    const expiresInSeconds = jwtExpiresInDays * 24 * 60 * 60;

    const token = jwt.sign(
      {
        userId: user._id,
        phoneNumber: user.phoneNumber,
        companyId: null,
        role: user.role,
        branches: [],
      },
      jwtSecret,
      { expiresIn: expiresInSeconds }
    );

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please set up your company.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        role: user.role,
        companyId: null,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error.message);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

/**
 * POST /api/auth/login
 * Body: { phoneNumber?, email?, password }
 * Returns JWT token + user data on success
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { phoneNumber, email, password } = req.body;

    // --- Validation ---
    if ((!phoneNumber && !email) || !password) {
      res.status(400).json({
        success: false,
        message: 'Phone number or email, and password are required.',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters.',
      });
      return;
    }

    // --- Find user ---
    let user = null;
    if (email) {
      user = await User.findOne({ email: email.toLowerCase().trim() });
    } else if (phoneNumber) {
      user = await User.findOne({ phoneNumber });
    }

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'No account found with these credentials.',
      });
      return;
    }

    // Check if user is active
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Contact your administrator.',
      });
      return;
    }

    // --- Compare password ---
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Incorrect password. Please try again.',
      });
      return;
    }

    // --- Update last login ---
    user.lastLoginAt = new Date();
    await user.save();

    // --- Generate JWT ---
    const jwtSecret = process.env.JWT_SECRET || 'fallback_secret';
    const jwtExpiresInDays = parseInt(process.env.JWT_EXPIRES_IN || '7', 10);
    const expiresInSeconds = jwtExpiresInDays * 24 * 60 * 60;

    const token = jwt.sign(
      {
        userId: user._id,
        phoneNumber: user.phoneNumber,
        companyId: user.companyId,
        role: user.role,
        branches: user.branches,
      },
      jwtSecret,
      { expiresIn: expiresInSeconds }
    );

    // --- Success response ---
    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        role: user.role,
        companyId: user.companyId,
        branches: user.branches,
      },
    });
  } catch (error: any) {
    console.error('Login error:', error.message);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

export default router;
