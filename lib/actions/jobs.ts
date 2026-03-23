"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { buildLinesFromIds, parseServiceExtrasMap, totalsFromLines } from "@/lib/parse-job-extras"

/** Date/heure interprétées en local dans le navigateur (ms UTC) — évite le décalage si le serveur est en autre fuseau. */
function scheduledDateFromFormData(data: FormData): Date {
    const utcMs = data.get("scheduledAtUtcMs") as string | null
    if (utcMs && /^\d+$/.test(utcMs)) {
        const t = parseInt(utcMs, 10)
        if (!Number.isNaN(t)) return new Date(t)
    }
    const dateStr = data.get("date") as string
    const timeStr = data.get("time") as string
    return new Date(`${dateStr}T${timeStr}:00`)
}

export async function createJob(data: FormData) {
    const clientId = data.get("clientId") as string
    let vehicleId = (data.get("vehicleId") as string) || ""

    // New Vehicle Logic (hidden input name="newVehicle" value="on")
    const isNewVehicle = data.get("newVehicle") === "on"
    const newVehicleType = data.get("newVehicleType") as string
    const newVehicleMake = data.get("newVehicleMake") as string
    const newVehicleModel = data.get("newVehicleModel") as string
    const newVehicleYear = data.get("newVehicleYear") as string

    const serviceIds = data.getAll("serviceId") as string[]
    const extrasMap = parseServiceExtrasMap(data)
    // Updated: Accept multiple employeeIds
    // MultiSelect sends "employeeIds" or similar, or we might receive multiple "employeeId" fields depending on the form
    // Since we'll use a hidden input with multiple values or JSON, let's assume JSON stringified array or multiple inputs.
    // For simplicity with standard formData, if we name inputs "employeeId" repeatedly, getAll works.
    const employeeIds = data.getAll("employeeId") as string[]

    const dateStr = data.get("date") as string
    const timeStr = data.get("time") as string // "14:00"

    if (!clientId || !dateStr || !timeStr) {
        return { error: "Client, Date et Heure requis" }
    }

    if (!serviceIds.length) {
        return { error: "Sélectionnez au moins un service" }
    }

    try {
        // Create Vehicle if new
        if (isNewVehicle && newVehicleType) {
            const v = await prisma.vehicle.create({
                data: {
                    clientId,
                    type: newVehicleType,
                    make: newVehicleMake || "Inconnu",
                    model: newVehicleModel || "Inconnu",
                    year: newVehicleYear ? parseInt(newVehicleYear, 10) : undefined,
                },
            })
            vehicleId = v.id
        }

        const lines = await buildLinesFromIds(serviceIds, extrasMap)
        const { totalPrice } = totalsFromLines(lines)

        const scheduledDate = scheduledDateFromFormData(data)

        await prisma.job.create({
            data: {
                clientId,
                vehicleId: vehicleId || null,
                scheduledDate,
                // En attente de confirmation → gris sur le calendrier
                status: "PENDING",
                totalPrice: lines.length ? totalPrice : null,
                services: {
                    create: serviceIds.map((id) => ({
                        serviceId: id,
                        selectedExtraIds: extrasMap[id] ?? [],
                    })),
                },
                ...(employeeIds.length > 0
                    ? { employees: { connect: employeeIds.map((id) => ({ id })) } }
                    : {}),
            },
        })
    } catch (e) {
        console.error(e)
        return { error: "Erreur création job" }
    }

    revalidatePath("/admin/schedule")
    revalidatePath("/employee")
    revalidatePath("/employee/calendar")
    return { success: true }
}

export async function getScheduleSelectors() {
    const [clients, employees, services] = await Promise.all([
        prisma.clientProfile.findMany({ include: { user: true, vehicles: true } }),
        prisma.employeeProfile.findMany({ include: { user: true } }),
        prisma.service.findMany({
            orderBy: { name: "asc" },
            include: { extras: { orderBy: { sortOrder: "asc" } } },
        }),
    ])
    return { clients, employees, services }
}

export async function getJobs() {
    const jobs = await prisma.job.findMany({
        include: {
            client: {
                include: {
                    user: true
                }
            },
            employee: { // Legacy Support
                include: {
                    user: true
                }
            },
            employees: { // New Relation
                include: {
                    user: true
                }
            },
            vehicle: true,
            services: {
                include: {
                    service: {
                        include: { extras: { orderBy: { sortOrder: "asc" } } },
                    },
                },
            },
        },
        orderBy: { scheduledDate: "asc" },
    })
    return jobs // serialization happens in server component automatically or via helper if needed context
}

export async function updateJob(id: string, data: FormData) {
    const dateStr = data.get("date") as string
    const timeStr = data.get("time") as string
    const employeeIds = data.getAll("employeeId") as string[]
    const status = data.get("status") as string
    const notes = data.get("notes") as string

    const serviceIds = data.getAll("serviceId") as string[]
    const extrasMap = parseServiceExtrasMap(data)

    try {
        const scheduledDate = scheduledDateFromFormData(data)
        const lines = await buildLinesFromIds(serviceIds, extrasMap)
        const { totalPrice } = totalsFromLines(lines)

        await prisma.job.update({
            where: { id },
            data: {
                scheduledDate,
                employeeId: employeeIds.length > 0 ? employeeIds[0] : null,
                status: status || "PENDING",
                notes,
                totalPrice: lines.length ? totalPrice : null,
                services: {
                    deleteMany: {},
                    create: serviceIds.map((sid) => ({
                        serviceId: sid,
                        selectedExtraIds: extrasMap[sid] ?? [],
                    })),
                },
                employees: {
                    set: employeeIds.map((eid) => ({ id: eid })),
                },
            },
        })
    } catch (e) {
        return { error: "Erreur mise à jour job" }
    }

    revalidatePath('/admin/schedule')
    revalidatePath('/employee') // Update employee view too
    revalidatePath('/employee/calendar')
    return { success: true }
}

export async function deleteJob(id: string) {
    try {
        await prisma.job.delete({ where: { id } })
    } catch (e) {
        return { error: "Erreur suppression" }
    }
    revalidatePath('/admin/schedule')
    revalidatePath('/employee')
    revalidatePath('/employee/calendar')
    return { success: true }
}

export async function toggleJobServiceDone(jobId: string, serviceId: string, isDone: boolean) {
    try {
        await prisma.jobService.update({
            where: { jobId_serviceId: { jobId, serviceId } },
            data: { isDone },
        })
        revalidatePath(`/employee/job/${jobId}`)
        return { success: true }
    } catch (e) {
        return { error: "Erreur mise à jour service" }
    }
}

export async function updateJobStatus(id: string, status: string) {
    try {
        await prisma.job.update({
            where: { id },
            data: { status }
        })
        revalidatePath(`/employee/job/${id}`)
        revalidatePath('/admin/schedule')
        return { success: true }
    } catch (e) {
        return { error: "Erreur mise à jour statut" }
    }
}
