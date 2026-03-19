"use server"

import prisma from "@/lib/db"
import { serialize } from "@/lib/utils"
import { revalidatePath } from "next/cache"

export async function getAvailability(userId: string, startDate: Date, endDate: Date) {
    const employee = await prisma.employeeProfile.findUnique({
        where: { userId }
    })

    if (!employee) return []

    const availabilities = await prisma.availability.findMany({
        where: {
            employeeId: employee.id,
            OR: [
                {
                    // Recurring (no date)
                    date: null
                },
                {
                    // Specific dates in range
                    date: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            ]
        }
    })
    return serialize(availabilities)
}

export async function saveAvailability(userId: string, data: any[]) {
    // data: [{ date: "YYYY-MM-DD", slots: [{ startTime, endTime }] }]
    const employee = await prisma.employeeProfile.findUnique({ where: { userId } })
    if (!employee) return { error: "Employé non trouvé" }

    try {
        for (const item of data) {
            const [y, m, d] = item.date.split('-').map(Number)
            const safeDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0))
            const dayStart = new Date(Date.UTC(y, m - 1, d, 0, 0, 0))
            const dayEnd = new Date(Date.UTC(y, m - 1, d, 23, 59, 59))

            // Check lock
            const locked = await prisma.availability.findFirst({
                where: {
                    employeeId: employee.id,
                    date: { gte: dayStart, lte: dayEnd },
                    isLocked: true
                }
            })
            if (locked) continue;

            // Delete existing
            await prisma.availability.deleteMany({
                where: {
                    employeeId: employee.id,
                    date: { gte: dayStart, lte: dayEnd }
                }
            })

            // Create new slots
            if (item.slots && Array.isArray(item.slots)) {
                for (const slot of item.slots) {
                    if (slot.startTime && slot.endTime) {
                        await prisma.availability.create({
                            data: {
                                employeeId: employee.id,
                                date: safeDate,
                                dayOfWeek: safeDate.getDay(),
                                startTime: slot.startTime,
                                endTime: slot.endTime
                            }
                        })
                    }
                }
            }
        }
        revalidatePath('/employee/availability')
        revalidatePath('/admin/schedule')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: "Erreur enregistrement" }
    }
}

export async function lockWeek(userId: string, dateInWeek: Date | string) {
    const employee = await prisma.employeeProfile.findUnique({ where: { userId } })
    if (!employee) return { error: "Employé non trouvé" }

    let start: Date
    if (typeof dateInWeek === 'string') {
        const [y, m, d] = dateInWeek.split('-').map(Number)
        start = new Date(y, m - 1, d) // Local
    } else {
        start = new Date(dateInWeek)
    }
    // Adjust to Monday (assuming week starts Monday based on other files) or just used passed date as start??
    // The previous code assumed dateInWeek is inside the week but calculated start/end.
    // Let's rely on the passed dateInWeek being the start or calculate start of week.
    // Refactored to lock ALL records in the week range at once
    const startOfWeek = new Date(start)
    // Adjust to Monday if needed, but we rely on input.

    const endOfWeek = new Date(start)
    endOfWeek.setDate(endOfWeek.getDate() + 7)

    try {
        // 1. Lock existing records
        await prisma.availability.updateMany({
            where: {
                employeeId: employee.id,
                date: {
                    gte: startOfWeek,
                    lt: endOfWeek
                }
            },
            data: { isLocked: true }
        })

        // 2. Handle "Empty Days" (Create Placeholders) - OPTIONAL?
        // If a day has NO records, does it mean "Available" or "Unavailable"?
        // In our logic, NO records = Unavailable (Off).
        // Do we need to create "00:00 Locked" placeholders?
        // checkTeamAvailability looks for Locked records. If none found, status is OFF.
        // So we DON'T need placeholders for OFF days if the default absence of record implies OFF.
        // The only case we needed placeholders before was if we wanted to explicitely show "Locked OFF" vs "Not filled yet".
        // But with "Inverse Logic", the user actively sets "Active". 
        // If they leave it inactive, it's OFF.
        // So we can skip the placeholder creation loop which simplifies things massively.
        // However, if the UI relies on "isLocked" check of *some* record to show the "Locked" alert...
        // WeekEditor checks `initialData.some(d => d.isLocked)`.
        // If the user sets WHOLE WEEK OFF (no records), `initialData` is empty. `isLocked` is false.
        // The UI will look UNLOCKED.
        // So the user clicks "Lock", it saves (empty), then locks (nothing updated), returns success.
        // UI reloads. `initialData` empty. UI shows "Save / Lock" buttons again.
        // Infinite loop of "I locked it but it looks unlocked".

        // SOLUTION: We MUST create at least one Locked Record for the week if it's empty, or for each empty day?
        // Or we use a separate "WeekStatus" model.
        // For now, sticking to Availability model: We iterate days, if no record exists, create placeholder.

        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(start)
            currentDate.setDate(currentDate.getDate() + i)
            const y = currentDate.getFullYear()
            const m = currentDate.getMonth()
            const d = currentDate.getDate()

            const dayStart = new Date(Date.UTC(y, m, d, 0, 0, 0))
            const dayEnd = new Date(Date.UTC(y, m, d, 23, 59, 59))

            const count = await prisma.availability.count({
                where: {
                    employeeId: employee.id,
                    date: { gte: dayStart, lte: dayEnd }
                }
            })

            if (count === 0) {
                const safeDate = new Date(Date.UTC(y, m, d, 12, 0, 0, 0))
                await prisma.availability.create({
                    data: {
                        employeeId: employee.id,
                        date: safeDate,
                        dayOfWeek: safeDate.getDay(),
                        startTime: "00:00",
                        endTime: "00:00",
                        isLocked: true
                    }
                })
            }
        }

    } catch (e) {
        console.error(e)
        return { error: "Erreur lors du verrouillage" }
    }

    revalidatePath('/employee/availability')
    return { success: true }
}

