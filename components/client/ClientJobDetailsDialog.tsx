"use client"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Car, PenTool, MessageSquare, MapPin } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export function ClientJobDetailsDialog({ job }: { job: any }) {
    if (!job) return null

    return (
        <Dialog>
            <DialogTrigger asChild>
                <div className="cursor-pointer hover:bg-secondary/50 transition-colors rounded-lg p-2 -m-2">
                    <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-foreground">
                            {format(new Date(job.scheduledDate), 'd MMMM yyyy', { locale: fr })}
                        </div>
                        <Badge variant={job.status === 'COMPLETED' ? 'default' : 'outline'}>
                            {job.status}
                        </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock size={14} />
                        {format(new Date(job.scheduledDate), 'HH:mm')}
                        <span>•</span>
                        {job.vehicle ? `${job.vehicle.make} ${job.vehicle.model}` : 'Véhicule Inconnu'}
                    </div>
                </div>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Détails du Rendez-vous</DialogTitle>
                    <DialogDescription>
                        Historique de votre intervention.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Date/Time */}
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/20 border border-border">
                        <div className="bg-primary/10 p-2 rounded-full text-primary">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <div>
                            <div className="font-semibold capitalize">
                                {format(new Date(job.scheduledDate), 'EEEE d MMMM yyyy', { locale: fr })}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {format(new Date(job.scheduledDate), 'HH:mm')}
                            </div>
                        </div>
                    </div>

                    {/* Vehicle */}
                    {job.vehicle && (
                        <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/20 border border-border">
                            <div className="bg-primary/10 p-2 rounded-full text-primary">
                                <Car className="h-5 w-5" />
                            </div>
                            <div>
                                <div className="font-semibold">
                                    {job.vehicle.make} {job.vehicle.model}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {job.vehicle.year} • {job.vehicle.licensePlate}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Services */}
                    <div className="flex items-center gap-4 p-3 rounded-lg bg-secondary/20 border border-border">
                        <div className="bg-primary/10 p-2 rounded-full text-primary">
                            <PenTool className="h-5 w-5" />
                        </div>
                        <div>
                            {job.services.length > 0 ? job.services.map((s: any) => (
                                <div key={s.serviceId} className="mb-1 last:mb-0">
                                    <div className="font-semibold">{s.service.name}</div>
                                </div>
                            )) : (
                                <div className="text-muted-foreground italic">Aucun service listé</div>
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    {job.notes && (
                        <div className="flex items-start gap-4 p-3 rounded-lg bg-secondary/20 border border-border">
                            <div className="bg-primary/10 p-2 rounded-full text-primary mt-1">
                                <MessageSquare className="h-5 w-5" />
                            </div>
                            <div className="text-sm italic text-muted-foreground">
                                "{job.notes}"
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
