
import { getAllAvailabilities, unlockWeek } from "@/lib/actions/availability"
import { getScheduleSelectors } from "@/lib/actions/jobs" // Reuse for employee list
import prisma from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { WeekViewer } from "@/components/admin/WeekViewer"
import { Eye } from "lucide-react"

// Helper to get next 4 weeks
function getFourWeeks() {
    const weeks = []
    const start = new Date()
    const day = start.getDay() || 7
    start.setDate(start.getDate() - day + 1)

    for (let i = 0; i < 4; i++) {
        const s = new Date(start)
        s.setDate(start.getDate() + (i * 7))
        const e = new Date(s)
        e.setDate(s.getDate() + 6)
        weeks.push({ start: s, end: e, label: `Semaine du ${s.getDate()}/${s.getMonth() + 1}` })
    }
    return weeks
}

// Helper to summarize slots into human text
function summarizeSlots(slots: any[]) {
    if (!slots || slots.length === 0) return "Aucune dispo"

    // Check if all slots have same start/end
    const first = slots[0]
    const sameHours = slots.every((s: any) => s.startTime === first.startTime && s.endTime === first.endTime)

    if (sameHours) {
        // e.g. "Lun-Ven : 08:00 - 17:00" or "5 jours : 08:00 - 17:00"
        return `${slots.length} jours • ${first.startTime} - ${first.endTime}`
    }

    return "Horaires variables"
}

