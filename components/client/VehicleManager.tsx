"use client"

import { useState } from "react"
import { addVehicle, deleteVehicle } from "@/lib/actions/client-vehicle"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Car, Plus, Trash2, Loader2, X } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

export function VehicleManager({ token, vehicles }: { token: string, vehicles: any[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleDelete(id: string) {
        if (!confirm("Supprimer ce véhicule ?")) return
        setLoading(true)
        await deleteVehicle(token, id)
        setLoading(false)
    }

    return (
        <Card className="border-none shadow-xl bg-white dark:bg-slate-900 h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-lg">Mes Véhicules</CardTitle>
                    <CardDescription className="hidden sm:block">Gérez votre flotte</CardDescription>
                </div>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="default" className="gap-1 h-8 px-2 rounded-full">
                            <Plus size={14} /> <span className="text-xs">Ajouter</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Ajouter un véhicule</DialogTitle>
                        </DialogHeader>
                        <form action={async (formData) => {
                            setLoading(true)
                            await addVehicle(token, formData)
                            setLoading(false)
                            setOpen(false)
                        }} className="space-y-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Marque</Label>
                                    <Input name="make" placeholder="Ex: Audi" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Modèle</Label>
                                    <Input name="model" placeholder="Ex: A4" required />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Année</Label>
                                    <Input name="year" type="number" placeholder="2023" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Type</Label>
                                    <Select name="type" defaultValue="SEDAN">
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="SEDAN">Berline / Sedan</SelectItem>
                                            <SelectItem value="SUV">SUV / 4x4</SelectItem>
                                            <SelectItem value="PICKUP">Pickup</SelectItem>
                                            <SelectItem value="TRUCK">Camion</SelectItem>
                                            <SelectItem value="OTHER">Autre</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Plaque (Optionnel)</Label>
                                <Input name="licensePlate" placeholder="ABC-123" />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Ajouter le véhicule
                            </Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    {vehicles.map((v) => (
                        <div key={v.id} className="relative flex items-center gap-3 p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all group">
                            <div className="bg-white dark:bg-slate-800 p-2.5 rounded-full text-slate-600 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-slate-700">
                                <Car size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm truncate text-slate-800 dark:text-slate-200">{v.make} {v.model}</div>
                                <div className="text-xs text-muted-foreground truncate">
                                    {v.year ? `${v.year} • ` : ''}{v.type}
                                </div>
                            </div>
                            <button
                                onClick={() => handleDelete(v.id)}
                                disabled={loading}
                                className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-full transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                                title="Supprimer"
                            >
                                <Trash2 size={14} />
                            </button>
                        </div>
                    ))}
                    {vehicles.length === 0 && (
                        <div className="text-center py-6 text-muted-foreground italic text-xs border border-dashed rounded-lg bg-slate-50/50">
                            Ajoutez votre premier véhicule.
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
