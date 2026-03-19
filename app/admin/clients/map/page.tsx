import { getClients } from "@/lib/actions/clients"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function MapPage() {
    const clients = await getClients()
    // filter clients with address
    const clientsWithAddress = clients.filter((c: any) => c.clientProfile?.address)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Carte des Clients</h2>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="md:col-span-1">
                    <CardHeader>
                        <CardTitle>Liste Géographique</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {clientsWithAddress.map((client: any) => (
                            <div key={client.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                                <div>
                                    <div className="font-semibold">{client.name}</div>
                                    <div className="text-sm text-muted-foreground">{client.clientProfile.address}</div>
                                </div>
                                <a
                                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(client.clientProfile.address)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    <Button size="sm" variant="outline" className="gap-2">
                                        <MapPin size={14} />
                                        Voir
                                    </Button>
                                </a>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card className="md:col-span-1 bg-muted/50 flex items-center justify-center min-h-[400px]">
                    <div className="text-center p-6">
                        <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold">Intégration Carte Interactive</h3>
                        <p className="text-sm text-muted-foreground mt-2">
                            Pour afficher une carte interactive en temps réel, une clé API Google Maps est requise.
                            <br />
                            En attendant, utilisez les liens "Voir" pour ouvrir la localisation exacte.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    )
}
