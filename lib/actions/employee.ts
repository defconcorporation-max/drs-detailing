"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createEmployee(data: FormData) {
    const name = data.get('name') as string
    const email = data.get('email') as string
    const password = data.get('password') as string
    const hourlyRate = parseFloat(data.get('hourlyRate') as string)

    if (!name || !email || !password) return { error: "Tous les champs sont requis" }

    try {
        const exists = await prisma.user.findUnique({ where: { email } })
        if (exists) return { error: "Email déjà utilisé" }

        await prisma.user.create({
            data: {
                name,
                email,
                password, // Plain text for MVP as requested/implied context
                role: 'EMPLOYEE',
                employeeProfile: {
                    create: {
                        hourlyRate: hourlyRate || 0
                    }
                }
            }
        })
    } catch (e) {
        return { error: "Erreur création employé" }
    }

    revalidatePath('/admin/team')
    redirect('/admin/team')
}

export async function getEmployeeById(id: string) {
    const user = await prisma.user.findUnique({
        where: { id },
        include: { employeeProfile: true }
    })
    return user
}

export async function updateEmployee(id: string, data: FormData) {
    const name = data.get('name') as string
    const email = data.get('email') as string
    const newPassword = ((data.get('newPassword') as string) || (data.get('password') as string) || '').trim()
    const hourlyRate = parseFloat(data.get('hourlyRate') as string)

    try {
        await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                ...(newPassword ? { password: newPassword } : {}),
                employeeProfile: {
                    update: {
                        hourlyRate: hourlyRate || 0
                    }
                }
            }
        })
    } catch (e) {
        return { error: "Erreur mise à jour" }
    }

    revalidatePath('/admin/team')
    revalidatePath(`/admin/team/${id}`)
    redirect('/admin/team')
}

export async function deleteEmployee(id: string) {
    try {
        await prisma.user.delete({ where: { id } })
    } catch (e) {
        return { error: "Erreur suppression" }
    }
    revalidatePath('/admin/team')
    redirect('/admin/team')
}

export async function getEmployeeWeekSchedule(userId: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employeeProfile: true }
    })
    if (!user || !user.employeeProfile) throw new Error("Employee not found")

    const now = new Date()
    // Lundi de cette semaine
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1))
    startOfWeek.setHours(0, 0, 0, 0)

    // Dimanche fin de journée
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    const [jobs, availabilities] = await Promise.all([
        prisma.job.findMany({
            where: {
                scheduledDate: { gte: startOfWeek, lt: endOfWeek },
                status: { not: "CANCELLED" },
                OR: [
                    { employeeId: user.employeeProfile.id },
                    { employees: { some: { id: user.employeeProfile.id } } }
                ]
            },
            orderBy: { scheduledDate: "asc" },
            include: {
                client: { include: { user: true } },
                vehicle: true,
                services: { include: { service: true } },
                timeLogs: true,
            }
        }),
        prisma.availability.findMany({
            where: {
                employeeId: user.employeeProfile.id,
                OR: [
                    { date: { gte: startOfWeek, lt: endOfWeek } },
                    { dayOfWeek: { gte: 0 } }
                ]
            }
        })
    ])

    return { jobs, availabilities, startOfWeek }
}
