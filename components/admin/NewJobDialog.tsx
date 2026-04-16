"use client"

import { useState, useEffect, useMemo } from "react"
import { createJob } from "@/lib/actions/jobs"
import { checkTeamAvailability } from "@/lib/actions/availability"
import { jobDurationMinutes } from "@/lib/job-metrics"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelect } from "@/components/ui/multi-select"
import { QuickClientDialog } from "./QuickClientDialog"
import { JobServiceExtrasPicker } from "@/components/admin/JobServiceExtrasPicker"

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
    const [customServiceName, setCustomServiceName] = useState("")
    const [customServicePrice, setCustomServicePrice] = useState("")

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
        const utcMs = new Date(`${date}T${time}:00`).getTime()
        if (!Number.isNaN(utcMs)) formData.set("scheduledAtUtcMs", String(utcMs))
        if (isNewVehicle) {
            formData.set("newVehicle", "on")
        } else {
            formData.delete("newVehicle")
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
            setCustomServiceName("")
            setCustomServicePrice("")
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

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2 rounded-xl">
                        <Plus size={16} /> Nouveau job
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-display text-xl uppercase">Planifier un rendez-vous</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-2">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Heure</Label>
                            <Input name="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} required />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Client</Label>
                        <div className="flex gap-2">
                            <Select value={selectedClient} onValueChange={setSelectedClient} required>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Choisir un client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.user.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <QuickClientDialog />
                        </div>
                    </div>

                    <div className="space-y-2 rounded-xl border border-border/60 bg-muted/15 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <Label>Véhicule</Label>
                            {selectedClient && vehicles.length > 0 && (
                                <div className="flex items-center gap-2">
                                    <Checkbox
                                        id="newVehicle"
                                        checked={isNewVehicle}
                                        onCheckedChange={(c) => setIsNewVehicle(c === true)}
                                    />
                                    <Label htmlFor="newVehicle" className="text-xs font-normal">
                                        Créer un nouveau véhicule
                                    </Label>
                                </div>
                            )}
                        </div>

                        {selectedClient && vehicles.length === 0 && (
                            <p className="text-sm text-amber-600 dark:text-amber-400">
                                Aucun véhicule pour ce client — renseignez la fiche véhicule ci-dessous (obligatoire pour le dossier).
                            </p>
                        )}

                        {!isNewVehicle ? (
                            <Select value={vehicleId} onValueChange={setVehicleId} disabled={!selectedClient}>
                                <SelectTrigger className="rounded-xl">
                                    <SelectValue
                                        placeholder={
                                            !selectedClient
                                                ? "Choisir un client d’abord"
                                                : vehicles.length > 0
                                                  ? "Véhicule (optionnel)"
                                                  : "—"
                                        }
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicles.map((v: any) => (
                                        <SelectItem key={v.id} value={v.id}>
                                            {v.make} {v.model}
                                            {v.year ? ` (${v.year})` : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 rounded-xl border border-primary/20 bg-card/50 p-3">
                                <Select name="newVehicleType" required>
                                    <SelectTrigger className="rounded-lg">
                                        <SelectValue placeholder="Type *" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SEDAN">Berline</SelectItem>
                                        <SelectItem value="SUV">VUS</SelectItem>
                                        <SelectItem value="PICKUP">Pickup</SelectItem>
                                        <SelectItem value="TRUCK">Camion</SelectItem>
                                        <SelectItem value="OTHER">Autre</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input name="newVehicleYear" placeholder="Année" type="number" className="rounded-lg" />
                                <Input name="newVehicleMake" placeholder="Marque *" className="col-span-2 rounded-lg" required />
                                <Input name="newVehicleModel" placeholder="Modèle *" className="col-span-2 rounded-lg" required />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Services</Label>
                        <div className="max-h-36 space-y-2 overflow-y-auto rounded-xl border border-border/60 p-3">
                            {services.map((s: any) => (
                                <div key={s.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`ns-${s.id}`}
                                        checked={selectedServices.includes(s.id)}
                                        onCheckedChange={() => handleServiceToggle(s.id)}
                                    />
                                    <label htmlFor={`ns-${s.id}`} className="grid cursor-pointer text-sm">
                                        <span className="font-medium">{s.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {s.durationMin} min · {s.basePrice.toFixed(2)} $
                                        </span>
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

                    <div className="space-y-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-3">
                        <Label className="text-xs font-semibold uppercase tracking-wide text-primary">Service personnalisé (optionnel)</Label>
                        <p className="text-xs text-muted-foreground">Prix spécial ou service hors catalogue — ne sera pas enregistré dans la liste.</p>
                        <div className="grid grid-cols-3 gap-2">
                            <Input
                                placeholder="Nom du service"
                                value={customServiceName}
                                onChange={(e) => setCustomServiceName(e.target.value)}
                                className="col-span-2 rounded-lg"
                            />
                            <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="Prix $"
                                value={customServicePrice}
                                onChange={(e) => setCustomServicePrice(e.target.value)}
                                className="rounded-lg"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Employé(s)</Label>
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
                                    label: `${indicator} ${e.user.name} ${!isAvail && reason ? `(${reason})` : ""}`,
                                }
                            })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit" className="w-full rounded-xl sm:w-auto">
                            Créer (statut : en attente)
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
