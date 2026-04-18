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
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Inventaire</h2>
                <AddItemDialog />
            </div>

            {/* Alerts Section - High end look */}
            {lowStockItems.length > 0 && (
                <div className="relative overflow-hidden rounded-2xl border border-destructive/20 bg-slate-950 p-6 shadow-2xl">
                    <div className="absolute -right-8 -top-8 size-32 rounded-full bg-destructive/10 blur-3xl" />
                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
                        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-destructive/10 text-destructive ring-1 ring-destructive/20">
                            <AlertTriangle size={28} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-xl font-black uppercase tracking-tight text-white">Stock Critique</h3>
                            <p className="text-sm font-medium text-slate-400">
                                {lowStockItems.length} articles nécessitent un réapprovisionnement immédiat.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:justify-end">
                            {lowStockItems.map((item: any) => (
                                <Badge key={item.id} variant="outline" className="border-destructive/30 bg-destructive/5 px-2 py-1 font-bold text-destructive">
                                    <Package size={12} className="mr-1" /> {item.name} • {item.quantity}{item.unit}
                                </Badge>
                            ))}
                        </div>
                    </div>
                </div>
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
                                <TableHead>Article (nom, type, stock, seuil, statut, actions)</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item: any) => (
                                <InventoryRow key={item.id} item={item} />
                            ))}
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={2} className="text-center py-8 text-muted-foreground">
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
