export const dynamic = "force-dynamic"

import { getClientById, updateClientProfile } from "@/lib/actions/clients"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Car, ArrowLeft, Clock, Save } from "lucide-react"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientPortalShare } from "@/components/admin/ClientPortalShare"
import { 
    DeleteClientButton, 
    AddVehicleDialog, 
    EditVehicleDialog, 
    DeleteVehicleButton 
} from "@/components/admin/ClientEntityComponents"

export default async function ClientEntityPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const client = await getClientById(id)

    if (!client) return (
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <h2 className="text-2xl font-bold">Client introuvable</h2>
            <Link href="/admin/clients">
                <Button variant="outline"><ArrowLeft className="mr-2" size={16} /> Retour à la liste</Button>
            </Link>
        </div>
    )
    
    const jobs = client.clientProfile?.jobs ?? []

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/clients">
                    <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
                </Link>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{client.name}</h2>
                    <div className="text-muted-foreground text-sm flex gap-2 items-center">
                        <Badge variant="outline" className="text-xs font-normal">
                            Client depuis {new Date(client.createdAt).toLocaleDateString()}
                        </Badge>
                        <span>•</span>
                        <span>{client.clientProfile?.loyaltyPoints || 0} pts fidélité</span>
                    </div>
                </div>
                <div className="ml-auto">
                    <DeleteClientButton id={client.id} name={client.name || "ce client"} />
                </div>
            </div>

            {/* Magic Link Banner */}
            <ClientPortalShare url={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/client/${client.clientProfile?.accessKey}`} />

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
                    <TabsTrigger value="vehicles">Véhicules ({client.clientProfile?.vehicles.length || 0})</TabsTrigger>
                    <TabsTrigger value="history">Historique Jobs</TabsTrigger>
                    <TabsTrigger value="settings">Modifier Profil</TabsTrigger>
                </TabsList>

                {/* OVERVIEW TAB */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Dépenses Totales</CardTitle>
                                <span className="text-muted-foreground">$</span>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    ${client.clientProfile?.jobs.reduce((acc: number, j: any) => acc + (j.totalPrice || 0), 0).toFixed(2)}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Jobs Complétés</CardTitle>
                                <Car className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {client.clientProfile?.jobs.filter((j: any) => j.status === 'COMPLETED').length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Dernière Visite</CardTitle>
                                <Clock className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-sm">
                                    {jobs.length > 0
                                        ? new Date(jobs[jobs.length - 1].scheduledDate).toLocaleDateString()
                                        : "N/A"}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Contact</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-medium">{client.email}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Téléphone</span>
                                    <span className="font-medium">{client.phone || "-"}</span>
                                </div>
                                <div className="flex justify-between border-b pb-2">
                                    <span className="text-muted-foreground">Adresse</span>
                                    <span className="font-medium">{client.clientProfile?.address || "-"}</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* VEHICLES TAB */}
                <TabsContent value="vehicles" className="space-y-4">
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Flotte Véhicules</h3>
                        <AddVehicleDialog clientId={client.id} />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {client.clientProfile?.vehicles.map((v: any) => (
                            <Card key={v.id} className="overflow-hidden group">
                                <div className="aspect-video bg-secondary relative">
                                    {v.photoUrl ? (
                                        <img src={v.photoUrl} alt="Vehicle" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-slate-100 dark:bg-slate-800">
                                            <Car size={48} opacity={0.2} />
                                        </div>
                                    )}
                                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <EditVehicleDialog vehicle={v} clientId={client.id} />
                                        <DeleteVehicleButton id={v.id} clientId={client.id} />
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <div className="font-bold text-lg">{v.make} {v.model}</div>
                                    <div className="text-sm text-muted-foreground mb-2">{v.year} • {v.color}</div>
                                    <div className="flex gap-2">
                                        <Badge variant="secondary" className="text-[10px]">{v.type}</Badge>
                                        <Badge variant="outline" className="text-[10px]">{v.licensePlate || v.plate}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* HISTORY TAB */}
                <TabsContent value="history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Historique des Interventions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-0 divide-y">
                                {client.clientProfile?.jobs.map((job: any) => (
                                    <div key={job.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="flex items-start gap-4">
                                            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg font-bold text-center min-w-[60px]">
                                                <div className="text-xs uppercase">{new Date(job.scheduledDate).toLocaleDateString('fr-FR', { month: 'short' })}</div>
                                                <div className="text-xl leading-none">{new Date(job.scheduledDate).getDate()}</div>
                                            </div>
                                            <div>
                                                <div className="font-semibold text-base">
                                                    {job.services.map((s: any) => s.service?.name || "Service Inconnu").join(", ")}
                                                </div>
                                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                                    <Car size={14} />
                                                    {job.vehicle?.make} {job.vehicle?.model}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="mt-2 md:mt-0 flex items-center gap-4">
                                            <div className="font-medium text-right">
                                                {job.totalPrice ? `$${job.totalPrice}` : '-'}
                                                <div className="text-xs text-muted-foreground">{job.services.length} services</div>
                                            </div>
                                            <Badge variant={job.status === 'COMPLETED' ? 'default' : (job.status === 'CONFIRMED' ? 'secondary' : 'outline')} className={job.status === 'COMPLETED' ? 'bg-green-600 hover:bg-green-700' : ''}>
                                                {job.status}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                                {jobs.length === 0 && (
                                    <div className="p-8 text-center text-muted-foreground">Aucun historique de job trouvé.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SETTINGS TAB */}
                <TabsContent value="settings">
                    <Card>
                        <CardHeader>
                            <CardTitle>Modifier le Profil</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form action={async (formData) => {
                                "use server"
                                await updateClientProfile(client.id, formData)
                            }} className="space-y-4 max-w-xl">
                                <div className="space-y-2">
                                    <Label>Nom Complet</Label>
                                    <Input name="name" defaultValue={client.name ?? ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input name="email" defaultValue={client.email ?? ""} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Téléphone</Label>
                                    <Input name="phone" defaultValue={client.phone || ""} placeholder="555-0000" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Adresse</Label>
                                    <Input name="address" defaultValue={client.clientProfile?.address || ""} />
                                </div>
                                <Button type="submit" className="gap-2">
                                    <Save size={16} /> Enregistrer les modifications
                                </Button>
                            </form>
                            
                            <Separator className="my-8" />
                            
                            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6">
                                <h4 className="text-lg font-bold text-destructive mb-2">Zone de Danger</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    La suppression d'un client est irréversible. Cela supprimera ses véhicules et son profil d'accès.
                                </p>
                                <DeleteClientButton id={client.id} name={client.name || ""} showLabel />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
