"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function startTimeLog(jobId: string, employeeId: string) {
    if (!employeeId) return { error: "Employé non identifié" }

    // Check if already running?
    const existing = await prisma.timeLog.findFirst({
        where: {
            jobId,
            employeeId,
            endTime: null
        }
    })

    if (existing) {
        return { error: "Un chronomètre est déjà en cours pour ce job." }
    }

    try {
        await prisma.timeLog.create({
            data: {
                jobId,
                employeeId,
                startTime: new Date()
            }
        })
        revalidatePath('/employee')
        return { success: true }
    } catch (error) {
        console.error("Start Timer Error:", error)
        return { error: "Erreur lors du démarrage du chronomètre." }
    }
}

export async function stopTimeLog(timeLogId: string) {
    const log = await prisma.timeLog.findUnique({ where: { id: timeLogId } })
    if (!log) return { error: "Log introuvable" }

    const end = new Date()
    const start = new Date(log.startTime)
    const durationMin = Math.round((end.getTime() - start.getTime()) / 60000)

    try {
        await prisma.timeLog.update({
            where: { id: timeLogId },
            data: {
                endTime: end,
                durationMin
            }
        })
        revalidatePath('/employee')
        return { success: true }
    } catch (error) {
        return { error: "Erreur lors de l'arrêt du chronomètre." }
    }
}

export async function getActiveTimeLog(jobId: string, employeeId: string) {
    // Returns the currently running log if any
    return await prisma.timeLog.findFirst({
        where: {
            jobId,
            employeeId,
            endTime: null
        }
    })
}

export async function getJobTimeLogs(jobId: string) {
    return await prisma.timeLog.findMany({
        where: { jobId },
        orderBy: { startTime: 'desc' }
    })
}
