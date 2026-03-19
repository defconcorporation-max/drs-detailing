"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export function WeekViewer({ weekStart, slots }: { weekStart: Date, slots: any[] }) {
    // Configuration
    const START_HOUR = 6
    const END_HOUR = 23
    const TOTAL_HOURS = END_HOUR - START_HOUR

    // Helper: Time (HH:mm) to Percentage
    const getPosition = (time: string) => {
        const [h, m] = time.split(':').map(Number)
        const totalMinutes = (h * 60) + m
        const startMinutes = START_HOUR * 60
        const offset = totalMinutes - startMinutes
        const pct = (offset / (TOTAL_HOURS * 60)) * 100
        return Math.max(0, Math.min(100, pct))
    }

    // Helper: Duration to Height Percentage
    const getHeight = (start: string, end: string) => {
        const top = getPosition(start)
        const bottom = getPosition(end)
        return bottom - top
    }

    // Generate 7 days from weekStart
    const days = []
    const base = new Date(weekStart)
    for (let i = 0; i < 7; i++) {
        const d = new Date(base)
        d.setDate(base.getDate() + i)
        const dStr = d.toDateString()
        const slot = slots.find((s: any) => new Date(s.date).toDateString() === dStr)
        days.push({ date: d, slot: slot })
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Header Days */}
            <div className="grid grid-cols-7 gap-1 text-center border-b pb-2">
                {days.map((day, i) => (
                    <div key={i} className="flex flex-col items-center">
                        <span className="text-xs uppercase text-muted-foreground font-bold">
                            {day.date.toLocaleDateString('fr-FR', { weekday: 'short' })}
                        </span>
                        <span className="text-sm font-bold text-slate-800 dark:text-slate-200">
                            {day.date.getDate()}
                        </span>
                    </div>
                ))}
            </div>

            {/* Visual Grid */}
            <div className="relative h-[300px] bg-slate-50 dark:bg-slate-900/50 rounded border border-slate-100 dark:border-slate-800">
                {/* Background Lines (every 2 hours) */}
                {[...Array(9)].map((_, i) => (
                    <div key={i} className="absolute w-full border-t border-slate-200/50 dark:border-slate-800 pointer-events-none flex items-center" style={{ top: `${(i / 8.5) * 100}%` }}>
                        <span className="text-[10px] text-slate-400 ml-1 -mt-4">
                            {START_HOUR + (i * 2)}h
                        </span>
                    </div>
                ))}

                {/* Columns */}
                <div className="grid grid-cols-7 h-full absolute inset-0">
                    {days.map((day, i) => (
                        <div key={i} className="relative border-l border-slate-100 dark:border-slate-800/50 first:border-l-0 h-full">
                            {day.slot && (
                                <div
                                    className="absolute left-1 right-1 bg-green-500/90 hover:bg-green-500 rounded-sm border border-green-600 text-[10px] text-white flex flex-col justify-center items-center shadow-sm"
                                    style={{
                                        top: `${getPosition(day.slot.startTime)}%`,
                                        height: `${getHeight(day.slot.startTime, day.slot.endTime)}%`
                                    }}
                                    title={`${day.slot.startTime} - ${day.slot.endTime}`}
                                >
                                    <span className="font-bold">{day.slot.startTime}</span>
                                    <span className="opacity-80">{day.slot.endTime}</span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex justify-end items-center gap-2 text-xs text-muted-foreground">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span>Disponibilité</span>
            </div>
        </div>
    )
}
