"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
// In a real app we'd use bcrypt. For MVP/SQLite local: text.

export async function updateAdminPassword(data: FormData) {
    const currentPass = data.get('currentPass') as string
    const newPass = data.get('newPass') as string

    if (!newPass || newPass.length < 4) return { error: "Nouveau mot de passe trop court" }

    try {
        // Verify current (Hardcoded ID for Admin or email lookup)
        const admin = await prisma.user.findUnique({ where: { email: 'admin@drs.com' } })

        if (!admin) return { error: "Admin introuvable" }
        if (admin.password !== currentPass) return { error: "Mot de passe actuel incorrect" }

        await prisma.user.update({
            where: { email: 'admin@drs.com' },
            data: { password: newPass }
        })

        return { success: true }
    } catch (e) {
        return { error: "Erreur modification mot de passe" }
    }
}

/** Saves city->color map as JSON in SystemSetting */
export async function updateCityColors(cityColors: Record<string, string>) {
    try {
        await prisma.systemSetting.upsert({
            where: { id: "GLOBAL" },
            update: { cityColors: JSON.stringify(cityColors) },
            create: { id: "GLOBAL", averageVehicleCost: 7.0, cityColors: JSON.stringify(cityColors) }
        })
        revalidatePath('/admin/settings')
        revalidatePath('/admin/schedule')
        return { success: true }
    } catch (e) {
        console.error("updateCityColors error:", e)
        return { error: "Erreur sauvegarde couleurs" }
    }
}

export async function getCityColors(): Promise<Record<string, string>> {
    try {
        const setting = await prisma.systemSetting.findUnique({ where: { id: "GLOBAL" } })
        if (!setting || !(setting as any).cityColors) return {}
        return JSON.parse((setting as any).cityColors)
    } catch {
        return {}
    }
}

/** Saves service zones GeoJSON in SystemSetting */
export async function updateServiceZones(geoJsonStr: string) {
    try {
        await prisma.systemSetting.upsert({
            where: { id: "GLOBAL" },
            update: { serviceZones: geoJsonStr },
            create: { id: "GLOBAL", averageVehicleCost: 7.0, serviceZones: geoJsonStr }
        })
        revalidatePath('/admin/settings')
        revalidatePath('/admin/schedule')
        revalidatePath('/admin/clients/map')
        return { success: true }
    } catch (e) {
        console.error("updateServiceZones error:", e)
        return { error: "Erreur sauvegarde des zones" }
    }
}

export async function getServiceZones(): Promise<any | null> {
    try {
        const setting = await prisma.systemSetting.findUnique({ where: { id: "GLOBAL" } })
        if (!setting || !setting.serviceZones) return null
        return JSON.parse(setting.serviceZones)
    } catch {
        return null
    }
}
