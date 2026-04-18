export const dynamic = "force-dynamic"

import { getClients, getBusinesses } from "@/lib/actions/clients"
import { ClientDialog } from "@/components/admin/ClientDialog"
import { BusinessDialog } from "@/components/admin/BusinessDialog"
import { DeleteBusinessButton } from "@/components/admin/DeleteBusinessButton"
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
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

type SearchParams = {
    tab?: string
    q?: string
    hasVehicles?: string
    businessLink?: string
    sort?: string
    qBiz?: string
    hasFleet?: string
    hasMembers?: string
    sortBiz?: string
}

function asText(value: string | string[] | undefined) {
    if (Array.isArray(value)) return value[0] ?? ""
    return value ?? ""
}

export default async function ClientsPage({
    searchParams,
}: {
    searchParams: Promise<SearchParams>
}) {
    const params = await searchParams
    const clients = await getClients()
    const businesses = await getBusinesses()
    const tab = asText(params.tab) === "b2b" ? "b2b" : "individuals"

    const q = asText(params.q).toLowerCase().trim()
    const hasVehicles = asText(params.hasVehicles) || "all"
    const businessLink = asText(params.businessLink) || "all"
    const sort = asText(params.sort) || "name-asc"

    const qBiz = asText(params.qBiz).toLowerCase().trim()
    const hasFleet = asText(params.hasFleet) || "all"
    const hasMembers = asText(params.hasMembers) || "all"
    const sortBiz = asText(params.sortBiz) || "name-asc"

    const filteredClients = [...clients]
        .filter((client: any) => {
            if (!q) return true
            const hay = [
                client.name,
                client.email,
                client.phone,
                client.clientProfile?.address,
                client.clientProfile?.business?.name,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
            return hay.includes(q)
        })
        .filter((client: any) => {
            const hasVeh = (client.clientProfile?.vehicles?.length ?? 0) > 0
            if (hasVehicles === "with") return hasVeh
            if (hasVehicles === "without") return !hasVeh
            return true
        })
        .filter((client: any) => {
            const linkedBiz = Boolean(client.clientProfile?.business)
            if (businessLink === "linked") return linkedBiz
            if (businessLink === "independent") return !linkedBiz
            return true
        })

    filteredClients.sort((a: any, b: any) => {
        switch (sort) {
            case "recent":
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            case "oldest":
                return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            case "name-desc":
                return (b.name || "").localeCompare(a.name || "", "fr")
            case "loyalty-desc":
                return (b.clientProfile?.loyaltyPoints || 0) - (a.clientProfile?.loyaltyPoints || 0)
            case "vehicles-desc":
                return (b.clientProfile?.vehicles?.length || 0) - (a.clientProfile?.vehicles?.length || 0)
            case "name-asc":
            default:
                return (a.name || "").localeCompare(b.name || "", "fr")
        }
    })

    const filteredBusinesses = [...businesses]
        .filter((biz: any) => {
            if (!qBiz) return true
            const hay = [biz.name, biz.contactName, biz.email, biz.phone, biz.address]
                .filter(Boolean)
                .join(" ")
                .toLowerCase()
            return hay.includes(qBiz)
        })
        .filter((biz: any) => {
            const fleetCount = biz.vehicles?.length || 0
            if (hasFleet === "with") return fleetCount > 0
            if (hasFleet === "without") return fleetCount === 0
            return true
        })
        .filter((biz: any) => {
            const membersCount = biz.clients?.length || 0
            if (hasMembers === "with") return membersCount > 0
            if (hasMembers === "without") return membersCount === 0
            return true
        })

    filteredBusinesses.sort((a: any, b: any) => {
        switch (sortBiz) {
            case "name-desc":
                return (b.name || "").localeCompare(a.name || "", "fr")
            case "fleet-desc":
                return (b.vehicles?.length || 0) - (a.vehicles?.length || 0)
            case "members-desc":
                return (b.clients?.length || 0) - (a.clients?.length || 0)
            case "recent":
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            case "name-asc":
            default:
                return (a.name || "").localeCompare(b.name || "", "fr")
        }
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Clients & Business</h2>
                    <p className="text-muted-foreground text-sm">Gérez vos clients individuels et vos comptes flottes B2B.</p>
                </div>
                <div className="flex gap-2">
                    <BusinessDialog />
                    <ClientDialog />
                </div>
            </div>

            <Tabs defaultValue={tab} className="w-full">
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
                            <CardTitle>Liste des Clients ({filteredClients.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form method="get" className="mb-4 grid gap-2 md:grid-cols-4">
                                <input type="hidden" name="tab" value="individuals" />
                                <Input
                                    name="q"
                                    placeholder="Rechercher nom, email, téléphone..."
                                    defaultValue={q}
                                />
                                <Select name="hasVehicles" defaultValue={hasVehicles}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Véhicules" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous véhicules</SelectItem>
                                        <SelectItem value="with">Avec véhicule</SelectItem>
                                        <SelectItem value="without">Sans véhicule</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select name="businessLink" defaultValue={businessLink}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Lien B2B" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous statuts B2B</SelectItem>
                                        <SelectItem value="linked">Liés à un compte B2B</SelectItem>
                                        <SelectItem value="independent">Indépendants</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select name="sort" defaultValue={sort}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tri" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name-asc">Nom A-Z</SelectItem>
                                        <SelectItem value="name-desc">Nom Z-A</SelectItem>
                                        <SelectItem value="recent">Plus récents</SelectItem>
                                        <SelectItem value="oldest">Plus anciens</SelectItem>
                                        <SelectItem value="loyalty-desc">Fidélité décroissante</SelectItem>
                                        <SelectItem value="vehicles-desc">Nb véhicules décroissant</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="md:col-span-4 flex gap-2">
                                    <Button type="submit" size="sm">Appliquer</Button>
                                    <Link href="/admin/clients?tab=individuals">
                                        <Button type="button" size="sm" variant="outline">Réinitialiser</Button>
                                    </Link>
                                </div>
                            </form>
                            <div className="overflow-x-auto -mx-6 px-6">
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
                                    {filteredClients.map((client: any) => (
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
                                    {filteredClients.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                                Aucun client ne correspond aux filtres.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="b2b" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Comptes Business & Flottes ({filteredBusinesses.length})</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form method="get" className="mb-4 grid gap-2 md:grid-cols-4">
                                <input type="hidden" name="tab" value="b2b" />
                                <Input
                                    name="qBiz"
                                    placeholder="Rechercher entreprise, contact, email..."
                                    defaultValue={qBiz}
                                />
                                <Select name="hasFleet" defaultValue={hasFleet}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Flotte" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Toutes flottes</SelectItem>
                                        <SelectItem value="with">Avec véhicules</SelectItem>
                                        <SelectItem value="without">Sans véhicule</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select name="hasMembers" defaultValue={hasMembers}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Membres" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Tous membres</SelectItem>
                                        <SelectItem value="with">Avec membres liés</SelectItem>
                                        <SelectItem value="without">Sans membre lié</SelectItem>
                                    </SelectContent>
                                </Select>
                                <Select name="sortBiz" defaultValue={sortBiz}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tri" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="name-asc">Nom A-Z</SelectItem>
                                        <SelectItem value="name-desc">Nom Z-A</SelectItem>
                                        <SelectItem value="fleet-desc">Flotte décroissante</SelectItem>
                                        <SelectItem value="members-desc">Membres décroissants</SelectItem>
                                        <SelectItem value="recent">Plus récents</SelectItem>
                                    </SelectContent>
                                </Select>
                                <div className="md:col-span-4 flex gap-2">
                                    <Button type="submit" size="sm">Appliquer</Button>
                                    <Link href="/admin/clients?tab=b2b">
                                        <Button type="button" size="sm" variant="outline">Réinitialiser</Button>
                                    </Link>
                                </div>
                            </form>
                            <div className="overflow-x-auto -mx-6 px-6">
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
                                    {filteredBusinesses.map((biz: any) => (
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
                                            <TableCell className="text-right flex justify-end gap-2">
                                                <Link href={`/admin/clients/b2b/${biz.id}`}>
                                                    <Button size="sm" variant="outline">Détails</Button>
                                                </Link>
                                                <DeleteBusinessButton id={biz.id} name={biz.name} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredBusinesses.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                                                <Building2 className="mx-auto mb-2 opacity-20" size={48} />
                                                <p>Aucun compte B2B ne correspond aux filtres.</p>
                                                <p className="text-xs">Ajustez vos filtres ou créez un nouveau compte flotte.</p>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
