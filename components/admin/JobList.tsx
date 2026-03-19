"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { EditJobDialog } from "./EditJobDialog"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export function JobList({ jobs, clients, employees, services }: { jobs: any[], clients: any, employees: any, services: any }) {

    if (!jobs || jobs.length === 0) {
        return <div className="text-center py-10 text-muted-foreground">Aucun job planifié.</div>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date & Heure</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Véhicule</TableHead>
                        <TableHead>Services</TableHead>
                        <TableHead>Employé</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead colSpan={2} className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {jobs.map((job) => (
                        <TableRow key={job.id}>
                            <TableCell className="font-medium">
                                <div className="flex flex-col">
                                    <span>{format(new Date(job.scheduledDate), 'dd MMM yyyy', { locale: fr })}</span>
                                    <span className="text-xs text-muted-foreground">{format(new Date(job.scheduledDate), 'HH:mm')}</span>
                                </div>
                            </TableCell>
                            <TableCell>{job.client?.user?.name}</TableCell>
                            <TableCell>
                                {job.vehicle ? `${job.vehicle.make} ${job.vehicle.model}` : '-'}
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {job.services.map((js: any) => (
                                        <Badge key={js.serviceId} variant="outline" className="text-[10px] px-1 py-0 h-5">
                                            {js.service.name}
                                        </Badge>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell>
                                {job.employee ? job.employee.user.name : <span className="text-muted-foreground italic">Non assigné</span>}
                            </TableCell>
                            <TableCell>
                                <StatusBadge status={job.status} />
                            </TableCell>
                            <TableCell className="text-right">
                                <EditJobDialog job={job} clients={clients} employees={employees} services={services} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const map: any = {
        'PENDING': 'bg-yellow-100 text-yellow-800',
        'CONFIRMED': 'bg-blue-100 text-blue-800',
        'IN_PROGRESS': 'bg-purple-100 text-purple-800',
        'COMPLETED': 'bg-green-100 text-green-800',
        'CANCELLED': 'bg-red-100 text-red-800'
    }
    const label: any = {
        'PENDING': 'En Attente',
        'CONFIRMED': 'Confirmé',
        'IN_PROGRESS': 'En Cours',
        'COMPLETED': 'Terminé',
        'CANCELLED': 'Annulé'
    }
    return (
        <Badge variant="secondary" className={map[status] || ""}>
            {label[status] || status}
        </Badge>
    )
}
