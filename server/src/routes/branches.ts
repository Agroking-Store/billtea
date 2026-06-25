import { Router, Response } from 'express';
import Branch from '../models/Branch';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/branches
 * Body: { name, address?, city?, state?, pincode?, phone?, email?, bankName?, accountNumber?, ifscCode?, upiId?, signatureType?, signatureValue? }
 * Creates a new branch. Owner only.
 */
router.post('/', requireRole('owner'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(400).json({
        success: false,
        message: 'You must set up a company before creating branches.',
      });
      return;
    }

    const {
      name, address, city, state, pincode, phone, email,
      bankName, accountNumber, ifscCode, upiId,
      signatureType, signatureValue,
    } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Branch name is required.',
      });
      return;
    }

    const branch = await Branch.create({
      companyId: req.companyId,
      name,
      isMainBranch: false,
      address: address || '',
      city: city || '',
      state: state || '',
      pincode: pincode || '',
      phone: phone || '',
      email: email || '',
      bankName: bankName || '',
      accountNumber: accountNumber || '',
      ifscCode: ifscCode || '',
      upiId: upiId || '',
      signatureType: signatureType || 'text',
      signatureValue: signatureValue || '',
    });

    res.status(201).json({
      success: true,
      message: 'Branch created successfully.',
      branch,
    });
  } catch (error: any) {
    // Handle duplicate branch name
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'A branch with this name already exists in your company.',
      });
      return;
    }
    console.error('Create branch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

/**
 * GET /api/branches
 * Returns all branches for the user's company.
 * All authenticated users can view branches.
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

    const branches = await Branch.find({ companyId: req.companyId, isActive: true })
      .sort({ isMainBranch: -1, createdAt: 1 }); // Main branch first

    res.status(200).json({
      success: true,
      branches,
    });
  } catch (error: any) {
    console.error('List branches error:', error.message);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

/**
 * PUT /api/branches/:id
 * Updates a branch. Owner only.
 */
router.put('/:id', requireRole('owner'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch || String(branch.companyId) !== String(req.companyId)) {
      res.status(404).json({
        success: false,
        message: 'Branch not found.',
      });
      return;
    }

    const {
      name, address, city, state, pincode, phone, email,
      bankName, accountNumber, ifscCode, upiId,
      signatureType, signatureValue,
    } = req.body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (bankName !== undefined) updateData.bankName = bankName;
    if (accountNumber !== undefined) updateData.accountNumber = accountNumber;
    if (ifscCode !== undefined) updateData.ifscCode = ifscCode;
    if (upiId !== undefined) updateData.upiId = upiId;
    if (signatureType !== undefined) updateData.signatureType = signatureType;
    if (signatureValue !== undefined) updateData.signatureValue = signatureValue;

    const updatedBranch = await Branch.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Branch updated successfully.',
      branch: updatedBranch,
    });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({
        success: false,
        message: 'A branch with this name already exists in your company.',
      });
      return;
    }
    console.error('Update branch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

/**
 * DELETE /api/branches/:id
 * Soft-deactivates a branch. Owner only. Cannot delete the main branch.
 */
router.delete('/:id', requireRole('owner'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const branch = await Branch.findById(req.params.id);

    if (!branch || String(branch.companyId) !== String(req.companyId)) {
      res.status(404).json({
        success: false,
        message: 'Branch not found.',
      });
      return;
    }

    if (branch.isMainBranch) {
      res.status(400).json({
        success: false,
        message: 'Main branch cannot be deleted.',
      });
      return;
    }

    branch.isActive = false;
    await branch.save();

    res.status(200).json({
      success: true,
      message: 'Branch deactivated successfully.',
    });
  } catch (error: any) {
    console.error('Delete branch error:', error.message);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

export default router;
