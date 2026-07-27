const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  try {
    const branches = await prisma.branch.findMany({
      include: {
        company: {
          select: { name: true, id: true }
        }
      }
    });
    console.log('--- ALL BRANCHES IN DB ---');
    console.log(JSON.stringify(branches, null, 2));

    const users = await prisma.user.findMany({
      select: { id: true, email: true, companyId: true, role: true, fullName: true }
    });
    console.log('--- ALL USERS IN DB ---');
    console.log(JSON.stringify(users, null, 2));
  } catch (err) {
    console.error('DB Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

check();
