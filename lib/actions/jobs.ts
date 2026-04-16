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
    const employeeIds = data.getAll("employeeId") as string[]

    // Custom service (free-text, not in catalog)
    const customServiceName = (data.get("customServiceName") as string)?.trim() || null
    const customServicePriceRaw = data.get("customServicePrice") as string
    const customServicePrice = customServicePriceRaw ? parseFloat(customServicePriceRaw) : null

    const dateStr = data.get("date") as string
    const timeStr = data.get("time") as string

    if (!clientId || !dateStr || !timeStr) {
        return { error: "Client, Date et Heure requis" }
    }

    if (!serviceIds.length && !customServiceName) {
        return { error: "Sélectionnez au moins un service ou ajoutez un service personnalisé" }
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
        const { totalPrice: catalogPrice } = totalsFromLines(lines)
        const finalPrice = (lines.length ? catalogPrice : 0) + (customServicePrice || 0)

        const scheduledDate = scheduledDateFromFormData(data)

        await prisma.job.create({
            data: {
                clientId,
                vehicleId: vehicleId || null,
                scheduledDate,
                status: "PENDING",
                totalPrice: finalPrice || null,
                customServiceName,
                customServicePrice,
                services: serviceIds.length ? {
                    create: serviceIds.map((id) => ({
                        serviceId: id,
                        selectedExtraIds: extrasMap[id] ?? [],
                    })),
                } : undefined,
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

    // Custom service
    const customServiceName = (data.get("customServiceName") as string)?.trim() || null
    const customServicePriceRaw = data.get("customServicePrice") as string
    const customServicePrice = customServicePriceRaw ? parseFloat(customServicePriceRaw) : null

    try {
        const scheduledDate = scheduledDateFromFormData(data)
        const lines = await buildLinesFromIds(serviceIds, extrasMap)
        const { totalPrice: catalogPrice } = totalsFromLines(lines)
        const finalPrice = (lines.length ? catalogPrice : 0) + (customServicePrice || 0)

        await prisma.job.update({
            where: { id },
            data: {
                scheduledDate,
                employeeId: employeeIds.length > 0 ? employeeIds[0] : null,
                status: status || "PENDING",
                notes,
                totalPrice: finalPrice || null,
                customServiceName,
                customServicePrice,
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

/** Replacer un job sur le calendrier (date/heure locale) sans repasser par le formulaire complet. */
export async function rescheduleJob(
    jobId: string,
    dateKey: string,
    hour: number,
    options?: { minute?: number }
) {
    const minute = Math.max(0, Math.min(59, options?.minute ?? 0))
    const parts = dateKey.split("-").map((x) => parseInt(x, 10))
    if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
        return { error: "Date invalide" }
    }
    const [y, mo, d] = parts
    if (hour < 0 || hour > 23) return { error: "Heure invalide" }

    const scheduledDate = new Date(y, mo - 1, d, hour, minute, 0, 0)
    if (Number.isNaN(scheduledDate.getTime())) {
        return { error: "Date invalide" }
    }

    try {
        await prisma.job.update({
            where: { id: jobId },
            data: { scheduledDate },
        })
    } catch (e) {
        console.error(e)
        return { error: "Erreur replanification" }
    }

    revalidatePath("/admin/schedule")
    revalidatePath("/employee")
    revalidatePath("/employee/calendar")
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
