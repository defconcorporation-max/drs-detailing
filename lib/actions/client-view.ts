"use server"

import prisma from "@/lib/db"

export async function getJobByAccessKey(accessKey: string) {
    const client = await prisma.clientProfile.findUnique({
        where: { accessKey },
        include: {
            user: true,
            jobs: {
                orderBy: { scheduledDate: 'desc' },
                take: 1, // Get the latest job
                include: {
                    vehicle: true,
                    services: { include: { service: true } },
                    inspections: { include: { points: true } },
                    timeLogs: true,
                    employees: { include: { user: true } }
                }
            }
        }
    })

    if (!client || !client.jobs[0]) return null
    return client.jobs[0]
}
