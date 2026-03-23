"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function createInspection(jobId: string, type: "CHECK_IN" | "CHECK_OUT", employeeId?: string) {
    try {
        const inspection = await prisma.inspection.create({
            data: {
                jobId,
                type,
                createdBy: employeeId,
            }
        })
        revalidatePath(`/employee/job/${jobId}`)
        return { success: true, inspection }
    } catch (e) {
        return { error: "Erreur création inspection" }
    }
}

export async function addInspectionPoint(inspectionId: string, data: { x: number, y: number, type: string, severity?: string, notes?: string }) {
    try {
        const point = await prisma.inspectionPoint.create({
            data: {
                inspectionId,
                x: data.x,
                y: data.y,
                type: data.type,
                severity: data.severity,
                notes: data.notes
            }
        })
        return { success: true, point }
    } catch (e) {
        return { error: "Erreur ajout du point" }
    }
}

export async function deleteInspectionPoint(pointId: string) {
    try {
        await prisma.inspectionPoint.delete({ where: { id: pointId } })
        return { success: true }
    } catch (e) {
        return { error: "Erreur suppression du point" }
    }
}

export async function getJobInspections(jobId: string) {
    return await prisma.inspection.findMany({
        where: { jobId },
        include: { points: true },
        orderBy: { createdAt: 'desc' }
    })
}
