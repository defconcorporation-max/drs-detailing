export const dynamic = "force-dynamic"

import { getInventory, createInventoryItem } from "@/lib/actions/inventory"
import { InventoryRow } from "@/components/admin/InventoryRow"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { AlertTriangle, Plus, Package, Trash2, Edit, Save } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export default async function InventoryPage() {
    const items = await getInventory()
    const lowStockItems = items.filter((i: any) => i.quantity <= i.minThreshold)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Inventaire</h2>
                <AddItemDialog />
            </div>

            {/* Alerts Section */}
            {lowStockItems.length > 0 && (
                <Card className="border-destructive/50 bg-destructive/10">
                    <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            <CardTitle className="text-lg">Attention: Stock Bas</CardTitle>
                        </div>
                        <CardDescription>
                            Les articles suivants sont en dessous du seuil minimum.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {lowStockItems.map((item: any) => (
                                <Badge key={item.id} variant="destructive">
                                    {item.name} ({item.quantity} {item.unit})
                                </Badge>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Main Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Liste des Produits & Équipements</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[40px]"></TableHead>
                                <TableHead>Nom</TableHead>
                                <TableHead className="text-center">Type</TableHead>
                                <TableHead>Stock / Format</TableHead>
                                <TableHead>Seuil Min.</TableHead>
                                <TableHead>Statut</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item: any) => (
                                <InventoryRow key={item.id} item={item} />
                            ))}
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Inventaire vide. Ajoutez votre premier produit.
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

function AddItemDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus size={16} />
                    Ajouter Article
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Ajouter au stock</DialogTitle>
                </DialogHeader>
                <form action={async (formData) => {
                    "use server"
                    await createInventoryItem(formData)
                }} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Nom</Label>
                        <Input name="name" className="col-span-3" required placeholder="Ex: Savon X" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Type</Label>
                        <div className="col-span-3">
                            <Select name="type" defaultValue="Produit">
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Produit">Produit (Consommable)</SelectItem>
                                    <SelectItem value="Équipement">Équipement (Machine)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Quantité</Label>
                        <div className="col-span-3 flex gap-2">
                            <Input name="quantity" type="number" step="0.1" className="flex-1" placeholder="0" />
                            <Select name="unit" defaultValue="L">
                                <SelectTrigger className="w-[100px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="L">Litres</SelectItem>
                                    <SelectItem value="ml">ml</SelectItem>
                                    <SelectItem value="Gal">Gallons</SelectItem>
                                    <SelectItem value="Unités">Unités</SelectItem>
                                    <SelectItem value="Bouteilles">Bouteilles</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Alerte à</Label>
                        <Input name="minThreshold" type="number" step="0.1" className="col-span-3" placeholder="Ex: 5" />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Ajouter</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
