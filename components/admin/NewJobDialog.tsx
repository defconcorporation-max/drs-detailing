"use client"

import { useState, useEffect, useMemo } from "react"
import { createJob } from "@/lib/actions/jobs"
import { checkTeamAvailability } from "@/lib/actions/availability"
import { jobDurationMinutes } from "@/lib/job-metrics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, Clock, CalendarDays, Car, Users, Store, CheckCircle2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelect } from "@/components/ui/multi-select"
import { QuickClientDialog } from "./QuickClientDialog"
import { JobServiceExtrasPicker } from "@/components/admin/JobServiceExtrasPicker"
import { ClientSearchSelect } from "@/components/admin/ClientSearchSelect"

export function NewJobDialog({
    clients,
    employees,
    services,
    prefillDate,
    prefillTime,
    trigger,
    open: controlledOpen,
    onOpenChange: controlledOnOpenChange,
    hideTrigger,
}: any) {
    const [internalOpen, setInternalOpen] = useState(false)
    const controlled = controlledOpen !== undefined && controlledOnOpenChange !== undefined
    const open = controlled ? controlledOpen : internalOpen
    const setOpen = controlled ? controlledOnOpenChange : setInternalOpen
    const [selectedClient, setSelectedClient] = useState("")
    const [vehicleId, setVehicleId] = useState("")
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [serviceExtras, setServiceExtras] = useState<Record<string, string[]>>({})
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
    const [isNewVehicle, setIsNewVehicle] = useState(false)
    const [isInShop, setIsInShop] = useState(false)
    const [customServiceName, setCustomServiceName] = useState("")
    const [customServicePrice, setCustomServicePrice] = useState("")
    const [durationHours, setDurationHours] = useState("")
    const [initialStatus, setInitialStatus] = useState("CONFIRMED")

    const [date, setDate] = useState(prefillDate || "")
    const [time, setTime] = useState(prefillTime || "09:00")

    // Sync créneau choisi sur le calendrier (dialog contrôlé)
    useEffect(() => {
        if (!open) return
        if (prefillDate) setDate(prefillDate)
        if (prefillTime != null && prefillTime !== "") setTime(prefillTime)
    }, [open, prefillDate, prefillTime])
    const [checking, setChecking] = useState(false)
    const [availability, setAvailability] = useState<Record<string, { status: string; reason?: string }>>({})

    const client = clients.find((c: any) => c.id === selectedClient)
    const vehicles = client?.vehicles || []

    useEffect(() => {
        setVehicleId("")
        if (client && vehicles.length === 0) {
            setIsNewVehicle(true)
        }
    }, [selectedClient, client, vehicles.length])

    useEffect(() => {
        setServiceExtras((prev) => {
            const next: Record<string, string[]> = { ...prev }
            for (const id of selectedServices) {
                if (!(id in next)) next[id] = []
            }
            for (const k of Object.keys(next)) {
                if (!selectedServices.includes(k)) delete next[k]
            }
            return next
        })
    }, [selectedServices])

    const estimatedDurationMin = useMemo(() => {
        const lines = selectedServices
            .map((sid) => {
                const s = services.find((serv: any) => serv.id === sid)
                if (!s) return null
                return {
                    serviceId: sid,
                    selectedExtraIds: serviceExtras[sid] ?? [],
                    service: s,
                }
            })
            .filter(Boolean) as any[]
        return jobDurationMinutes(lines)
    }, [selectedServices, serviceExtras, services])

    const handleServiceToggle = (id: string) => {
        setSelectedServices((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    }

    useEffect(() => {
        const check = async () => {
            if (!date || !time) return
            setChecking(true)
            const totalDuration = selectedServices.length ? estimatedDurationMin : 60
            try {
                const res = await checkTeamAvailability(date, time, totalDuration)
                setAvailability(res)
            } catch (err) {
                console.error(err)
            } finally {
                setChecking(false)
            }
        }
        const timer = setTimeout(check, 400)
        return () => clearTimeout(timer)
    }, [date, time, estimatedDurationMin, selectedServices.length])

    const handleSubmit = async (formData: FormData) => {
        formData.set("clientId", selectedClient)
        if (!isNewVehicle && vehicleId) {
            formData.set("vehicleId", vehicleId)
        } else {
            formData.delete("vehicleId")
        }
        selectedServices.forEach((id) => formData.append("serviceId", id))
        formData.set("serviceExtras", JSON.stringify(serviceExtras))
        if (customServiceName.trim()) {
            formData.set("customServiceName", customServiceName.trim())
            if (customServicePrice) formData.set("customServicePrice", customServicePrice)
        }
        if (durationHours) {
            const mins = Math.round(parseFloat(durationHours) * 60)
            if (mins > 0) formData.set("durationMin", String(mins))
        }
        const utcMs = new Date(`${date}T${time}:00`).getTime()
        if (!Number.isNaN(utcMs)) formData.set("scheduledAtUtcMs", String(utcMs))
        if (isNewVehicle) {
            formData.set("newVehicle", "on")
        } else {
            formData.delete("newVehicle")
        }
        if (isInShop) {
            formData.set("isInShop", "on")
        } else {
            formData.delete("isInShop")
        }
        const res = await createJob(formData)
        if (res.success) {
            setOpen(false)
            setSelectedClient("")
            setVehicleId("")
            setSelectedServices([])
            setServiceExtras({})
            setSelectedEmployees([])
            setIsNewVehicle(false)
            setIsInShop(false)
            setCustomServiceName("")
            setCustomServicePrice("")
            setDurationHours("")
            setInitialStatus("CONFIRMED")
        } else {
            alert(res.error)
        }
    }

    const sortedEmployees = [...employees].sort((a, b) => {
        const statusA = availability[a.id]?.status || "OFF"
        const statusB = availability[b.id]?.status || "OFF"
        if (statusA === "AVAILABLE" && statusB !== "AVAILABLE") return -1
        if (statusA !== "AVAILABLE" && statusB === "AVAILABLE") return 1
        return 0
    })
    const formContent = (
        <form action={handleSubmit} className="flex flex-col h-full">
            <div className="flex-1 space-y-5 px-5 py-4 min-h-0">

                {/* Date + Heure */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-4">
                    <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                        <CalendarDays size={16} /> Date &amp; Heure
                    </div>
                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs">Date</Label>
                            <Input name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required className="h-11 text-base" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs">Heure</Label>
                            <Input name="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required className="h-11 text-base" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1.5 text-xs">
                                <Clock size={13} className="text-muted-foreground" /> Durée (heures)
                            </Label>
                            <Input
                                type="number" step="0.5" min="0.5" max="12"
                                placeholder={estimatedDurationMin > 0 ? `Auto: ${(estimatedDurationMin / 60).toFixed(1)}h` : "Ex: 2.5"}
                                value={durationHours}
                                onChange={(e) => setDurationHours(e.target.value)}
                                className="h-11 text-base"
                            />
                        </div>
                        {/* Lieu de prestation */}
                        <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/10 px-4 py-3 cursor-pointer hover:bg-muted/30 transition-colors">
                            <Checkbox
                                id="isInShop"
                                name="isInShop"
                                checked={isInShop}
                                onCheckedChange={(c) => setIsInShop(c === true)}
                            />
                            <div className="flex items-center gap-2">
                                <Store size={15} className={isInShop ? "text-primary" : "text-muted-foreground"} />
                                <div>
                                    <div className="text-sm font-semibold">{isInShop ? "En shop" : "Équipe mobile"}</div>
                                    <div className="text-xs text-muted-foreground">{isInShop ? "Le client amène son véhicule" : "Déplacement chez le client"}</div>
                                </div>
                            </div>
                        </label>

                        {/* Statut initial */}
                        <div className="space-y-1.5">
                            <Label className="flex items-center gap-1.5 text-xs">
                                <CheckCircle2 size={13} className="text-muted-foreground" /> Statut initial
                            </Label>
                            <input type="hidden" name="status" value={initialStatus} />
                            <Select value={initialStatus} onValueChange={setInitialStatus}>
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">En attente</SelectItem>
                                    <SelectItem value="CONFIRMED">✅ Confirmé</SelectItem>
                                    <SelectItem value="SCHEDULED">Planifié</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {/* Client */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold">Client</Label>
                    <div className="flex gap-2">
                        <ClientSearchSelect clients={clients} value={selectedClient} onChange={setSelectedClient} />
                        <QuickClientDialog />
                    </div>
                </div>

                {/* Véhicule */}
                <div className="rounded-xl border border-border/60 bg-muted/20 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-semibold">
                            <Car size={15} /> Véhicule
                        </div>
                        {selectedClient && vehicles.length > 0 && (
                            <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                                <Checkbox
                                    id="newVehicle"
                                    checked={isNewVehicle}
                                    onCheckedChange={(c) => setIsNewVehicle(c === true)}
                                />
                                Nouveau
                            </label>
                        )}
                    </div>

                    {selectedClient && vehicles.length === 0 && (
                        <p className="text-sm text-amber-600 dark:text-amber-400">
                            Aucun véhicule — remplissez la fiche ci-dessous.
                        </p>
                    )}

                    {!isNewVehicle ? (
                        <Select value={vehicleId} onValueChange={setVehicleId} disabled={!selectedClient}>
                            <SelectTrigger className="h-11 rounded-xl">
                                <SelectValue placeholder={!selectedClient ? "Choisir un client d'abord" : vehicles.length > 0 ? "Sélectionner un véhicule" : "—"} />
                            </SelectTrigger>
                            <SelectContent>
                                {vehicles.map((v: any) => (
                                    <SelectItem key={v.id} value={v.id}>
                                        {v.make} {v.model}{v.year ? ` (${v.year})` : ""}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <div className="grid gap-3">
                            <Select name="newVehicleType" required>
                                <SelectTrigger className="h-11 rounded-xl">
                                    <SelectValue placeholder="Type de véhicule *" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SEDAN">Berline</SelectItem>
                                    <SelectItem value="SUV">VUS / SUV</SelectItem>
                                    <SelectItem value="PICKUP">Pickup</SelectItem>
                                    <SelectItem value="TRUCK">Camion</SelectItem>
                                    <SelectItem value="OTHER">Autre</SelectItem>
                                </SelectContent>
                            </Select>
                            <Input name="newVehicleYear" placeholder="Année" type="number" className="h-11" />
                            <Input name="newVehicleMake" placeholder="Marque *" className="h-11" required />
                            <Input name="newVehicleModel" placeholder="Modèle *" className="h-11" required />
                        </div>
                    )}
                </div>

                {/* Services */}
                <div className="space-y-2">
                    <Label className="text-sm font-semibold">Services</Label>
                    <div className="space-y-2 rounded-xl border border-border/60 p-3">
                        {services.map((s: any) => (
                            <div key={s.id} className="flex items-start gap-3 py-1">
                                <Checkbox
                                    id={`ns-${s.id}`}
                                    checked={selectedServices.includes(s.id)}
                                    onCheckedChange={() => handleServiceToggle(s.id)}
                                    className="mt-0.5"
                                />
                                <label htmlFor={`ns-${s.id}`} className="flex-1 cursor-pointer">
                                    <div className="font-medium text-sm">{s.name}</div>
                                    <div className="text-xs text-muted-foreground">{s.durationMin} min · {s.basePrice.toFixed(2)} $</div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <JobServiceExtrasPicker
                    services={services}
                    selectedServiceIds={selectedServices}
                    value={serviceExtras}
                    onChange={setServiceExtras}
                />

                {/* Service custom */}
                <div className="rounded-xl border border-dashed border-primary/30 bg-primary/5 p-4 space-y-2">
                    <Label className="text-xs font-semibold uppercase tracking-wide text-primary">Service personnalisé (optionnel)</Label>
                    <div className="space-y-2">
                        <Input
                            placeholder="Nom du service"
                            value={customServiceName}
                            onChange={(e) => setCustomServiceName(e.target.value)}
                            className="h-11"
                        />
                        <Input
                            type="number" step="0.01" min="0"
                            placeholder="Prix $"
                            value={customServicePrice}
                            onChange={(e) => setCustomServicePrice(e.target.value)}
                            className="h-11"
                        />
                    </div>
                </div>

                {/* Employés */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm font-semibold">
                        <Users size={15} /> Employé(s)
                        {checking && <Loader2 className="size-3 animate-spin text-muted-foreground" />}
                    </div>
                    {selectedEmployees.map((id) => (
                        <input key={id} type="hidden" name="employeeId" value={id} />
                    ))}
                    <MultiSelect
                        selected={selectedEmployees}
                        onChange={setSelectedEmployees}
                        placeholder="Sélectionner employés…"
                        options={sortedEmployees.map((e: any) => {
                            const statusData = availability[e.id]
                            const status = statusData?.status || "AVAILABLE"
                            const reason = statusData?.reason
                            const isAvail = status === "AVAILABLE"
                            const indicator = isAvail ? "🟢" : status === "BUSY" ? "🔴" : "⚪"
                            return {
                                value: e.id,
                                label: `${indicator} ${e.user.name}${!isAvail && reason ? ` (${reason})` : ""}`,
                            }
                        })}
                    />
                </div>
            </div>

            <div className="border-t px-5 py-4">
                <Button type="submit" className="w-full h-12 rounded-xl text-base font-semibold">
                    Créer le rendez-vous
                </Button>
            </div>
        </form>
    )

    const title = "Planifier un rendez-vous"

    return (
        <>
            {/* Mobile : Sheet (tiroir plein écran depuis le bas) */}
            <div className="sm:hidden">
                <Sheet open={open} onOpenChange={setOpen}>
                    {!hideTrigger && (
                        <SheetTrigger asChild>
                            {trigger || (
                                <Button className="gap-2 rounded-xl">
                                    <Plus size={16} /> Nouveau job
                                </Button>
                            )}
                        </SheetTrigger>
                    )}
                    <SheetContent side="bottom" className="max-h-[90dvh] flex flex-col rounded-t-2xl p-0">
                        <SheetHeader className="px-5 pt-5 pb-2 border-b shrink-0">
                            <div className="mx-auto w-10 h-1 rounded-full bg-muted-foreground/30 mb-3" />
                            <SheetTitle className="font-display text-lg uppercase">{title}</SheetTitle>
                        </SheetHeader>
                        <div className="overflow-y-auto flex-1 min-h-0">
                            {formContent}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>

            {/* Desktop : Dialog normal */}
            <div className="hidden sm:block">
                <Dialog open={open} onOpenChange={setOpen}>
                    {!hideTrigger && (
                        <DialogTrigger asChild>
                            {trigger || (
                                <Button className="gap-2 rounded-xl">
                                    <Plus size={16} /> Nouveau job
                                </Button>
                            )}
                        </DialogTrigger>
                    )}
                    <DialogContent className="flex max-h-[90vh] max-w-lg flex-col rounded-2xl p-0">
                        <DialogHeader className="px-5 pt-5 pb-2 border-b shrink-0">
                            <DialogTitle className="font-display text-xl uppercase">{title}</DialogTitle>
                        </DialogHeader>
                        <div className="overflow-y-auto flex-1 min-h-0">
                            {formContent}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </>
    )
}
