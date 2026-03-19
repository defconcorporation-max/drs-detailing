
import prisma from "./lib/db"

async function main() {
    console.log("Migrating Jobs to Many-to-Many...");

    // 1. Get all jobs that have an employeeId but no entries in 'employees' (JobTeam)
    // Actually, we can just grab all jobs with employeeId.
    const jobs = await prisma.job.findMany({
        where: {
            employeeId: { not: null }
        },
        include: { employees: true }
    });

    console.log(`Found ${jobs.length} jobs with legacy employeeId.`);

    let count = 0;
    for (const job of jobs) {
        if (job.employeeId) {
            // Check if already migrated (just in case)
            const alreadyLinked = job.employees.some(e => e.id === job.employeeId);

            if (!alreadyLinked) {
                await prisma.job.update({
                    where: { id: job.id },
                    data: {
                        employees: {
                            connect: { id: job.employeeId }
                        }
                    }
                });
                count++;
            }
        }
    }

    console.log(`Migration complete. Updated ${count} jobs.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
