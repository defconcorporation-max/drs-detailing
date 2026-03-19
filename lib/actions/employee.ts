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
    const password = data.get('password') as string
    const hourlyRate = parseFloat(data.get('hourlyRate') as string)

    try {
        await prisma.user.update({
            where: { id },
            data: {
                name,
                email,
                password,
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
