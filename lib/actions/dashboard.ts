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

    // Semaine prochaine
    const startOfNextWeek = new Date(endOfWeek)
    const endOfNextWeek = new Date(startOfNextWeek)
    endOfNextWeek.setDate(startOfNextWeek.getDate() + 7)

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
        jobsNextWeekRaw,
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
                employees: { include: { user: true } }, 
                employee: { include: { user: true } }, 
                client: { include: { user: true } }, 
                vehicle: true, 
                services: { include: { service: true } },
                timeLogs: true,
            }
        }),
        
        prisma.job.findMany({ 
            where: { scheduledDate: { gte: startOfNextWeek, lt: endOfNextWeek }, status: { not: 'CANCELLED' } },
            orderBy: { scheduledDate: 'asc' },
            include: { 
                employees: { include: { user: true } }, 
                employee: { include: { user: true } }, 
                client: { include: { user: true } }, 
                vehicle: true, 
                services: { include: { service: true } },
                timeLogs: true,
            }
        }),
        
        prisma.job.findMany({ 
            where: { scheduledDate: { gte: startOfMonth }, status: { not: 'CANCELLED' } },
            include: { employees: { include: { user: true } }, employee: { include: { user: true } }, timeLogs: true }
        }),
        
        prisma.job.findMany({ 
            where: { scheduledDate: { gte: startOfYear }, status: { not: 'CANCELLED' } },
            include: { employees: { include: { user: true } }, employee: { include: { user: true } }, timeLogs: true }
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

    // Calcule la durée réelle d'un job en heures
    // Priorité : 1) startedAt→completedAt  2) timeLogs  3) durationMin  4) 60 min
    const resolveJobDurationHrs = (job: any): number => {
        // 1) Temps réel chrono (heure de début → heure de fin)
        if (job.startedAt && job.completedAt) {
            const mins = (new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 60000
            if (mins > 0) return mins / 60
        }
        // 2) Somme des timeLogs
        if (job.timeLogs?.length) {
            const totalMin = job.timeLogs.reduce((acc: number, log: any) => acc + (log.durationMin || 0), 0)
            if (totalMin > 0) return totalMin / 60
        }
        // 3) Durée manuelle
        if (job.durationMin && job.durationMin > 0) return job.durationMin / 60
        // 4) Défaut 60 min
        return 1
    }

    const calculateMetrics = (jobs: any[]) => {
        let revenue = 0
        let hours = 0
        let salary = 0
        let employeeBreakdown: Record<string, { hours: number, salary: number, name: string }> = {}
        
        jobs.forEach(job => {
            revenue += job.totalPrice || 0
            const durationHrs = resolveJobDurationHrs(job)
            hours += durationHrs
            
            const emps = job.employees?.length ? job.employees : (job.employee ? [job.employee] : [])
            emps.forEach((emp: any) => {
                const empSalary = (emp.hourlyRate || 0) * durationHrs
                salary += empSalary
                
                const empName = emp.user?.name || "Employé inconnu"
                if (!employeeBreakdown[emp.id]) {
                    employeeBreakdown[emp.id] = { name: empName, hours: 0, salary: 0 }
                }
                employeeBreakdown[emp.id].hours += durationHrs
                employeeBreakdown[emp.id].salary += empSalary
            })
        })
        
        const count = jobs.length
        const totalVehicleCost = count * avgVehicleCost
        const profit = revenue - salary - totalVehicleCost
        
        return { count, revenue, hours, salary, profit, totalVehicleCost, employeeBreakdown: Object.values(employeeBreakdown) }
    }

    const weekMetrics = calculateMetrics(jobsWeekRaw)
    const nextWeekMetrics = calculateMetrics(jobsNextWeekRaw)
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
        nextWeek: nextWeekMetrics,
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
