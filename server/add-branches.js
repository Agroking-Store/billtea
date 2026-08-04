const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addDemoBranches() {
  try {
    const company = await prisma.company.findFirst({ where: { name: 'Indux Tech' } });
    if (!company) {
      console.log('Company not found');
      return;
    }

    const branchesToAdd = [
      { name: 'Mumbai Branch', city: 'Mumbai', address: 'Andheri East, Mumbai' },
      { name: 'Surat Branch', city: 'Surat', address: 'Ring Road, Surat' },
      { name: 'Ahmedabad Branch', city: 'Ahmedabad', address: 'CG Road, Ahmedabad' },
    ];

    for (const b of branchesToAdd) {
      const existing = await prisma.branch.findFirst({
        where: { companyId: company.id, name: b.name }
      });

      if (!existing) {
        await prisma.branch.create({
          data: {
            companyId: company.id,
            name: b.name,
            city: b.city,
            address: b.address,
            isMainBranch: false,
            isActive: true,
          }
        });
        console.log(`Created branch: ${b.name}`);
      } else {
        console.log(`Branch already exists: ${b.name}`);
      }
    }

    const allBranches = await prisma.branch.findMany({ where: { companyId: company.id } });
    console.log('\nAll branches currently in Database for Indux Tech:');
    allBranches.forEach(b => console.log(`- ${b.name} (ID: ${b.id}, Main: ${b.isMainBranch})`));

  } catch (err) {
    console.error('Error adding branches:', err);
  } finally {
    await prisma.$disconnect();
  }
}

addDemoBranches();
