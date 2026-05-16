const { PrismaClient } = require('./prisma/fresh-client');
const prisma = new PrismaClient();

const normalize = (s) => {
    if (!s) return "";
    let res = s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    res = res.replace(/[^a-z0-9\s]/g, " ")
    res = res.replace(/\b(ste)\b/g, "sainte")
    res = res.replace(/\b(st)\b/g, "saint")
    return res.replace(/\s+/g, " ").trim()
}

async function main() {
    const jobs = await prisma.job.findMany({ include: { client: true } });
    const settings = await prisma.systemSetting.findFirst();
    const cityColors = settings?.cityColors || {};
    
    console.log("Configured cities:", Object.keys(cityColors));

    for (const job of jobs) {
        const address = job.client?.address || "";
        if (!address) continue;
        
        const normAddr = normalize(address);
        let matched = null;
        for (const city of Object.keys(cityColors)) {
            if (normAddr.includes(normalize(city))) {
                matched = city;
                break;
            }
        }
        
        console.log(`[${matched ? 'MATCH: ' + matched : 'NO MATCH'}] Address: "${address}" -> Norm: "${normAddr}"`);
    }
}

main().finally(() => prisma.$disconnect());
