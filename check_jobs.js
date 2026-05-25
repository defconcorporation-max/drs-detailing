const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const jobs = await prisma.job.groupBy({ by: ['status'], _count: { id: true } });
  console.log('Jobs by status:', jobs);
  const clients = await prisma.clientProfile.count();
  console.log('Total clients:', clients);
}
main().finally(() => prisma.$disconnect());
