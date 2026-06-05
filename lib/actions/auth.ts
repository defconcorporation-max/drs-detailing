"use server"

import { cookies } from "next/headers"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"

export async function loginAdmin(formData: FormData) {
    const password = formData.get("password") as string
    // Hardcoded check for MVP as requested: "admin"
    // Also check DB user if we want consistency, but user said "password will be momentarily 'admin'"
    // We'll update the 'admin@drs.com' user password to 'admin' just in case, or just check the string.

    // Check DB Admin User password
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    const isDispatcher = password === 'dispatcher'

    // Fallback or DB check
    const isValidAdmin = (adminUser && adminUser.password === password) || password === 'admin'

    if (isValidAdmin || isDispatcher) {
        const roleStr = isDispatcher ? "dispatcher" : "admin"
        const cookieStore = await cookies()
        cookieStore.set("drs_admin_session", roleStr, { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 30 })
        return { success: true }
    } else {
        return { error: "Mot de passe incorrect" }
    }
}

export async function loginEmployee(formData: FormData) {
    const email = ((formData.get("email") as string) || "").trim().toLowerCase()
    const password = formData.get("password") as string

    const user = await prisma.user.findUnique({
        where: { email },
        include: { employeeProfile: true },
    })

    const okRole = user && (user.role === "EMPLOYEE" || user.role === "ADMIN")
    if (user && okRole && user.password === password) {
        const cookieStore = await cookies()
        cookieStore.set("drs_employee_session", user.id, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 30 })
        return { success: true }
    }
    return { error: "Identifiants invalides" }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete("drs_admin_session")
    cookieStore.delete("drs_employee_session")
    redirect("/")
}
