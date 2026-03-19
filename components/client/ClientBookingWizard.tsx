"use client"

import * as React from "react"
import { Calendar as CalendarIcon, Clock, MessageSquare, Loader2, CheckCircle, AlertCircle, ArrowLeft, Car, PenTool } from "lucide-react"
import { format, addMonths } from "date-fns"
import { fr } from "date-fns/locale"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar } from "@/components/ui/calendar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogDescription
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

import { getPublicAvailability, DayAvailability, requestBooking } from "@/lib/actions/client-booking"

type WizardProps = {
    clientName: string
    token: string
    vehicles: any[]
    services: any[]
}

export function ClientBookingWizard({ clientName, token, vehicles = [], services = [] }: WizardProps) {
    const [isOpen, setIsOpen] = React.useState(false)
    const [step, setStep] = React.useState<'SLOT' | 'DETAILS'>('SLOT')

    // Slot Selection State
    const [currentMonth, setCurrentMonth] = React.useState<Date>(new Date())
    const [date, setDate] = React.useState<Date | undefined>(undefined)
    const [availabilities, setAvailabilities] = React.useState<DayAvailability[]>([])
    const [loadingSlots, setLoadingSlots] = React.useState(false)

    // Details State
    const [selectedSlot, setSelectedSlot] = React.useState<{ date: string, time: string } | null>(null)
    const [selectedVehicle, setSelectedVehicle] = React.useState<string>(vehicles.length > 0 ? vehicles[0].id : "")
    const [selectedService, setSelectedService] = React.useState<string>("")
    const [notes, setNotes] = React.useState("")

    // Submission State
    const [submitting, setSubmitting] = React.useState(false)
    const [success, setSuccess] = React.useState(false)
    const [error, setError] = React.useState<string | null>(null)

    // Load Availability when month changes
    React.useEffect(() => {
        if (isOpen && step === 'SLOT' && !success) {
            setLoadingSlots(true)
            // Fetch for the whole month displayed (plus a bit buffer)
            const dateStr = currentMonth.toISOString().split('T')[0]
            // Fetch 35 days from start of month to cover grid
            getPublicAvailability(dateStr, 40)
                .then(data => {
                    setAvailabilities(data)
                    setLoadingSlots(false)
                })
        }
    }, [isOpen, step, success, currentMonth])

    const handleSlotClick = (dateStr: string, time: string) => {
        setSelectedSlot({ date: dateStr, time })
        setStep('DETAILS')
    }

    const handleSubmit = async () => {
        if (!selectedSlot || !selectedService || !selectedVehicle) {
            setError("Veuillez remplir tous les champs obligatoires.")
            return
        }

        setSubmitting(true)
        setError(null)

        const res = await requestBooking({
            token,
            dateStr: selectedSlot.date,
            timeStr: selectedSlot.time,
            serviceId: selectedService,
            vehicleId: selectedVehicle,
            notes
        })

        setSubmitting(false)
        if (res.success) {
            setSuccess(true)
        } else {
            setError(res.error || "Une erreur est survenue.")
        }
    }

    const reset = () => {
        setSuccess(false)
        setStep('SLOT')
        setDate(undefined)
        setSelectedSlot(null)
        setNotes("")
        setError(null)
        setIsOpen(false)
    }

    // Helper: Current Day Slots
    const selectedDateStr = date?.toISOString().split('T')[0]
    const dayData = availabilities.find(d => d.date === selectedDateStr)

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && reset()}>
            <DialogTrigger asChild>
                <Button onClick={() => setIsOpen(true)} className="w-full gap-3 text-lg py-8 shadow-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold border border-primary/20 animate-in fade-in zoom-in duration-300">
                    <CalendarIcon className="h-6 w-6" />
                    Réserver un Rendez-vous
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[800px] h-[85vh] md:h-[600px] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border bg-card text-card-foreground shadow-2xl">
                {success ? (
                    <div className="flex flex-col items-center justify-center h-full p-12 text-center bg-card">
                        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                            <CheckCircle className="text-green-500 w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Demande Envoyée !</h2>
                        <p className="text-muted-foreground max-w-md mb-8">
                            Nous avons bien reçu votre demande pour le {selectedSlot?.date} à {selectedSlot?.time}.
                            <br />Nous la confirmerons rapidement.
                        </p>
                        <Button onClick={reset} size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground">
                            Retour à l'accueil
                        </Button>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="bg-primary p-6 text-primary-foreground shrink-0 flex items-center gap-4">
                            {step === 'DETAILS' && (
                                <Button size="icon" variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/20 -ml-2" onClick={() => setStep('SLOT')}>
                                    <ArrowLeft />
                                </Button>
                            )}
                            <div>
                                <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                    <CalendarIcon className="opacity-80" />
                                    {step === 'SLOT' ? 'Choisir un créneau' : 'Détails du Rendez-vous'}
                                </DialogTitle>
                                <DialogDescription className="text-primary-foreground/70">
                                    {step === 'SLOT'
                                        ? "Sélectionnez la date et l'heure de votre passage."
                                        : "Précisez le véhicule et le service souhaité."}
                                </DialogDescription>
                            </div>
                        </div>

                        <div className="flex flex-1 overflow-hidden bg-card relative">
                            {/* Loading Overlay */}
                            {submitting && (
                                <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <Loader2 className="animate-spin text-primary" size={40} />
                                        <div className="font-semibold text-primary">Envoi de la demande...</div>
                                    </div>
                                </div>
                            )}

                            {step === 'SLOT' ? (
                                <div className="flex flex-1 flex-col md:flex-row overflow-hidden w-full">
                                    {/* Calendar Column */}
                                    <div className="p-4 border-b md:border-b-0 md:border-r bg-muted/30 flex justify-center items-start pt-6">
                                        <Calendar
                                            mode="single"
                                            selected={date}
                                            onSelect={setDate}
                                            month={currentMonth}
                                            onMonthChange={setCurrentMonth}
                                            className="rounded-xl border shadow-sm bg-card p-4"
                                            disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                            locale={fr}
                                        />
                                    </div>

                                    {/* Slots Column */}
                                    <div className="flex-1 p-6 overflow-y-auto bg-card min-h-[300px]">
                                        <div className="flex items-center justify-between mb-6">
                                            <h3 className="font-bold flex items-center gap-2 text-lg">
                                                <Clock size={20} className="text-primary" />
                                                {date ? (
                                                    <span className="capitalize">{format(date, 'EEEE d MMMM', { locale: fr })}</span>
                                                ) : (
                                                    "Choisir une date"
                                                )}
                                            </h3>
                                            {date && dayData && (
                                                <Badge variant="outline" className="text-xs font-normal">
                                                    {dayData.slots.filter(s => s.available).length} créneaux
                                                </Badge>
                                            )}
                                        </div>

                                        {loadingSlots ? (
                                            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground animate-pulse">
                                                <Loader2 className="animate-spin text-primary" size={32} />
                                                <div className="text-sm">Recherche de disponibilités...</div>
                                            </div>
                                        ) : !date ? (
                                            <div className="flex flex-col items-center justify-center py-12 text-center space-y-3 opacity-50">
                                                <CalendarIcon size={48} className="text-muted-foreground" />
                                                <div>Sélectionnez une date sur le calendrier.</div>
                                            </div>
                                        ) : !dayData || dayData.slots.filter(s => s.available).length === 0 ? (
                                            <div className="flex flex-col items-center justify-center py-10 bg-destructive/10 rounded-xl border border-destructive/20 text-destructive">
                                                <div className="font-semibold">Complet</div>
                                                <div className="text-sm opacity-80">Aucune disponibilité pour cette date.</div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                                                {dayData.slots.map((slot) => (
                                                    <Button
                                                        key={slot.time}
                                                        variant={slot.available ? "outline" : "ghost"}
                                                        disabled={!slot.available}
                                                        onClick={() => handleSlotClick(dayData.date, slot.time)}
                                                        className={cn(
                                                            "relative h-14 flex flex-col items-center justify-center border-border transition-all duration-200 rounded-lg group",
                                                            slot.available
                                                                ? "hover:border-primary hover:bg-primary/5 hover:shadow-md cursor-pointer"
                                                                : "opacity-40 grayscale cursor-not-allowed bg-muted"
                                                        )}
                                                    >
                                                        <span className={cn(
                                                            "text-lg font-bold group-hover:text-primary",
                                                            slot.available ? "text-foreground" : "text-muted-foreground"
                                                        )}>
                                                            {slot.time}
                                                        </span>
                                                        {slot.available && (
                                                            <div className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full shadow-sm ring-2 ring-background" />
                                                        )}
                                                    </Button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex-1 p-8 overflow-y-auto bg-muted/10">
                                    <div className="max-w-2xl mx-auto space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Summary Card */}
                                            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center gap-4 md:col-span-2">
                                                <div className="bg-background p-3 rounded-lg shadow-sm text-primary">
                                                    <CalendarIcon />
                                                </div>
                                                <div>
                                                    <div className="text-sm text-primary font-semibold uppercase tracking-wider">Créneau Choisi</div>
                                                    <div className="text-lg font-bold capitalize">
                                                        {selectedSlot && format(new Date(selectedSlot.date), 'EEEE d MMMM', { locale: fr })} à {selectedSlot?.time}
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="sm" className="ml-auto text-primary hover:bg-primary/10" onClick={() => setStep('SLOT')}>Modifier</Button>
                                            </div>

                                            {/* Vehicle Selection */}
                                            <div className="space-y-3">
                                                <Label className="text-base font-semibold flex items-center gap-2">
                                                    <Car size={18} /> Véhicule
                                                </Label>
                                                <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
                                                    <SelectTrigger className="h-12 bg-background">
                                                        <SelectValue placeholder="Sélectionner un véhicule" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {vehicles.map((v) => (
                                                            <SelectItem key={v.id} value={v.id}>
                                                                {v.make} {v.model} ({v.year})
                                                            </SelectItem>
                                                        ))}
                                                        {vehicles.length === 0 && (
                                                            <SelectItem value="" disabled>Aucun véhicule enregistré</SelectItem>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Service Selection */}
                                            <div className="space-y-3">
                                                <Label className="text-base font-semibold flex items-center gap-2">
                                                    <PenTool size={18} /> Service Souhaité
                                                </Label>
                                                <Select value={selectedService} onValueChange={setSelectedService}>
                                                    <SelectTrigger className="h-12 bg-background">
                                                        <SelectValue placeholder="Choisir un service" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {services.map((s) => (
                                                            <SelectItem key={s.id} value={s.id}>
                                                                <div className="flex flex-col items-start py-1">
                                                                    <span className="font-semibold">{s.name}</span>
                                                                    <span className="text-xs text-muted-foreground">{s.durationMin} min • {s.basePrice} $</span>
                                                                </div>
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            {/* Notes */}
                                            <div className="space-y-3 md:col-span-2">
                                                <Label className="text-base font-semibold flex items-center gap-2">
                                                    <MessageSquare size={18} /> Informations Additionnelles
                                                </Label>
                                                <Textarea
                                                    placeholder="Précisions..."
                                                    className="bg-background min-h-[100px]"
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        {error && (
                                            <div className="p-4 bg-destructive/10 text-destructive rounded-lg flex items-center gap-2 border border-destructive/20 animate-in fade-in slide-in-from-top-2">
                                                <AlertCircle size={20} />
                                                <span className="font-medium">{error}</span>
                                            </div>
                                        )}

                                        <div className="pt-4">
                                            <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-6 shadow-lg shadow-primary/10" onClick={handleSubmit}>
                                                Confirmer la Demande
                                            </Button>
                                            <p className="text-center text-xs text-muted-foreground mt-4">
                                                En confirmant, une demande sera envoyée à notre équipe pour validation.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
