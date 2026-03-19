"use client"

import { useState, useEffect } from "react"
import { updateJob, deleteJob } from "@/lib/actions/jobs"
import { checkTeamAvailability } from "@/lib/actions/availability"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Edit, Trash2, Loader2, Calendar as CalendarIcon, Save } from "lucide-react"
import { MultiSelect } from "@/components/ui/multi-select"

// Define props to include everything needed for editing
export function EditJobDialog({ job, clients, employees, services }: { job: any, clients: any[], employees: any[], services: any[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    // Initial State extraction
    const initialDate = new Date(job.scheduledDate).toISOString().split('T')[0]
    const initialTime = new Date(job.scheduledDate).toTimeString().substring(0, 5)
    // Get array of existing service IDs
    const existingServiceIds = job.services.map((s: any) => s.serviceId)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-neutral-200 dark:hover:bg-neutral-800">
                    <Edit size={14} className="text-blue-600" />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Modifier Job</DialogTitle>
                </DialogHeader>

                <form action={async (formData) => {
                    setLoading(true)
                    await updateJob(job.id, formData)
                    setLoading(false)
                    setOpen(false)
                }} className="space-y-6 py-4">

                    {/* Read-only Client/Vehicle Info (can make editable if needed, but usually fixed) */}
                    {/* Read-only Client/Vehicle Info */}
                    <div className="p-3 bg-muted rounded-lg text-sm grid grid-cols-2 gap-2 text-foreground">
                        <div>
                            <span className="font-bold">Client:</span> {job.client?.user?.name || 'N/A'}
                        </div>
                        <div>
                            <span className="font-bold">Véhicule:</span> {job.vehicle?.make} {job.vehicle?.model}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input type="date" name="date" defaultValue={initialDate} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Heure</Label>
                            <Input type="time" name="time" defaultValue={initialTime} required />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Assigné à</Label>
                            {/* We need local state for Availability in Edit too */}
                            <EditJobEmployeeSelect
                                job={job}
                                employees={employees}
                                services={services}
                                existingServiceIds={existingServiceIds} // Pass initial services
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Statut</Label>
                            <Select name="status" defaultValue={job.status}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PENDING">En Attente</SelectItem>
                                    <SelectItem value="CONFIRMED">Confirmé</SelectItem>
                                    <SelectItem value="IN_PROGRESS">En Cours</SelectItem>
                                    <SelectItem value="COMPLETED">Terminé</SelectItem>
                                    <SelectItem value="CANCELLED">Annulé</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Services</Label>
                        <div className="grid grid-cols-2 gap-2 border p-3 rounded-md max-h-40 overflow-y-auto">
                            {services.map((service: any) => (
                                <div key={service.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        name="serviceId"
                                        value={service.id}
                                        defaultChecked={existingServiceIds.includes(service.id)}
                                        id={`edit-srv-${service.id}`}
                                    />
                                    <label htmlFor={`edit-srv-${service.id}`} className="text-sm cursor-pointer block w-full">
                                        {service.name}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <Input name="notes" placeholder="Code porte, instructions..." defaultValue={job.notes || ""} />
                    </div>

                    <DialogFooter className="flex justify-between sm:justify-between">
                        {/* We put delete button here too */}
                        <DeleteJobButton id={job.id} />

                        <Button type="submit" disabled={loading} className="gap-2">
                            {loading ? <Loader2 className="animate-spin" /> : <Save size={16} />}
                            Sauvegarder
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}


function EditJobEmployeeSelect({ job, employees, services, existingServiceIds }: any) {
    const [availability, setAvailability] = useState<Record<string, { status: string, reason?: string }>>({})
    // Initialize with existing employees if available, or fallback to legacy employeeId
    const initialIds = job.employees?.map((e: any) => e.id) || (job.employeeId ? [job.employeeId] : [])
    const [selectedEmployees, setSelectedEmployees] = useState<string[]>(initialIds)

    useEffect(() => {
        const check = async () => {
            let totalDuration = 0
            existingServiceIds.forEach((sid: string) => {
                const s = services.find((serv: any) => serv.id === sid)
                if (s) totalDuration += (s.durationMin || 60)
            })
            if (totalDuration === 0) totalDuration = 60

            const dateStr = new Date(job.scheduledDate).toISOString().split('T')[0]
            const timeStr = new Date(job.scheduledDate).toTimeString().substring(0, 5)

            try {
                const res = await checkTeamAvailability(dateStr, timeStr, totalDuration)
                setAvailability(res)
            } catch (e) {
                console.error(e)
            }
        }
        check()
    }, [])

    const sortedEmployees = [...employees].sort((a: any, b: any) => {
        const statusA = availability[a.id]?.status || 'OFF'
        const statusB = availability[b.id]?.status || 'OFF'

        // Prioritize: Assigned > Available > Others
        const isAssignedA = selectedEmployees.includes(a.id)
        const isAssignedB = selectedEmployees.includes(b.id)
        if (isAssignedA && !isAssignedB) return -1
        if (!isAssignedA && isAssignedB) return 1

        if (statusA === 'AVAILABLE' && statusB !== 'AVAILABLE') return -1
        if (statusA !== 'AVAILABLE' && statusB === 'AVAILABLE') return 1
        return 0
    })

    return (
        <div className="space-y-2">
            {/* Hidden inputs to submit array */}
            {selectedEmployees.map(id => (
                <input key={id} type="hidden" name="employeeId" value={id} />
            ))}

            <MultiSelect
                selected={selectedEmployees}
                onChange={setSelectedEmployees}
                placeholder="Choisir employés..."
                options={sortedEmployees.map((e: any) => {
                    const statusData = availability[e.id]
                    const status = statusData?.status || 'AVAILABLE'
                    const reason = statusData?.reason
                    const isAvail = status === 'AVAILABLE'

                    const indicator = isAvail ? "🟢" : (status === 'BUSY' ? "🔴" : "⚪")

                    return {
                        value: e.id,
                        label: `${indicator} ${e.user.name} ${!isAvail && reason ? `(${reason})` : ''}`
                    }
                })}
            />
        </div>
    )
}

function DeleteJobButton({ id }: { id: string }) {
    return (
        <form action={async () => {
            if (confirm("Êtes-vous sûr de vouloir supprimer ce job ?")) {
                await deleteJob(id)
            }
        }}>
            <Button type="submit" variant="destructive" size="sm" className="gap-2">
                <Trash2 size={16} /> Supprimer
            </Button>
        </form>
    )
}
