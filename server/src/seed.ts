import User from './models/User';
import Company from './models/Company';
import Branch from './models/Branch';

/**
 * Seeds a default admin user with a company and main branch if no users exist.
 * Credentials:
 *   Phone: 8180849725
 *   Email: admin@indux.com
 *   Password: pass@123
 */
export async function seedDefaultUser(): Promise<void> {
  try {
    // 1. Check or create the default company & branch
    let company = await Company.findOne({ name: 'Indux Tech' });
    if (!company) {
      company = await Company.create({
        name: 'Indux Tech',
        logo: '',
        identifiers: [],
      });
      console.log('✓ Default company "Indux Tech" created.');
    }

    let mainBranch = await Branch.findOne({ companyId: company._id, isMainBranch: true });
    if (!mainBranch) {
      mainBranch = await Branch.create({
        companyId: company._id,
        name: 'Main Branch',
        isMainBranch: true,
      });
      console.log('✓ Default "Main Branch" created.');
    }

    // 2. Helper to check and create a user
    const checkAndCreateUser = async (fullName: string, email: string, phoneNumber: string, role: 'owner' | 'manager' | 'staff') => {
      const existing = await User.findOne({ email });
      if (!existing) {
        const newUser = await User.create({
          fullName,
          email,
          phoneNumber,
          password: 'Pass@123', // Will be hashed by pre-save hook
          role,
          companyId: company?._id,
          branches: [mainBranch?._id],
          createdBy: null,
        });
        console.log(`✓ Seeded ${role}: ${email} | Phone: ${phoneNumber} | Password: Pass@123`);
        return newUser;
      } else {
        console.log(`✓ User ${email} already exists.`);
        return existing;
      }
    };

    // Seed Owner
    const owner = await checkAndCreateUser('Project Owner', 'admin@project.com', '9999999901', 'owner');
    if (company && !company.createdBy) {
      company.createdBy = owner._id as any;
      await company.save();
    }

    // Seed Manager
    await checkAndCreateUser('Project Manager', 'manager@project.com', '9999999902', 'manager');

    // Seed Staff
    await checkAndCreateUser('Project Staff', 'user@project.com', '9999999903', 'staff');

  } catch (error: any) {
    console.error('✗ Error seeding default users:', error.message);
  }
}
