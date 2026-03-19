"use client"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Copy } from "lucide-react"
import { useState, useMemo } from "react"
import { toast } from "sonner"

export function AvailabilityGenerator({ weekDays, jobs, availabilities }: any) {
    const [open, setOpen] = useState(false)

    const generatedText = useMemo(() => {
        if (!availabilities || availabilities.length === 0) return "Aucune disponibilité trouvée pour cette semaine."

        let text = "📅 Voici nos prochaines disponibilités :\n\n"

        weekDays.forEach((day: Date) => {
            const dayName = day.toLocaleDateString("fr-FR", { weekday: "long" })
            const dayDate = day.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })
            const dayStr = day.toISOString().split('T')[0]

            // 1. Get all availability slots for this day
            const dayAvailabilities = availabilities.filter((a: any) => {
                return new Date(a.date).toDateString() === day.toDateString()
            })

            if (dayAvailabilities.length === 0) return

            // 2. Simplistic "Free Slot" calculation
            // We verify specific hours (e.g. 8, 9, 10... 18)
            // If at least one employee is available AND not booked, it's a slot.

            const freeHours = []
            for (let h = 8; h < 18; h++) {
                // Check if anyone is available at H
                const availableEmployees = dayAvailabilities.filter((a: any) => {
                    const start = parseInt(a.startTime.split(':')[0])
                    const end = parseInt(a.endTime.split(':')[0])
                    return h >= start && h < end
                })

                if (availableEmployees.length === 0) continue

                // Check if ALL of these available employees are booked?
                // Or if ANY of them is free?
                // We want to offer a slot if at least one person is free.

                const freeEmployees = availableEmployees.filter((a: any) => {
                    // Check if this employee has a job at this hour
                    const busy = jobs.some((j: any) => {
                        // Safe navigation for employee
                        if (j.employee?.id !== a.employeeId) return false

                        const jStart = new Date(j.scheduledDate)
                        const durationMin = j.services?.reduce((acc: number, s: any) => acc + (s.service.durationMin || 0), 0) || 60
                        const jEnd = new Date(jStart.getTime() + durationMin * 60000)

                        // Slot interval: [h, h+1)
                        const slotStart = new Date(day)
                        slotStart.setHours(h, 0, 0, 0)
                        const slotEnd = new Date(day)
                        slotEnd.setHours(h + 1, 0, 0, 0)

                        // Check overlapping intervals
                        // (StartA < EndB) and (EndA > StartB)
                        return jStart < slotEnd && jEnd > slotStart
                    })
                    return !busy
                })

                if (freeEmployees.length > 0) {
                    freeHours.push(`${h}h`)
                }
            }

            if (freeHours.length > 0) {
                // Group contiguous? Naive list for now.
                text += `• ${dayName} ${dayDate} : ${freeHours.join(', ')}\n`
            }
        })

        text += "\nMerci de nous confirmer le créneau qui vous convient !"
        return text
    }, [weekDays, jobs, availabilities])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <FileText size={16} />
                    Générer Dispo
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Message de Disponibilités</DialogTitle>
                    <DialogDescription>
                        Copiez ce message pour l'envoyer à vos clients.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <Textarea
                        value={generatedText}
                        readOnly
                        className="h-[300px] font-mono text-sm"
                    />
                    <Button
                        onClick={() => {
                            navigator.clipboard.writeText(generatedText)
                            setOpen(false)
                        }}
                        className="w-full gap-2"
                    >
                        <Copy size={16} /> Copier le texte
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
