"use client"

import { useState } from "react"
import { saveAvailability, lockWeek } from "@/lib/actions/availability"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Lock, BadgeMinus, Save, RotateCcw, CheckCircle, Plus } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"

type TimeSlot = {
    startTime: string
    endTime: string
}

type DayState = {
    date: Date
    slots: TimeSlot[]
    active: boolean // General toggle for the day
}

export function WeekEditor({ userId, weekStartStr, weekEndStr, initialData }: any) {
    const parseLocal = (s: string) => {
        const [y, m, d] = s.split('-').map(Number)
        return new Date(y, m - 1, d)
    }

    const weekStart = parseLocal(weekStartStr)
    const weekEnd = parseLocal(weekEndStr)

    const isLocked = initialData.some((d: any) => {
        const date = new Date(d.date)
        return date >= weekStart && date <= weekEnd && d.isLocked
    })

    const [loading, setLoading] = useState(false)
    const [locked, setLocked] = useState(isLocked)

    // Init Logic
    const [days, setDays] = useState<DayState[]>(() => {
        const d: DayState[] = []
        for (let i = 0; i < 7; i++) {
            const current = new Date(weekStart)
            current.setDate(weekStart.getDate() + i)

            // Find all slots for this day
            const daySlots = initialData.filter((x: any) => {
                const xDate = new Date(x.date)
                // Loose string compare for safety
                return xDate.toDateString() === current.toDateString()
            }).map((x: any) => ({
                startTime: x.startTime,
                endTime: x.endTime
            })).filter((s: TimeSlot) => s.startTime !== "00:00") // Filter out placeholders

            const hasSlots = daySlots.length > 0

            // Check if explicitly locked via placeholder (checked in isLocked global mostly, but per day?)
            // We rely on 'active' if there are slots OR if we assume new week is inactive.

            d.push({
                date: current,
                slots: hasSlots ? daySlots.sort((a: any, b: any) => a.startTime.localeCompare(b.startTime)) : [],
                active: hasSlots
            })
        }
        return d
    })

    const handleToggleDay = (index: number, isActive: boolean) => {
        const newDays = [...days]
        newDays[index].active = isActive
        if (isActive && newDays[index].slots.length === 0) {
            // Default "Auto set to 7-20"
            newDays[index].slots = [{ startTime: "07:00", endTime: "20:00" }]
        } else if (!isActive) {
            // Clear logic or keep? User might toggle by mistake.
            // Let's clear to be consistent with "OFF".
            newDays[index].slots = []
        }
        setDays(newDays)
    }

    const handleAddUnavailability = (index: number, unStart: string, unEnd: string) => {
        const newDays = [...days]
        const currentSlots = newDays[index].slots
        const newSlots: TimeSlot[] = []

        // Subtract Logic
        // We iterate existing slots and "cut" them with the unavailability

        // Convert to minutes for easier math
        const toMin = (t: string) => {
            const [h, m] = t.split(':').map(Number)
            return h * 60 + m
        }
        const toStr = (m: number) => {
            const h = Math.floor(m / 60)
            const min = m % 60
            return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`
        }

        const unStartMin = toMin(unStart)
        const unEndMin = toMin(unEnd)

        currentSlots.forEach(slot => {
            const sStart = toMin(slot.startTime)
            const sEnd = toMin(slot.endTime)

            // Cases:
            // 1. Unavail is completely outside -> Keep slot
            // 2. Unavail covers entire slot -> Remove slot
            // 3. Unavail cuts start -> Shorten slot start
            // 4. Unavail cuts end -> Shorten slot end
            // 5. Unavail in middle -> Split slot

            if (unEndMin <= sStart || unStartMin >= sEnd) {
                // No overlap
                newSlots.push(slot)
            } else {
                // Overlap exists

                // If unavail leaves a chunk at the start
                if (unStartMin > sStart) {
                    newSlots.push({
                        startTime: toStr(sStart),
                        endTime: toStr(unStartMin)
                    })
                }

                // If unavail leaves a chunk at the end
                if (unEndMin < sEnd) {
                    newSlots.push({
                        startTime: toStr(unEndMin),
                        endTime: toStr(sEnd)
                    })
                }
            }
        })

        newDays[index].slots = newSlots.sort((a, b) => a.startTime.localeCompare(b.startTime))
        setDays(newDays)
    }

    const handleResetDay = (index: number) => {
        const newDays = [...days]
        newDays[index].active = true
        newDays[index].slots = [{ startTime: "07:00", endTime: "20:00" }]
        setDays(newDays)
    }

    const performSave = async () => {
        const payload = days
            .filter(d => d.active) // Only active days sent? Or send empty for inactive? Logic in server matches sent dates.
            // If we filter here, server needs to know which to DELETE.
            // Server implementation iterates Payload. If day is missing from Payload, it is NOT touched/deleted by current logic?
            // "Delete existing for this date... Loop data."
            // We should send ALL days that we want to manage. If inactive, send active=false?
            // Current Server Action loops 'data'. If date is not in data, it skips.
            // So to CLEAR a day, we must send it with empty slots?
            // Updated Server Action: "if (item.slots...)" -> if slots empty, it creates nothing but deleted existing. PERFECT.
            .map(d => {
                const year = d.date.getFullYear()
                const month = String(d.date.getMonth() + 1).padStart(2, '0')
                const day = String(d.date.getDate()).padStart(2, '0')
                return {
                    date: `${year}-${month}-${day}`,
                    slots: d.active ? d.slots : []
                }
            })

        const res = await saveAvailability(userId, payload)
        if (res.error) {
            alert(res.error)
            return false
        }
        return true
    }

    const handleSave = async () => {
        setLoading(true)
        await performSave()
        setLoading(false)
    }

    const handleLock = async () => {
        if (!confirm("Êtes-vous sûr de vouloir valider cette semaine ? Vous ne pourrez plus la modifier.")) return
        setLoading(true)

        // SAVE FIRST!
        const saved = await performSave()
        if (!saved) {
            setLoading(false)
            return
        }

        const res = await lockWeek(userId, weekStartStr)
        if (res.success) {
            setLocked(true)
        }
        setLoading(false)
    }

    return (
        <div className="space-y-4 pt-4">
            {locked && (
                <Alert className="bg-muted border-primary/20">
                    <Lock className="h-4 w-4" />
                    <AlertTitle>Semaine Validée</AlertTitle>
                    <AlertDescription>
                        Cette semaine est verrouillée.
                    </AlertDescription>
                </Alert>
            )}

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {days.map((day, i) => (
                    <DayCard
                        key={i}
                        day={day}
                        index={i}
                        locked={locked}
                        onToggle={handleToggleDay}
                        onAddUnavailability={handleAddUnavailability}
                        onReset={handleResetDay}
                    />
                ))}
            </div>

            <div className="flex items-center justify-end gap-4 border-t pt-4">
                {!locked && (
                    <>
                        <Button variant="outline" onClick={handleSave} disabled={loading} className="gap-2">
                            {loading ? "..." : <><Save size={16} /> Sauvegarder le Brouillon</>}
                        </Button>
                        <Button onClick={handleLock} disabled={loading} className="gap-2">
                            <CheckCircle size={16} /> Valider & Verrouiller
                        </Button>
                    </>
                )}
            </div>
        </div>
    )
}

function DayCard({ day, index, locked, onToggle, onAddUnavailability, onReset }: any) {
    const [unavailOpen, setUnavailOpen] = useState(false)
    const [unStart, setUnStart] = useState("12:00")
    const [unEnd, setUnEnd] = useState("13:00")

    return (
        <Card className={!day.active ? "opacity-60 border-dashed" : "border-primary/20 bg-primary/5"}>
            <CardContent className="p-3 space-y-3">
                <div className="flex items-center justify-between">
                    <Label className="font-bold capitalize">
                        {day.date.toLocaleDateString('fr-FR', { weekday: 'short' })} {day.date.getDate()}
                    </Label>
                    <input
                        type="checkbox"
                        checked={day.active}
                        disabled={locked}
                        className="w-4 h-4"
                        onChange={(e) => onToggle(index, e.target.checked)}
                    />
                </div>

                {day.active && (
                    <div className="space-y-2">
                        {/* Visualization of Slots */}
                        <div className="text-xs space-y-1">
                            {day.slots.length > 0 ? day.slots.map((s: any, k: number) => (
                                <div key={k} className="bg-white dark:bg-slate-800 border rounded px-1.5 py-0.5 flex justify-between">
                                    <span>{s.startTime} - {s.endTime}</span>
                                </div>
                            )) : <div className="text-red-500 font-bold">Aucune dispo</div>}
                        </div>

                        {!locked && (
                            <div className="flex gap-1">
                                <Dialog open={unavailOpen} onOpenChange={setUnavailOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="w-full text-[10px] h-7 gap-1 px-1">
                                            <BadgeMinus size={12} className="text-red-500" /> Indispo
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[300px]">
                                        <DialogHeader>
                                            <DialogTitle>Ajouter Indisponibilité</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="space-y-1">
                                                    <Label>Début</Label>
                                                    <Input type="time" value={unStart} onChange={e => setUnStart(e.target.value)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label>Fin</Label>
                                                    <Input type="time" value={unEnd} onChange={e => setUnEnd(e.target.value)} />
                                                </div>
                                            </div>
                                            <Button onClick={() => {
                                                onAddUnavailability(index, unStart, unEnd)
                                                setUnavailOpen(false)
                                            }}>Ajouter</Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>

                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onReset(index)} title="Réinitialiser 07-20">
                                    <RotateCcw size={12} />
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
