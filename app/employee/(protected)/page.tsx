
import { getJobs } from "@/lib/actions/jobs"
import prisma from "@/lib/db"
import { cookies } from "next/headers"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Car, TrendingUp } from "lucide-react"
import { startOfYear, endOfYear, startOfWeek, endOfWeek, isWithinInterval } from "date-fns"
import { filterJobsForPortal, isAdminEmployeePortalView } from "@/lib/employee-portal"

export default async function EmployeeDashboard() {
    const cookieStore = await cookies()
    const currentUserId = cookieStore.get("drs_employee_session")?.value

    if (!currentUserId) return <div>Non connecté</div>

    const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        include: { employeeProfile: true },
    })

    if (!user) return <div>Non connecté</div>

    const adminView = isAdminEmployeePortalView(user.role)
    if (!adminView && !user.employeeProfile) return <div>Profil employé introuvable</div>

    const allJobs = await getJobs()
    const myJobs = filterJobsForPortal(allJobs, currentUserId, { isAdminView: adminView })

    // KPI Calculations
    const now = new Date()

    // 1. Cars this Year
    const yearStart = startOfYear(now)
    const yearEnd = endOfYear(now)
    const jobsThisYear = myJobs.filter((j: any) => isWithinInterval(new Date(j.scheduledDate), { start: yearStart, end: yearEnd }))

    // 2. Cars this Week
    // startOfWeek defaults to Sunday usually, use option { weekStartsOn: 1 } for Monday
    const weekStart = startOfWeek(now, { weekStartsOn: 1 })
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 })
    const jobsThisWeek = myJobs.filter((j: any) => isWithinInterval(new Date(j.scheduledDate), { start: weekStart, end: weekEnd }))

    // Upcoming List (Sort by date)
    const upcomingJobs = myJobs
        .filter((j: any) => new Date(j.scheduledDate) >= now || j.status === 'IN_PROGRESS') // Include active jobs
        .sort((a: any, b: any) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())
        .slice(0, 10) // Limit to 10

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord</h2>
                {adminView && (
                    <p className="text-sm text-muted-foreground rounded-xl border border-primary/20 bg-primary/5 px-3 py-2">
                        Connexion <strong>administrateur</strong> : vous voyez tous les rendez-vous de l&apos;équipe (vue lecture).
                    </p>
                )}
            </div>

            {/* KPI Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Véhicules (Cette Semaine)</CardTitle>
                        <Car className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{jobsThisWeek.length}</div>
                        <p className="text-xs text-muted-foreground">Planning de la semaine en cours</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total (Année)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{jobsThisYear.length}</div>
                        <p className="text-xs text-muted-foreground">Véhicules pris en charge cette année</p>
                    </CardContent>
                </Card>
            </div>

            {/* Task List Section */}
            <div className="space-y-4">
                <h3 className="text-xl font-bold flex items-center gap-2">
                    <Calendar className="h-5 w-5" /> Prochaines Tâches
                </h3>

                {upcomingJobs.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                        Aucune tâche à venir pour le moment.
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
                        {upcomingJobs.map((job: any) => (
                            <Card key={job.id} className="border-l-4 border-l-primary hover:bg-muted/5 transition-colors">
                                <CardHeader className="pb-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{job.client.user.name}</CardTitle>
                                            <CardDescription className="font-medium text-foreground/80">
                                                {job.vehicle?.make} {job.vehicle?.model}
                                            </CardDescription>
                                        </div>
                                        <Badge variant={job.status === 'IN_PROGRESS' ? 'default' : 'secondary'}>
                                            {job.status}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={14} className="text-muted-foreground" />
                                            <span>{new Date(job.scheduledDate).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock size={14} className="text-muted-foreground" />
                                            <span>{new Date(job.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                    </div>

                                    {job.client.address && (
                                        <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded">
                                            <MapPin size={14} className="text-muted-foreground shrink-0" />
                                            <span className="truncate">{job.client.address}</span>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <div className="flex flex-wrap gap-1">
                                            {job.services.map((js: any) => (
                                                <Badge key={js.serviceId} variant="outline" className="text-xs">
                                                    {js.service.name}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
