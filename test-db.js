const { PrismaClient } = require('./prisma/fresh-client');
const prisma = new PrismaClient();
async function main() {
    const jobs = await prisma.job.findMany({ include: { client: { include: { user: true } } } });
    console.log('Jobs with addresses:');
    jobs.forEach(j => console.log(j.client?.user?.name, '->', j.client?.address));
    const settings = await prisma.systemSetting.findFirst();
    console.log('City colors:', settings?.cityColors);
}
main().finally(() => prisma.$disconnect());