export async function unlockWeek(employeeId: string, weekStart: Date | string) {
    console.log(`[unlockWeek] Request for Emp: ${employeeId}, Start: ${weekStart}`)

    if (!employeeId) return { error: "Employee ID manquant" }

    let start: Date
    // FORCE LOCAL DATE construction from string if possible to avoid ISO shifts
    if (typeof weekStart === 'string') {
        const [y, m, d] = weekStart.split('-').map(Number)
        start = new Date(y, m - 1, d) // Local midnight
    } else {
        start = new Date(weekStart)
    }

    try {
        // "Shotgun" Approach: Unlock everything in the wide week window
        // This matches getAllAvailabilities logic to ensure visual consistency
        const rangeStart = new Date(start)
        rangeStart.setDate(rangeStart.getDate() - 1) // Buffer -1 day

        const rangeEnd = new Date(start)
        rangeEnd.setDate(rangeEnd.getDate() + 8) // 7 days + 1 buffer

        console.log(`[unlockWeek] Unlocking range: ${rangeStart.toISOString()} to ${rangeEnd.toISOString()}`)

        // Use updateMany for efficiency and to catch all records in scope
        const result = await prisma.availability.updateMany({
            where: {
                employeeId: employeeId,
                date: {
                    gte: rangeStart,
                    lte: rangeEnd
                },
                isLocked: true
            },
            data: { isLocked: false }
        })

        console.log(`[unlockWeek] Unlocked ${result.count} records.`)

        revalidatePath('/admin/availability')
        revalidatePath('/employee/availability')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: "Erreur déverrouillage" }
    }
}

export async function getAllAvailabilities(startDate: Date, endDate: Date) {
    // Widen fetch window to account for timezone shifts (e.g. UTC Noon vs Local Midnight)
    // +/- 24 hours buffer ensures we get all potential records
    const bufferStart = new Date(startDate)
    bufferStart.setDate(startDate.getDate() - 1)

    const bufferEnd = new Date(endDate)
    bufferEnd.setDate(endDate.getDate() + 1)

    const availabilities = await prisma.availability.findMany({
        where: {
            OR: [
                { date: null }, // Recurring (if used)
                {
                    date: {
                        gte: bufferStart,
                        lte: bufferEnd
                    }
                }
            ]
        },
        include: {
            employee: {
                include: { user: true }
            }
        }
    })
    return serialize(availabilities)
}

