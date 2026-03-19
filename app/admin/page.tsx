
import { getDashboardStats } from "@/lib/actions/dashboard"
import { getPendingRequests } from "@/lib/actions/client-booking"
import { runReminderDispatch } from "@/lib/actions/notifications"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Calendar, DollarSign, AlertTriangle, Briefcase, Car, CheckCircle, Clock } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookingRequestModal } from "@/components/admin/BookingRequestModal"

export default async function AdminDashboard() {
    const stats = await getDashboardStats()
    const pendingRequests = await getPendingRequests()

    const cards = [
        { label: "Clients Total", value: stats.clientsCount, icon: Users, desc: "Total enregistré" },
        { label: "Jobs (Semaine)", value: stats.jobsThisWeek, icon: Briefcase, desc: "Cette semaine" },
        { label: "Jobs (Mois)", value: stats.jobsThisMonth, icon: Calendar, desc: "Ce mois" },
        { label: "Jobs (Année)", value: stats.jobsThisYear, icon: Car, desc: "Cette année" },
    ]

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Tableau de Bord</h2>
                <div className="text-sm text-muted-foreground">
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
                <Card className="border-primary/20 bg-primary/5 mb-6 shadow-sm">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2 text-primary">
                            <Briefcase className="h-5 w-5" />
                            Demandes de Rendez-vous ({pendingRequests.length})
                        </CardTitle>
                        <CardDescription className="text-muted-foreground">
                            Clients en attente de confirmation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {pendingRequests.map((job) => (
                                <div key={job.id} className="bg-card p-4 rounded-lg border shadow-sm flex flex-col justify-between gap-4">
                                    <div>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-lg">{job.client.user.name}</div>
                                            <Badge variant="outline" className="bg-background">
                                                {new Date(job.scheduledDate).toLocaleDateString()}
                                            </Badge>
                                        </div>
                                        <div className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                                            <Clock size={14} />
                                            {new Date(job.scheduledDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                        {job.vehicle && (
                                            <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium bg-secondary px-2 py-1 rounded inline-block mb-2">
                                                {job.vehicle.make} {job.vehicle.model}
                                            </div>
                                        )}
                                    </div>

                                    <BookingRequestModal job={job} />
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Alerts Section - Clickable */}
            {stats.lowStockCount > 0 && (
                <Link href="/admin/inventory">
                    <Card className="border-destructive/50 bg-destructive/10 hover:bg-destructive/20 transition-colors cursor-pointer mb-6">
                        <CardHeader className="py-3 flex flex-row items-center gap-4">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            <div>
                                <CardTitle className="text-base text-destructive">Attention : Stock Bas</CardTitle>
                                <CardDescription className="text-destructive/80">
                                    {stats.lowStockCount} articles nécessitent une attention immédiate. Cliquez pour voir.
                                </CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </Link>
            )}

            {/* Reminders Quick Action */}
            <Card className="border-blue-200 bg-blue-50/40 dark:bg-blue-950/20">
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" />
                        Rappels clients (J-1 / H-2)
                    </CardTitle>
                    <CardDescription>
                        Déclenche manuellement l&apos;envoi des rappels en attente (version simulation).
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        action={async () => {
                            "use server"
                            await runReminderDispatch()
                        }}
                    >
                        <Button type="submit" variant="outline">
                            Lancer les rappels maintenant
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {cards.map((stat, i) => {
                    const Icon = stat.icon
                    return (
                        <Card key={i}>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                                <Icon className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{stat.value}</div>
                                <p className="text-xs text-muted-foreground">{stat.desc}</p>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                {/* Recent Jobs */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Jobs Récents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {stats.recentActivity.map((job: any) => (
                                <div key={job.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <Car size={16} className="text-primary" />
                                        </div>
                                        <div>
                                            <div className="font-medium text-sm">{job.client.user.name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {job.vehicle?.make} {job.vehicle?.model}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold">
                                            {new Date(job.scheduledDate).toLocaleDateString()}
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">{job.status}</Badge>
                                    </div>
                                </div>
                            ))}
                            {stats.recentActivity.length === 0 && (
                                <div className="text-center text-muted-foreground py-4">Aucune activité récente.</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Calendar Widget Week */}
                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Semaine en cours</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Simple list of days for now, easier to read than small calendar */}
                        <div className="space-y-2">
                            {[0, 1, 2, 3, 4, 5, 6].map(offset => {
                                const d = new Date()
                                const day = new Date(d.setDate(d.getDate() - d.getDay() + offset))
                                const isToday = new Date().toDateString() === day.toDateString()

                                return (
                                    <div key={offset} className={`flex items-center justify-between p-2 rounded-md ${isToday ? 'bg-secondary' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-primary' : 'bg-muted'}`}></div>
                                            <span className="text-sm font-medium capitalize">
                                                {day.toLocaleDateString('fr-FR', { weekday: 'short' })}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                                {day.getDate()}
                                            </span>
                                        </div>
                                        {/* Placeholder for dots/count of jobs if we had that detail in this view */}
                                    </div>
                                )
                            })}
                        </div>
                        <Link href="/admin/schedule" className="block mt-4">
                            <Button variant="outline" className="w-full text-xs">Voir Planning Complet</Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
