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
import { Edit, Trash2, Loader2, Calendar as CalendarIcon, Save } from "lucide-react"
import { MultiSelect } from "@/components/ui/multi-select"
import { JobServiceExtrasPicker } from "@/components/admin/JobServiceExtrasPicker"

export function EditJobDialog({ job, clients, employees, services }: { job: any; clients: any[]; employees: any[]; services: any[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const initialDate = new Date(job.scheduledDate).toISOString().split("T")[0]
    const initialTime = new Date(job.scheduledDate).toTimeString().substring(0, 5)
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
                        await updateJob(job.id, formData)
                        setLoading(false)
                        setOpen(false)
                    }}
                    className="space-y-6 py-2"
                >
                    <div className="grid grid-cols-2 gap-2 rounded-xl border border-border/50 bg-muted/20 p-3 text-sm">
                        <div>
                            <span className="font-semibold">Client :</span> {job.client?.user?.name || "—"}
                        </div>
                        <div>
                            <span className="font-semibold">Véhicule :</span>{" "}
                            {job.vehicle ? `${job.vehicle.make} ${job.vehicle.model}` : "—"}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
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
                        <div className="space-y-2">
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Assigné à</Label>
                            <EditJobEmployeeSelect
                                job={job}
                                employees={employees}
                                services={services}
                                selectedServiceIds={selectedServiceIds}
                                serviceExtras={serviceExtras}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Statut</Label>
                            <input type="hidden" name="status" value={status} />
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="rounded-xl">
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

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Input name="notes" placeholder="Code porte, instructions…" defaultValue={job.notes || ""} className="rounded-xl" />
                    </div>

                    <DialogFooter className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                        <DeleteJobButton id={job.id} />
                        <Button type="submit" disabled={loading} className="gap-2 rounded-xl">
                            {loading ? <Loader2 className="size-4 animate-spin" /> : <Save size={16} />}
                            Sauvegarder
                        </Button>
                    </DialogFooter>
                </form>
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
}: {
    job: any
    employees: any[]
    services: any[]
    selectedServiceIds: string[]
    serviceExtras: Record<string, string[]>
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
            const dateStr = new Date(job.scheduledDate).toISOString().split("T")[0]
            const timeStr = new Date(job.scheduledDate).toTimeString().substring(0, 5)
            try {
                const res = await checkTeamAvailability(dateStr, timeStr, durationEstimate)
                setAvailability(res)
            } catch (e) {
                console.error(e)
            }
        }
        check()
    }, [job.scheduledDate, durationEstimate])

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
        <div className="space-y-2">
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
