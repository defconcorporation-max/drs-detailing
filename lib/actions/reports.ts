"use server"

import prisma from "@/lib/db"
import { startOfWeek, subWeeks, endOfWeek, format, startOfMonth, subMonths, endOfMonth } from "date-fns"
import { fr } from "date-fns/locale"

export type WeeklyRevenue = {
    week: string
    weekLabel: string
    revenue: number
    jobs: number
}

export type TopClient = {
    id: string
    name: string
    jobCount: number
    totalRevenue: number
    lastJobDate: string | null
}

export type ReportsData = {
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
    weeklyRevenue: WeeklyRevenue[]
    serviceBreakdown: { name: string; revenue: number; jobCount: number }[]
    profitabilityByService: { name: string; profitPerHour: number; avgRevenue: number; avgDurationH: number }[]
    statusBreakdown: { status: string; count: number }[]
    dayOfWeekActivity: { day: string; jobs: number; revenue: number }[]
    topClients: TopClient[]
    avgJobRevenue: number
    avgJobDurationH: number
}

// Revenu réel d'un job : totalPrice stocké OU somme des prix de base des services
function resolveJobRevenue(job: any): number {
    if (job.totalPrice != null && job.totalPrice > 0) return job.totalPrice
    // Fallback : somme des services de catalogue + service custom
    let cat = 0
    if (job.services?.length) {
        cat = job.services.reduce((acc: number, js: any) => {
            return acc + (js.service?.basePrice || 0)
        }, 0)
    }
    const custom = job.customServicePrice || 0
    return cat + custom
}