export default async function AdminAvailabilityPage() {
    const weeks = getFourWeeks()
    const employees = await prisma.employeeProfile.findMany({ include: { user: true } })

    // Fetch all for the range
    const allData = await getAllAvailabilities(weeks[0].start, weeks[3].end)

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Disponibilités Équipe</h2>

            <div className="grid gap-6">
                {employees.map(emp => (
                    <Card key={emp.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                                <CardTitle className="text-lg">
                                    {emp.user.name}
                                    <span className="text-xs text-muted-foreground ml-2 font-normal">({emp.id.slice(0, 4)})</span>
                                </CardTitle>
                                <Badge variant="outline">Employé</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-4 gap-4">
                                {weeks.map((week, i) => {
                                    // Robust Date Matching for Display
                                    // FORCE "YYYY-MM-DD" using local components to avoid UTC shifts
                                    const y = week.start.getFullYear()
                                    const m = String(week.start.getMonth() + 1).padStart(2, '0')
                                    const d = String(week.start.getDate()).padStart(2, '0')
                                    const weekStartStr = `${y}-${m}-${d}`

                                    const weekEndStr = week.end.toDateString() // Not used for action logic currently

                                    // Use loose string comparison to handle any timezone offset
                                    // Compare just the "Date" part (YYYY-MM-DD logic) or simple DateString
                                    // return d.toDateString() === week.start.toDateString() ||
                                    //        (d > week.start && d < week.end) ||
                                    //        d.toDateString() === week.end.toDateString()
                                    // Better: check if "Day string" is in the set of 7 days?
                                    // Simplest: d >= week.start is failing because of hours.
                                    // Fix: Reset hours before comparing?
                                    // Let's use the helper:
                                    // return d.toISOString().split('T')[0] >= weekStartStr && ...
                                    // Actually, let's just check if it falls within the 7 days inclusive irrespective of hours

                                    // Optimization: filter by strict time range
                                    const weekStartMs = week.start.getTime() - 1 // buffer
                                    const weekEndMs = week.end.getTime() + 86400000 // end of week + buffer

                                    const locksMatches = allData.filter((a: any) => {
                                        // Normalize A Date to Local Midnight?
                                        // The 'date' string layout is "YYYY-MM-DD..."
                                        // We want to see if it belongs to this week.
                                        const d = new Date(a.date)
                                        return d >= week.start && d <= week.end && a.isLocked
                                    })

                                    // Let's try the Loose String Match Approach that worked for Employee
                                    const relevantRecords = allData.filter((a: any) => {
                                        // a.date is ISO. week.start/end are Dates.
                                        // Check if a.date falls in the [start, end] window.
                                        const d = new Date(a.date)
                                        // Force timestamps comparison with margin for Timezone
                                        // 12 hours buffer?
                                        const t = d.getTime()
                                        const ws = week.start.getTime()
                                        const we = week.end.getTime()
                                        // week.end is usually 6 days after start.
                                        // We need [start 00:00, end 23:59]
                                        return t >= ws - 43200000 && t <= we + 86400000
                                        // Buffer of 12 hours before to catch UTC>Local and 24h after for end.
                                        // Checks strict employeeId
                                    })

                                    const empLocks = relevantRecords.filter((a: any) => a.employeeId === emp.id && a.isLocked)
                                    const isLocked = empLocks.length > 0

                                    const slots = relevantRecords.filter((a: any) =>
                                        a.employeeId === emp.id &&
                                        a.startTime !== "00:00" &&
                                        !a.isLocked // Show slots even if not locked? No, "Validé" shows slots too.
                                        // Actually: slots are just records that have time.
                                        // If unlocked, they are slots. if locked, they are slots (unless placeholder).
                                    ).filter((a: any) => a.startTime !== "00:00")

                                    // Refined:
                                    // 1. Get all recs for this emp in this week
                                    const weekRecs = allData.filter((a: any) => {
                                        if (a.employeeId !== emp.id) return false
                                        const d = new Date(a.date)
                                        // Flexible range: Week Start - 12h to Week End + 24h
                                        // This handles UTC Noon shifts (Sunday 7PM to Monday 7AM etc)
                                        return d.getTime() >= (week.start.getTime() - 43200000) &&
                                            d.getTime() <= (week.end.getTime() + 86400000)
                                    })

                                    const lockedRecs = weekRecs.filter((a: any) => a.isLocked)
                                    const isWeekLocked = lockedRecs.length > 0

                                    const realSlots = weekRecs.filter((a: any) => a.startTime !== "00:00")

                                    return (
                                        <div key={i} className={`border rounded p-3 text-sm ${isWeekLocked ? 'bg-green-50 dark:bg-green-900/10 border-green-200' : 'bg-slate-50 opacity-60'}`}>
                                            <div className="font-semibold mb-2">{week.label}</div>
                                            {isWeekLocked ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-green-600 hover:bg-green-600">Validé</Badge>

                                                        {/* View Button */}
                                                        <Dialog>
                                                            <DialogTrigger asChild>
                                                                <button className="flex items-center gap-1 text-xs bg-blue-50 text-blue-600 hover:bg-blue-100 px-2 py-0.5 rounded-full transition-colors border border-blue-200">
                                                                    <Eye size={10} /> Voir
                                                                </button>
                                                            </DialogTrigger>
                                                            <DialogContent className="max-w-4xl">
                                                                <DialogHeader>
                                                                    <DialogTitle>Disponibilités : {emp.user.name}</DialogTitle>
                                                                    <DialogDescription>
                                                                        Semaine du {week.start.toLocaleDateString()}
                                                                    </DialogDescription>
                                                                </DialogHeader>
                                                                <WeekViewer weekStart={week.start} slots={realSlots} />
                                                            </DialogContent>
                                                        </Dialog>

                                                        <form action={unlockWeek.bind(null, emp.id, weekStartStr)}>
                                                            <button className="text-xs text-red-500 hover:underline px-1 opacity-50 hover:opacity-100" title={`Déverrouiller pour ${emp.user.name}`}>
                                                                (Déverrouiller)
                                                            </button>
                                                        </form>
                                                    </div>



                                                    <div className="text-xs text-muted-foreground mt-1 font-medium text-blue-800">
                                                        {summarizeSlots(realSlots)}
                                                    </div>
                                                    <details className="text-[10px] text-gray-400 mt-2">
                                                        <summary>Debug</summary>
                                                        <pre>{JSON.stringify(weekRecs.map((r: any) => ({ d: r.date, s: r.startTime })), null, 2)}</pre>
                                                    </details>
                                                </div>
                                            ) : (
                                                <Badge variant="secondary">En attente</Badge>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