export async function checkTeamAvailability(dateStr: string, startTime: string, durationMinutes: number) {
    console.log(`[checkTeamAvail] Checking ${dateStr} @ ${startTime} (${durationMinutes}m)`)

    // 1. Parse timestamps
    const [y, m, d] = dateStr.split('-').map(Number)
    const [h, min] = startTime.split(':').map(Number)

    // Job Time Window
    const reqStartMin = (h * 60) + min
    const reqEndMin = reqStartMin + durationMinutes

    const searchDate = new Date(dateStr)
    const searchDateStart = new Date(searchDate)
    searchDateStart.setHours(0, 0, 0, 0)
    const searchDateEnd = new Date(searchDate)
    searchDateEnd.setHours(23, 59, 59, 999)

    // 2. Search Availabilities
    // Widen buffer to surely catch the record (UTC storage vs Local Query)
    const bufferStart = new Date(searchDateStart)
    bufferStart.setDate(bufferStart.getDate() - 1)
    const bufferEnd = new Date(searchDateEnd)
    bufferEnd.setDate(bufferEnd.getDate() + 2) // +2 days just to be safe

    const availabilities = await prisma.availability.findMany({
        where: {
            isLocked: true,
            date: {
                gte: bufferStart,
                lte: bufferEnd
            }
        },
        include: { employee: true }
    })

    console.log(`[checkTeamAvail] Found ${availabilities.length} locked slots in buffer`)

    // 3. Search Existing Jobs (Conflicts)
    const jobs = await prisma.job.findMany({
        where: {
            scheduledDate: {
                gte: bufferStart,
                lte: bufferEnd
            }
        },
        include: {
            services: { include: { service: true } },
            employees: true
        }
    })

    const employees = await prisma.employeeProfile.findMany({ include: { user: true } })

    const result: Record<string, { status: 'AVAILABLE' | 'BUSY' | 'OFF', reason?: string }> = {}

    for (const emp of employees) {
        // A. Check Working Hours
        const slots = availabilities.filter(a => a.employeeId === emp.id)

        // ROBUST MATCH: Compare YYYY-MM-DD strings
        // We know 'dateStr' is the target "YYYY-MM-DD"
        // We need to see if any slot's date, when converted to YYYY-MM-DD, matches.
        // Alert: stored dates might be UTC T12:00. 
        // We should convert stored date to ISO string and take first part? 
        // Or if stored as UTC Noon, it represents that day.

        const todaySlot = slots.find(s => {
            if (!s.date) return false
            // Convert DB date to YYYY-MM-DD
            // If stored as "2026-01-09T12:00:00Z", .toISOString().split('T')[0] gives "2026-01-09"
            // This is reliable assuming standard storage we implemented earlier.
            const sDateStr = s.date.toISOString().split('T')[0]
            return sDateStr === dateStr
        })

        if (!todaySlot) {
            // Log specifically for debugging if needed
            // console.log(`[checkTeamAvail] Emp ${emp.user.name} has no slot for ${dateStr}`)
            result[emp.id] = { status: 'OFF', reason: 'Hors horaire (Pas de dispo)' }
            continue
        }

        let isWorking = false
        if (todaySlot.startTime !== '00:00' && todaySlot.startTime && todaySlot.endTime) {
            const [sH, sM] = todaySlot.startTime.split(':').map(Number)
            const [eH, eM] = todaySlot.endTime.split(':').map(Number)
            const slotStartMin = (sH * 60) + sM
            const slotEndMin = (eH * 60) + eM

            // Check containment
            if (reqStartMin >= slotStartMin && reqEndMin <= slotEndMin) {
                isWorking = true
            } else {
                // console.log(`[checkTeamAvail] Out of bounds: Req [${reqStartMin}-${reqEndMin}] vs Slot [${slotStartMin}-${slotEndMin}]`)
            }
        }

        if (!isWorking) {
            result[emp.id] = { status: 'OFF', reason: 'Hors horaire' }
            continue
        }

        // B. Check Conflicts
        const empJobs = jobs.filter(j => {
            const isAssignedM2N = j.employees?.some(e => e.id === emp.id)
            const isAssignedLegacy = j.employeeId === emp.id
            return isAssignedM2N || isAssignedLegacy
        })

        let hasConflict = false
        for (const job of empJobs) {
            const jDate = new Date(job.scheduledDate)
            // Check if it's the same day using string
            const jDateStr = jDate.toISOString().split('T')[0]
            if (jDateStr !== dateStr) continue

            const jH = jDate.getHours()
            const jM = jDate.getMinutes()
            const jobStart = (jH * 60) + jM

            // Calculate Job Duration
            let jobDuration = 0
            if (job.services && job.services.length > 0) {
                jobDuration = job.services.reduce((acc, js) => acc + (js.service.durationMin || 60), 0)
            } else {
                jobDuration = 60 // Default
            }

            const jobEnd = jobStart + jobDuration

            // Overlap Logic
            if (reqStartMin < jobEnd && reqEndMin > jobStart) {
                hasConflict = true
                break
            }
        }

        if (hasConflict) {
            result[emp.id] = { status: 'BUSY', reason: 'Déjà pris' }
        } else {
            result[emp.id] = { status: 'AVAILABLE' }
        }
    }

    return result
}
