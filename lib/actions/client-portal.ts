"use server"

import prisma from "@/lib/db"
import { serialize } from "@/lib/utils"

export async function getClientByToken(token: string) {
    const client = await prisma.clientProfile.findUnique({
        where: { accessKey: token },
        include: {
            user: true,
            vehicles: true,
            jobs: {
                include: {
                    services: { include: { service: true } },
                    employee: { include: { user: true } },
                    vehicle: true
                },
                orderBy: { scheduledDate: 'desc' }
            }
        }
    })

    if (!client) return null
    return serialize(client)
}
