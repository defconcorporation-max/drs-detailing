"use server"

import prisma from "@/lib/db"
import { serialize } from "@/lib/utils"
import { revalidatePath } from "next/cache"

export async function getJobsForPeriod(start: Date, end: Date) {
    const jobs = await prisma.job.findMany({
        where: {
            scheduledDate: {
                gte: start,
                lte: end
            }
        },
        include: {
            client: {
                include: { user: true }
            },
            vehicle: true,
            services: {
                include: { service: true }
            },
            employee: {
                include: { user: true }
            }
        }
    })

    // Calculate duration and end time for each job to help UI placement
    const jobsWithMeta = jobs.map(job => {
        const totalDuration = job.services.reduce((acc, s) => acc + s.service.durationMin, 0)
        const startDate = new Date(job.scheduledDate)
        const endDate = new Date(startDate.getTime() + totalDuration * 60000)

        return {
            ...job,
            totalDuration,
            endDate
        }
    })

    return serialize(jobsWithMeta)
}

export async function updateJobColor(jobId: string, color: string) {
    try {
        await prisma.job.update({
            where: { id: jobId },
            data: { color }
        })
        revalidatePath('/admin/schedule')
        revalidatePath('/employee/calendar')
        return { success: true }
    } catch (e) {
        return { error: "Erreur mise à jour couleur" }
    }
}
