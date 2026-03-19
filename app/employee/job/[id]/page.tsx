
import prisma from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, User, Car, Calendar, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    const job = await prisma.job.findUnique({
        where: { id },
        include: {
            client: { include: { user: true, clientProfile: true } },
            vehicle: true,
            services: { include: { service: true } }
        }
    })

    if (!job) return <div>Job non trouvé</div>

    return (
        <div className="space-y-6 max-w-3xl mx-auto">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Détails du Job</h2>
                <Badge className="text-lg">{job.status}</Badge>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User size={20} />
                            Client
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="font-semibold text-lg">{job.client.user.name}</div>
                        <div className="text-muted-foreground">{job.client.user.email}</div>
                        <div className="text-muted-foreground">{job.client.user.phone}</div>
                        {job.client.clientProfile?.address && (
                            <div className="flex items-start gap-2 pt-2 text-sm">
                                <MapPin size={16} className="mt-1" />
                                <span>{job.client.clientProfile.address}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Car size={20} />
                            Véhicule
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="font-semibold text-lg">{job.vehicle?.make} {job.vehicle?.model}</div>
                        <div className="flex gap-2">
                            <Badge variant="secondary">{job.vehicle?.type}</Badge>
                            <Badge variant="outline">{job.vehicle?.year}</Badge>
                        </div>
                        <div className="text-sm">Couleur: {job.vehicle?.color}</div>
                        <div className="text-sm">Plaque: {job.vehicle?.licensePlate || "N/A"}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Services à réaliser</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {job.services.map((js) => (
                            <div key={js.serviceId} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                                <div>
                                    <div className="font-medium">{js.service.name}</div>
                                    <div className="text-sm text-muted-foreground">{js.service.description}</div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-muted-foreground">{js.service.durationMin} min</span>
                                    <Button size="sm" variant="outline" className="gap-2">
                                        <CheckCircle2 size={16} />
                                        Terminé
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
