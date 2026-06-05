"use server"

import prisma from "@/lib/db"
import { serialize } from "@/lib/utils"

export async function getDashboardStats() {
    const now = new Date()

    // Semaine courante (lundi → dimanche)
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

    // Aujourd'hui & hier
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1)
    const yesterdayEnd = new Date(todayEnd); yesterdayEnd.setDate(yesterdayEnd.getDate() - 1)

    // Même mois l'an dernier
    const lastYearMonthStart = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    const lastYearMonthEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1)

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
        lowStockCount,
        jobsYesterdayRaw,
        jobsLastYearMonthRaw,
        allAvailabilities,
        allEmployees,
    ] = await Promise.all([
        prisma.clientProfile.count(),

        prisma.job.findMany({
            where: { scheduledDate: { gte: startOfWeek, lt: endOfWeek }, status: { not: "CANCELLED" } },
            orderBy: { scheduledDate: "asc" },
            include: {
                employees: { include: { user: true } },
                employee: { include: { user: true } },
                client: { include: { user: true } },
                vehicle: true,
                services: { include: { service: true } },
                timeLogs: true,
            },
        }),

        prisma.job.findMany({
            where: { scheduledDate: { gte: startOfNextWeek, lt: endOfNextWeek }, status: { not: "CANCELLED" } },
            orderBy: { scheduledDate: "asc" },
            include: {
                employees: { include: { user: true } },
                employee: { include: { user: true } },
                client: { include: { user: true } },
                vehicle: true,
                services: { include: { service: true } },
                timeLogs: true,
            },
        }),

        prisma.job.findMany({
            where: { scheduledDate: { gte: startOfMonth }, status: { not: "CANCELLED" } },
            include: { employees: { include: { user: true } }, employee: { include: { user: true } }, timeLogs: true },
        }),

        prisma.job.findMany({
            where: { scheduledDate: { gte: startOfYear }, status: { not: "CANCELLED" } },
            include: { employees: { include: { user: true } }, employee: { include: { user: true } }, timeLogs: true },
        }),

        prisma.job.findMany({
            take: 5,
            where: { status: "COMPLETED" },
            orderBy: { scheduledDate: "desc" },
            include: { client: { include: { user: true } }, services: { include: { service: true } }, vehicle: true },
        }),

        prisma.inventoryItem.count({
            where: { quantity: { lte: prisma.inventoryItem.fields.minThreshold } },
        }),

        // Hier (pour comparaison)
        prisma.job.findMany({
            where: { scheduledDate: { gte: yesterdayStart, lte: yesterdayEnd }, status: "COMPLETED" },
            select: { totalPrice: true },
        }),

        // Même mois an dernier
        prisma.job.findMany({
            where: { scheduledDate: { gte: lastYearMonthStart, lt: lastYearMonthEnd }, status: "COMPLETED" },
            select: { totalPrice: true },
        }),

        // Disponibilités de la semaine
        prisma.availability.findMany({
            where: {
                OR: [
                    { date: { gte: startOfWeek, lt: endOfWeek } },
                    { dayOfWeek: { gte: 0 } },
                ],
            },
        }),

        // Tous les employés
        prisma.employeeProfile.findMany({ include: { user: true } }),
    ])

    // ── Helpers ──────────────────────────────────────────────────────────
    const resolveJobDurationHrs = (job: any): number => {
        if (job.startedAt && job.completedAt) {
            const mins = (new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 60000
            if (mins > 0) return mins / 60
        }
        if (job.timeLogs?.length) {
            const totalMin = job.timeLogs.reduce((acc: number, log: any) => acc + (log.durationMin || 0), 0)
            if (totalMin > 0) return totalMin / 60
        }
        if (job.durationMin && job.durationMin > 0) return job.durationMin / 60
        return 1
    }

    const calculateMetrics = (jobs: any[]) => {
        let revenue = 0, hours = 0, salary = 0
        const employeeBreakdown: Record<string, { hours: number; salary: number; name: string }> = {}
        jobs.forEach((job) => {
            revenue += job.totalPrice || 0
            const durationHrs = resolveJobDurationHrs(job)
            hours += durationHrs
            const emps = job.employees?.length ? job.employees : job.employee ? [job.employee] : []
            emps.forEach((emp: any) => {
                const empSalary = (emp.hourlyRate || 0) * durationHrs
                salary += empSalary
                const empName = emp.user?.name || "Employé inconnu"
                if (!employeeBreakdown[emp.id]) employeeBreakdown[emp.id] = { name: empName, hours: 0, salary: 0 }
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

    // ── Aujourd'hui ───────────────────────────────────────────────────────
    const jobsToday = jobsWeekRaw.filter((j: any) => {
        const d = new Date(j.scheduledDate)
        return d >= todayStart && d <= todayEnd
    })
    const todayRevenue = jobsToday.filter((j: any) => j.status === "COMPLETED").reduce((s: number, j: any) => s + (j.totalPrice || 0), 0)
    const yesterdayRevenue = jobsYesterdayRaw.reduce((s: number, j: any) => s + (j.totalPrice || 0), 0)
    const todayVsYesterdayPct = yesterdayRevenue > 0
        ? Math.round(((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100)
        : null

    // ── Jobs en retard ────────────────────────────────────────────────────
    // Job en retard = prévu avant maintenant, pas encore terminé/annulé
    const lateJobs = jobsToday.filter((j: any) => {
        if (j.status === "COMPLETED" || j.status === "CANCELLED") return false
        const scheduledEnd = new Date(j.scheduledDate).getTime() + ((j.durationMin || 60) * 60 * 1000)
        return scheduledEnd < now.getTime()
    })

    // ── Taux d'occupation de l'équipe (semaine) ──────────────────────────
    // Heures dispos = somme des plages de dispo de la semaine pour tous les employés
    const WEEK_START_MS = startOfWeek.getTime()
    let totalAvailableHrs = 0
    const weekDayOfWeekMap: Record<number, boolean> = {}
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek); d.setDate(d.getDate() + i)
        weekDayOfWeekMap[d.getDay()] = true
    }

    allAvailabilities.forEach((av: any) => {
        const [sh, sm] = av.startTime.split(":").map(Number)
        const [eh, em] = av.endTime.split(":").map(Number)
        const durationH = (eh * 60 + em - (sh * 60 + sm)) / 60
        if (durationH <= 0) return

        if (av.date) {
            // Dispo spécifique
            const d = new Date(av.date)
            if (d >= startOfWeek && d < endOfWeek) totalAvailableHrs += durationH
        } else if (weekDayOfWeekMap[av.dayOfWeek]) {
            // Dispo récurrente active sur ce jour de semaine
            totalAvailableHrs += durationH
        }
    })

    const occupancyPct = totalAvailableHrs > 0
        ? Math.round((weekMetrics.hours / totalAvailableHrs) * 100)
        : null

    // ── Record mensuel vs même mois an dernier ────────────────────────────
    const lastYearMonthRevenue = jobsLastYearMonthRaw.reduce((s: number, j: any) => s + (j.totalPrice || 0), 0)
    const thisMonthRevenue = monthMetrics.revenue
    const monthVsLastYearPct = lastYearMonthRevenue > 0
        ? Math.round(((thisMonthRevenue - lastYearMonthRevenue) / lastYearMonthRevenue) * 100)
        : null
    const isMonthRecord = thisMonthRevenue > lastYearMonthRevenue

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
        lowStockCount,
        // Nouveaux indicateurs
        today: { revenue: todayRevenue, jobCount: jobsToday.length },
        yesterday: { revenue: yesterdayRevenue },
        todayVsYesterdayPct,
        lateJobs,
        occupancyPct,
        lastYearMonthRevenue,
        monthVsLastYearPct,
        isMonthRecord,
    })
}

export async function updateSystemSettings(data: { averageVehicleCost: number }) {
    await prisma.systemSetting.upsert({
        where: { id: "GLOBAL" },
        update: { averageVehicleCost: data.averageVehicleCost },
        create: { id: "GLOBAL", averageVehicleCost: data.averageVehicleCost },
    })
    return { success: true }
}
