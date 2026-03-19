"use server"

import prisma from "@/lib/db"
import { serialize } from "@/lib/utils"
import { revalidatePath } from "next/cache"

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

async function assertClientOwnsJob(token: string, jobId: string) {
    const client = await prisma.clientProfile.findUnique({
        where: { accessKey: token },
        select: { id: true },
    })
    if (!client) return null

    const job = await prisma.job.findFirst({
        where: { id: jobId, clientId: client.id },
        select: { id: true, status: true },
    })
    return job ? { clientId: client.id, status: job.status } : null
}

export async function confirmClientJob(token: string, jobId: string) {
    const ownership = await assertClientOwnsJob(token, jobId)
    if (!ownership) return

    // Do not overwrite terminal states.
    if (["COMPLETED", "CANCELLED"].includes(ownership.status)) return

    await prisma.job.update({
        where: { id: jobId },
        data: {
            status: "CONFIRMED",
        },
    }).catch(() => undefined)

    revalidatePath(`/client/${token}`)
    revalidatePath("/admin")
}

export async function requestRescheduleClientJob(token: string, jobId: string) {
    const ownership = await assertClientOwnsJob(token, jobId)
    if (!ownership) return
    if (["COMPLETED", "CANCELLED"].includes(ownership.status)) return

    await prisma.job.update({
        where: { id: jobId },
        data: {
            status: "RESCHEDULE_REQUESTED",
        },
    }).catch(() => undefined)

    revalidatePath(`/client/${token}`)
    revalidatePath("/admin")
}

export async function cancelClientJob(token: string, jobId: string) {
    const ownership = await assertClientOwnsJob(token, jobId)
    if (!ownership) return
    if (["COMPLETED", "CANCELLED"].includes(ownership.status)) return

    await prisma.job.update({
        where: { id: jobId },
        data: {
            status: "CANCELLED",
        },
    }).catch(() => undefined)

    revalidatePath(`/client/${token}`)
    revalidatePath("/admin")
}
