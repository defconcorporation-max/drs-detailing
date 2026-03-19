
import prisma from "@/lib/db"

async function main() {
    console.log("--- EMPLOYEES ---")
    const employees = await prisma.employeeProfile.findMany({ include: { user: true } })
    employees.forEach(e => {
        console.log(`ID: ${e.id} | Name: ${e.user?.name} | User: ${e.userId}`)
    })

    console.log("\n--- AVAILABILITIES ---")
    const avails = await prisma.availability.findMany({
        orderBy: { date: 'asc' }
    })

    avails.forEach(a => {
        console.log(`
        ID: ${a.id}
        EmpID: ${a.employeeId}
        Date: ${a.date?.toISOString()} (${a.date?.toLocaleDateString()})
        Locked: ${a.isLocked}
        Time: ${a.startTime}-${a.endTime}
        `)
    })
}

main()
