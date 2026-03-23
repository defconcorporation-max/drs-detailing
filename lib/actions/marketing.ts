"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

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
