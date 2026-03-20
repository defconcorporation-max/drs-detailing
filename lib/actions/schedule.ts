"use server"

import prisma from "@/lib/db"
import { serialize } from "@/lib/utils"
import { jobDurationMinutes } from "@/lib/job-metrics"

export async function getJobsForPeriod(start: Date, end: Date) {
    const jobs = await prisma.job.findMany({
        where: {
            scheduledDate: {
                gte: start,
                lte: end,
            },
        },
        include: {
            client: {
                include: { user: true },
            },
            vehicle: true,
            services: {
                include: {
                    service: {
                        include: { extras: { orderBy: { sortOrder: "asc" } } },
                    },
                },
            },
            employee: {
                include: { user: true },
            },
        },
    })

    const jobsWithMeta = jobs.map((job) => {
        const totalDuration = jobDurationMinutes(job.services as any)
        const startDate = new Date(job.scheduledDate)
        const endDate = new Date(startDate.getTime() + totalDuration * 60000)

        return {
            ...job,
            totalDuration,
            endDate,
        }
    })

    return serialize(jobsWithMeta)
}
