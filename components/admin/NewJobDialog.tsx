"use client"

import { useState, useEffect } from "react"
import { createJob } from "@/lib/actions/jobs"
import { checkTeamAvailability } from "@/lib/actions/availability"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Calendar as CalendarIcon, Loader2, CheckCircle2, XCircle, Clock } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { MultiSelect } from "@/components/ui/multi-select"
import { QuickClientDialog } from "./QuickClientDialog"

export function NewJobDialog({ clients, employees, services, prefillDate, prefillTime, trigger }: any) {
    const [open, setOpen] = useState(false)
    const [selectedClient, setSelectedClient] = useState("")
    const [selectedServices, setSelectedServices] = useState<string[]>([])
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
    const [isNewVehicle, setIsNewVehicle] = useState(false)

    // State for Availability Check
    const [date, setDate] = useState(prefillDate || "")
    const [time, setTime] = useState(prefillTime || "09:00")
    const [checking, setChecking] = useState(false)
    const [availability, setAvailability] = useState<Record<string, { status: string, reason?: string }>>({})

    // Filter vehicles based on selected client
    const client = clients.find((c: any) => c.id === selectedClient)
    const vehicles = client?.vehicles || []

    const handleServiceToggle = (id: string) => {
        setSelectedServices(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )
    }

    // Effect: Check availability when Date, Time, or Services change
    useEffect(() => {
        const check = async () => {
            if (!date || !time) return

            setChecking(true)
            // Calculate total duration
            let totalDuration = 0
            selectedServices.forEach(sid => {
                const s = services.find((serv: any) => serv.id === sid)
                if (s) totalDuration += (s.durationMin || 60)
            })
            if (totalDuration === 0) totalDuration = 60 // Default 1h if no services

            try {
                const res = await checkTeamAvailability(date, time, totalDuration)
                setAvailability(res)
            } catch (err) {
                console.error(err)
            } finally {
                setChecking(false)
            }
        }

        // Debounce slightly
        const timer = setTimeout(check, 500)
        return () => clearTimeout(timer)
    }, [date, time, selectedServices, services])

    const handleSubmit = async (formData: FormData) => {
        selectedServices.forEach(id => formData.append('serviceId', id))
        const res = await createJob(formData)
        if (res.success) {
            setOpen(false)
            setSelectedClient("")
            setSelectedServices([])
            setSelectedEmployees([])
        } else {
            alert(res.error)
        }
    }

    // Helper to sort employees: Available first, then others
    const sortedEmployees = [...employees].sort((a, b) => {
        const statusA = availability[a.id]?.status || 'OFF'
        const statusB = availability[b.id]?.status || 'OFF'
        if (statusA === 'AVAILABLE' && statusB !== 'AVAILABLE') return -1
        if (statusA !== 'AVAILABLE' && statusB === 'AVAILABLE') return 1
        return 0
    })

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button className="gap-2">
                        <Plus size={16} /> Nouveau Job
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Planifier un Rendez-vous</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                                name="date"
                                type="date"
                                defaultValue={prefillDate}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Heure</Label>
                            <Input
                                name="time"
                                type="time"
                                defaultValue={prefillTime || "09:00"}
                                onChange={(e) => setTime(e.target.value)}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Client</Label>
                        <div className="flex gap-2">
                            <Select name="clientId" onValueChange={setSelectedClient} required>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Sélectionner un client" />
                                </SelectTrigger>
                                <SelectContent>
                                    {clients.map((c: any) => (
                                        <SelectItem key={c.id} value={c.id}>{c.user.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <QuickClientDialog />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Véhicule</Label>
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="newVehicle"
                                    name="newVehicle"
                                    onCheckedChange={(c) => setIsNewVehicle(c === true)}
                                />
                                <Label htmlFor="newVehicle" className="text-xs font-normal">Ajouter un nouveau ?</Label>
                            </div>
                        </div>

                        {!isNewVehicle ? (
                            <Select name="vehicleId" disabled={!selectedClient} required={false}>
                                <SelectTrigger>
                                    <SelectValue placeholder={!selectedClient ? "Choisir client d'abord" : (vehicles.length > 0 ? "Sélectionner véhicule (Optionnel)" : "Aucun véhicule existant")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {vehicles.map((v: any) => (
                                        <SelectItem key={v.id} value={v.id}>{v.brand} {v.model} ({v.year})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <div className="grid grid-cols-2 gap-2 border p-2 rounded bg-slate-50 dark:bg-slate-900/50">
                                <Select name="newVehicleType" required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Type *" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SEDAN">Berline (Sedan)</SelectItem>
                                        <SelectItem value="SUV">VUS (SUV)</SelectItem>
                                        <SelectItem value="PICKUP">Pickup</SelectItem>
                                        <SelectItem value="TRUCK">Camion</SelectItem>
                                        <SelectItem value="OTHER">Autre</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Input name="newVehicleYear" placeholder="Année" type="number" />
                                <Input name="newVehicleMake" placeholder="Marque" className="col-span-2" />
                                <Input name="newVehicleModel" placeholder="Modèle" className="col-span-2" />
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Services</Label>
                        <div className="border rounded-md p-2 h-32 overflow-y-auto space-y-2">
                            {services.map((s: any) => (
                                <div key={s.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={s.id}
                                        checked={selectedServices.includes(s.id)}
                                        onCheckedChange={() => handleServiceToggle(s.id)}
                                    />
                                    <label htmlFor={s.id} className="text-sm cursor-pointer grid">
                                        <span className="font-medium">{s.name}</span>
                                        <span className="text-xs text-muted-foreground">{s.durationMin}min - ${s.basePrice}</span>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label>Employé(s) Assigné(s)</Label>
                            {checking && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
                        </div>
                        {/* Hidden inputs for form submission */}
                        {selectedEmployees.map(id => (
                            <input key={id} type="hidden" name="employeeId" value={id} />
                        ))}

                        <MultiSelect
                            selected={selectedEmployees}
                            onChange={setSelectedEmployees}
                            placeholder="Sélectionner employés..."
                            options={sortedEmployees.map((e: any) => {
                                const statusData = availability[e.id]
                                const status = statusData?.status || 'AVAILABLE'
                                const reason = statusData?.reason
                                const isAvail = status === 'AVAILABLE'
                                // Visual indicator in label
                                const indicator = isAvail ? "🟢" : (status === 'BUSY' ? "🔴" : "⚪")

                                return {
                                    value: e.id,
                                    label: `${indicator} ${e.user.name} ${!isAvail && reason ? `(${reason})` : ''}`
                                }
                            })}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="submit">Planifier</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
