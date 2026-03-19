
import { getClientDashboardData } from "@/lib/actions/portal"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Car, Star } from "lucide-react"

export default async function ClientDashboard() {
    const data = await getClientDashboardData()

    if (!data) return <div>Erreur chargement profil client.</div>

    const { profile, recentJobs, vehicles } = data
    const nextJob = recentJobs.find((j: any) => j.status === 'PENDING' || j.status === 'CONFIRMED')

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                    Bonjour{profile.user?.name ? `, ${profile.user.name}` : ""}
                </h1>
                <p className="mt-1 text-muted-foreground">Votre espace personnel DRS Detailing</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Loyalty Card */}
                <Card className="border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-transparent to-primary/5">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Points fidélité</CardTitle>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                            <Star className="h-4 w-4" />
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                            {profile.loyaltyPoints} <span className="text-lg font-semibold">pts</span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Équivalent à {(profile.loyaltyPoints * 0.1).toFixed(2)} $ de rabais
                        </p>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
                            <div className="h-full w-[45%] rounded-full bg-gradient-to-r from-emerald-500 to-primary" />
                        </div>
                        <p className="mt-1 text-right text-[10px] text-muted-foreground">45 % vers statut VIP</p>
                    </CardContent>
                </Card>

                {/* Next Appointment */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Prochain rendez-vous</CardTitle>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <Calendar className="h-4 w-4" />
                        </span>
                    </CardHeader>
                    <CardContent>
                        {nextJob ? (
                            <div className="space-y-2">
                                <div className="text-lg font-bold">
                                    {new Date(nextJob.scheduledDate).toLocaleDateString()}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {new Date(nextJob.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <Badge>{nextJob.status}</Badge>
                                <p className="text-xs pt-2">
                                    {nextJob.vehicle?.make ?? "-"} {nextJob.vehicle?.model ?? ""}
                                </p>
                            </div>
                        ) : (
                            <div className="py-4 text-center text-muted-foreground text-sm">
                                Aucun RDV à venir
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Vehicles */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Mes véhicules</CardTitle>
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
                            <Car className="h-4 w-4" />
                        </span>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {vehicles.map((v: any) => (
                                <div
                                    key={v.id}
                                    className="flex items-center justify-between border-b border-border/50 py-2 text-sm last:border-0 last:pb-0"
                                >
                                    <span>{v.make} {v.model}</span>
                                    <span className="text-xs text-muted-foreground">{v.year}</span>
                                </div>
                            ))}
                        </div>
                        <Button variant="link" className="px-0 h-auto text-xs mt-2">
                            + Ajouter véhicule
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Recent History */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Historique récent</CardTitle>
                    <CardDescription>Vos dernières interventions</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {recentJobs.slice(0, 3).map((job: any) => (
                            <div
                                key={job.id}
                                className="flex items-center justify-between rounded-xl border border-border/40 bg-muted/20 px-3 py-3"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="rounded-xl bg-primary/10 p-2.5">
                                        <Car className="size-4 text-primary" />
                                    </div>
                                    <div>
                                        <div className="font-medium">{job.services.map((s: any) => s.service.name).join(", ")}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {new Date(job.scheduledDate).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <Badge variant="outline">{job.status}</Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
