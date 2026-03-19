
import { getClientDashboardData } from "@/lib/actions/portal"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, Car, Download } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function HistoryPage() {
    const data = await getClientDashboardData()
    if (!data) return <div>Erreur</div>

    const { recentJobs } = data
    const completedJobs = recentJobs.filter((j: any) => j.status === 'COMPLETED' || j.status === 'CONFIRMED') // Including confirmed for demo if no completed

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Historique des Services</h2>

            <div className="space-y-4">
                {completedJobs.map((job: any) => (
                    <Card key={job.id}>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>{new Date(job.scheduledDate).toLocaleDateString()}</CardTitle>
                                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                        <Car size={14} />
                                        {job.vehicle.make} {job.vehicle.model}
                                    </div>
                                </div>
                                <Badge variant="outline">{job.status}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="font-semibold text-sm">Services effectués :</div>
                                <ul className="list-disc list-inside text-sm text-muted-foreground">
                                    {job.services.map((js: any) => (
                                        <li key={js.serviceId}>{js.service.name}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className="pt-4 flex justify-end">
                                <Button variant="ghost" size="sm" className="gap-2">
                                    <Download size={14} />
                                    Facture
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {completedJobs.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                        Aucun historique de service disponible.
                    </div>
                )}
            </div>
        </div>
    )
}
