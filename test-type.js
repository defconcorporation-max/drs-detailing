const { PrismaClient } = require('./prisma/fresh-client');
const prisma = new PrismaClient();

async function main() {
    const setting = await prisma.systemSetting.findFirst();
    const cityColors = setting?.cityColors;
    console.log('typeof cityColors:', typeof cityColors);
    console.log('cityColors is Array:', Array.isArray(cityColors));
    console.log('cityColors content:', cityColors);
    
    // Now if I do JSON.parse:
    if (typeof cityColors === 'string') {
        const parsed = JSON.parse(cityColors);
        console.log('typeof parsed:', typeof parsed);
        console.log('keys of parsed:', Object.keys(parsed));
    } else {
        console.log('keys:', Object.keys(cityColors));
    }
}

main().finally(() => prisma.$disconnect());
