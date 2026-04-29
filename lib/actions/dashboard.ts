"use server"

import prisma from "@/lib/db"
import { serialize } from "@/lib/utils"

export async function getDashboardStats() {
    const now = new Date()
    
    // Pour la semaine : de lundi à dimanche
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1))
    startOfWeek.setHours(0, 0, 0, 0)
    
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 7)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Ensure SystemSetting exists
    let setting = await prisma.systemSetting.findUnique({ where: { id: "GLOBAL" } })
    if (!setting) {
        setting = await prisma.systemSetting.create({ data: { id: "GLOBAL", averageVehicleCost: 7.0 } })
    }
    const avgVehicleCost = setting.averageVehicleCost

    const [
        clientsCount,
        jobsWeekRaw,
        jobsMonthRaw,
        jobsYearRaw,
        recentCompletedJobs,
        lowStockCount
    ] = await Promise.all([
        prisma.clientProfile.count(),
        
        prisma.job.findMany({ 
            where: { scheduledDate: { gte: startOfWeek, lt: endOfWeek }, status: { not: 'CANCELLED' } },
            orderBy: { scheduledDate: 'asc' },
            include: { 
                employees: true, 
                employee: true, 
                client: { include: { user: true } }, 
                vehicle: true, 
                services: { include: { service: true } } 
            }
        }),
        
        prisma.job.findMany({ 
            where: { scheduledDate: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
            include: { employees: true, employee: true }
        }),
        
        prisma.job.findMany({ 
            where: { scheduledDate: { gte: startOfYear }, status: { not: 'CANCELLED' } },
            include: { employees: true, employee: true }
        }),
        
        prisma.job.findMany({
            take: 5,
            where: { status: 'COMPLETED' },
            orderBy: { scheduledDate: 'desc' },
            include: { client: { include: { user: true } }, services: { include: { service: true } }, vehicle: true }
        }),
        
        prisma.inventoryItem.count({
            where: { quantity: { lte: prisma.inventoryItem.fields.minThreshold } }
        })
    ])

    const calculateMetrics = (jobs: any[]) => {
        let revenue = 0
        let hours = 0
        let salary = 0
        
        jobs.forEach(job => {
            revenue += job.totalPrice || 0
            const durationHrs = (job.durationMin || 60) / 60
            hours += durationHrs
            
            const emps = job.employees?.length ? job.employees : (job.employee ? [job.employee] : [])
            emps.forEach((emp: any) => {
                salary += (emp.hourlyRate || 0) * durationHrs
            })
        })
        
        const count = jobs.length
        const totalVehicleCost = count * avgVehicleCost
        const profit = revenue - salary - totalVehicleCost
        
        return { count, revenue, hours, salary, profit }
    }

    const weekMetrics = calculateMetrics(jobsWeekRaw)
    const monthMetrics = calculateMetrics(jobsMonthRaw)
    const yearMetrics = calculateMetrics(jobsYearRaw)

    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    
    const jobsToday = jobsWeekRaw.filter((j: any) => {
        const d = new Date(j.scheduledDate)
        return d >= todayStart && d <= todayEnd
    })

    return serialize({
        clientsCount,
        avgVehicleCost,
        week: weekMetrics,
        month: monthMetrics,
        year: yearMetrics,
        jobsToday,
        jobsWeek: jobsWeekRaw,
        recentCompletedJobs,
        lowStockCount
    })
}

export async function updateSystemSettings(data: { averageVehicleCost: number }) {
    await prisma.systemSetting.upsert({
        where: { id: "GLOBAL" },
        update: { averageVehicleCost: data.averageVehicleCost },
        create: { id: "GLOBAL", averageVehicleCost: data.averageVehicleCost }
    })
    return { success: true }
}
