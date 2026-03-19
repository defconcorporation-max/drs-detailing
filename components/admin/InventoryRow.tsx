"use client"

import { updateInventoryItem, deleteInventoryItem } from "@/lib/actions/inventory"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Save } from "lucide-react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function InventoryRow({ item }: { item: any }) {
    return (
        <TableRow>
            <TableCell className="p-2">
                <form action={async (formData) => {
                    await updateInventoryItem(item.id, formData)
                }} className="flex items-center gap-2">
                    {/* Hidden button to submit on Enter */}
                    <button type="submit" className="hidden" />

                    <div className="grid grid-cols-[150px_100px_100px_100px_1fr_auto] gap-2 items-center w-full">
                        <Input name="name" defaultValue={item.name} className="h-8" />

                        <Select name="type" defaultValue={item.type}>
                            <SelectTrigger className="h-8 text-xs">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Product">Produit</SelectItem>
                                <SelectItem value="Equipment">Équipement</SelectItem>
                            </SelectContent>
                        </Select>

                        <div className="flex items-center gap-1">
                            <Input name="quantity" type="number" step="0.1" defaultValue={item.quantity} className="h-8 text-center font-bold" />
                            <Input name="unit" defaultValue={item.unit} className="h-8 w-12 text-xs text-muted-foreground px-1" />
                        </div>

                        <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground">Min:</span>
                            <Input name="threshold" type="number" step="0.1" defaultValue={item.minThreshold} className="h-8 w-14 text-xs" />
                        </div>

                        <div>
                            {item.quantity <= item.minThreshold ? (
                                <Badge variant="destructive" className="h-6">Bas</Badge>
                            ) : (
                                <Badge variant="outline" className="text-green-600 h-6 border-green-200 bg-green-50">OK</Badge>
                            )}
                        </div>

                        <div className="flex justify-end gap-1">
                            <Button size="icon" variant="ghost" type="submit" title="Enregistrer">
                                <Save size={16} className="text-primary" />
                            </Button>
                        </div>
                    </div>
                </form>
            </TableCell>
            <TableCell className="w-[50px]">
                <DeleteInventoryButton id={item.id} />
            </TableCell>
        </TableRow>
    )
}

function DeleteInventoryButton({ id }: { id: string }) {
    return (
        <form action={async () => {
            await deleteInventoryItem(id)
        }}>
            <Button size="icon" variant="ghost" type="submit" className="text-destructive h-8 w-8 hover:bg-destructive/10">
                <Trash2 size={16} />
            </Button>
        </form>
    )
}
