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

type SmartSlotInput = {
    startDate: string
    days?: number
    serviceId?: string
}

const SLOT_STEP_MINUTES = 30
const BUSINESS_START_MIN = 8 * 60
const BUSINESS_END_MIN = 18 * 60

function toMinuteLabel(totalMin: number) {
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

export async function getPublicAvailability(startDate: string, days: number = 14, serviceId?: string) {
    return getPublicAvailabilitySmart({ startDate, days, serviceId })
}

export async function getPublicAvailabilitySmart({ startDate, days = 14, serviceId }: SmartSlotInput) {
    const start = new Date(startDate)
    const end = new Date(start)
    end.setDate(end.getDate() + days)

    const selectedService = serviceId
        ? await prisma.service.findUnique({ where: { id: serviceId } })
        : null
    const requiredDurationMin = selectedService?.durationMin || 60

    // 1. Fetch Jobs (not cancelled)
    const jobs = await prisma.job.findMany({
        where: {
            scheduledDate: {
                gte: start,
                lte: end
            },
            NOT: { status: "CANCELLED" }
        },
        include: {
            services: { include: { service: true } },
            employees: true
        }
    })

    const employees = await prisma.employeeProfile.findMany()

    const result: DayAvailability[] = []
    
    // Exact 5 slots requested: 8am, 10am, 12pm (midi), 2pm (14h00), 4pm (16h00)
    const TARGET_SLOTS = ["08:00", "10:00", "12:00", "14:00", "16:00"]

    // 2. Calculate per day
    for (let i = 0; i < days; i++) {
        const currentD = new Date(start)
        currentD.setDate(currentD.getDate() + i)
        const dateStr = currentD.toISOString().split('T')[0]

        // Skip Sundays (closed)
        const isSunday = currentD.getDay() === 0
        if (isSunday) {
            result.push({
                date: dateStr,
                slots: TARGET_SLOTS.map(t => ({ time: t, available: false, remaining: 0 }))
            })
            continue
        }

        const slots: TimeSlot[] = []

        for (const timeStr of TARGET_SLOTS) {
            const [h, min] = timeStr.split(':').map(Number)
            const startMin = h * 60 + min
            const endMin = startMin + requiredDurationMin

            // Check how many jobs overlap with this slot
            const overlappingJobs = jobs.filter((j: any) => {
                const jDate = new Date(j.scheduledDate)
                const jDateStr = jDate.toISOString().split("T")[0]
                if (jDateStr !== dateStr) return false

                const jobStart = jDate.getHours() * 60 + jDate.getMinutes()
                const jobDuration =
                    j.durationMin ||
                    j.services?.reduce(
                        (acc: number, s: any) => acc + (s.service.durationMin || 60),
                        0
                    ) || 60
                const jobEnd = jobStart + jobDuration
                return startMin < jobEnd && endMin > jobStart
            })

            // The capacity is either the number of employees in the DB or 2 if none
            const capacity = Math.max(employees.length, 2)
            const remaining = capacity - overlappingJobs.length

            slots.push({
                time: timeStr,
                available: remaining > 0,
                remaining: Math.max(0, remaining)
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

        // Validate smart availability at submit time to avoid stale slot conflicts.
        const dayAvailability = await getPublicAvailabilitySmart({
            startDate: dateStr,
            days: 1,
            serviceId,
        })
        const day = dayAvailability[0]
        const chosenSlot = day?.slots?.find((s) => s.time === timeStr)
        if (!chosenSlot || !chosenSlot.available) {
            return { error: "Ce créneau n'est plus disponible. Veuillez en choisir un autre." }
        }

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
