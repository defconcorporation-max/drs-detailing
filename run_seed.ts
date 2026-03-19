
// This is a temporary script to run the seed function.
import { seedJeanTesteur } from "./lib/actions/debug_seed";

// Mock "use server" context/environment if needed, but for simple prisma calls it should work if env is loaded.
// We need to load env vars for Prisma.
import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    console.log("Starting seed...");
    try {
        const result = await seedJeanTesteur();
        console.log("Seed result:", result);
    } catch (e) {
        console.error("Seed failed:", e);
    }
    process.exit(0);
}

main();
