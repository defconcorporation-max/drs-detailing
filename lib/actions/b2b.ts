"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createBusinessProfile(data: { name: string, contactName?: string, email?: string, phone?: string }) {
    try {
        const business = await prisma.businessProfile.create({
            data
        })
        revalidatePath('/admin/b2b')
        return { success: true, business }
    } catch (e) {
        return { error: "Erreur lors de la création du profil business" }
    }
}

export async function getBusinessFleet(businessId: string) {
    return await prisma.vehicle.findMany({
        where: { businessId },
        include: {
            jobs: {
                orderBy: { createdAt: 'desc' },
                take: 1
            }
        }
    })
}

export async function getBusinessStats(businessId: string) {
    const jobs = await prisma.job.findMany({
        where: {
            vehicle: { businessId }
        },
        select: {
            status: true,
            totalPrice: true
        }
    })

    const totalSpent = jobs.reduce((acc, job) => acc + (job.totalPrice || 0), 0)
    const completedJobs = jobs.filter(j => j.status === 'COMPLETED').length

    return {
        totalSpent,
        completedJobs,
        activeJobs: jobs.filter(j => j.status !== 'COMPLETED' && j.status !== 'CANCELLED').length
    }
}

export async function assignVehicleToBusiness(vehicleId: string, businessId: string) {
    try {
        await prisma.vehicle.update({
            where: { id: vehicleId },
            data: { businessId }
        })
        revalidatePath('/admin/b2b')
        return { success: true }
    } catch (e) {
        return { error: "Erreur lors de l'assignation du véhicule" }
    }
}
