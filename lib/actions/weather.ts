"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

// Montréal / Laval area coordinates
const LAT = 45.56
const LNG = -73.65

/**
 * Maps WMO weather interpretation codes to simple condition strings.
 * https://open-meteo.com/en/docs#weathervariables
 */
function wmoToCondition(code: number): string {
    if (code === 0) return "SUNNY"
    if (code <= 3) return "PARTLY_CLOUDY"
    if (code <= 49) return "CLOUDY"
    if (code <= 57) return "DRIZZLE"
    if (code <= 67) return "RAIN"
    if (code <= 77) return "SNOW"
    if (code <= 82) return "RAIN"
    if (code <= 86) return "SNOW"
    return "STORM"
}

export interface DayForecast {
    date: Date
    dateKey: string  // "YYYY-MM-DD"
    temp: number
    tempMax: number
    tempMin: number
    condition: string
    wmoCode: number
}

/**
 * Fetches a 7-day forecast from Open-Meteo (free, no API key needed).
 */
export async function getWeatherForecast(): Promise<DayForecast[]> {
    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LNG}&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America%2FToronto&forecast_days=7`
        const res = await fetch(url, { next: { revalidate: 3600 } }) // cache 1h
        if (!res.ok) throw new Error("Open-Meteo fetch failed")
        const data = await res.json()

        const days: DayForecast[] = (data.daily.time as string[]).map((dateStr: string, i: number) => {
            const wmoCode = data.daily.weather_code[i] as number
            const tempMax = Math.round(data.daily.temperature_2m_max[i])
            const tempMin = Math.round(data.daily.temperature_2m_min[i])
            return {
                date: new Date(dateStr + "T12:00:00"),
                dateKey: dateStr,
                temp: Math.round((tempMax + tempMin) / 2),
                tempMax,
                tempMin,
                condition: wmoToCondition(wmoCode),
                wmoCode,
            }
        })
        return days
    } catch {
        // Fallback: empty forecast (won't show weather badges)
        return []
    }
}

/**
 * Returns a map of dateKey → forecast for quick lookup in the calendar.
 */
export async function getWeatherByDate(): Promise<Record<string, { condition: string; temp: number }>> {
    const forecast = await getWeatherForecast()
    const map: Record<string, { condition: string; temp: number }> = {}
    for (const day of forecast) {
        map[day.dateKey] = { condition: day.condition, temp: day.temp }
    }
    return map
}

/**
 * Finds clients who meet the "Weather Campaign" criteria:
 * 1. Next 2 days are SUNNY.
 * 2. Last order (lastBookingDate) was more than 14 days ago.
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
        clients: targetClients.slice(0, 5)
    }
}

export async function sendWeatherCampaign() {
    await new Promise(resolve => setTimeout(resolve, 1500))
    revalidatePath('/admin/marketing')
    return { success: true }
}
