"use client"

import { updateInventoryItem, deleteInventoryItem, addInventoryFormat, deleteInventoryFormat } from "@/lib/actions/inventory"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TableRow, TableCell } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Trash2, Save, ChevronDown, ChevronRight, PlusCircle } from "lucide-react"
import { useState } from "react"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

export function InventoryRow({ item }: { item: any }) {
    const [expanded, setExpanded] = useState(false)

    return (
        <>
            <TableRow className="group">
                <TableCell className="w-[40px] p-2">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => setExpanded(!expanded)}
                    >
                        {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </Button>
                </TableCell>
                <TableCell className="p-2">
                    <form action={async (formData) => {
                        await updateInventoryItem(item.id, formData)
                    }} className="flex items-center gap-2">
                        <button type="submit" className="hidden" />

                        <div className="grid grid-cols-[1fr_120px_100px_100px_1fr_auto] gap-2 items-center w-full">
                            <Input name="name" defaultValue={item.name} className="h-8 border-transparent group-hover:border-input transition-colors" />

                            <Select name="type" defaultValue={item.type}>
                                <SelectTrigger className="h-8 text-xs border-transparent group-hover:border-input transition-colors">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="PRODUCT">Produit</SelectItem>
                                    <SelectItem value="EQUIPMENT">Équipement</SelectItem>
                                </SelectContent>
                            </Select>

                            <div className="flex items-center gap-1">
                                <Input name="quantity" type="number" step="0.1" defaultValue={item.quantity} className="h-8 text-center font-bold border-transparent group-hover:border-input transition-colors" />
                                <span className="text-xs text-muted-foreground w-12">{item.unit}</span>
                            </div>

                            <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">Min:</span>
                                <Input name="threshold" type="number" step="0.1" defaultValue={item.minThreshold} className="h-8 w-14 text-xs border-transparent group-hover:border-input transition-colors" />
                            </div>

                            <div>
                                {item.quantity <= (item.minThreshold || 0) ? (
                                    <Badge variant="destructive" className="h-6">Bas</Badge>
                                ) : (
                                    <Badge variant="outline" className="text-green-600 h-6 border-green-200 bg-green-50">OK</Badge>
                                )}
                                {item.formats && item.formats.length > 0 && (
                                    <Badge variant="secondary" className="ml-2 h-6 text-[10px]">
                                        {item.formats.length} formats
                                    </Badge>
                                )}
                            </div>

                            <div className="flex justify-end gap-1">
                                <Button size="icon" variant="ghost" type="submit" title="Enregistrer">
                                    <Save size={16} className="text-primary" />
                                </Button>
                                <DeleteInventoryButton id={item.id} />
                            </div>
                        </div>
                    </form>
                </TableCell>
            </TableRow>
            {expanded && (
                <TableRow className="bg-slate-50/50 dark:bg-slate-900/20 shadow-inner">
                    <TableCell />
                    <TableCell className="p-0 border-t-0">
                        <div className="p-4 pt-2 space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Formats & Tarification</h4>
                                <AddFormatInline itemId={item.id} />
                            </div>
                            
                            {item.formats && item.formats.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {item.formats.map((f: any) => (
                                        <div key={f.id} className="bg-background border rounded-md p-3 flex justify-between items-center shadow-sm">
                                            <div>
                                                <div className="font-bold text-sm">{f.label}</div>
                                                <div className="text-xs text-muted-foreground">${(f.price || 0).toFixed(2)} / format</div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1">
                                                <div className="text-xs font-medium">Stock: {f.quantity || 0}</div>
                                                <DeleteFormatButton formatId={f.id} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground italic py-2">
                                    Aucun format défini pour cet article. Ajoutez-en un pour gérer les prix par format.
                                </div>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    )
}

function AddFormatInline({ itemId }: { itemId: string }) {
    const [open, setOpen] = useState(false)

    if (!open) {
        return (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setOpen(true)}>
                <PlusCircle size={14} /> Ajouter un format
            </Button>
        )
    }

    return (
        <form action={async (fd) => {
            await addInventoryFormat(itemId, fd)
            setOpen(false)
        }} className="flex items-center gap-2 bg-slate-100 p-2 rounded-md border shadow-sm">
            <Input name="label" placeholder="Format (ex: 500ml)" className="h-8 text-xs w-32" required autoFocus />
            <Input name="price" type="number" step="0.01" placeholder="Prix ($)" className="h-8 text-xs w-20" />
            <Input name="quantity" type="number" step="0.1" placeholder="Stock" className="h-8 text-xs w-20" />
            <div className="flex gap-1">
                <Button type="submit" size="sm" className="h-8 w-8 px-0"><Save size={14} /></Button>
                <Button type="button" size="sm" variant="ghost" className="h-8 w-8 px-0 text-destructive" onClick={() => setOpen(false)}>×</Button>
            </div>
        </form>
    )
}

function DeleteFormatButton({ formatId }: { formatId: string }) {
    return (
        <form action={async () => {
            if (confirm("Supprimer ce format ?")) {
                await deleteInventoryFormat(formatId)
            }
        }}>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive/50 hover:text-destructive">
                <Trash2 size={12} />
            </Button>
        </form>
    )
}

function DeleteInventoryButton({ id }: { id: string }) {
    return (
        <form action={async () => {
            if (confirm("Supprimer définitivement cet article de l'inventaire ?")) {
                await deleteInventoryItem(id)
            }
        }}>
            <Button size="icon" variant="ghost" type="submit" className="text-destructive h-8 w-8 hover:bg-destructive/10">
                <Trash2 size={16} />
            </Button>
        </form>
    )
}
