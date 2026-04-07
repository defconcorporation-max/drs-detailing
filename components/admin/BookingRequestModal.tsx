"use client"

import { useState } from "react"
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter, DialogTrigger
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Car, User, MessageSquare, CheckCircle, XCircle, PenTool } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { confirmBooking, declineBooking } from "@/lib/actions/client-booking"

type JobRequest = {
    id: string
    scheduledDate: Date | string
    notes: string | null
    client: {
        user: {
            name: string | null
            email: string | null
            phone: string | null
        }
    }
    vehicle: {
        make: string
        model: string
        year: number | null
        licensePlate: string | null
    } | null
    services: {
        service: {
            name: string
            durationMin: number
            basePrice: number | null
        }
    }[]
}

export function BookingRequestModal({ job }: { job: JobRequest }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const handleConfirm = async () => {
        setLoading(true)
        await confirmBooking(job.id)
        setLoading(false)
        setOpen(false)
    }

    const handleDecline = async () => {
        if (!confirm("Voulez-vous vraiment refuser cette demande ?")) return
        setLoading(true)
        await declineBooking(job.id)
        setLoading(false)
        setOpen(false)
    }

    const date = new Date(job.scheduledDate)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white w-full">
                    Gérer la demande
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Demande de {job.client.user.name}
                    </DialogTitle>
                    <DialogDescription>
                        Reçu le {format(new Date(), 'd MMMM yyyy', { locale: fr })}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Date & Time */}
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 border border-border">
                        <div className="bg-background p-2 rounded-full">
                            <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <div className="font-semibold capitalize">
                                {format(date, 'EEEE d MMMM yyyy', { locale: fr })}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                                <Clock size={14} />
                                {format(date, 'HH:mm')}
                            </div>
                        </div>
                    </div>

                    {/* Vehicle */}
                    {job.vehicle && (
                        <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 border border-border">
                            <div className="bg-background p-2 rounded-full">
                                <Car className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <div className="font-semibold">
                                    {job.vehicle.make} {job.vehicle.model}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {job.vehicle.year} • {job.vehicle.licensePlate || 'Sans plaque'}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Service */}
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/50 border border-border">
                        <div className="bg-background p-2 rounded-full">
                            <PenTool className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            {job.services.length > 0 ? (
                                <>
                                    <div className="font-semibold">{job.services[0].service.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                        {job.services[0].service.durationMin} min • {job.services[0].service.basePrice}$
                                    </div>
                                </>
                            ) : (
                                <div className="text-muted-foreground italic">Aucun service spécifié</div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    {job.notes && (
                        <div className="flex items-start gap-4 p-3 rounded-lg bg-secondary/50 border border-border">
                            <div className="bg-background p-2 rounded-full mt-1">
                                <MessageSquare className="h-5 w-5 text-primary" />
                            </div>
                            <div className="text-sm italic text-muted-foreground">
                                "{job.notes}"
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:justify-between">
                    <Button
                        variant="destructive"
                        onClick={handleDecline}
                        disabled={loading}
                        className="gap-2"
                    >
                        <XCircle size={16} /> Refuser
                    </Button>
                    <Button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="gap-2 bg-green-600 hover:bg-green-500 text-white"
                    >
                        <CheckCircle size={16} /> Confirmer le Rendez-vous
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
