import { Router, Response } from 'express';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

// All routes require authentication + owner role
router.use(authMiddleware);
router.use(requireRole('owner'));

/**
 * POST /api/users/create
 * Body: { fullName, phoneNumber, email, password, role, branches? }
 * Owner creates a sub-user. Returns the created user's credentials.
 */
router.post('/create', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({
        success: false,
        message: 'You must set up a company before creating users.',
      });
      return;
    }

    const { fullName, phoneNumber, email, password, role, branches } = req.body;

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

    const validRoles = ['manager', 'staff'];
    if (!role || !validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        message: 'Role must be either "manager" or "staff".',
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
        message: `A user with this ${field} already exists.`,
      });
      return;
    }

    // Create the sub-user
    const user = await User.create({
      fullName,
      phoneNumber,
      email: email.toLowerCase().trim(),
      password, // Will be hashed by pre-save hook
      role,
      companyId: req.companyId,
      branches: branches || [],
      createdBy: req.userId,
    });

    // Return credentials (password in plain text for the owner to share)
    res.status(201).json({
      success: true,
      message: 'User created successfully.',
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        branches: user.branches,
      },
      credentials: {
        phoneNumber: user.phoneNumber,
        email: user.email,
        password: password, // Return the plain-text password for the owner to share
      },
    });
  } catch (error: any) {
    console.error('Create user error:', error.message);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

/**
 * GET /api/users
 * Returns all users in the owner's company.
 */
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({
        success: false,
        message: 'No company found.',
      });
      return;
    }

    const users = await User.find({ companyId: req.companyId })
      .select('-password')
      .populate('branches', 'name isMainBranch')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error: any) {
    console.error('List users error:', error.message);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

/**
 * PUT /api/users/:id
 * Body: { fullName?, phoneNumber?, email?, role?, branches?, isActive? }
 * Updates a sub-user. Owner only. Cannot modify another owner.
 */
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser || String(targetUser.companyId) !== String(req.companyId)) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      });
      return;
    }

    // Prevent modifying another owner
    if (targetUser.role === 'owner' && String(targetUser._id) !== String(req.userId)) {
      res.status(403).json({
        success: false,
        message: 'You cannot modify another owner.',
      });
      return;
    }

    const { fullName, phoneNumber, email, role, branches, isActive } = req.body;
    const updateData: any = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (role !== undefined && ['manager', 'staff'].includes(role)) updateData.role = role;
    if (branches !== undefined) updateData.branches = branches;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'User updated successfully.',
      user: updatedUser,
    });
  } catch (error: any) {
    console.error('Update user error:', error.message);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

/**
 * DELETE /api/users/:id
 * Soft-deactivates a sub-user. Owner only. Cannot deactivate self or another owner.
 */
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const targetUser = await User.findById(req.params.id);

    if (!targetUser || String(targetUser.companyId) !== String(req.companyId)) {
      res.status(404).json({
        success: false,
        message: 'User not found.',
      });
      return;
    }

    if (String(targetUser._id) === String(req.userId)) {
      res.status(400).json({
        success: false,
        message: 'You cannot deactivate your own account.',
      });
      return;
    }

    if (targetUser.role === 'owner') {
      res.status(403).json({
        success: false,
        message: 'You cannot deactivate another owner.',
      });
      return;
    }

    targetUser.isActive = false;
    await targetUser.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully.',
    });
  } catch (error: any) {
    console.error('Delete user error:', error.message);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

export default router;
