"use server"

import prisma from "@/lib/db"
import { startOfWeek, subWeeks, endOfWeek, format, startOfMonth, subMonths, endOfMonth, startOfYear } from "date-fns"
import { fr } from "date-fns/locale"

export type WeeklyRevenue = {
    week: string       // "Sem 21"
    weekLabel: string  // "21 avr"
    revenue: number
    jobs: number
    margin: number
}

export type TopClient = {
    id: string
    name: string
    jobCount: number
    totalRevenue: number
    lastJobDate: string | null
}

export type ReportsData = {
    // KPIs
    revenueThisWeek: number
    revenueThisMonth: number
    revenuePrevMonth: number
    revenueAllTime: number
    jobsCompleted: number
    jobsCompletionRate: number
    totalClients: number
    shopJobsCount: number
    mobileJobsCount: number
    shopRevenue: number
    mobileRevenue: number

    // Graphiques
    weeklyRevenue: WeeklyRevenue[]
    serviceBreakdown: { name: string; revenue: number; jobCount: number }[]
    profitabilityByService: { name: string; profitPerHour: number; avgRevenue: number; avgDurationH: number }[]
    statusBreakdown: { status: string; count: number }[]
    dayOfWeekActivity: { day: string; jobs: number; revenue: number }[]

    // Top clients
    topClients: TopClient[]

    // Moyennes
    avgJobRevenue: number
    avgJobDurationH: number
}

