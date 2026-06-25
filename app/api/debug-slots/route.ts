import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"
import { getPublicAvailabilitySmart } from "@/lib/actions/client-booking"
import { getLocalDateAndHourInTZ } from "@/lib/date-local"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const date = req.nextUrl.searchParams.get("date") || "2026-06-26"
    
    try {
        const start = new Date(date)
        const end = new Date(start)
        end.setDate(end.getDate() + 1)

        const jobs = await prisma.job.findMany({
            where: {
                scheduledDate: {
                    gte: start,
                    lte: end
                },
                NOT: { status: "CANCELLED" }
            },
            include: {
                client: { include: { user: true } },
                services: { include: { service: true } }
            }
        })

        const employees = await prisma.employeeProfile.findMany()

        const debugJobs = jobs.map(j => {
            const jDate = new Date(j.scheduledDate)
            const tzInfo = getLocalDateAndHourInTZ(jDate)
            return {
                id: j.id,
                clientName: j.client?.user?.name,
                scheduledDateUtc: j.scheduledDate.toISOString(),
                scheduledDateRaw: j.scheduledDate.toString(),
                localDateStr: tzInfo.dateStr,
                localHour: tzInfo.hour,
                localMinute: tzInfo.minute,
                durationMin: j.durationMin,
                status: j.status
            }
        })

        const slotsResult = await getPublicAvailabilitySmart({
            startDate: date,
            days: 1
        })

        return NextResponse.json({
            success: true,
            serverTime: new Date().toISOString(),
            serverTimezoneOffset: new Date().getTimezoneOffset(),
            queryDate: date,
            queryStartUtc: start.toISOString(),
            queryEndUtc: end.toISOString(),
            totalEmployees: employees.length,
            jobsFound: debugJobs,
            availabilityOutput: slotsResult
        })
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message })
    }
}
