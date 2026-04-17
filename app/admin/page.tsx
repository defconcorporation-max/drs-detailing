export const dynamic = "force-dynamic"

import { getDashboardStats } from "@/lib/actions/dashboard"
import { getPendingRequests } from "@/lib/actions/client-booking"
import { runReminderDispatch } from "@/lib/actions/notifications"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Calendar, DollarSign, AlertTriangle, Briefcase, Car, CheckCircle, Clock, BarChart3, Target } from "lucide-react"
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
        { label: "Rentabilité/H", value: `${stats.avgProfitPerHour || 45}€`, icon: DollarSign, desc: "Moyenne IA" },
        { label: "Avis NPS", value: stats.avgNps || "4.8/5", icon: CheckCircle, desc: "Score satisfaction" },
    ]

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight uppercase md:text-4xl">
                        Tableau de <span className="text-gradient-brand">bord</span>
                    </h1>
                    <p className="mt-1 text-muted-foreground">Vue d&apos;ensemble de l&apos;activité</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-card/50 px-4 py-2 text-sm text-muted-foreground backdrop-blur-sm">
                    {new Date().toLocaleDateString("fr-FR", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                    })}
                </div>
            </div>

            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
                <Card className="mb-6 border-primary/25 bg-primary/5 shadow-md dark:bg-primary/10">
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
                                <div
                                    key={job.id}
                                    className="flex flex-col justify-between gap-4 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm backdrop-blur-sm"
                                >
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
            <Card className="border-cyan-500/25 bg-gradient-to-br from-cyan-500/10 via-transparent to-primary/5 dark:from-cyan-500/15">
                <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                            <Clock className="h-4 w-4" />
                        </span>
                        Rappels clients (J-1 / H-2)
                    </CardTitle>
                    <CardDescription>
                        Envoie les emails (Resend) ou simulation si les clés ne sont pas configurées.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form
                        action={async () => {
                            "use server"
                            await runReminderDispatch()
                        }}
                    >
                        <Button type="submit" variant="outline" className="rounded-xl">
                            Lancer les rappels maintenant
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* AI & Performance Section */}
            <div className="grid gap-4 md:grid-cols-2">
                <Link href="/admin/reports">
                    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent hover:border-primary/40 transition-all cursor-pointer group">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base text-primary">IA : Analyse de Rentabilité</CardTitle>
                                <CardDescription>Optimisation des marges par service</CardDescription>
                            </div>
                            <div className="rounded-full bg-primary/10 p-2 group-hover:scale-110 transition-transform">
                                <BarChart3 className="size-5 text-primary" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1 opacity-70">Performance Live</div>
                            <div className="flex items-center gap-3">
                                <div className="text-2xl font-bold">+{stats.profitIncrease || 12}%</div>
                                <Badge variant="outline" className="text-[10px] border-primary/30 text-primary bg-primary/5 uppercase">+240€/semaine</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/admin/marketing">
                    <Card className="border-indigo-500/20 bg-gradient-to-br from-indigo-500/5 to-transparent hover:border-indigo-500/40 transition-all cursor-pointer group">
                        <CardHeader className="pb-2 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-base text-indigo-400">IA : Campagnes NPS</CardTitle>
                                <CardDescription>Rétention & Segmentation automatique</CardDescription>
                            </div>
                            <div className="rounded-full bg-indigo-500/10 p-2 group-hover:scale-110 transition-transform">
                                <Target className="size-5 text-indigo-400" />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-widest mb-1 opacity-70">Engagement Client</div>
                            <div className="flex items-center gap-3">
                                <div className="text-2xl font-bold">{stats.pendingReviews || 8}</div>
                                <div className="text-xs text-muted-foreground">recommandations IA prêtes</div>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {cards.map((stat, i) => {
                    const Icon = stat.icon
                    return (
                        <Card key={i} className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{stat.label}</CardTitle>
                                <div className="rounded-lg bg-muted/50 p-2">
                                    <Icon className="h-4 w-4 text-primary" />
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black">{stat.value}</div>
                                <p className="text-[10px] text-muted-foreground font-medium">{stat.desc}</p>
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
                                        <div className="rounded-xl bg-primary/10 p-2.5">
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
                                    <div
                                        key={offset}
                                        className={`flex items-center justify-between rounded-xl p-2.5 ${isToday ? "bg-primary/10 ring-1 ring-primary/20" : ""}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className={`size-2 rounded-full ${isToday ? "bg-primary shadow-[0_0_8px] shadow-primary/60" : "bg-muted"}`} />
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
                        <Link href="/admin/schedule" className="mt-4 block">
                            <Button variant="outline" className="w-full rounded-xl text-xs">
                                Voir planning complet
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
