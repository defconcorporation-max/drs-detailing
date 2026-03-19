
import { getClientDashboardData } from "@/lib/actions/portal"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Car, Star, TrendingUp } from "lucide-react"

export default async function ClientDashboard() {
    const data = await getClientDashboardData()

    if (!data) return <div>Erreur chargement profil client.</div>

    const { profile, recentJobs, vehicles } = data
    const nextJob = recentJobs.find((j: any) => j.status === 'PENDING' || j.status === 'CONFIRMED')

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Bonjour, Client !</h2>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Loyalty Card */}
                <Card className="bg-gradient-to-br from-green-500/20 to-green-900/20 border-green-500/50">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Mes Points Fidélité</CardTitle>
                        <Star className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">{profile.loyaltyPoints} PTS</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Équivalent à ${(profile.loyaltyPoints * 0.10).toFixed(2)} de rabais
                        </p>
                        <div className="mt-4 h-2 bg-secondary rounded-full overflow-hidden">
                            <div className="h-full bg-green-500 w-[45%]"></div>
                        </div>
                        <p className="text-[10px] text-right mt-1 text-muted-foreground">45% vers statut VIP</p>
                    </CardContent>
                </Card>

                {/* Next Appointment */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Prochain Rendez-vous</CardTitle>
                        <Calendar className="h-4 w-4 text-primary" />
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
                        <CardTitle className="text-sm font-medium">Mes Véhicules</CardTitle>
                        <Car className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            {vehicles.map((v: any) => (
                                <div key={v.id} className="text-sm flex justify-between items-center border-b last:border-0 pb-1 last:pb-0">
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
                    <CardTitle>Historique Récent</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {recentJobs.slice(0, 3).map((job: any) => (
                            <div key={job.id} className="flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="bg-secondary p-2 rounded-full">
                                        <Car size={16} />
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
