"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { 
    Check, 
    Calendar, 
    Car, 
    User, 
    MapPin, 
    Clock, 
    ArrowRight, 
    ArrowLeft, 
    CheckCircle2, 
    Loader2, 
    Sparkles, 
    Store,
    DollarSign,
    ShieldCheck
} from "lucide-react"
import { getPublicServices, getPublicAvailabilityForDay, createPublicBooking } from "@/lib/actions/public-booking"
import { toast } from "sonner"

type ServiceWithExtras = {
    id: string
    name: string
    description: string | null
    basePrice: number
    durationMin: number
    extras: {
        id: string
        label: string
        priceExtra: number
        durationExtraMin: number
    }[]
}

const VEHICLE_TYPES = [
    { value: "SEDAN", label: "Berline / Coupé" },
    { value: "SUV", label: "VUS / SUV" },
    { value: "PICKUP", label: "Pickup / Camionnette" },
    { value: "TRUCK", label: "Camion / Utilitaire" },
    { value: "OTHER", label: "Autre" }
]

export function PublicBookingForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const isEmbed = searchParams.get("embed") === "true"

    // Services state
    const [services, setServices] = useState<ServiceWithExtras[]>([])
    const [loadingServices, setLoadingServices] = useState(true)

    // Form Wizard Steps: 1 (Services), 2 (Date/Time), 3 (Vehicle), 4 (Contact), 5 (Review), 6 (Success)
    const [step, setStep] = useState(1)
    
    // Booking Form State
    const [selectedServiceId, setSelectedServiceId] = useState("")
    const [selectedExtraIds, setSelectedExtraIds] = useState<string[]>([])
    
    const [selectedDate, setSelectedDate] = useState("") // YYYY-MM-DD
    const [selectedTime, setSelectedTime] = useState("") // HH:MM
    const [slots, setSlots] = useState<{ time: string; available: boolean; remaining: number }[]>([])
    const [loadingSlots, setLoadingSlots] = useState(false)

    const [vehicleType, setVehicleType] = useState("SEDAN")
    const [vehicleMake, setVehicleMake] = useState("")
    const [vehicleModel, setVehicleModel] = useState("")
    const [vehicleYear, setVehicleYear] = useState("")
    const [vehicleColor, setVehicleColor] = useState("")
    const [vehiclePlate, setVehiclePlate] = useState("")

    const [isInShop, setIsInShop] = useState(true) // default to In-Shop only
    const [clientName, setClientName] = useState("")
    const [clientEmail, setClientEmail] = useState("")
    const [clientPhone, setClientPhone] = useState("")
    const [clientAddress, setClientAddress] = useState("")
    const [bookingNotes, setBookingNotes] = useState("")

    const [submitting, setSubmitting] = useState(false)

    // Load services on mount
    useEffect(() => {
        const load = async () => {
            const res = await getPublicServices()
            if (res.success && res.services) {
                setServices(res.services as any)
            } else {
                toast.error(res.error || "Erreur de chargement des services")
            }
            setLoadingServices(false)
        }
        load()
    }, [])

    // Generate next 14 days
    const [dateOptions, setDateOptions] = useState<{ key: string; dateLabel: string; dayNum: number; monthLabel: string }[]>([])
    useEffect(() => {
        const options = []
        const daysOfWeek = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"]
        const months = ["Janv.", "Févr.", "Mars", "Avril", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."]
        
        // Start from tomorrow
        const tomorrow = new Date()
        for (let i = 1; i <= 14; i++) {
            const d = new Date(tomorrow)
            d.setDate(tomorrow.getDate() + i)
            
            // Skip Sundays (standard workshop closure, or customizable)
            if (d.getDay() === 0) continue

            const year = d.getFullYear()
            const month = String(d.getMonth() + 1).padStart(2, "0")
            const date = String(d.getDate()).padStart(2, "0")
            const key = `${year}-${month}-${date}`

            options.push({
                key,
                dateLabel: daysOfWeek[d.getDay()],
                dayNum: d.getDate(),
                monthLabel: months[d.getMonth()]
            })
        }
        setDateOptions(options)
    }, [])

    // Fetch slots when date or service changes
    useEffect(() => {
        if (!selectedDate || !selectedServiceId) return
        
        const loadSlots = async () => {
            setLoadingSlots(true)
            setSelectedTime("")
            const res = await getPublicAvailabilityForDay(selectedDate, selectedServiceId)
            if (res.success && res.slots) {
                setSlots(res.slots)
            } else {
                toast.error(res.error || "Erreur lors de la récupération des créneaux")
            }
            setLoadingSlots(false)
        }
        loadSlots()
    }, [selectedDate, selectedServiceId])

    // Calculations
    const activeService = services.find(s => s.id === selectedServiceId)
    const activeExtras = activeService?.extras.filter(e => selectedExtraIds.includes(e.id)) || []
    
    const totalPrice = (activeService?.basePrice || 0) + activeExtras.reduce((sum, e) => sum + e.priceExtra, 0)
    const totalDuration = (activeService?.durationMin || 0) + activeExtras.reduce((sum, e) => sum + e.durationExtraMin, 0)

    const handleServiceSelect = (id: string) => {
        setSelectedServiceId(id)
        setSelectedExtraIds([]) // reset extras
        setSelectedDate("")
        setSelectedTime("")
    }

    const handleExtraToggle = (id: string) => {
        setSelectedExtraIds(prev => 
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    const handleBack = () => {
        if (step > 1) setStep(step - 1)
    }

    const handleNext = () => {
        if (step === 1) {
            if (!selectedServiceId) {
                toast.error("Veuillez sélectionner un service.")
                return
            }
            setStep(2)
        } else if (step === 2) {
            if (!selectedDate || !selectedTime) {
                toast.error("Veuillez sélectionner une date et une heure.")
                return
            }
            setStep(3)
        } else if (step === 3) {
            if (!vehicleMake || !vehicleModel) {
                toast.error("Veuillez renseigner la marque et le modèle du véhicule.")
                return
            }
            setStep(4)
        } else if (step === 4) {
            if (!clientName || !clientEmail || !clientPhone) {
                toast.error("Veuillez remplir vos coordonnées.")
                return
            }
            if (!isInShop && !clientAddress) {
                toast.error("Veuillez fournir une adresse pour le service à domicile.")
                return
            }
            setStep(5)
        }
    }

    const handleBookingSubmit = async () => {
        setSubmitting(true)
        const res = await createPublicBooking({
            name: clientName,
            email: clientEmail,
            phone: clientPhone,
            address: isInShop ? "À l'atelier" : clientAddress,
            vehicleType,
            vehicleYear: vehicleYear ? Number(vehicleYear) : undefined,
            vehicleMake,
            vehicleModel,
            vehicleColor: vehicleColor || undefined,
            vehicleLicensePlate: vehiclePlate || undefined,
            serviceId: selectedServiceId,
            selectedExtraIds,
            dateStr: selectedDate,
            timeStr: selectedTime,
            notes: bookingNotes,
            isInShop
        })
        setSubmitting(false)

        if (res.success) {
            setStep(6)
        } else {
            toast.error(res.error || "Erreur lors de la réservation.")
        }
    }

    const formatDuration = (mins: number) => {
        const hrs = Math.floor(mins / 60)
        const m = mins % 60
        if (hrs > 0) {
            return `${hrs}h${m > 0 ? String(m).padStart(2, "0") : ""}`
        }
        return `${m} min`
    }

    if (loadingServices) {
        return (
            <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground font-medium">Chargement du configurateur...</p>
            </div>
        )
    }

    return (
        <div className={`w-full max-w-4xl mx-auto ${isEmbed ? "p-0 bg-transparent" : "px-4 py-8"}`}>
            {/* Header (Hidden on Embed to fit Wix layout) */}
            {!isEmbed && step < 6 && (
                <div className="text-center mb-8">
                    <h1 className="font-display text-3xl font-black uppercase tracking-wider text-foreground sm:text-4xl">
                        Réserver un <span className="text-gradient-brand">rendez-vous</span>
                      </h1>
                      <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
                        Configurez votre esthétique automobile premium en quelques étapes simples.
                      </p>
                </div>
            )}

            {/* Stepper Progress Bar */}
            {step < 6 && (
                <div className="mb-8 bg-muted/20 border border-border/50 rounded-2xl p-4 flex items-center justify-between gap-2 overflow-x-auto">
                    {[
                        { num: 1, label: "Services", active: step === 1, done: step > 1 },
                        { num: 2, label: "Date & Heure", active: step === 2, done: step > 2 },
                        { num: 3, label: "Véhicule", active: step === 3, done: step > 3 },
                        { num: 4, label: "Client", active: step === 4, done: step > 4 },
                        { num: 5, label: "Confirmation", active: step === 5, done: step > 5 }
                    ].map((s) => (
                        <div key={s.num} className="flex items-center gap-2 shrink-0">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all duration-300 ${
                                s.active ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" :
                                s.done ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" :
                                "bg-muted border-border/60 text-muted-foreground"
                            }`}>
                                {s.done ? <Check size={12} strokeWidth={3} /> : s.num}
                            </div>
                            <span className={`text-xs font-semibold hidden sm:inline ${s.active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                            {s.num < 5 && <div className="h-px w-6 sm:w-10 bg-border hidden sm:block ml-2" />}
                        </div>
                    ))}
                </div>
            )}

            {/* Steps Container */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Main Content Card */}
                <div className={`${step < 6 ? "lg:col-span-8" : "lg:col-span-12"} w-full rounded-2xl border border-white/10 bg-card/60 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden`}>
                    <div className="showroom-bay-shine" />

                    {/* STEP 1: SERVICES & EXTRAS */}
                    {step === 1 && (
                        <div className="space-y-6 relative z-[1]">
                            <h2 className="font-display text-xl font-bold tracking-wide uppercase text-foreground">
                                Étape 1 : Choisissez votre formule
                            </h2>
                            <div className="space-y-4">
                                {services.map((s) => {
                                    const isSelected = selectedServiceId === s.id
                                    return (
                                        <div 
                                            key={s.id} 
                                            onClick={() => handleServiceSelect(s.id)}
                                            className={`rounded-xl border p-4 cursor-pointer transition-all duration-300 ${
                                                isSelected 
                                                    ? "bg-primary/5 border-primary shadow-[0_0_20px_rgba(59,130,246,0.1)] ring-1 ring-primary" 
                                                    : "bg-muted/10 border-border/60 hover:border-muted-foreground/35 hover:bg-muted/30"
                                            }`}
                                        >
                                            <div className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-bold text-base text-foreground">{s.name}</h3>
                                                        {isSelected && <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[8px]"><Check size={8} strokeWidth={4} /></span>}
                                                    </div>
                                                    {s.description && (
                                                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.description}</p>
                                                    )}
                                                    <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground mt-3 uppercase tracking-wider">
                                                        <span className="flex items-center gap-1"><Clock size={12} /> {formatDuration(s.durationMin)}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-lg font-black text-primary">{s.basePrice.toFixed(2)} $</div>
                                                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Base</span>
                                                </div>
                                            </div>

                                            {/* Sub-extras visible if selected */}
                                            {isSelected && s.extras.length > 0 && (
                                                <div className="mt-4 pt-4 border-t border-border/40 space-y-3" onClick={(e) => e.stopPropagation()}>
                                                    <h4 className="text-xs font-bold uppercase tracking-wider text-primary mb-2 flex items-center gap-1">
                                                        <Sparkles size={12} /> Options supplémentaires
                                                    </h4>
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                        {s.extras.map((ext) => {
                                                            const extraSelected = selectedExtraIds.includes(ext.id)
                                                            return (
                                                                <label 
                                                                    key={ext.id}
                                                                    className={`flex items-start gap-3 rounded-lg border p-2.5 cursor-pointer transition-colors ${
                                                                        extraSelected 
                                                                            ? "bg-primary/10 border-primary/40 text-foreground" 
                                                                            : "bg-background/40 border-border/50 text-muted-foreground hover:bg-muted/20"
                                                                    }`}
                                                                >
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={extraSelected}
                                                                        onChange={() => handleExtraToggle(ext.id)}
                                                                        className="rounded border-border text-primary focus:ring-primary h-4 w-4 mt-0.5"
                                                                    />
                                                                    <div className="flex-1 text-xs">
                                                                        <div className="font-semibold text-foreground">{ext.label}</div>
                                                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                                                            +{ext.priceExtra.toFixed(2)} $ · +{formatDuration(ext.durationExtraMin)}
                                                                        </div>
                                                                    </div>
                                                                </label>
                                                            )
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: DATE & TIME */}
                    {step === 2 && (
                        <div className="space-y-6 relative z-[1]">
                            <h2 className="font-display text-xl font-bold tracking-wide uppercase text-foreground">
                                Étape 2 : Date &amp; Heure de rendez-vous
                            </h2>
                            
                            {/* Horizontal scroll dates */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                    <Calendar size={13} /> Choisissez la date
                                </label>
                                <div className="flex gap-2 overflow-x-auto pb-2 -mx-2 px-2 scrollbar-thin scrollbar-thumb-primary/20">
                                    {dateOptions.map((opt) => (
                                        <button
                                            key={opt.key}
                                            type="button"
                                            onClick={() => setSelectedDate(opt.key)}
                                            className={`flex flex-col items-center justify-center p-3 rounded-xl border min-w-[70px] transition-all shrink-0 ${
                                                selectedDate === opt.key 
                                                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-105" 
                                                    : "bg-muted/15 border-border/50 text-muted-foreground hover:bg-muted/30 hover:border-muted-foreground/30"
                                            }`}
                                        >
                                            <span className="text-[9px] uppercase font-bold tracking-wider leading-none">
                                                {opt.dateLabel.substring(0, 3)}
                                            </span>
                                            <span className="text-lg font-black my-1 leading-none">{opt.dayNum}</span>
                                            <span className="text-[9px] uppercase font-bold tracking-widest leading-none">
                                                {opt.monthLabel}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Grid slots */}
                            {selectedDate && (
                                <div className="space-y-3 pt-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <Clock size={13} /> Créneaux horaires disponibles
                                    </label>

                                    {loadingSlots ? (
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                                            <Loader2 size={16} className="animate-spin text-primary" />
                                            Recherche des mécaniciens disponibles...
                                        </div>
                                    ) : slots.length === 0 ? (
                                        <div className="text-sm text-amber-500 bg-amber-500/10 p-3 rounded-xl">
                                            Aucun créneau disponible pour cette journée.
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                                            {slots.map((slot) => (
                                                <button
                                                    key={slot.time}
                                                    type="button"
                                                    disabled={!slot.available}
                                                    onClick={() => setSelectedTime(slot.time)}
                                                    className={`py-2 px-3 rounded-lg border text-sm font-bold transition-all tabular-nums ${
                                                        !slot.available 
                                                            ? "bg-muted/10 border-border/30 text-muted-foreground/30 cursor-not-allowed" 
                                                            : selectedTime === slot.time
                                                                ? "bg-primary text-primary-foreground border-primary shadow-md"
                                                                : "bg-background/60 border-border/60 text-foreground hover:bg-muted/20 hover:border-muted-foreground/30"
                                                    }`}
                                                >
                                                    {slot.time}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* STEP 3: VEHICLE DETAILS */}
                    {step === 3 && (
                        <div className="space-y-6 relative z-[1]">
                            <h2 className="font-display text-xl font-bold tracking-wide uppercase text-foreground">
                                Étape 3 : Fiche du Véhicule
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Type de véhicule *</label>
                                    <select
                                        value={vehicleType}
                                        onChange={(e) => setVehicleType(e.target.value)}
                                        className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary"
                                    >
                                        {VEHICLE_TYPES.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Année</label>
                                    <input
                                        type="number"
                                        placeholder="Ex: 2022"
                                        value={vehicleYear}
                                        onChange={(e) => setVehicleYear(e.target.value)}
                                        className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Marque *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Porsche"
                                        value={vehicleMake}
                                        onChange={(e) => setVehicleMake(e.target.value)}
                                        className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary text-foreground"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Modèle *</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: 911 Carrera"
                                        value={vehicleModel}
                                        onChange={(e) => setVehicleModel(e.target.value)}
                                        className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary text-foreground"
                                        required
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Couleur</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Noir Métallisé"
                                        value={vehicleColor}
                                        onChange={(e) => setVehicleColor(e.target.value)}
                                        className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary text-foreground"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 4: CONTACT & LOCATION */}
                    {step === 4 && (
                        <div className="space-y-6 relative z-[1]">
                            <h2 className="font-display text-xl font-bold tracking-wide uppercase text-foreground">
                                Étape 4 : Vos Coordonnées
                            </h2>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nom complet *</label>
                                    <input
                                        type="text"
                                        placeholder="Jean Tremblay"
                                        value={clientName}
                                        onChange={(e) => setClientName(e.target.value)}
                                        className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary text-foreground"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Adresse courriel *</label>
                                        <input
                                            type="email"
                                            placeholder="jean.tremblay@gmail.com"
                                            value={clientEmail}
                                            onChange={(e) => setClientEmail(e.target.value)}
                                            className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary text-foreground"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Téléphone mobile *</label>
                                        <input
                                            type="tel"
                                            placeholder="Ex: 514-555-0199"
                                            value={clientPhone}
                                            onChange={(e) => setClientPhone(e.target.value)}
                                            className="w-full h-11 px-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary text-foreground"
                                            required
                                        />
                                        <span className="text-[10px] text-muted-foreground mt-0.5 block">Nécessaire pour recevoir la confirmation et le suivi par SMS.</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 5: REVIEW & CONFIRM */}
                    {step === 5 && (
                        <div className="space-y-6 relative z-[1]">
                            <h2 className="font-display text-xl font-bold tracking-wide uppercase text-foreground">
                                Étape 5 : Récapitulatif de la commande
                            </h2>

                            <div className="space-y-4 divide-y divide-border/40">
                                {/* Services list */}
                                <div className="pb-4">
                                    <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Prestation demandée</h3>
                                    <div className="flex justify-between items-start gap-4">
                                        <div>
                                            <div className="font-bold text-foreground text-sm">{activeService?.name}</div>
                                            {activeExtras.length > 0 && (
                                                <ul className="text-xs text-muted-foreground mt-1.5 list-disc list-inside space-y-0.5">
                                                    {activeExtras.map(e => (
                                                        <li key={e.id}>{e.label}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="font-bold text-foreground text-sm">{totalPrice.toFixed(2)} $</div>
                                            <div className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end mt-1"><Clock size={10} /> {formatDuration(totalDuration)} est.</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Date & Time */}
                                <div className="py-4">
                                    <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Date, Heure &amp; Lieu</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center gap-2 text-foreground font-semibold">
                                            <Calendar size={14} className="text-muted-foreground" />
                                            <span>
                                                {new Date(selectedDate + "T00:00:00").toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-foreground font-semibold">
                                            <Clock size={14} className="text-muted-foreground" />
                                            <span>À {selectedTime}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-foreground font-semibold mt-1 col-span-full">
                                            {isInShop ? <Store size={14} className="text-muted-foreground" /> : <MapPin size={14} className="text-muted-foreground" />}
                                            <span>{isInShop ? "Prestation à notre atelier" : `Service mobile : ${clientAddress}`}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Vehicle info */}
                                <div className="py-4">
                                    <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Véhicule</h3>
                                    <div className="text-sm font-semibold text-foreground">
                                        {vehicleYear ? `${vehicleYear} ` : ""}{vehicleMake} {vehicleModel}
                                        <span className="text-xs font-normal text-muted-foreground block mt-1 uppercase tracking-wide">
                                            Type : {VEHICLE_TYPES.find(t => t.value === vehicleType)?.label} 
                                            {vehicleColor && ` · Couleur : ${vehicleColor}`}
                                            {vehiclePlate && ` · Plaque : ${vehiclePlate}`}
                                        </span>
                                    </div>
                                </div>

                                {/* Contact info */}
                                <div className="py-4">
                                    <h3 className="text-xs font-bold text-primary uppercase tracking-widest mb-2">Coordonnées client</h3>
                                    <div className="text-sm font-semibold text-foreground">
                                        {clientName}
                                        <span className="text-xs font-normal text-muted-foreground block mt-1">
                                            ✉ {clientEmail} · 📞 {clientPhone}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Additional notes */}
                            <div className="space-y-2 pt-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes ou instructions particulières (optionnel)</label>
                                <textarea
                                    placeholder="Ex: Présence d'un chien (poils), vernis très sensible..."
                                    value={bookingNotes}
                                    onChange={(e) => setBookingNotes(e.target.value)}
                                    className="w-full min-h-[80px] p-3 rounded-xl border border-border bg-background text-sm outline-none focus:ring-1 focus:ring-primary text-foreground resize-none"
                                />
                            </div>

                            {/* Security badge */}
                            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3 text-xs text-emerald-400 flex items-center gap-2">
                                <ShieldCheck size={16} className="shrink-0" />
                                <span>Votre réservation sera mise en attente de validation. Nous vous enverrons un SMS dès confirmation.</span>
                            </div>
                        </div>
                    )}

                    {/* STEP 6: SUCCESS */}
                    {step === 6 && (
                        <div className="py-10 text-center space-y-6 relative z-[1]">
                            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                                <CheckCircle2 size={36} strokeWidth={1.5} className="animate-bounce" />
                            </div>
                            
                            <div className="space-y-2">
                                <h2 className="font-display text-2xl font-black uppercase tracking-wider text-foreground">
                                    Réservation enregistrée !
                                </h2>
                                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                                    Merci, {clientName}. Votre demande a bien été transmise à notre équipe.
                                </p>
                            </div>

                            <div className="rounded-xl border border-border/60 bg-muted/20 p-4 max-w-sm mx-auto text-xs text-left space-y-2.5">
                                <div className="font-bold uppercase tracking-wider text-primary">Récapitulatif rapide</div>
                                <div className="text-foreground font-medium">Formule : {activeService?.name}</div>
                                <div className="text-foreground font-medium">Véhicule : {vehicleMake} {vehicleModel}</div>
                                <div className="text-foreground font-medium">Prestation : {new Date(selectedDate + "T00:00:00").toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} à {selectedTime}</div>
                            </div>

                            <p className="text-xs text-muted-foreground italic">
                                Un SMS contenant ces informations de demande vient d&apos;être envoyé sur votre mobile.
                            </p>

                            {!isEmbed && (
                                <button
                                    onClick={() => {
                                        setSelectedServiceId("")
                                        setSelectedExtraIds([])
                                        setSelectedDate("")
                                        setSelectedTime("")
                                        setStep(1)
                                    }}
                                    className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg hover:brightness-[1.05] transition-all"
                                >
                                    Faire une autre réservation
                                </button>
                            )}
                        </div>
                    )}

                    {/* Wizard controls */}
                    {step < 6 && (
                        <div className="flex justify-between items-center gap-4 mt-8 pt-4 border-t border-border/40 relative z-[1]">
                            {step > 1 ? (
                                <button
                                    type="button"
                                    onClick={handleBack}
                                    className="inline-flex h-11 items-center gap-2 px-4 rounded-xl border border-border/60 text-sm font-bold text-foreground hover:bg-muted/30 transition-colors"
                                >
                                    <ArrowLeft size={16} />
                                    <span>Retour</span>
                                </button>
                            ) : <div />}

                            {step < 5 ? (
                                <button
                                    type="button"
                                    onClick={handleNext}
                                    className="inline-flex h-11 items-center gap-2 px-6 rounded-xl bg-primary text-primary-foreground text-sm font-bold shadow-lg shadow-primary/20 hover:brightness-[1.05] transition-all"
                                >
                                    <span>Continuer</span>
                                    <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={handleBookingSubmit}
                                    disabled={submitting}
                                    className="inline-flex h-11 items-center gap-2 px-6 rounded-xl bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 hover:brightness-[1.05] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Validation...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 size={16} />
                                            <span>Confirmer &amp; Réserver</span>
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar Summary (Visible during steps 1-5, hidden on success) */}
                {step < 6 && (
                    <div className="lg:col-span-4 w-full space-y-4">
                        <div className="rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl p-5 shadow-xl relative overflow-hidden">
                            <div className="showroom-bay-shine" />
                            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                                Détails de votre réservation
                            </h3>

                            {activeService ? (
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-sm font-bold text-foreground leading-snug">{activeService.name}</div>
                                        <div className="text-xs text-muted-foreground mt-0.5">{activeService.basePrice.toFixed(2)} $</div>
                                    </div>

                                    {activeExtras.length > 0 && (
                                        <div className="space-y-2 pt-2 border-t border-border/40">
                                            <div className="text-[10px] uppercase tracking-wider font-bold text-primary">Options choisies</div>
                                            {activeExtras.map(e => (
                                                <div key={e.id} className="flex justify-between items-start gap-2 text-xs">
                                                    <span className="text-muted-foreground">{e.label}</span>
                                                    <span className="font-semibold text-foreground shrink-0">+{e.priceExtra.toFixed(2)} $</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Date & slot */}
                                    {(selectedDate || selectedTime) && (
                                        <div className="space-y-2 pt-3 border-t border-border/40 text-xs">
                                            <div className="text-[10px] uppercase tracking-wider font-bold text-primary">Planification</div>
                                            {selectedDate && (
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Calendar size={12} className="shrink-0" />
                                                    <span>
                                                        {new Date(selectedDate + "T00:00:00").toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                            )}
                                            {selectedTime && (
                                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                                    <Clock size={12} className="shrink-0" />
                                                    <span>À {selectedTime}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Total Box */}
                                    <div className="pt-4 border-t border-primary/20 flex justify-between items-baseline">
                                        <div>
                                            <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest">Total estimé</div>
                                            <div className="text-[10px] text-muted-foreground flex items-center gap-0.5 mt-0.5"><Clock size={9} /> {formatDuration(totalDuration)}</div>
                                        </div>
                                        <div className="text-2xl font-black text-primary tracking-tight">
                                            {totalPrice.toFixed(2)} $
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground italic text-center py-6">
                                    Veuillez choisir une formule pour voir le récapitulatif.
                                </div>
                            )}
                        </div>

                        {/* Direct contact helpline */}
                        <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                            <span>Besoin d&apos;aide ? Appelez-nous directement au <strong className="text-foreground">450 602 4805</strong></span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
