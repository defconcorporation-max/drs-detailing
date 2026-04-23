"use client"

import { useState, useEffect } from "react"
import { updateCalendarEvent, deleteCalendarEvent } from "@/lib/actions/events"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Clock, Trash2, Loader2, Save } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { localDateKey, localTimeHM } from "@/lib/date-local"

export function EditEventDialog({ event }: { event: any }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState(localDateKey(event.scheduledDate))
    const [time, setTime] = useState(localTimeHM(event.scheduledDate))
    const [durationHours, setDurationHours] = useState(String(event.durationMin / 60))

    useEffect(() => {
        if (open) {
            setDate(localDateKey(event.scheduledDate))
            setTime(localTimeHM(event.scheduledDate))
            setDurationHours(String(event.durationMin / 60))
        }
    }, [open, event])

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const mins = Math.round(parseFloat(durationHours) * 60)
        formData.set("durationMin", String(mins))
        
        const utcMs = new Date(`${date}T${time}:00`).getTime()
        if (!Number.isNaN(utcMs)) formData.set("scheduledAtUtcMs", String(utcMs))
        
        const res = await updateCalendarEvent(event.id, formData)
        setLoading(false)

        if (res.error) {
            alert(res.error)
        } else {
            setOpen(false)
        }
    }

    async function handleDelete() {
        if (!confirm("Supprimer cet événement ?")) return
        setLoading(true)
        const res = await deleteCalendarEvent(event.id)
        setLoading(false)
        if (res.error) alert(res.error)
        else setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button className="text-[10px] underline opacity-70 hover:opacity-100">Modifier</button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <div className="flex items-center justify-between pr-6">
                        <DialogTitle className="font-display text-xl uppercase">Modifier l'événement</DialogTitle>
                        <Button variant="ghost" size="icon" onClick={handleDelete} className="text-destructive">
                            <Trash2 size={18} />
                        </Button>
                    </div>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Titre</Label>
                        <Input name="title" defaultValue={event.title} required className="rounded-xl" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                            <Label>Heure</Label>
                            <Input name="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="rounded-xl" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select name="type" defaultValue={event.type}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="TASK">Tâche</SelectItem>
                                    <SelectItem value="MEETING">Réunion</SelectItem>
                                    <SelectItem value="REMINDER">Rappel</SelectItem>
                                    <SelectItem value="PERSONAL">Personnel</SelectItem>
                                    <SelectItem value="OTHER">Autre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="flex items-center gap-1.5">
                                <Clock size={14} className="text-muted-foreground" /> Durée (heures)
                            </Label>
                            <Input
                                type="number"
                                step="0.5"
                                min="0.5"
                                value={durationHours}
                                onChange={(e) => setDurationHours(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Description (optionnel)</Label>
                        <Textarea name="description" defaultValue={event.description || ""} className="rounded-xl min-h-[80px]" />
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex-1 space-y-2">
                            <Label>Couleur</Label>
                            <Input name="color" type="color" defaultValue={event.color || "#3b82f6"} className="h-10 w-full rounded-xl p-1" />
                        </div>
                        <div className="flex items-center gap-2 pt-6">
                            <Checkbox id="isCompleted" name="isCompleted" defaultChecked={event.isCompleted} />
                            <Label htmlFor="isCompleted">Terminé</Label>
                        </div>
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="submit" disabled={loading} className="w-full rounded-xl">
                            {loading ? <Loader2 className="mr-2 animate-spin" size={16} /> : null}
                            <Save size={16} className="mr-2" /> Mettre à jour
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
