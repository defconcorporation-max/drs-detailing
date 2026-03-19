"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createJob(data: FormData) {
    const clientId = data.get('clientId') as string
    let vehicleId = data.get('vehicleId') as string

    // New Vehicle Logic
    const isNewVehicle = data.get('newVehicle') === 'on'
    const newVehicleType = data.get('newVehicleType') as string
    const newVehicleMake = data.get('newVehicleMake') as string
    const newVehicleModel = data.get('newVehicleModel') as string
    const newVehicleYear = data.get('newVehicleYear') as string

    const serviceIds = data.getAll('serviceId') as string[]
    // Updated: Accept multiple employeeIds
    // MultiSelect sends "employeeIds" or similar, or we might receive multiple "employeeId" fields depending on the form
    // Since we'll use a hidden input with multiple values or JSON, let's assume JSON stringified array or multiple inputs.
    // For simplicity with standard formData, if we name inputs "employeeId" repeatedly, getAll works.
    const employeeIds = data.getAll('employeeId') as string[]

    const dateStr = data.get('date') as string
    const timeStr = data.get('time') as string // "14:00"

    if (!clientId || !dateStr || !timeStr) {
        return { error: "Client, Date et Heure requis" }
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
                    year: newVehicleYear ? parseInt(newVehicleYear) : undefined
                }
            })
            vehicleId = v.id
        }

        const scheduledDate = new Date(`${dateStr}T${timeStr}:00`)

        await prisma.job.create({
            data: {
                clientId,
                vehicleId: vehicleId || null,
                // We assume we don't need the legacy employeeId anymore for NEW jobs.
                scheduledDate,
                status: 'SCHEDULED',
                services: {
                    create: serviceIds.map(id => ({ serviceId: id }))
                },
                employees: {
                    connect: employeeIds.map(id => ({ id }))
                }
            }
        })
    } catch (e) {
        console.error(e)
        return { error: "Erreur création job" }
    }

    revalidatePath('/admin/schedule')
    revalidatePath('/employee')
    revalidatePath('/employee/calendar')
    return { success: true }
}

export async function getScheduleSelectors() {
    // Helper to get dropdown data
    const [clients, employees, services] = await Promise.all([
        prisma.clientProfile.findMany({ include: { user: true, vehicles: true } }),
        prisma.employeeProfile.findMany({ include: { user: true } }),
        prisma.service.findMany({ orderBy: { name: 'asc' } })
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
                    service: true
                }
            }
        },
        orderBy: { scheduledDate: 'asc' }
    })
    return jobs // serialization happens in server component automatically or via helper if needed context
}

export async function updateJob(id: string, data: FormData) {
    const dateStr = data.get('date') as string
    const timeStr = data.get('time') as string
    // const employeeId = data.get('employeeId') as string // Legacy
    const employeeIds = data.getAll('employeeId') as string[]
    const status = data.get('status') as string
    const notes = data.get('notes') as string

    // Services handling is complex via FormData if checkboxes are used. 
    // We might receive "serviceId" multiple times.
    const serviceIds = data.getAll('serviceId') as string[]

    try {
        const scheduledDate = new Date(`${dateStr}T${timeStr}:00`)

        // Update basic fields
        await prisma.job.update({
            where: { id },
            data: {
                scheduledDate,
                // Legacy: keep specific primary employee if desired, or null. 
                // For now, let's just set employeeId to the first one or null to support legacy views if needed.
                employeeId: employeeIds.length > 0 ? employeeIds[0] : null,

                status: status || 'SCHEDULED',
                notes,
                // Services: delete/create
                services: {
                    deleteMany: {},
                    create: serviceIds.map(sid => ({ serviceId: sid }))
                },
                // Employees: set (replace all)
                employees: {
                    set: employeeIds.map(id => ({ id }))
                }
            }
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
