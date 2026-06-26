import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Billaro database...\n');

  // 1. Create default company
  let company = await prisma.company.findFirst({ where: { name: 'Indux Tech' } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Indux Tech',
        logo: '',
        identifiers: [],
      },
    });
    console.log('✓ Default company "Indux Tech" created.');
  } else {
    console.log('✓ Company "Indux Tech" already exists.');
  }

  // 2. Create main branch
  let mainBranch = await prisma.branch.findFirst({
    where: { companyId: company.id, isMainBranch: true },
  });
  if (!mainBranch) {
    mainBranch = await prisma.branch.create({
      data: {
        companyId: company.id,
        name: 'Main Branch',
        isMainBranch: true,
      },
    });
    console.log('✓ Default "Main Branch" created.');
  } else {
    console.log('✓ "Main Branch" already exists.');
  }

  // 3. Helper to seed a user
  const seedUser = async (
    fullName: string,
    email: string,
    phoneNumber: string,
    role: UserRole,
  ) => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('Pass@123', 12);
      const user = await prisma.user.create({
        data: {
          fullName,
          email,
          phoneNumber,
          password: hashedPassword,
          role,
          companyId: company!.id,
          branches: { connect: [{ id: mainBranch!.id }] },
        },
      });
      console.log(`✓ Seeded ${role}: ${email} | Phone: ${phoneNumber} | Password: Pass@123`);
      return user;
    } else {
      console.log(`✓ User ${email} already exists.`);
      return existing;
    }
  };

  // Seed Owner
  const owner = await seedUser('Project Owner', 'admin@project.com', '9999999901', 'OWNER');

  // Link company creator
  if (!company.createdById) {
    await prisma.company.update({
      where: { id: company.id },
      data: { createdById: owner.id },
    });
  }

  // Seed Manager
  await seedUser('Project Manager', 'manager@project.com', '9999999902', 'MANAGER');

  // Seed Staff
  await seedUser('Project Staff', 'user@project.com', '9999999903', 'STAFF');

  console.log('\n✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('✗ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