function jobDurationMinFallback(job: any): number {
    if (job.timeLogs?.length) {
        const total = job.timeLogs.reduce((a: number, l: any) => a + (l.durationMin || 0), 0)
        if (total > 0) return total
    }
    if (job.startedAt && job.completedAt) {
        const mins = (new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 60000
        if (mins > 0) return mins
    }
    return job.durationMin || 60
}

export async function getReportsData(): Promise<ReportsData> {
    const now = new Date()
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 })
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const thisMonthStart = startOfMonth(now)
    const prevMonthStart = startOfMonth(subMonths(now, 1))
    const prevMonthEnd = endOfMonth(subMonths(now, 1))
    const yearStart = startOfYear(now)

    // 12 semaines de données
    const twelveWeeksAgo = subWeeks(thisWeekStart, 11)

    const [allJobs, totalClients] = await Promise.all([
        prisma.job.findMany({
            where: { scheduledDate: { gte: twelveWeeksAgo } },
            include: {
                services: { include: { service: true } },
                client: { include: { user: true } },
                timeLogs: true,
            },
            orderBy: { scheduledDate: "asc" },
        }),
        prisma.clientProfile.count(),
    ])

    // Jobs all-time pour certains KPIs
    const allTimeJobs = await prisma.job.findMany({
        where: { status: "COMPLETED" },
        include: {
            services: { include: { service: true } },
            client: { include: { user: true } },
            timeLogs: true,
        },
    })

    const allJobsTotal = await prisma.job.count()
    const completedTotal = allTimeJobs.length
    const completionRate = allJobsTotal > 0 ? Math.round((completedTotal / allJobsTotal) * 100) : 0

    // KPIs de base
    const thisWeekJobs = allJobs.filter(j => {
        const d = new Date(j.scheduledDate)
        return d >= thisWeekStart && d <= thisWeekEnd && j.status !== "CANCELLED"
    })
    const thisMonthJobs = allJobs.filter(j => {
        const d = new Date(j.scheduledDate)
        return d >= thisMonthStart && j.status !== "CANCELLED"
    })
    const prevMonthJobs = await prisma.job.findMany({
        where: { scheduledDate: { gte: prevMonthStart, lte: prevMonthEnd }, status: { not: "CANCELLED" } },
        select: { totalPrice: true },
    })

    const sum = (jobs: any[]) => jobs.reduce((a, j) => a + (j.totalPrice || 0), 0)

    const revenueThisWeek = sum(thisWeekJobs)
    const revenueThisMonth = sum(thisMonthJobs)
    const revenuePrevMonth = prevMonthJobs.reduce((a, j) => a + (j.totalPrice || 0), 0)
    const revenueAllTime = allTimeJobs.reduce((a, j) => a + (j.totalPrice || 0), 0)

    // Shop vs Mobile
    const shopJobs = allTimeJobs.filter(j => (j as any).isInShop)
    const mobileJobs = allTimeJobs.filter(j => !(j as any).isInShop)

    // Graphique semaine par semaine (12 semaines)
    const weeklyRevenue: WeeklyRevenue[] = []
    for (let i = 11; i >= 0; i--) {
        const wStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
        const wEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
        const wJobs = allJobs.filter(j => {
            const d = new Date(j.scheduledDate)
            return d >= wStart && d <= wEnd && j.status !== "CANCELLED"
        })
        const wRevenue = sum(wJobs)
        const wCompleted = wJobs.filter(j => j.status === "COMPLETED")
        const wMargin = wCompleted.reduce((a, j) => {
            const dur = jobDurationMinFallback(j) / 60
            return a + (j.totalPrice || 0) - dur * 0  // marge = CA (sans coûts connus)
        }, 0)

        weeklyRevenue.push({
            week: format(wStart, "'Sem' w", { locale: fr }),
            weekLabel: format(wStart, "d MMM", { locale: fr }),
            revenue: parseFloat(wRevenue.toFixed(2)),
            jobs: wJobs.length,
            margin: parseFloat(wRevenue.toFixed(2)),
        })
    }

    // Répartition par service
    const serviceMap = new Map<string, { name: string; revenue: number; jobCount: number }>()
    for (const job of allTimeJobs) {
        if (!job.services.length) continue
        const share = 1 / job.services.length
        for (const js of job.services) {
            const key = js.service.name
            if (!serviceMap.has(key)) serviceMap.set(key, { name: key, revenue: 0, jobCount: 0 })
            const s = serviceMap.get(key)!
            s.revenue += (job.totalPrice || 0) * share
            s.jobCount++
        }
    }
    const serviceBreakdown = Array.from(serviceMap.values())
        .map(s => ({ ...s, revenue: parseFloat(s.revenue.toFixed(2)) }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8)

    // Rentabilité par service
    const profitMap = new Map<string, { name: string; totalRevenue: number; totalDuration: number; count: number }>()
    for (const job of allTimeJobs) {
        if (!job.services.length) continue
        const dur = jobDurationMinFallback(job)
        const share = 1 / job.services.length
        for (const js of job.services) {
            const key = js.service.name
            if (!profitMap.has(key)) profitMap.set(key, { name: key, totalRevenue: 0, totalDuration: 0, count: 0 })
            const s = profitMap.get(key)!
            s.totalRevenue += (job.totalPrice || 0) * share
            s.totalDuration += dur * share
            s.count++
        }
    }
    const profitabilityByService = Array.from(profitMap.values())
        .map(s => {
            const avgRevenue = s.count > 0 ? s.totalRevenue / s.count : 0
            const avgDurationH = s.count > 0 ? (s.totalDuration / s.count) / 60 : 1
            const profitPerHour = avgDurationH > 0 ? avgRevenue / avgDurationH : 0
            return {
                name: s.name,
                profitPerHour: parseFloat(profitPerHour.toFixed(2)),
                avgRevenue: parseFloat(avgRevenue.toFixed(2)),
                avgDurationH: parseFloat(avgDurationH.toFixed(2)),
            }
        })
        .sort((a, b) => b.profitPerHour - a.profitPerHour)
        .slice(0, 6)

    // Répartition statuts (12 semaines)
    const statusCount = new Map<string, number>()
    for (const j of allJobs) {
        statusCount.set(j.status, (statusCount.get(j.status) || 0) + 1)
    }
    const statusBreakdown = Array.from(statusCount.entries()).map(([status, count]) => ({ status, count }))

    // Activité par jour de semaine
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
    const dayData = days.map(day => ({ day, jobs: 0, revenue: 0 }))
    for (const j of allTimeJobs) {
        const dow = new Date(j.scheduledDate).getDay() // 0=Sun
        const idx = dow === 0 ? 6 : dow - 1
        dayData[idx].jobs++
        dayData[idx].revenue += j.totalPrice || 0
    }

    // Top clients
    const clientMap = new Map<string, { id: string; name: string; revenue: number; jobCount: number; lastDate: Date | null }>()
    for (const j of allTimeJobs) {
        const cid = j.clientId
        const name = (j.client as any)?.user?.name || "Inconnu"
        if (!clientMap.has(cid)) clientMap.set(cid, { id: cid, name, revenue: 0, jobCount: 0, lastDate: null })
        const c = clientMap.get(cid)!
        c.revenue += j.totalPrice || 0
        c.jobCount++
        const d = new Date(j.scheduledDate)
        if (!c.lastDate || d > c.lastDate) c.lastDate = d
    }
    const topClients: TopClient[] = Array.from(clientMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
        .map(c => ({
            id: c.id,
            name: c.name,
            jobCount: c.jobCount,
            totalRevenue: parseFloat(c.revenue.toFixed(2)),
            lastJobDate: c.lastDate ? format(c.lastDate, "d MMM yyyy", { locale: fr }) : null,
        }))

    // Moyennes globales
    const avgJobRevenue = completedTotal > 0 ? parseFloat((revenueAllTime / completedTotal).toFixed(2)) : 0
    const totalDurMin = allTimeJobs.reduce((a, j) => a + jobDurationMinFallback(j), 0)
    const avgJobDurationH = completedTotal > 0 ? parseFloat(((totalDurMin / completedTotal) / 60).toFixed(2)) : 0

    return {
        revenueThisWeek,
        revenueThisMonth,
        revenuePrevMonth,
        revenueAllTime,
        jobsCompleted: completedTotal,
        jobsCompletionRate: completionRate,
        totalClients,
        shopJobsCount: shopJobs.length,
        mobileJobsCount: mobileJobs.length,
        shopRevenue: parseFloat(sum(shopJobs).toFixed(2)),
        mobileRevenue: parseFloat(sum(mobileJobs).toFixed(2)),
        weeklyRevenue,
        serviceBreakdown,
        profitabilityByService,
        statusBreakdown,
        dayOfWeekActivity: dayData.map(d => ({ ...d, revenue: parseFloat(d.revenue.toFixed(2)) })),
        topClients,
        avgJobRevenue,
        avgJobDurationH,
    }
}
