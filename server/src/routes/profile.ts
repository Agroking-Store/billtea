import { Router, Response } from 'express';
import User from '../models/User';
import Company from '../models/Company';
import Branch from '../models/Branch';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// All profile routes require authentication
router.use(authMiddleware);

/**
 * GET /api/profile
 * Returns the authenticated user's full profile with populated company & branch data.
 */
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.userId)
      .select('-password')
      .populate('createdBy', 'fullName email');

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Fetch company details if user has one
    let company = null;
    if (user.companyId) {
      company = await Company.findById(user.companyId);
    }

    // Fetch branch details — populated with names
    let branches: any[] = [];
    if (user.branches && user.branches.length > 0) {
      branches = await Branch.find({ _id: { $in: user.branches } })
        .select('name isMainBranch city state');
    } else if (user.companyId) {
      // Empty branches array means "all branches"
      branches = await Branch.find({ companyId: user.companyId, isActive: true })
        .select('name isMainBranch city state');
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        profilePicture: user.profilePicture,
        role: user.role,
        isActive: user.isActive,
        lastLoginAt: user.lastLoginAt,
        createdBy: user.createdBy,
        createdAt: user.createdAt,
      },
      company: company
        ? {
            id: company._id,
            name: company.name,
            logo: company.logo,
            identifiers: company.identifiers,
          }
        : null,
      branches,
      allBranches: user.branches.length === 0, // true = global access
    });
  } catch (error: any) {
    console.error('Get profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

/**
 * PUT /api/profile
 * Body: { fullName?, email?, phoneNumber?, profilePicture? }
 * Updates the authenticated user's personal details.
 */
router.put('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { fullName, email, phoneNumber, profilePicture } = req.body;
    const updateData: any = {};

    if (fullName !== undefined) updateData.fullName = fullName;
    if (profilePicture !== undefined) updateData.profilePicture = profilePicture;

    // If email is being changed, check for duplicates
    if (email !== undefined) {
      const normalizedEmail = email.toLowerCase().trim();
      const existing = await User.findOne({ email: normalizedEmail, _id: { $ne: req.userId } });
      if (existing) {
        res.status(409).json({
          success: false,
          message: 'This email is already in use by another account.',
        });
        return;
      }
      updateData.email = normalizedEmail;
    }

    // If phone is being changed, check for duplicates
    if (phoneNumber !== undefined) {
      const existing = await User.findOne({ phoneNumber, _id: { $ne: req.userId } });
      if (existing) {
        res.status(409).json({
          success: false,
          message: 'This phone number is already in use by another account.',
        });
        return;
      }
      updateData.phoneNumber = phoneNumber;
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    // Also update the localStorage-compatible user object in response
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        phoneNumber: updatedUser.phoneNumber,
        profilePicture: updatedUser.profilePicture,
        role: updatedUser.role,
        companyId: updatedUser.companyId,
        branches: updatedUser.branches,
      },
    });
  } catch (error: any) {
    console.error('Update profile error:', error.message);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

/**
 * PUT /api/profile/password
 * Body: { currentPassword, newPassword }
 * Changes the authenticated user's password.
 */
router.put('/password', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        message: 'Current password and new password are required.',
      });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters.',
      });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found.' });
      return;
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Current password is incorrect.',
      });
      return;
    }

    user.password = newPassword; // Pre-save hook will hash it
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully.',
    });
  } catch (error: any) {
    console.error('Change password error:', error.message);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

export default router;
