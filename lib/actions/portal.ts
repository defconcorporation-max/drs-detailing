"use server"

import prisma from "@/lib/db"
import { serialize } from "@/lib/utils"

// Mock logged in user for demo
const DEMO_CLIENT_EMAIL = 'client@test.com'

export async function getClientDashboardData() {
    const user = await prisma.user.findUnique({
        where: { email: DEMO_CLIENT_EMAIL },
        include: {
            clientProfile: {
                include: {
                    vehicles: true,
                    jobs: {
                        include: {
                            services: { include: { service: true } },
                            vehicle: true
                        },
                        orderBy: { scheduledDate: 'desc' },
                        take: 5
                    }
                }
            }
        }
    })

    if (!user || !user.clientProfile) return null

    return serialize({
        profile: user.clientProfile,
        recentJobs: user.clientProfile.jobs,
        vehicles: user.clientProfile.vehicles
    })
}
