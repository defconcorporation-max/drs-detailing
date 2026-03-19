"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

export type TimeSlot = {
    time: string
    available: boolean
    remaining: number
}

export type DayAvailability = {
    date: string
    slots: TimeSlot[]
}

export async function getPublicAvailability(startDate: string, days: number = 14) {
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + days)

    // 1. Fetch "Active" Availabilities (isLocked: true means published)
    const availabilities = await prisma.availability.findMany({
        where: {
            isLocked: true,
            date: {
                gte: start,
                lte: end
            }
        }
    })

    // 2. Fetch Jobs
    const jobs = await prisma.job.findMany({
        where: {
            scheduledDate: {
                gte: start,
                lte: end
            }
        },
        include: {
            services: { include: { service: true } },
            employees: true
        }
    })

    const result: DayAvailability[] = []

    // 3. Calculate per day
    for (let i = 0; i < days; i++) {
        const currentD = new Date(start)
        currentD.setDate(currentD.getDate() + i)
        // Ensure we are working with local dates conceptually
        const dateStr = currentD.toISOString().split('T')[0]

        // Scan hours 8 to 18
        const slots: TimeSlot[] = []

        for (let h = 8; h < 18; h++) {
            const timeStr = `${h.toString().padStart(2, '0')}:00`

            // Check Capacity
            const workingEmployees = availabilities.filter(a => {
                if (!a.date) return false
                const aDateStr = a.date.toISOString().split('T')[0]
                if (aDateStr !== dateStr) return false

                const [sH, sM] = a.startTime.split(':').map(Number)
                const [eH, eM] = a.endTime.split(':').map(Number)

                return h >= sH && h < eH
            })
            const totalCapacity = new Set(workingEmployees.map(e => e.employeeId)).size

            // Check Busy
            const busyEmployees = new Set()
            const activeJobs = jobs.filter(j => {
                const jDate = new Date(j.scheduledDate)
                const jDateStr = jDate.toISOString().split('T')[0]
                if (jDateStr !== dateStr) return false

                const jStartH = jDate.getHours()
                // Calc duration
                // @ts-ignore
                const duration = j.services.reduce((acc: number, s: any) => acc + (s.service.durationMin || 0), 0) || 60
                const jEndH = jStartH + (duration / 60)

                // Overlap: Hour is inside [Start, End)
                return h >= jStartH && h < jEndH
            })

            // @ts-ignore
            activeJobs.forEach((j: any) => {
                if (j.employees && j.employees.length > 0) {
                    j.employees.forEach((e: any) => busyEmployees.add(e.id))
                } else if (j.employeeId) {
                    busyEmployees.add(j.employeeId)
                }
            })

            const remaining = Math.max(0, totalCapacity - busyEmployees.size)

            slots.push({
                time: timeStr,
                available: remaining > 0,
                remaining
            })
        }

        result.push({
            date: dateStr,
            slots
        })
    }

    return result
}

type BookingRequest = {
    token: string
    dateStr: string
    timeStr: string
    serviceId: string
    vehicleId: string
    notes?: string
}

export async function requestBooking({ token, dateStr, timeStr, serviceId, vehicleId, notes }: BookingRequest) {
    if (!token) return { error: "Token invalide" }
    if (!serviceId || !vehicleId) return { error: "Service et Véhicule requis" }

    try {
        const client = await prisma.clientProfile.findUnique({
            where: { accessKey: token }
        })

        if (!client) return { error: "Client introuvable" }

        // Construct Date object
        const [y, m, d] = dateStr.split('-').map(Number)
        const [h, min] = timeStr.split(':').map(Number)
        const scheduledDate = new Date(y, m - 1, d, h, min)

        // Find Service
        const service = await prisma.service.findUnique({ where: { id: serviceId } })
        if (!service) return { error: "Service introuvable" }

        // Create Job
        await prisma.job.create({
            data: {
                clientId: client.id,
                vehicleId: vehicleId,
                scheduledDate: scheduledDate,
                status: "REQUESTED",
                notes: notes || "Demande via Portail",
                services: {
                    create: {
                        serviceId: service.id
                    }
                }
            }
        })

        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: "Erreur lors de la réservation" }
    }
}

export async function confirmBooking(jobId: string) {
    try {
        await prisma.job.update({
            where: { id: jobId },
            data: { status: "CONFIRMED" }
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        return { error: "Erreur confirmation" }
    }
}

export async function declineBooking(jobId: string) {
    try {
        await prisma.job.update({
            where: { id: jobId },
            data: { status: "CANCELLED" }
        })
        revalidatePath('/admin')
        return { success: true }
    } catch (e) {
        return { error: "Erreur refus" }
    }
}

export async function getPendingRequests() {
    return await prisma.job.findMany({
        where: { status: "REQUESTED" },
        include: {
            client: { include: { user: true } },
            services: { include: { service: true } },
            vehicle: true
        },
        orderBy: { scheduledDate: 'asc' }
    })
}
