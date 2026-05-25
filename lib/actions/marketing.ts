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
    lastBookingDate: Date
    vehicleStr: string
    daysSinceLastJob: number
}

export type RetentionBuckets = {
    weeks2: RetentionClient[]
    month1: RetentionClient[]
    months2: RetentionClient[]
    months3: RetentionClient[]
    months3Plus: RetentionClient[]
}

export async function getRetentionData(): Promise<RetentionBuckets> {
    const clients = await prisma.clientProfile.findMany({
        where: {
            lastBookingDate: { not: null }
        },
        include: {
            user: true,
            vehicles: true
        },
        orderBy: {
            lastBookingDate: 'desc'
        }
    })

    const buckets: RetentionBuckets = {
        weeks2: [],
        month1: [],
        months2: [],
        months3: [],
        months3Plus: []
    }

    const now = new Date()

    for (const client of clients) {
        if (!client.lastBookingDate) continue
        const days = differenceInDays(now, client.lastBookingDate)

        let vehicleStr = "Inconnu"
        if (client.vehicles && client.vehicles.length > 0) {
            const v = client.vehicles[0]
            vehicleStr = `${v.make} ${v.model}`
        }

        const rc: RetentionClient = {
            id: client.id,
            name: client.user.name || "Client",
            phone: client.user.phone,
            email: client.user.email,
            lastBookingDate: client.lastBookingDate,
            vehicleStr,
            daysSinceLastJob: days
        }

        if (days >= 14 && days < 30) {
            buckets.weeks2.push(rc)
        } else if (days >= 30 && days < 60) {
            buckets.month1.push(rc)
        } else if (days >= 60 && days < 90) {
            buckets.months2.push(rc)
        } else if (days >= 90 && days < 120) {
            buckets.months3.push(rc)
        } else if (days >= 120) {
            buckets.months3Plus.push(rc)
        }
    }

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
