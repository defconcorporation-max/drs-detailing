import { getClients } from "@/lib/actions/clients"
import { ClientDialog } from "@/components/admin/ClientDialog"
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
// import { formatDate } from "@/lib/utils" 

export default async function ClientsPage() {
    const clients = await getClients()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Clients</h2>
                <div className="flex gap-2">
                    <form action={async () => {
                        "use server"
                        const { seedJeanTesteur } = await import("@/lib/actions/debug_seed")
                        await seedJeanTesteur()
                    }}>
                        <Button variant="outline" size="sm">
                            + Jean Testeur (Mock)
                        </Button>
                    </form>
                    <ClientDialog />
                </div>
            </div>

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
                                    <TableCell className="font-medium">{client.name}</TableCell>
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
                            {clients.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Aucun client trouvé.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
