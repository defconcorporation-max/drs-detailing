"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { requireAdminSession } from "@/lib/server/admin-session"
import { serialize } from "@/lib/utils"
import { USER_ROLES, type UserRole } from "@/lib/user-roles"

function parseRole(raw: string | null): UserRole | null {
    if (!raw) return null
    return USER_ROLES.includes(raw as UserRole) ? (raw as UserRole) : null
}

async function ensureClientProfile(userId: string, address: string | null) {
    const u = await prisma.user.findUnique({
        where: { id: userId },
        include: { clientProfile: true },
    })
    if (!u) return
    if (!u.clientProfile) {
        await prisma.clientProfile.create({
            data: { userId, address: address || undefined },
        })
    } else {
        await prisma.clientProfile.update({
            where: { userId },
            data: { address: address || undefined },
        })
    }
}

async function ensureEmployeeProfile(userId: string, hourlyRate: number) {
    const u = await prisma.user.findUnique({
        where: { id: userId },
        include: { employeeProfile: true },
    })
    if (!u) return
    if (!u.employeeProfile) {
        await prisma.employeeProfile.create({
            data: { userId, hourlyRate: hourlyRate || 0 },
        })
    } else {
        await prisma.employeeProfile.update({
            where: { userId },
            data: { hourlyRate: hourlyRate || 0 },
        })
    }
}

export async function getUsersForAdmin() {
    const denied = await requireAdminSession()
    if (denied) return { error: denied, users: null as null }

    const users = await prisma.user.findMany({
        orderBy: [{ role: "asc" }, { name: "asc" }],
        include: {
            clientProfile: { select: { id: true, address: true } },
            employeeProfile: { select: { id: true, hourlyRate: true } },
        },
    })
    return { users: serialize(users) }
}

export async function getUserForAdminById(id: string) {
    const denied = await requireAdminSession()
    if (denied) return { error: denied, user: null }

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            clientProfile: true,
            employeeProfile: true,
        },
    })
    if (!user) return { error: "Utilisateur introuvable", user: null }
    return { user: serialize(user) }
}

export async function createUser(data: FormData): Promise<{ error?: string; success?: boolean }> {
    const denied = await requireAdminSession()
    if (denied) return { error: denied }

    const name = (data.get("name") as string)?.trim()
    const email = (data.get("email") as string)?.trim().toLowerCase()
    const password = data.get("password") as string
    const phone = ((data.get("phone") as string) || "").trim() || null
    const role = parseRole(data.get("role") as string)
    const address = ((data.get("address") as string) || "").trim() || null
    const hourlyRate = parseFloat((data.get("hourlyRate") as string) || "0")

    if (!name || !email || !password) {
        return { error: "Nom, e-mail et mot de passe sont requis." }
    }
    if (!role) {
        return { error: "Rôle invalide." }
    }

    try {
        const exists = await prisma.user.findUnique({ where: { email } })
        if (exists) return { error: "Cet e-mail est déjà utilisé." }

        if (role === "CLIENT") {
            await prisma.user.create({
                data: {
                    name,
                    email,
                    password,
                    phone,
                    role,
                    clientProfile: {
                        create: { address: address || undefined },
                    },
                },
            })
        } else if (role === "EMPLOYEE") {
            await prisma.user.create({
                data: {
                    name,
                    email,
                    password,
                    phone,
                    role,
                    employeeProfile: {
                        create: { hourlyRate: Number.isFinite(hourlyRate) ? hourlyRate : 0 },
                    },
                },
            })
        } else {
            await prisma.user.create({
                data: {
                    name,
                    email,
                    password,
                    phone,
                    role,
                },
            })
        }
    } catch (e) {
        console.error(e)
        return { error: "Erreur lors de la création du compte." }
    }

    revalidatePath("/admin/users")
    revalidatePath("/admin/team")
    revalidatePath("/admin/clients")
    revalidatePath("/admin/schedule")
    return { success: true }
}

export async function updateUser(id: string, data: FormData): Promise<{ error?: string; success?: boolean }> {
    const denied = await requireAdminSession()
    if (denied) return { error: denied }

    const name = (data.get("name") as string)?.trim()
    const email = (data.get("email") as string)?.trim().toLowerCase()
    const phone = ((data.get("phone") as string) || "").trim() || null
    const newPassword = (data.get("newPassword") as string) || ""
    const role = parseRole(data.get("role") as string)
    const address = ((data.get("address") as string) || "").trim() || null
    const hourlyRate = parseFloat((data.get("hourlyRate") as string) || "0")

    if (!name || !email) {
        return { error: "Nom et e-mail sont requis." }
    }
    if (!role) {
        return { error: "Rôle invalide." }
    }

    const existing = await prisma.user.findUnique({ where: { id } })
    if (!existing) return { error: "Utilisateur introuvable." }

    const adminCount = await prisma.user.count({ where: { role: "ADMIN" } })
    if (existing.role === "ADMIN" && role !== "ADMIN" && adminCount <= 1) {
        return { error: "Impossible de retirer le rôle admin au dernier administrateur." }
    }

    const emailOwner = await prisma.user.findUnique({ where: { email } })
    if (emailOwner && emailOwner.id !== id) {
        return { error: "Cet e-mail est déjà utilisé par un autre compte." }
    }

    const dataToSet: {
        name: string
        email: string
        phone: string | null
        role: UserRole
        password?: string
    } = {
        name,
        email,
        phone,
        role,
    }

    if (newPassword.trim()) {
        dataToSet.password = newPassword.trim()
    }

    try {
        await prisma.user.update({
            where: { id },
            data: dataToSet,
        })

        if (role === "CLIENT") {
            await ensureClientProfile(id, address)
        }
        if (role === "EMPLOYEE") {
            await ensureEmployeeProfile(id, Number.isFinite(hourlyRate) ? hourlyRate : 0)
        }
    } catch (e) {
        console.error(e)
        return { error: "Erreur lors de la mise à jour." }
    }

    revalidatePath("/admin/users")
    revalidatePath(`/admin/users/${id}`)
    revalidatePath("/admin/team")
    revalidatePath("/admin/clients")
    revalidatePath("/admin/schedule")
    return { success: true }
}

export async function deleteUser(id: string): Promise<{ error?: string; success?: boolean }> {
    const denied = await requireAdminSession()
    if (denied) return { error: denied }

    const user = await prisma.user.findUnique({ where: { id } })
    if (!user) return { error: "Utilisateur introuvable." }

    if (user.role === "ADMIN") {
        const cnt = await prisma.user.count({ where: { role: "ADMIN" } })
        if (cnt <= 1) {
            return { error: "Impossible de supprimer le dernier administrateur." }
        }
    }

    try {
        await prisma.user.delete({ where: { id } })
    } catch (e) {
        console.error(e)
        return {
            error: "Suppression impossible (données liées : jobs, véhicules, etc.). Retirez d’abord les liens ou archivez le compte.",
        }
    }

    revalidatePath("/admin/users")
    revalidatePath("/admin/team")
    revalidatePath("/admin/clients")
    revalidatePath("/admin/schedule")
    return { success: true }
}
