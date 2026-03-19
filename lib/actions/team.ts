"use server"

import prisma from "@/lib/db"
import { serialize } from "@/lib/utils"

export async function getTeamStats() {
    const employees = await prisma.user.findMany({
        where: { role: 'EMPLOYEE' },
        include: {
            employeeProfile: {
                include: {
                    assignedJobs: {
                        where: { status: 'COMPLETED' } // Only count completed for stats
                    }
                }
            }
        }
    })

    // Transform data for UI
    const stats = employees.map(u => {
        const jobsDone = u.employeeProfile?.assignedJobs.length || 0
        // Mock calculation for hours (e.g. sum of service duration / 60)
        // Since job doesn't store duration directly, we'd need to sum services.
        // For MVP V2, let's assume 2h per job average or 0 if no jobs.
        const hoursWorked = jobsDone * 2.5

        const hourlyRate = u.employeeProfile?.hourlyRate || 0
        const currentPay = hoursWorked * hourlyRate

        return {
            id: u.id,
            name: u.name,
            email: u.email,
            jobsCount: jobsDone,
            hours: hoursWorked,
            payPeriod: currentPay,
            hourlyRate: hourlyRate
        }
    })

    return serialize(stats)
}
