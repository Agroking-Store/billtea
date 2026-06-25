import { Router, Response } from 'express';
import Company from '../models/Company';
import Branch from '../models/Branch';
import User from '../models/User';
import { authMiddleware, AuthRequest } from '../middleware/authMiddleware';
import { requireRole } from '../middleware/roleMiddleware';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * POST /api/company/setup
 * Body: { name, logo?, identifiers?, mainBranch?: { name?, address?, city?, state?, pincode?, phone?, email? } }
 * Creates a new company + main branch and links them to the authenticated user.
 * Only works if the user doesn't already have a company.
 */
router.post('/setup', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Check if user already has a company
    if (req.companyId) {
      res.status(400).json({
        success: false,
        message: 'You already have a company set up.',
      });
      return;
    }

    const { name, logo, identifiers, mainBranch } = req.body;

    if (!name) {
      res.status(400).json({
        success: false,
        message: 'Company name is required.',
      });
      return;
    }

    // Create the company
    const company = await Company.create({
      name,
      logo: logo || '',
      identifiers: identifiers || [],
      createdBy: req.userId,
    });

    // Create the main branch
    const branch = await Branch.create({
      companyId: company._id,
      name: mainBranch?.name || 'Main Branch',
      isMainBranch: true,
      address: mainBranch?.address || '',
      city: mainBranch?.city || '',
      state: mainBranch?.state || '',
      pincode: mainBranch?.pincode || '',
      phone: mainBranch?.phone || '',
      email: mainBranch?.email || '',
    });

    // Update the user with companyId and assign to main branch
    await User.findByIdAndUpdate(req.userId, {
      companyId: company._id,
      branches: [branch._id],
    });

    res.status(201).json({
      success: true,
      message: 'Company set up successfully.',
      company,
      mainBranch: branch,
    });
  } catch (error: any) {
    console.error('Company setup error:', error.message);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

/**
 * GET /api/company
 * Returns the current user's company details.
 */
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(404).json({
        success: false,
        message: 'No company found. Please set up your company first.',
      });
      return;
    }

    const company = await Company.findById(req.companyId);
    if (!company) {
      res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      company,
    });
  } catch (error: any) {
    console.error('Get company error:', error.message);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

/**
 * PUT /api/company
 * Body: { name?, logo?, identifiers? }
 * Updates company details. Owner only.
 */
router.put('/', requireRole('owner'), async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.companyId) {
      res.status(404).json({
        success: false,
        message: 'No company found.',
      });
      return;
    }

    const { name, logo, identifiers } = req.body;
    const updateData: any = {};

    if (name !== undefined) updateData.name = name;
    if (logo !== undefined) updateData.logo = logo;
    if (identifiers !== undefined) updateData.identifiers = identifiers;

    const company = await Company.findByIdAndUpdate(
      req.companyId,
      updateData,
      { new: true, runValidators: true }
    );

    if (!company) {
      res.status(404).json({
        success: false,
        message: 'Company not found.',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Company updated successfully.',
      company,
    });
  } catch (error: any) {
    console.error('Update company error:', error.message);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred. Please try again later.',
    });
  }
});

export default router;
