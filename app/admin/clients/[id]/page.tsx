
import { getClientById, updateClientProfile, addVehicle, deleteVehicle, updateVehicle, deleteClient } from "@/lib/actions/clients"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Car, Trash2, Plus, Save, ArrowLeft, Clock } from "lucide-react"
import Link from "next/link"
import { revalidatePath } from "next/cache"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { ClientPortalShare } from "@/components/admin/ClientPortalShare"

export default async function ClientEntityPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const client = await getClientById(id)

    if (!client) return <div>Client introuvable</div>
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
                        <Badge variant="outline" className="text-xs font-normal">Client depuis {new Date(client.createdAt).toLocaleDateString()}</Badge>
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
                        {/* Quick Stats */}
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
                        {client.clientProfile?.vehicles.length === 0 && (
                            <div className="col-span-full text-center py-12 text-muted-foreground bg-slate-50 border border-dashed rounded-lg">
                                Aucun véhicule. Ajoutez-en un pour commencer.
                            </div>
                        )}
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
                                                <div className="font-semibold text-base">{job.services.map((s: any) => s.service.name).join(", ")}</div>
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

function DeleteVehicleButton({ id, clientId }: { id: string, clientId: string }) {
    return (
        <form action={async () => {
            "use server"
            await deleteVehicle(id)
            revalidatePath(`/admin/clients/${clientId}`)
        }}>
            <Button size="icon" variant="secondary" className="text-destructive h-8 w-8 hover:bg-destructive hover:text-white transition-colors">
                <Trash2 size={14} />
            </Button>
        </form>
    )
}

function DeleteClientButton({ id, name, showLabel }: { id: string, name: string, showLabel?: boolean }) {
    return (
        <form action={async () => {
            "use server"
            await deleteClient(id)
        }} onSubmit={(e) => {
            if (!confirm(`Supprimer définitivement le client ${name} ?`)) {
                e.preventDefault()
            }
        }}>
            <Button type="submit" variant={showLabel ? "destructive" : "ghost"} size={showLabel ? "default" : "icon"} className={showLabel ? "" : "text-muted-foreground hover:text-destructive"}>
                <Trash2 size={showLabel ? 16 : 18} className={showLabel ? "mr-2" : ""} />
                {showLabel && "Supprimer le client"}
            </Button>
        </form>
    )
}

function EditVehicleDialog({ vehicle, clientId }: { vehicle: any, clientId: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Save size={14} />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifier le Véhicule</DialogTitle>
                </DialogHeader>
                <form action={async (formData) => {
                    "use server"
                    await updateVehicle(vehicle.id, formData)
                    revalidatePath(`/admin/clients/${clientId}`)
                }} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Marque</Label>
                        <Input name="make" defaultValue={vehicle.make} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Modèle</Label>
                        <Input name="model" defaultValue={vehicle.model} className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Année</Label>
                        <Input name="year" type="number" defaultValue={vehicle.year} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Couleur</Label>
                        <Input name="color" defaultValue={vehicle.color} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Plaque</Label>
                        <Input name="plate" defaultValue={vehicle.licensePlate || vehicle.plate} className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Type</Label>
                        <div className="col-span-3">
                            <Select name="type" defaultValue={vehicle.type || "SEDAN"}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SEDAN">Berline (Sedan)</SelectItem>
                                    <SelectItem value="SUV">VUS (SUV)</SelectItem>
                                    <SelectItem value="PICKUP">Pickup</SelectItem>
                                    <SelectItem value="TRUCK">Camion</SelectItem>
                                    <SelectItem value="OTHER">Autre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit">Enregistrer</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

function AddVehicleDialog({ clientId }: { clientId: string }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" className="gap-2" variant="outline">
                    <Plus size={14} />
                    Ajouter
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Nouveau Véhicule</DialogTitle>
                </DialogHeader>
                <form action={async (formData) => {
                    "use server"
                    await addVehicle(clientId, formData)
                }} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Marque</Label>
                        <Input name="make" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Modèle</Label>
                        <Input name="model" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Année</Label>
                        <Input name="year" type="number" className="col-span-3" defaultValue={new Date().getFullYear()} />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Couleur</Label>
                        <Input name="color" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Plaque</Label>
                        <Input name="plate" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Type</Label>
                        <div className="col-span-3">
                            <Select name="type" defaultValue="SEDAN">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SEDAN">Berline (Sedan)</SelectItem>
                                    <SelectItem value="SUV">VUS (SUV)</SelectItem>
                                    <SelectItem value="PICKUP">Pickup</SelectItem>
                                    <SelectItem value="TRUCK">Camion</SelectItem>
                                    <SelectItem value="OTHER">Autre</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Photo URL</Label>
                        <Input name="photoUrl" className="col-span-3" placeholder="https://..." />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Ajouter</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
