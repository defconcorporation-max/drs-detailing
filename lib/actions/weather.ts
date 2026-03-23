"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

/**
 * Mock Weather API. 
 * Real implementation would fetch from OpenWeatherMap or VisualCrossing.
 */
export async function getWeatherForecast() {
    // Simulating a forecast for the next 5 days
    return [
        { date: new Date(Date.now() + 86400000), temp: 22, condition: "SUNNY" },
        { date: new Date(Date.now() + 172800000), temp: 24, condition: "SUNNY" },
        { date: new Date(Date.now() + 259200000), temp: 25, condition: "CLOUDY" },
        { date: new Date(Date.now() + 345600000), temp: 21, condition: "RAIN" },
        { date: new Date(Date.now() + 432000000), temp: 23, condition: "SUNNY" },
    ]
}

/**
 * Finds clients who meet the "Weather Campaign" criteria:
 * 1. Next 2 days are SUNNY.
 * 2. Last order (lastBookingDate) was more than 14 days ago. (Using 14 days as default retention)
 */
export async function getWeatherCampaignStats() {
    const forecast = await getWeatherForecast()
    const isSunnyNext2Days = forecast.slice(0, 2).every(f => f.condition === "SUNNY")

    if (!isSunnyNext2Days) return { available: false, reason: "Mauvaises conditions météo prévues" }

    const threshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
    
    const targetClients = await prisma.clientProfile.findMany({
        where: {
            OR: [
                { lastBookingDate: { lt: threshold } },
                { lastBookingDate: null }
            ]
        },
        include: { user: true }
    })

    return { 
        available: true, 
        count: targetClients.length, 
        forecast,
        clients: targetClients.slice(0, 5) // Show preview
    }
}

export async function sendWeatherCampaign() {
    // This would call the generic marketing sender but with a specific template
    // For MVP, we simulated it
    await new Promise(resolve => setTimeout(resolve, 1500))
    revalidatePath('/admin/marketing')
    return { success: true }
}
