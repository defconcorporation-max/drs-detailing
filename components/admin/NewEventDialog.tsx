"use client"

import { useState } from "react"
import { createCalendarEvent } from "@/lib/actions/events"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar as CalendarIcon, Clock, Plus, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function NewEventDialog({ prefillDate, prefillTime }: { prefillDate?: string; prefillTime?: string }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [date, setDate] = useState(prefillDate || new Date().toISOString().split("T")[0])
    const [time, setTime] = useState(prefillTime || "09:00")
    const [durationHours, setDurationHours] = useState("1")

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const mins = Math.round(parseFloat(durationHours) * 60)
        formData.set("durationMin", String(mins))
        
        const res = await createCalendarEvent(formData)
        setLoading(false)

        if (res.error) {
            alert(res.error)
        } else {
            setOpen(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-xl">
                    <Plus size={16} /> Autre événement
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-display text-xl uppercase">Nouvel événement</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Titre</Label>
                        <Input name="title" required placeholder="Ex: Réunion d'équipe, Maintenance..." className="rounded-xl" />
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
                            <Select name="type" defaultValue="TASK">
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
                        <Textarea name="description" placeholder="Plus de détails..." className="rounded-xl min-h-[80px]" />
                    </div>

                    <div className="space-y-2">
                        <Label>Couleur (optionnel)</Label>
                        <Input name="color" type="color" defaultValue="#3b82f6" className="h-10 w-full rounded-xl p-1" />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="submit" disabled={loading} className="w-full rounded-xl">
                            {loading ? <Loader2 className="mr-2 animate-spin" size={16} /> : null}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
