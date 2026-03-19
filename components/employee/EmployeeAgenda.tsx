"use client"

import { useState, useMemo } from "react"
import { addDays, startOfWeek, format, isSameDay, parseISO, startOfDay, getDay } from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, MapPin, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

// Helper: Time (HH:MM) to % from top (starting 07:00 ending 20:00)
// Total hours: 13 (7 to 20) -> 0% to 100%
const START_HOUR = 7
const END_HOUR = 21 // 21:00 to give space
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60

const getTopOffset = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number)
    const minutesFromStart = (h - START_HOUR) * 60 + m
    return (minutesFromStart / TOTAL_MINUTES) * 100
}

const getHeight = (startStr: string, endStr: string) => {
    const [h1, m1] = startStr.split(':').map(Number)
    const [h2, m2] = endStr.split(':').map(Number)
    const startMin = (h1 - START_HOUR) * 60 + m1
    const endMin = (h2 - START_HOUR) * 60 + m2
    const duration = endMin - startMin
    return (duration / TOTAL_MINUTES) * 100
}

export function EmployeeAgenda({ jobs, availabilities }: { jobs: any[], availabilities: any[] }) {
    const [currentDate, setCurrentDate] = useState(new Date())

    // Week Range
    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 }) // Monday
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))

    // Navigation
    const nextWeek = () => setCurrentDate(addDays(currentDate, 7))
    const prevWeek = () => setCurrentDate(addDays(currentDate, -7))
    const today = () => setCurrentDate(new Date())

    return (
        <div className="flex flex-col h-[calc(100vh-200px)] sm:h-[800px] border rounded-xl bg-background shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <div className="flex items-center gap-4">
                    <h2 className="text-xl font-bold capitalize">
                        {format(currentDate, 'MMMM yyyy', { locale: fr })}
                    </h2>
                    <div className="flex items-center rounded-md border bg-muted/50">
                        <Button variant="ghost" size="icon" onClick={prevWeek}><ChevronLeft size={16} /></Button>
                        <Button variant="ghost" size="sm" onClick={today}>Aujourd'hui</Button>
                        <Button variant="ghost" size="icon" onClick={nextWeek}><ChevronRight size={16} /></Button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="flex flex-1 overflow-auto">
                {/* Time Scale Column */}
                <div className="w-16 border-r bg-muted/10 flex-shrink-0">
                    <div className="h-10 border-b"></div> {/* Header spacer */}
                    <div className="relative h-full">
                        {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                            <div key={i} className="absolute w-full text-right pr-2 text-xs text-muted-foreground border-t border-transparent" style={{ top: `${(i / (END_HOUR - START_HOUR)) * 100}%` }}>
                                {START_HOUR + i}:00
                            </div>
                        ))}
                    </div>
                </div>

                {/* Days Columns */}
                {/* On small screens, allow horizontal scroll instead of forcing the whole layout to be very wide */}
                <div className="flex flex-1 min-w-[650px] sm:min-w-[800px]">
                    {weekDays.map((day, i) => {
                        const isToday = isSameDay(day, new Date())

                        // FIX: Use isSameDay for robust local comparison
                        // Do not use toISOString() as it shifts timezone

                        // 1. Availabilities
                        const dayAvails = availabilities.filter(a => {
                            // a.date is ISO string or Date object
                            return isSameDay(new Date(a.date), day)
                        })

                        // 2. Jobs
                        const dayJobs = jobs.filter(j => {
                            return isSameDay(new Date(j.scheduledDate), day)
                        })

                        // Debug log to console if needed
                        // console.log(`Day ${day.toDateString()}: ${dayJobs.length} jobs`)

                        return (
                            <div key={i} className={cn("flex-1 border-r min-w-[90px] sm:min-w-[120px] flex flex-col", isToday && "bg-primary/5")}>
                                {/* Day Header */}
                                <div className="h-10 border-b flex items-center justify-center font-medium text-sm capitalize bg-background sticky top-0 z-10">
                                    <span className={cn(isToday && "text-primary font-bold")}>
                                        {format(day, 'EEE d', { locale: fr })}
                                    </span>
                                </div>

                                {/* Timeline Area */}
                                <div className="relative flex-1 bg-background/50">
                                    {/* Grid Lines */}
                                    {Array.from({ length: END_HOUR - START_HOUR }).map((_, idx) => (
                                        <div key={idx} className="absolute w-full border-t border-dashed border-muted/30 pointer-events-none" style={{ top: `${(idx / (END_HOUR - START_HOUR)) * 100}%` }} />
                                    ))}

                                    {/* Availabilities (Background Events) */}
                                    {dayAvails.map((avail, idx) => (
                                        <div
                                            key={`av-${idx}`}
                                            className="absolute w-full bg-slate-200 dark:bg-slate-800/50 border-l-4 border-slate-400 opacity-60 rounded-sm px-1 py-0.5 pointer-events-none z-0"
                                            style={{
                                                top: `${getTopOffset(avail.startTime)}%`,
                                                height: `${getHeight(avail.startTime, avail.endTime)}%`
                                            }}
                                        >
                                            <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Dispo</span>
                                        </div>
                                    ))}

                                    {/* Jobs (Foreground Events) */}
                                    {dayJobs.map((job, idx) => {
                                        const jDate = new Date(job.scheduledDate)
                                        // Use Local Time for positioning
                                        const timeStr = jDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

                                        // Helper to safely parse time if locale returns strange format (e.g. "14 h 00")
                                        // Force HH:MM format manually if needed, but fr-FR usually returns HH:mm
                                        // Let's rely on getHours/getMinutes directly for calculation to be safe

                                        const startMinutes = (jDate.getHours() * 60) + jDate.getMinutes()
                                        // Re-calculate top offset from minutes directly
                                        // START_HOUR = 7
                                        const startOffsetMin = (START_HOUR * 60)
                                        const topPct = ((startMinutes - startOffsetMin) / TOTAL_MINUTES) * 100

                                        const duration = job.services?.reduce((acc: number, s: any) => acc + (s.service.durationMin || 60), 0) || 60
                                        const heightPct = (duration / TOTAL_MINUTES) * 100

                                        // Recalculate End Time String for Display
                                        const endTotalMin = startMinutes + duration
                                        const endH = Math.floor(endTotalMin / 60)
                                        const endM = endTotalMin % 60
                                        const endTimeStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`

                                        return (
                                            <Dialog key={job.id}>
                                                <DialogTrigger asChild>
                                                    <div
                                                        className="absolute w-[95%] left-[2.5%] bg-primary text-primary-foreground text-xs rounded-md shadow-md p-1.5 cursor-pointer hover:scale-[1.02] transition-transform z-10 overflow-hidden border border-primary-foreground/10"
                                                        style={{
                                                            top: `${topPct}%`,
                                                            height: `${heightPct}%`
                                                        }}
                                                    >
                                                        <div className="font-bold truncate">{job.client.user.name}</div>
                                                        <div className="truncate opacity-90">{job.vehicle?.make} {job.vehicle?.model}</div>
                                                    </div>
                                                </DialogTrigger>
                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Détails du Rendez-vous</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 pt-4">
                                                        <div className="flex justify-between items-center">
                                                            <Badge>{job.status}</Badge>
                                                            <div className="text-sm font-bold flex items-center gap-1">
                                                                <Clock size={16} /> {timeStr} - {endTimeStr}
                                                            </div>
                                                        </div>
                                                        <div className="bg-muted p-4 rounded-lg">
                                                            <div className="font-bold text-lg mb-1">{job.client.user.name}</div>
                                                            <div className="text-muted-foreground text-sm flex items-center gap-2">
                                                                <MapPin size={14} /> {job.client.address || "Aucune adresse"}
                                                            </div>
                                                            <div className="text-sm mt-2 font-medium">{job.vehicle?.make} {job.vehicle?.model} ({job.vehicle?.color})</div>
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-sm mb-2">Services:</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {job.services.map((s: any) => (
                                                                    <Badge key={s.service.id} variant="outline">{s.service.name}</Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
