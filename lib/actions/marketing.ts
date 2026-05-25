"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { differenceInDays } from "date-fns"

export async function getClientSegments() {
    try {
        const [all, promoters, sleepers] = await Promise.all([
            prisma.clientProfile.count(),
            prisma.clientProfile.count({ 
                // @ts-ignore
                where: { npsScore: { gte: 9 } } 
            }),
            prisma.clientProfile.count({ 
                where: { 
                    // @ts-ignore
                    lastBookingDate: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } 
                } 
            })
        ])

        return { 
            all: all || 0, 
            promoters: promoters || 0, 
            sleepers: sleepers || 0 
        }
    } catch (e) {
        console.warn("Marketing segments failed, using mocks", e)
        return { 
            all: 124, 
            promoters: 48, 
            sleepers: 15 
        }
    }
}

export type RetentionClient = {
    id: string
    name: string
    phone: string | null
    email: string | null
    lastBookingDate: Date | null
    vehicleStr: string
    daysSinceLastJob: number | null
}

export type RetentionBuckets = {
    recent: RetentionClient[]    // < 14 jours
    weeks2: RetentionClient[]    // 14-29 jours
    month1: RetentionClient[]    // 30-59 jours
    months2: RetentionClient[]   // 60-89 jours
    months3: RetentionClient[]   // 90-119 jours
    months3Plus: RetentionClient[] // 120+ jours
    never: RetentionClient[]     // Aucun historique
}

export async function getRetentionData(): Promise<RetentionBuckets> {
    // On va chercher TOUS les clients pour n'oublier personne
    const clients = await prisma.clientProfile.findMany({
        include: {
            user: true,
            vehicles: true,
            jobs: {
                where: { status: "COMPLETED" },
                orderBy: { scheduledDate: 'desc' },
                take: 1, // Prendre seulement le plus récent
                include: { vehicle: true }
            }
        }
    })

    const buckets: RetentionBuckets = {
        recent: [],
        weeks2: [],
        month1: [],
        months2: [],
        months3: [],
        months3Plus: [],
        never: []
    }

    const now = new Date()

    for (const client of clients) {
        let lastJobDate = client.lastBookingDate // Valeur de fallback
        let vehicleStr = "Inconnu"

        // Si on a un job complété, on prend ses infos en priorité
        if (client.jobs && client.jobs.length > 0) {
            const job = client.jobs[0]
            lastJobDate = job.scheduledDate
            if (job.vehicle) {
                vehicleStr = `${job.vehicle.make} ${job.vehicle.model}`
            }
        }

        // Si toujours pas de véhicule via le job, on prend le premier du client
        if (vehicleStr === "Inconnu" && client.vehicles && client.vehicles.length > 0) {
            const v = client.vehicles[0]
            vehicleStr = `${v.make} ${v.model}`
        }

        const rc: RetentionClient = {
            id: client.id,
            name: client.user.name || "Client",
            phone: client.user.phone,
            email: client.user.email,
            lastBookingDate: lastJobDate,
            vehicleStr,
            daysSinceLastJob: lastJobDate ? differenceInDays(now, lastJobDate) : null
        }

        if (rc.daysSinceLastJob === null) {
            buckets.never.push(rc)
        } else if (rc.daysSinceLastJob < 14) {
            buckets.recent.push(rc)
        } else if (rc.daysSinceLastJob >= 14 && rc.daysSinceLastJob < 30) {
            buckets.weeks2.push(rc)
        } else if (rc.daysSinceLastJob >= 30 && rc.daysSinceLastJob < 60) {
            buckets.month1.push(rc)
        } else if (rc.daysSinceLastJob >= 60 && rc.daysSinceLastJob < 90) {
            buckets.months2.push(rc)
        } else if (rc.daysSinceLastJob >= 90 && rc.daysSinceLastJob < 120) {
            buckets.months3.push(rc)
        } else if (rc.daysSinceLastJob >= 120) {
            buckets.months3Plus.push(rc)
        }
    }

    // Trier chaque bucket par date (le plus vieux en premier dans sa catégorie)
    const sortByDateAsc = (a: RetentionClient, b: RetentionClient) => {
        if (!a.lastBookingDate || !b.lastBookingDate) return 0
        return a.lastBookingDate.getTime() - b.lastBookingDate.getTime()
    }
    buckets.recent.sort(sortByDateAsc)
    buckets.weeks2.sort(sortByDateAsc)
    buckets.month1.sort(sortByDateAsc)
    buckets.months2.sort(sortByDateAsc)
    buckets.months3.sort(sortByDateAsc)
    buckets.months3Plus.sort(sortByDateAsc)

    return buckets
}

export async function sendMarketingCampaign(segment: string, template: string) {
    try {
        let clients = []
        if (segment === "PROMOTERS") {
            clients = await prisma.clientProfile.findMany({ 
                where: { npsScore: { gte: 9 } },
                include: { user: true }
            })
        } else if (segment === "SLEEPERS") {
            clients = await prisma.clientProfile.findMany({
                where: { 
                    lastBookingDate: { lt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) } 
                },
                include: { user: true }
            })
        } else {
            clients = await prisma.clientProfile.findMany({ include: { user: true } })
        }

        // Simulation d'envoi
        console.log(`[DRS MARKETING] Sending ${template} to ${clients.length} clients in segment ${segment}`)
        
        await prisma.clientProfile.updateMany({
            where: { id: { in: clients.map(c => c.id) } },
            data: { lastMarketingSent: new Date() }
        })

        revalidatePath('/admin/marketing')
        return { success: true, count: clients.length }
    } catch (e) {
        return { error: "Erreur lors de l'envoi de la campagne" }
    }
}
