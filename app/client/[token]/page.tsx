
import { getClientByToken } from "@/lib/actions/client-portal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Car, Star, Clock, Info } from "lucide-react"
import { ClientBookingWizard } from "@/components/client/ClientBookingWizard"
import { getServices } from "@/lib/actions/services"
import { VehicleManager } from "@/components/client/VehicleManager"
import { ClientJobDetailsDialog } from "@/components/client/ClientJobDetailsDialog"

export default async function ClientPortalPage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = await params
    const client = await getClientByToken(token)
    const services = await getServices()

    if (!client) {
        return <div className="p-8 text-center text-destructive font-bold">Lien invalide ou expiré.</div>
    }

    // Filter jobs
    const now = new Date()
    const upcomingJobs = client.jobs.filter((j: any) => new Date(j.scheduledDate) > now && j.status !== 'CANCELLED')
    const pastJobs = client.jobs.filter((j: any) => new Date(j.scheduledDate) <= now || j.status === 'CANCELLED')
    const nextJob = upcomingJobs.length > 0 ? upcomingJobs[0] : null

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            {/* Hero Header - Premium Dark Theme */}
            <div className="bg-slate-900 text-white pb-32 pt-12 shadow-2xl relative overflow-hidden">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">
                                Espace Client
                            </h1>
                            <p className="text-slate-400 text-lg">Heureux de vous revoir, <span className="text-white font-semibold">{client.user.name}</span>.</p>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Loyalty Card - Gold Premium Look */}
                            <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 text-white rounded-xl p-4 shadow-lg border border-yellow-500/30 flex items-center gap-4 min-w-[200px]">
                                <div className="p-3 bg-black/20 rounded-full backdrop-blur-sm">
                                    <Star size={24} className="fill-yellow-200 text-yellow-200" />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold leading-none">{client.loyaltyPoints}</div>
                                    <div className="text-[10px] uppercase tracking-widest font-semibold opacity-90">Points Fidélité</div>
                                </div>
                            </div>

                            <div className="">
                                <ClientBookingWizard
                                    clientName={client.user.name || 'Client'}
                                    token={token}
                                    vehicles={client.vehicles}
                                    services={services}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 -mt-20 space-y-8 relative z-20">
                {/* Main Action Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column (2/3): Next Appointment & History */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Next Appointment Card - Featured */}
                        <Card className="shadow-xl border-none overflow-hidden bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100">
                            <div className="h-2 w-full bg-gradient-to-r from-blue-600 to-purple-600"></div>
                            <CardHeader className="pb-2">
                                <CardTitle className="flex items-center gap-2 text-xl font-bold uppercase tracking-wide text-muted-foreground">
                                    <Calendar className="text-primary mb-1" size={20} /> Prochain Rendez-vous
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="pt-4">
                                {nextJob ? (
                                    <div className="flex flex-col md:flex-row gap-8 items-start">
                                        {/* Date Block */}
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <div className="text-5xl font-extrabold capitalize text-slate-900 dark:text-white leading-tight">
                                                    {new Date(nextJob.scheduledDate).toLocaleDateString('fr-FR', { weekday: 'long' })}
                                                </div>
                                                <div className="text-3xl font-light text-slate-500">
                                                    {new Date(nextJob.scheduledDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                                                </div>
                                            </div>
                                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xl font-bold">
                                                <Clock size={24} />
                                                {new Date(nextJob.scheduledDate).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        {/* Line Separator (Desktop) */}
                                        <div className="hidden md:block w-px bg-slate-200 dark:bg-slate-700 self-stretch"></div>

                                        {/* Job Details */}
                                        <div className="flex-1 space-y-4 w-full">
                                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                                                <div className="bg-white dark:bg-slate-700 p-3 rounded-full shadow-sm">
                                                    <Car size={32} className="text-slate-700 dark:text-slate-300" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-lg">{nextJob.vehicle?.make} {nextJob.vehicle?.model}</div>
                                                    <div className="text-sm text-muted-foreground">{nextJob.vehicle?.type}</div>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <p className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Services prévus</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {nextJob.services.map((s: any) => (
                                                        <Badge key={s.service.id} variant="secondary" className="px-3 py-1.5 text-sm font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 shadow-sm">
                                                            {s.service.name}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-12 text-center space-y-6">
                                        <div className="bg-slate-100 dark:bg-slate-800 p-6 rounded-full">
                                            <Calendar size={48} className="text-slate-400" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="text-xl font-medium">Aucun rendez-vous planifié</h3>
                                            <p className="text-muted-foreground max-w-xs mx-auto">
                                                Réservez dès maintenant pour prendre soin de votre véhicule.
                                            </p>
                                        </div>
                                        <div className="pt-2">
                                            {/* Reuse wizard trigger styled differently? Or keep generic */}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* History Card */}
                        <Card className="shadow-lg border-none bg-white dark:bg-slate-900">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Info size={20} className="text-muted-foreground" /> Historique récent
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {pastJobs.length === 0 && (
                                        <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-slate-50 dark:bg-slate-950/50">
                                            Votre historique apparaitra ici une fois votre premier service terminé.
                                        </div>
                                    )}
                                    {/* Make history list instead of grid for better flow */}
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {pastJobs.map((job: any) => (
                                            <ClientJobDetailsDialog key={job.id} job={job} />
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Right Column (1/3): Vehicles & Info */}
                    <div className="space-y-8">
                        <div className="sticky top-8">
                            <VehicleManager token={token} vehicles={client.vehicles} />

                            {/* Contact / Info Card could go here */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