// Durée d'un job en minutes
function resolveJobDurationMin(job: any): number {
    if (job.timeLogs?.length) {
        const t = job.timeLogs.reduce((a: number, l: any) => a + (l.durationMin || 0), 0)
        if (t > 0) return t
    }
    if (job.startedAt && job.completedAt) {
        const mins = (new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 60000
        if (mins > 0) return mins
    }
    if (job.durationMin && job.durationMin > 0) return job.durationMin
    // Estimation depuis les services
    if (job.services?.length) {
        const total = job.services.reduce((a: number, js: any) => a + (js.service?.durationMin || 60), 0)
        if (total > 0) return total
    }
    return 60
}

export async function getReportsData(): Promise<ReportsData> {
    const now = new Date()
    const thisWeekStart = startOfWeek(now, { weekStartsOn: 1 })
    const thisWeekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const thisMonthStart = startOfMonth(now)
    const prevMonthStart = startOfMonth(subMonths(now, 1))
    const prevMonthEnd = endOfMonth(subMonths(now, 1))
    const twelveWeeksAgo = subWeeks(thisWeekStart, 11)

    // Une seule grande requête — tous les jobs non-annulés (all-time) pour les agrégats globaux
    // + jobs 12 semaines pour les graphiques hebdomadaires
    const [allTimeJobs, totalClients, allJobsCount] = await Promise.all([
        prisma.job.findMany({
            include: {
                services: { include: { service: true } },
                client: { include: { user: true } },
                timeLogs: true,
            },
            orderBy: { scheduledDate: "asc" },
        }),
        prisma.clientProfile.count(),
        prisma.job.count(),
    ])

    // Séparer par statut
    const nonCancelledJobs = allTimeJobs.filter(j => j.status !== "CANCELLED")
    const completedJobs = allTimeJobs.filter(j => j.status === "COMPLETED")
    const jobsCompleted = completedJobs.length
    const completionRate = allJobsCount > 0 ? Math.round((jobsCompleted / allJobsCount) * 100) : 0

    // ── CA par période ──
    const revenueAllTime = nonCancelledJobs.reduce((a, j) => a + resolveJobRevenue(j), 0)

    const thisWeekJobs = nonCancelledJobs.filter(j => {
        const d = new Date(j.scheduledDate)
        return d >= thisWeekStart && d <= thisWeekEnd
    })
    const revenueThisWeek = thisWeekJobs.reduce((a, j) => a + resolveJobRevenue(j), 0)

    const thisMonthJobs = nonCancelledJobs.filter(j => new Date(j.scheduledDate) >= thisMonthStart)
    const revenueThisMonth = thisMonthJobs.reduce((a, j) => a + resolveJobRevenue(j), 0)

    const prevMonthJobs = nonCancelledJobs.filter(j => {
        const d = new Date(j.scheduledDate)
        return d >= prevMonthStart && d <= prevMonthEnd
    })
    const revenuePrevMonth = prevMonthJobs.reduce((a, j) => a + resolveJobRevenue(j), 0)

    // ── Shop vs Mobile ──
    const shopJobs = nonCancelledJobs.filter(j => (j as any).isInShop)
    const mobileJobs = nonCancelledJobs.filter(j => !(j as any).isInShop)
    const shopRevenue = shopJobs.reduce((a, j) => a + resolveJobRevenue(j), 0)
    const mobileRevenue = mobileJobs.reduce((a, j) => a + resolveJobRevenue(j), 0)

    // ── Graphique semaine par semaine (12 semaines) ──
    const weeklyRevenue: WeeklyRevenue[] = []
    for (let i = 11; i >= 0; i--) {
        const wStart = startOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
        const wEnd = endOfWeek(subWeeks(now, i), { weekStartsOn: 1 })
        const wJobs = nonCancelledJobs.filter(j => {
            const d = new Date(j.scheduledDate)
            return d >= wStart && d <= wEnd
        })
        weeklyRevenue.push({
            week: format(wStart, "'S'w", { locale: fr }),
            weekLabel: format(wStart, "d MMM", { locale: fr }),
            revenue: parseFloat(wJobs.reduce((a, j) => a + resolveJobRevenue(j), 0).toFixed(2)),
            jobs: wJobs.length,
        })
    }

    // ── Répartition par service (utilise tous les jobs non-annulés) ──
    const serviceMap = new Map<string, { name: string; revenue: number; jobCount: Set<string> }>()

    // Ajoute aussi les services custom comme catégorie
    for (const job of nonCancelledJobs) {
        const jobRev = resolveJobRevenue(job)

        if (job.services.length > 0) {
            const share = job.services.length > 0 ? 1 / job.services.length : 1
            for (const js of job.services) {
                const name = js.service?.name || "Inconnu"
                if (!serviceMap.has(name)) serviceMap.set(name, { name, revenue: 0, jobCount: new Set() })
                const s = serviceMap.get(name)!
                // Revenu proportionnel si custom aussi présent
                const catRev = job.services.reduce((a: number, x: any) => a + (x.service?.basePrice || 0), 0)
                const customRev = job.customServicePrice || 0
                const total = catRev + customRev
                const serviceRevShare = total > 0 ? (js.service?.basePrice || 0) / total * jobRev : jobRev * share
                s.revenue += serviceRevShare
                s.jobCount.add(job.id)
            }
        }

        // Service custom comme catégorie séparée
        if (job.customServiceName) {
            const name = job.customServiceName
            if (!serviceMap.has(name)) serviceMap.set(name, { name, revenue: 0, jobCount: new Set() })
            const s = serviceMap.get(name)!
            const customRev = job.customServicePrice || 0
            s.revenue += customRev
            s.jobCount.add(job.id)
        }
    }

    const serviceBreakdown = Array.from(serviceMap.values())
        .map(s => ({ name: s.name, revenue: parseFloat(s.revenue.toFixed(2)), jobCount: s.jobCount.size }))
        .filter(s => s.revenue > 0 || s.jobCount > 0)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 8)

    // ── Rentabilité par service ──
    const profitMap = new Map<string, { name: string; totalRevenue: number; totalDuration: number; count: number }>()
    for (const job of completedJobs) {
        const jobRev = resolveJobRevenue(job)
        const dur = resolveJobDurationMin(job)

        if (job.services.length > 0) {
            const share = 1 / job.services.length
            for (const js of job.services) {
                const name = js.service?.name || "Inconnu"
                if (!profitMap.has(name)) profitMap.set(name, { name, totalRevenue: 0, totalDuration: 0, count: 0 })
                const s = profitMap.get(name)!
                s.totalRevenue += jobRev * share
                s.totalDuration += dur * share
                s.count++
            }
        }

        if (job.customServiceName) {
            const name = job.customServiceName
            if (!profitMap.has(name)) profitMap.set(name, { name, totalRevenue: 0, totalDuration: 0, count: 0 })
            const s = profitMap.get(name)!
            s.totalRevenue += job.customServicePrice || 0
            s.totalDuration += dur
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

    // ── Statuts (all-time) ──
    const statusCount = new Map<string, number>()
    for (const j of allTimeJobs) {
        statusCount.set(j.status, (statusCount.get(j.status) || 0) + 1)
    }
    const statusBreakdown = Array.from(statusCount.entries()).map(([status, count]) => ({ status, count }))

    // ── Activité par jour de semaine (completed) ──
    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
    const dayData = days.map(day => ({ day, jobs: 0, revenue: 0 }))
    for (const j of completedJobs) {
        const dow = new Date(j.scheduledDate).getDay()
        const idx = dow === 0 ? 6 : dow - 1
        dayData[idx].jobs++
        dayData[idx].revenue += resolveJobRevenue(j)
    }

    // ── Top clients (non-annulés) ──
    const clientMap = new Map<string, { id: string; name: string; revenue: number; jobCount: number; lastDate: Date | null }>()
    for (const j of nonCancelledJobs) {
        const cid = j.clientId
        const name = (j.client as any)?.user?.name || "Inconnu"
        if (!clientMap.has(cid)) clientMap.set(cid, { id: cid, name, revenue: 0, jobCount: 0, lastDate: null })
        const c = clientMap.get(cid)!
        c.revenue += resolveJobRevenue(j)
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

    // ── Moyennes ──
    const totalRevAllTime = completedJobs.reduce((a, j) => a + resolveJobRevenue(j), 0)
    const avgJobRevenue = jobsCompleted > 0 ? parseFloat((totalRevAllTime / jobsCompleted).toFixed(2)) : 0
    const totalDurMin = completedJobs.reduce((a, j) => a + resolveJobDurationMin(j), 0)
    const avgJobDurationH = jobsCompleted > 0 ? parseFloat(((totalDurMin / jobsCompleted) / 60).toFixed(2)) : 0

    return {
        revenueThisWeek: parseFloat(revenueThisWeek.toFixed(2)),
        revenueThisMonth: parseFloat(revenueThisMonth.toFixed(2)),
        revenuePrevMonth: parseFloat(revenuePrevMonth.toFixed(2)),
        revenueAllTime: parseFloat(revenueAllTime.toFixed(2)),
        jobsCompleted,
        jobsCompletionRate: completionRate,
        totalClients,
        shopJobsCount: shopJobs.length,
        mobileJobsCount: mobileJobs.length,
        shopRevenue: parseFloat(shopRevenue.toFixed(2)),
        mobileRevenue: parseFloat(mobileRevenue.toFixed(2)),
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
