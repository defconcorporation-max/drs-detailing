export const dynamic = "force-dynamic"

import { getDashboardStats } from "@/lib/actions/dashboard"
import { getPendingRequests } from "@/lib/actions/client-booking"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Users, Calendar, DollarSign, AlertTriangle, Briefcase, Car, Clock, TrendingUp, PiggyBank } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { BookingRequestModal } from "@/components/admin/BookingRequestModal"

export default async function AdminDashboard() {
    const stats = await getDashboardStats()
    const pendingRequests = await getPendingRequests()

    const formatMoney = (val: number) => new Intl.NumberFormat('fr-CA', { style: 'currency', currency: 'CAD' }).format(val)



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



            {/* Sections de Statistiques */}
            <div className="space-y-6">
                {/* Cette Semaine */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Cette Semaine
                        </h2>
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded text-muted-foreground uppercase font-medium">En cours</span>
                    </div>

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                        {/* CA Semaine */}
                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chiffre d'Affaires</CardTitle>
                                <div className="rounded-lg bg-muted/50 p-2"><DollarSign className="h-4 w-4 text-primary" /></div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black">{formatMoney(stats.week.revenue)}</div>
                                <p className="text-[10px] text-muted-foreground font-medium">Pour {stats.week.count} jobs ({stats.week.hours.toFixed(1)}h)</p>
                            </CardContent>
                        </Card>

                        {/* Coût Salaires */}
                        <Card className="hover:shadow-md transition-shadow">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Coût Salaires</CardTitle>
                                <div className="rounded-lg bg-muted/50 p-2"><Users className="h-4 w-4 text-primary" /></div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black">{formatMoney(stats.week.salary)}</div>
                                <div className="mt-1 space-y-1">
                                    {stats.week.employeeBreakdown?.map((emp: any) => (
                                        <div key={emp.name} className="flex justify-between text-[10px] text-muted-foreground">
                                            <span>{emp.name} ({emp.hours.toFixed(1)}h)</span>
                                            <span className="font-semibold">{formatMoney(emp.salary)}</span>
                                        </div>
                                    ))}
                                    {(!stats.week.employeeBreakdown || stats.week.employeeBreakdown.length === 0) && (
                                        <div className="text-[10px] text-muted-foreground">Aucun employé assigné</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Profit Semaine */}
                        <Card className="hover:shadow-md transition-shadow bg-primary/5 border-primary/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">Profit</CardTitle>
                                <div className="rounded-lg bg-primary/10 p-2"><PiggyBank className="h-4 w-4 text-primary" /></div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-primary">{formatMoney(stats.week.profit)}</div>
                                <div className="mt-2 space-y-0.5 text-[10px] text-muted-foreground">
                                    <div className="flex justify-between"><span>Revenus</span><span>{formatMoney(stats.week.revenue)}</span></div>
                                    <div className="flex justify-between"><span>Salaires</span><span className="text-red-500/70">-{formatMoney(stats.week.salary)}</span></div>
                                    <div className="flex justify-between"><span>Matériel ({stats.week.count}x{stats.avgVehicleCost}$)</span><span className="text-red-500/70">-{formatMoney(stats.week.totalVehicleCost)}</span></div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Profit Mois / Année */}
                        <Card className="hover:shadow-md transition-shadow flex flex-col justify-between">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Profit Global</CardTitle>
                                <div className="rounded-lg bg-muted/50 p-2"><TrendingUp className="h-4 w-4 text-primary" /></div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="text-sm text-muted-foreground font-medium">Ce mois-ci</div>
                                    <div className="text-lg font-black">{formatMoney(stats.month.profit)}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground font-medium">Cette année</div>
                                    <div className="text-lg font-black">{formatMoney(stats.year.profit)}</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Semaine Prochaine */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between border-b pb-2">
                        <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <span className="size-2 rounded-full bg-indigo-500"></span>
                            Semaine Prochaine
                        </h2>
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded uppercase font-medium">Prévisionnel</span>
                    </div>

                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
                        {/* CA Semaine Prochaine */}
                        <Card className="hover:shadow-md transition-shadow border-indigo-500/10 bg-indigo-500/[0.01]">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chiffre d'Affaires (Est.)</CardTitle>
                                <div className="rounded-lg bg-indigo-500/10 p-2"><DollarSign className="h-4 w-4 text-indigo-500" /></div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black">{formatMoney(stats.nextWeek.revenue)}</div>
                                <p className="text-[10px] text-muted-foreground font-medium">Estimé pour {stats.nextWeek.count} jobs ({stats.nextWeek.hours.toFixed(1)}h)</p>
                            </CardContent>
                        </Card>

                        {/* Coût Salaires Semaine Prochaine */}
                        <Card className="hover:shadow-md transition-shadow border-indigo-500/10 bg-indigo-500/[0.01]">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Coût Salaires (Est.)</CardTitle>
                                <div className="rounded-lg bg-indigo-500/10 p-2"><Users className="h-4 w-4 text-indigo-500" /></div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black">{formatMoney(stats.nextWeek.salary)}</div>
                                <div className="mt-1 space-y-1">
                                    {stats.nextWeek.employeeBreakdown?.map((emp: any) => (
                                        <div key={emp.name} className="flex justify-between text-[10px] text-muted-foreground">
                                            <span>{emp.name} ({emp.hours.toFixed(1)}h)</span>
                                            <span className="font-semibold">{formatMoney(emp.salary)}</span>
                                        </div>
                                    ))}
                                    {(!stats.nextWeek.employeeBreakdown || stats.nextWeek.employeeBreakdown.length === 0) && (
                                        <div className="text-[10px] text-muted-foreground">Aucun employé assigné</div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Profit Semaine Prochaine */}
                        <Card className="hover:shadow-md transition-shadow bg-indigo-500/[0.04] border-indigo-500/20">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-indigo-500">Profit (Est.)</CardTitle>
                                <div className="rounded-lg bg-indigo-500/10 p-2"><PiggyBank className="h-4 w-4 text-indigo-500" /></div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{formatMoney(stats.nextWeek.profit)}</div>
                                <div className="mt-2 space-y-0.5 text-[10px] text-muted-foreground">
                                    <div className="flex justify-between"><span>Revenus</span><span>{formatMoney(stats.nextWeek.revenue)}</span></div>
                                    <div className="flex justify-between"><span>Salaires</span><span className="text-red-500/70">-{formatMoney(stats.nextWeek.salary)}</span></div>
                                    <div className="flex justify-between"><span>Matériel ({stats.nextWeek.count}x{stats.avgVehicleCost}$)</span><span className="text-red-500/70">-{formatMoney(stats.nextWeek.totalVehicleCost)}</span></div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Activité & Volume */}
                        <Card className="hover:shadow-md transition-shadow border-indigo-500/10 bg-indigo-500/[0.01]">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Volume & Panier Moyen</CardTitle>
                                <div className="rounded-lg bg-indigo-500/10 p-2"><TrendingUp className="h-4 w-4 text-indigo-500" /></div>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div>
                                    <div className="text-sm text-muted-foreground font-medium">Panier Moyen Estimé</div>
                                    <div className="text-lg font-black">
                                        {stats.nextWeek.count > 0 ? formatMoney(stats.nextWeek.revenue / stats.nextWeek.count) : '0,00 $'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-muted-foreground font-medium">Heures Planifiées</div>
                                    <div className="text-lg font-black">{stats.nextWeek.hours.toFixed(1)}h</div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>

            {/* Jobs du Jour - En gros */}
            <Card className="border-primary/20 shadow-md">
                <CardHeader>
                    <CardTitle className="text-xl">Jobs du Jour</CardTitle>
                    <CardDescription>Cliquez sur un job pour l'ouvrir en détail</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {stats.jobsToday.length > 0 ? stats.jobsToday.map((job: any) => (
                            <Link key={job.id} href={`/admin/job/${job.id}`} className="block">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-primary/30 transition-all p-4 gap-4 cursor-pointer">
                                    <div className="flex items-start gap-4">
                                        <div className="rounded-xl bg-primary/10 p-3">
                                            <Car size={20} className="text-primary" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-lg">{job.client?.user?.name}</div>
                                            <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                                <Clock size={14}/> {new Date(job.scheduledDate).toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                                                <span className="opacity-50">|</span>
                                                {job.vehicle ? `${job.vehicle.make} ${job.vehicle.model}` : "Aucun véhicule"}
                                            </div>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {job.services?.map((s: any) => (
                                                    <Badge key={s.service.id} variant="secondary" className="text-[10px]">{s.service.name}</Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col sm:items-end gap-2">
                                        <Badge variant="outline" className="w-fit">{job.status}</Badge>
                                        <span className="text-xs text-primary font-semibold">Ouvrir →</span>
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            <div className="text-center text-muted-foreground py-8">Aucun job prévu aujourd'hui.</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Jobs de la Semaine - Plus petit */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Aperçu de la Semaine</CardTitle>
                    <CardDescription>Tous les jobs planifiés pour cette semaine</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {stats.jobsWeek.length > 0 ? stats.jobsWeek.map((job: any) => (
                            <Link key={job.id} href={`/admin/job/${job.id}`} className="block">
                                <div className="p-3 border rounded-xl bg-card flex flex-col justify-between hover:border-primary/30 hover:bg-muted/30 transition-colors cursor-pointer">
                                    <div>
                                        <div className="font-semibold text-sm truncate">{job.client?.user?.name}</div>
                                        <div className="text-[10px] text-muted-foreground mt-0.5">
                                            {new Date(job.scheduledDate).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} à {new Date(job.scheduledDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                    <div className="mt-2 flex justify-between items-center">
                                        <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{job.vehicle?.make || "Véhicule"}</span>
                                        <div className={`size-2 rounded-full ${job.status === 'COMPLETED' ? 'bg-green-500' : job.status === 'CANCELLED' ? 'bg-red-500' : 'bg-blue-500'}`} title={job.status} />
                                    </div>
                                </div>
                            </Link>
                        )) : (
                            <div className="col-span-full text-center text-muted-foreground py-4 text-sm">Rien de prévu cette semaine.</div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
