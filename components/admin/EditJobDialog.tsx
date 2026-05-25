"use client"

import { useState, useEffect, useMemo } from "react"
import { updateJob, deleteJob } from "@/lib/actions/jobs"
import { checkTeamAvailability } from "@/lib/actions/availability"
import { jobDurationMinutes, parseExtraIds } from "@/lib/job-metrics"
import { localDateKey, localTimeHM } from "@/lib/date-local"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Trash2, Loader2, Calendar as CalendarIcon, Save, Clock, MapPin, Store } from "lucide-react"
import { MultiSelect } from "@/components/ui/multi-select"
import { JobServiceExtrasPicker } from "@/components/admin/JobServiceExtrasPicker"

export function EditJobDialog({ job, clients, employees, services }: { job: any; clients: any[]; employees: any[]; services: any[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const initialDate = localDateKey(job.scheduledDate)
    const initialTime = localTimeHM(job.scheduledDate)
    const existingServiceIds = job.services.map((s: any) => s.serviceId)

    const [status, setStatus] = useState(job.status)
    const [editDate, setEditDate] = useState(initialDate)
    const [editTime, setEditTime] = useState(initialTime)
    const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>(existingServiceIds)
    const [serviceExtras, setServiceExtras] = useState<Record<string, string[]>>(() => {
        const m: Record<string, string[]> = {}
        for (const js of job.services || []) {
            m[js.serviceId] = parseExtraIds(js.selectedExtraIds)
        }
        return m
    })
    const [customServiceName, setCustomServiceName] = useState(job.customServiceName || "")
    const [customServicePrice, setCustomServicePrice] = useState(job.customServicePrice ? String(job.customServicePrice) : "")
    const [durationHours, setDurationHours] = useState(job.durationMin ? String(job.durationMin / 60) : "")
    const [isInShop, setIsInShop] = useState<boolean>(job.isInShop ?? false)

    useEffect(() => {
        if (!open) return
        setStatus(job.status)
        setEditDate(localDateKey(job.scheduledDate))
        setEditTime(localTimeHM(job.scheduledDate))
        setSelectedServiceIds(job.services.map((s: any) => s.serviceId))
        const m: Record<string, string[]> = {}
        for (const js of job.services || []) {
            m[js.serviceId] = parseExtraIds(js.selectedExtraIds)
        }
        setServiceExtras(m)
        setCustomServiceName(job.customServiceName || "")
        setCustomServicePrice(job.customServicePrice ? String(job.customServicePrice) : "")
        setDurationHours(job.durationMin ? String(job.durationMin / 60) : "")
        setIsInShop(job.isInShop ?? false)
    }, [open, job])

    useEffect(() => {
        setServiceExtras((prev) => {
            const next: Record<string, string[]> = { ...prev }
            for (const id of selectedServiceIds) {
                if (!(id in next)) next[id] = []
            }
            for (const k of Object.keys(next)) {
                if (!selectedServiceIds.includes(k)) delete next[k]
            }
            return next
        })
    }, [selectedServiceIds])

    const scheduledAtUtcMs = useMemo(() => {
        const t = new Date(`${editDate}T${editTime}:00`).getTime()
        return Number.isNaN(t) ? "" : String(t)
    }, [editDate, editTime])

    function toggleService(id: string) {
        setSelectedServiceIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-muted">
                    <Edit size={14} className="text-primary" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="font-display text-xl uppercase">Modifier le job</DialogTitle>
                </DialogHeader>

                <form
                    action={async (formData) => {
                        setLoading(true)
                        selectedServiceIds.forEach((id) => formData.append("serviceId", id))
                        formData.set("serviceExtras", JSON.stringify(serviceExtras))
                        if (isInShop) formData.set("isInShop", "on")
                        if (customServiceName.trim()) {
                            formData.set("customServiceName", customServiceName.trim())
                            if (customServicePrice) formData.set("customServicePrice", customServicePrice)
                        }
                        if (durationHours) {
                            const mins = Math.round(parseFloat(durationHours) * 60)
                            if (mins > 0) formData.set("durationMin", String(mins))
                        }
                        await updateJob(job.id, formData)
                        setLoading(false)
                        setOpen(false)
                    }}
                    className="space-y-6 py-2"
                >
                    <input type="hidden" name="scheduledAtUtcMs" value={scheduledAtUtcMs} />
                    <div className="flex flex-col gap-2 rounded-xl border border-border/50 bg-muted/20 p-3 text-sm">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <span className="font-semibold text-muted-foreground">Client :</span><br/>
                                {job.client?.user?.name || "—"}
                            </div>
                            <div>
                                <span className="font-semibold text-muted-foreground">Véhicule :</span><br/>
                                {job.vehicle ? `${job.vehicle.make} ${job.vehicle.model}` : "—"}
                            </div>
                        </div>
                        {job.client?.address && (
                            <div className="mt-1 border-t border-border/30 pt-2 flex items-center justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <span className="font-semibold text-muted-foreground text-[10px] uppercase">Adresse de prestation :</span>
                                    <p className="truncate text-xs">{job.client.address}</p>
                                </div>
                                <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.client.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-[10px] font-bold text-primary hover:bg-primary/20 transition-colors shrink-0"
                                >
                                    <MapPin size={12} />
                                    GOOGLE MAPS
                                </a>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 min-w-0">
                        <div className="min-w-0 space-y-2">
                            <Label>Date</Label>
                            <input type="hidden" name="date" value={editDate} />
                            <Input
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                required
                                className="rounded-xl"
                            />
                        </div>
                        <div className="min-w-0 space-y-2">
                            <Label>Heure</Label>
                            <input type="hidden" name="time" value={editTime} />
                            <Input
                                type="time"
                                value={editTime}
                                onChange={(e) => setEditTime(e.target.value)}
                                required
                                className="rounded-xl"
                            />
                        </div>
                        <div className="min-w-0 space-y-2">
                            <Label className="flex items-center gap-1.5">
                                <Clock size={14} className="text-muted-foreground" /> Durée (h)
                            </Label>
                            <Input
                                type="number"
                                step="0.5"
                                min="0.5"
                                max="12"
                                placeholder="Ex: 2.5"
                                value={durationHours}
                                onChange={(e) => setDurationHours(e.target.value)}
                                className="rounded-xl"
                            />
                        </div>
                        {/* Lieu de prestation */}
                        <div className="min-w-0 flex items-end">
                            <label className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/10 px-3 py-2.5 cursor-pointer hover:bg-muted/30 transition-colors w-full">
                                <Checkbox
                                    id="edit-isInShop"
                                    checked={isInShop}
                                    onCheckedChange={(c) => setIsInShop(c === true)}
                                />
                                <div className="flex items-center gap-1.5">
                                    <Store size={14} className={isInShop ? "text-primary" : "text-muted-foreground"} />
                                    <div>
                                        <div className="text-sm font-semibold">{isInShop ? "En shop" : "Mobile"}</div>
                                        <div className="text-[10px] text-muted-foreground">{isInShop ? "Client en boutique" : "Déplacement"}</div>
                                    </div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 min-w-0">
                        <div className="min-w-0 space-y-2 overflow-hidden">
                            <Label>Assigné à</Label>
                            <EditJobEmployeeSelect
                                job={job}
                                employees={employees}
                                services={services}
                                selectedServiceIds={selectedServiceIds}
                                serviceExtras={serviceExtras}
                                availabilityDate={editDate}
                                availabilityTime={editTime}
                            />
                        </div>
                        <div className="min-w-0 space-y-2">
                            <Label>Statut</Label>
                            <input type="hidden" name="status" value={status} />
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-full min-w-0 rounded-xl">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="REQUESTED">Demandé (client)</SelectItem>
                                    <SelectItem value="PENDING">En attente</SelectItem>
                                    <SelectItem value="CONFIRMED">Confirmé</SelectItem>
                                    <SelectItem value="SCHEDULED">Planifié</SelectItem>
                                    <SelectItem value="RESCHEDULE_REQUESTED">Replanif. demandée</SelectItem>
                                    <SelectItem value="IN_PROGRESS">En cours</SelectItem>
                                    <SelectItem value="COMPLETED">Terminé</SelectItem>
                                    <SelectItem value="CANCELLED">Annulé</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Services</Label>
                        <div className="grid max-h-44 grid-cols-2 gap-2 overflow-y-auto rounded-xl border border-border/60 p-3">
                            {services.map((service: any) => (
                                <div key={service.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`edit-srv-${service.id}`}
                                        checked={selectedServiceIds.includes(service.id)}
                                        onCheckedChange={() => toggleService(service.id)}
                                    />
                                    <label htmlFor={`edit-srv-${service.id}`} className="cursor-pointer text-sm">
                                        {service.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <JobServiceExtrasPicker
                        services={services}
                        selectedServiceIds={selectedServiceIds}
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
                        <Label>Notes</Label>
                        <Input name="notes" placeholder="Code porte, instructions…" defaultValue={job.notes || ""} className="rounded-xl" />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading} className="w-full gap-2 rounded-xl">
                            {loading ? <Loader2 className="size-4 animate-spin" /> : <Save size={16} />}
                            Sauvegarder les modifications
                        </Button>
                    </DialogFooter>
                </form>

                <div className="mt-6 border-t pt-4">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Zone de danger</p>
                    <DeleteJobButton id={job.id} />
                </div>
            </DialogContent>
        </Dialog>
    )
}

function EditJobEmployeeSelect({
    job,
    employees,
    services,
    selectedServiceIds,
    serviceExtras,
    availabilityDate,
    availabilityTime,
}: {
    job: any
    employees: any[]
    services: any[]
    selectedServiceIds: string[]
    serviceExtras: Record<string, string[]>
    availabilityDate: string
    availabilityTime: string
}) {
    const [availability, setAvailability] = useState<Record<string, { status: string; reason?: string }>>({})
    const initialIds = job.employees?.map((e: any) => e.id) || (job.employeeId ? [job.employeeId] : [])
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>(initialIds)

    const durationEstimate = useMemo(() => {
        const lines = selectedServiceIds
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
    }, [selectedServiceIds, services, serviceExtras])

    useEffect(() => {
        const check = async () => {
            if (!availabilityDate || !availabilityTime) return
            try {
                const res = await checkTeamAvailability(availabilityDate, availabilityTime, durationEstimate)
                setAvailability(res)
            } catch (e) {
                console.error(e)
            }
        }
        const t = setTimeout(check, 400)
        return () => clearTimeout(t)
    }, [availabilityDate, availabilityTime, durationEstimate])

    const sortedEmployees = [...employees].sort((a: any, b: any) => {
        const statusA = availability[a.id]?.status || "OFF"
        const statusB = availability[b.id]?.status || "OFF"
        const isAssignedA = selectedEmployees.includes(a.id)
        const isAssignedB = selectedEmployees.includes(b.id)
        if (isAssignedA && !isAssignedB) return -1
        if (!isAssignedA && isAssignedB) return 1
        if (statusA === "AVAILABLE" && statusB !== "AVAILABLE") return -1
        if (statusA !== "AVAILABLE" && statusB === "AVAILABLE") return 1
        return 0
    })

    return (
        <div className="min-w-0 max-w-full space-y-2">
            {selectedEmployees.map((id) => (
                <input key={id} type="hidden" name="employeeId" value={id} />
            ))}
            <MultiSelect
                selected={selectedEmployees}
                onChange={setSelectedEmployees}
                placeholder="Choisir employés…"
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
    )
}

function DeleteJobButton({ id }: { id: string }) {
    return (
        <form
            action={async () => {
                if (confirm("Supprimer ce job ?")) {
                    await deleteJob(id)
                }
            }}
        >
            <Button type="submit" variant="destructive" size="sm" className="gap-2 rounded-xl">
                <Trash2 size={16} /> Supprimer
            </Button>
        </form>
    )
}
