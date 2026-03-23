"use server"

import prisma from "@/lib/db"
import { serialize } from "@/lib/utils"

export async function getDashboardStats() {
    const now = new Date()
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()))
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    const startOfYear = new Date(new Date().getFullYear(), 0, 1)

    const [
        clientsCount,
        activeJobs,
        jobsThisWeek,
        jobsThisMonth,
        jobsThisYear,
        recentActivity,
        lowStockCount
    ] = await Promise.all([
        prisma.clientProfile.count(),
        prisma.job.count({ where: { status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS'] } } }),
        prisma.job.count({ where: { status: 'COMPLETED', scheduledDate: { gte: startOfWeek } } }),
        prisma.job.count({ where: { status: 'COMPLETED', scheduledDate: { gte: startOfMonth } } }),
        prisma.job.count({ where: { status: 'COMPLETED', scheduledDate: { gte: startOfYear } } }),
        prisma.job.findMany({
            take: 5,
            orderBy: { updatedAt: 'desc' },
            include: { client: { include: { user: true } }, services: { include: { service: true } } }
        }),
        prisma.inventoryItem.count({
            where: {
                quantity: { lte: prisma.inventoryItem.fields.minThreshold }
            }
        })
    ])

    // Mock/Calculate AI metrics
    const avgProfitPerHour = 48.5
    const avgNps = "4.9/5"
    const profitIncrease = 15
    // AI & Performance Metrics (Mocked or try/catch for DB fields)
    let pendingReviews = 0
    try {
        pendingReviews = await prisma.clientProfile.count({
            // @ts-ignore
            where: { npsScore: null }
        })
    } catch (e) {
        console.warn("NPS Score column missing from DB yet, using 0 fallback")
    }

    return serialize({
        clientsCount,
        activeJobs,
        jobsThisWeek,
        jobsThisMonth,
        jobsThisYear,
        recentActivity,
        lowStockCount,
        avgProfitPerHour,
        avgNps,
        profitIncrease,
        pendingReviews
    })
}
