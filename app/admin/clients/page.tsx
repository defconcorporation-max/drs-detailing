import { getClients, getBusinesses } from "@/lib/actions/clients"
import { ClientDialog } from "@/components/admin/ClientDialog"
import { BusinessDialog } from "@/components/admin/BusinessDialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building2, User } from "lucide-react"

export default async function ClientsPage() {
    const clients = await getClients()
    const businesses = await getBusinesses()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Clients & Business</h2>
                    <p className="text-muted-foreground">Gérez vos clients individuels et vos comptes flottes B2B.</p>
                </div>
                <div className="flex gap-2">
                    <BusinessDialog />
                    <ClientDialog />
                </div>
            </div>

            <Tabs defaultValue="individuals" className="w-full">
                <TabsList className="grid w-full max-w-[400px] grid-cols-2">
                    <TabsTrigger value="individuals" className="gap-2">
                        <User size={16} />
                        Particuliers
                    </TabsTrigger>
                    <TabsTrigger value="b2b" className="gap-2">
                        <Building2 size={16} />
                        Comptes B2B
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="individuals" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Liste des Clients ({clients.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom</TableHead>
                                        <TableHead>Contact</TableHead>
                                        <TableHead>Véhicules</TableHead>
                                        <TableHead>Fidélité</TableHead>
                                        <TableHead>Depuis</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {clients.map((client: any) => (
                                        <TableRow key={client.id}>
                                            <TableCell className="font-medium">
                                                <div className="flex flex-col">
                                                    <span>{client.name}</span>
                                                    {client.clientProfile?.business && (
                                                        <Badge variant="outline" className="w-fit text-[10px] mt-1">
                                                            🏢 {client.clientProfile.business.name}
                                                        </Badge>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    <span>{client.email}</span>
                                                    <span className="text-muted-foreground">{client.phone}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {client.clientProfile?.vehicles?.length > 0 ? (
                                                    <div className="flex gap-1 flex-wrap">
                                                        {client.clientProfile.vehicles.map((v: any) => (
                                                            <Badge key={v.id} variant="secondary" className="text-xs">
                                                                {v.make} {v.model}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">Aucun</span>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{client.clientProfile?.loyaltyPoints || 0} pts</Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(client.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/admin/clients/${client.id}`}>
                                                    <Button size="sm" variant="outline">Gérer</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="b2b" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Comptes Business & Flottes ({businesses.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Entreprise</TableHead>
                                        <TableHead>Contact Principal</TableHead>
                                        <TableHead>Véhicules en Flotte</TableHead>
                                        <TableHead>Clients Liés</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {businesses.map((biz: any) => (
                                        <TableRow key={biz.id}>
                                            <TableCell className="font-bold">{biz.name}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col text-sm">
                                                    <span>{biz.contactName}</span>
                                                    <span className="text-muted-foreground text-xs">{biz.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary">{biz.vehicles?.length || 0} Véhicules</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{biz.clients?.length || 0} Employés/Membres</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/admin/clients/b2b/${biz.id}`}>
                                                    <Button size="sm" variant="outline">Détails</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {businesses.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                                <Building2 className="mx-auto mb-2 opacity-20" size={48} />
                                                <p>Aucun compte B2B configuré.</p>
                                                <p className="text-xs">Créez votre premier compte flotte pour gérer les entreprises.</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
