import { getWarranties } from "@/lib/actions/warranties"
import { WarrantyDialog } from "@/components/admin/WarrantyDialog"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Calendar, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

export default async function WarrantiesPage() {
    const warranties = await getWarranties()

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Garanties Numériques</h2>
                    <p className="text-muted-foreground">Historique et suivi des certificats de protection émis.</p>
                </div>
                <WarrantyDialog />
            </header>

            <div className="grid gap-6 md:grid-cols-4">
                <StatCard title="Actives" value={warranties.filter((w:any) => w.status === 'ACTIVE').length} icon={<ShieldCheck className="text-green-500" />} />
                <StatCard title="Total Émis" value={warranties.length} icon={<Calendar className="text-primary" />} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Certificats ({warranties.length})</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>N° Certificat</TableHead>
                                <TableHead>Client</TableHead>
                                <TableHead>Véhicule</TableHead>
                                <TableHead>Protection</TableHead>
                                <TableHead>Expiration</TableHead>
                                <TableHead>Statut</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {warranties.map((w: any) => (
                                <TableRow key={w.id}>
                                    <TableCell className="font-mono text-xs font-bold">{w.certNumber}</TableCell>
                                    <TableCell className="font-medium">{w.client?.user?.name}</TableCell>
                                    <TableCell className="text-xs">
                                        {w.vehicle ? `${w.vehicle.make} ${w.vehicle.model}` : 'N/A'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{w.service?.name}</Badge>
                                    </TableCell>
                                    <TableCell className="text-xs">
                                        {new Date(w.expiryDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>
                                        <Badge 
                                            variant={w.status === 'ACTIVE' ? 'default' : 'secondary'}
                                            className={w.status === 'ACTIVE' ? 'bg-green-600/10 text-green-500 border-green-500/20' : ''}
                                        >
                                            {w.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right flex justify-end gap-2">
                                        <Button size="icon" variant="ghost" className="size-8">
                                            <Download size={14} />
                                        </Button>
                                        <Button size="icon" variant="ghost" className="size-8">
                                            <ExternalLink size={14} />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {warranties.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground italic">
                                        Aucun certificat émis pour le moment.
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

function StatCard({ title, value, icon }: any) {
    return (
        <Card className="bg-muted/30 border-none shadow-sm">
            <CardContent className="p-6 flex items-center gap-4">
                <div className="size-12 rounded-2xl bg-background flex items-center justify-center shadow-inner">
                    {icon}
                </div>
                <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
                    <p className="text-3xl font-black">{value}</p>
                </div>
            </CardContent>
        </Card>
    )
}
