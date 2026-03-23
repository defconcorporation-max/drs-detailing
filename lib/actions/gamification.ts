"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getEmployeeStats(employeeId: string) {
    return await prisma.employeeProfile.findUnique({
        where: { id: employeeId },
        include: {
            badges: { include: { badge: true } }
        }
    })
}

export async function addExperience(employeeId: string, amount: number) {
    try {
        const employee = await prisma.employeeProfile.findUnique({
            where: { id: employeeId }
        })

        if (!employee) return { error: "Employee not found" }

        let newExperience = employee.experience + amount
        let newLevel = employee.level

        // Simple level up logic: each level needs level * 1000 XP
        const xpNeeded = newLevel * 1000
        if (newExperience >= xpNeeded) {
            newExperience -= xpNeeded
            newLevel += 1
        }

        await prisma.employeeProfile.update({
            where: { id: employeeId },
            data: {
                experience: newExperience,
                level: newLevel
            }
        })

        revalidatePath('/employee')
        return { success: true, levelUp: newLevel > employee.level, newLevel }
    } catch (e) {
        return { error: "Failed to update experience" }
    }
}

export async function awardBadge(employeeId: string, badgeId: string) {
    try {
        await prisma.employeeBadge.create({
            data: {
                employeeId,
                badgeId
            }
        })
        revalidatePath('/employee')
        return { success: true }
    } catch (e) {
        return { error: "Failed to award badge" }
    }
}

export async function getBadges() {
    return await prisma.badge.findMany()
}
