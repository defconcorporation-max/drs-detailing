"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getCalendarEvents() {
    try {
        const events = await prisma.calendarEvent.findMany({
            orderBy: { scheduledDate: "asc" },
        })
        return events
    } catch (e) {
        console.error("[getCalendarEvents]", e)
        return []
    }
}

export async function createCalendarEvent(data: FormData) {
    const title = data.get("title") as string
    const description = data.get("description") as string
    const dateStr = data.get("date") as string
    const timeStr = data.get("time") as string
    const durationMinStr = data.get("durationMin") as string
    const color = data.get("color") as string
    const type = data.get("type") as string

    if (!title || !dateStr || !timeStr) {
        return { error: "Titre, Date et Heure requis" }
    }

    try {
        const scheduledDate = new Date(`${dateStr}T${timeStr}:00`)
        const durationMin = parseInt(durationMinStr, 10) || 60

        await prisma.calendarEvent.create({
            data: {
                title,
                description,
                scheduledDate,
                durationMin,
                color: color || null,
                type: type || "TASK",
            },
        })
    } catch (e) {
        console.error(e)
        return { error: "Erreur création événement" }
    }

    revalidatePath("/admin/schedule")
    return { success: true }
}

export async function updateCalendarEvent(id: string, data: FormData) {
    const title = data.get("title") as string
    const description = data.get("description") as string
    const dateStr = data.get("date") as string
    const timeStr = data.get("time") as string
    const durationMinStr = data.get("durationMin") as string
    const color = data.get("color") as string
    const type = data.get("type") as string
    const isCompleted = data.get("isCompleted") === "on"

    try {
        const scheduledDate = new Date(`${dateStr}T${timeStr}:00`)
        const durationMin = parseInt(durationMinStr, 10) || 60

        await prisma.calendarEvent.update({
            where: { id },
            data: {
                title,
                description,
                scheduledDate,
                durationMin,
                color: color || null,
                type: type || "TASK",
                isCompleted,
            },
        })
    } catch (e) {
        console.error(e)
        return { error: "Erreur mise à jour événement" }
    }

    revalidatePath("/admin/schedule")
    return { success: true }
}

export async function deleteCalendarEvent(id: string) {
    try {
        await prisma.calendarEvent.delete({ where: { id } })
    } catch (e) {
        console.error(e)
        return { error: "Erreur suppression" }
    }
    revalidatePath("/admin/schedule")
    return { success: true }
}
