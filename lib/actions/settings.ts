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
