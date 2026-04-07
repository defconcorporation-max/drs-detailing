"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { addVehicle, deleteVehicle, updateVehicle, deleteClient } from "@/lib/actions/clients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Trash2, Plus, Save } from "lucide-react"
import { toast } from "sonner"

export function DeleteVehicleButton({ id, clientId }: { id: string, clientId: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleDelete() {
        if (!confirm("Supprimer ce véhicule ?")) return
        setLoading(true)
        const res = await deleteVehicle(id)
        if (res.success) {
            toast.success("Véhicule supprimé")
            router.refresh()
        } else {
            toast.error(res.error || "Erreur lors de la suppression")
        }
        setLoading(false)
    }

    return (
        <Button 
            size="icon" 
            variant="secondary" 
            className="text-destructive h-8 w-8 hover:bg-destructive hover:text-white transition-colors"
            onClick={handleDelete}
            disabled={loading}
        >
            <Trash2 size={14} />
        </Button>
    )
}

export function DeleteClientButton({ id, name, showLabel }: { id: string, name: string, showLabel?: boolean }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleDelete() {
        if (!confirm(`Supprimer définitivement le client ${name} ?`)) return
        setLoading(true)
        const res = await deleteClient(id)
        if (res.success) {
            toast.success("Client supprimé")
            router.push("/admin/clients")
        } else {
            toast.error(res.error || "Erreur")
        }
        setLoading(false)
    }

    return (
        <Button 
            variant={showLabel ? "destructive" : "ghost"} 
            size={showLabel ? "default" : "icon"} 
            className={showLabel ? "" : "text-muted-foreground hover:text-destructive"}
            onClick={handleDelete}
            disabled={loading}
        >
            <Trash2 size={showLabel ? 16 : 18} className={showLabel ? "mr-2" : ""} />
            {showLabel && "Supprimer le client"}
        </Button>
    )
}

export function EditVehicleDialog({ vehicle, clientId }: { vehicle: any, clientId: string }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const res = await updateVehicle(vehicle.id, formData)
        if (res.success) {
            toast.success("Véhicule mis à jour")
            setOpen(false)
            router.refresh()
        } else {
            toast.error(res.error || "Erreur")
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="secondary" className="h-8 w-8">
                    <Save size={14} />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Modifier le Véhicule</DialogTitle>
                </DialogHeader>
                <form onSubmit={onSubmit} className="grid gap-4 py-4">
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
                        <Button type="submit" disabled={loading}>
                            {loading ? "Enregistrement..." : "Enregistrer"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

export function AddVehicleDialog({ clientId }: { clientId: string }) {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const res = await addVehicle(clientId, formData)
        if (res.success) {
            toast.success("Véhicule ajouté")
            setOpen(false)
            router.refresh()
        } else {
            toast.error(res.error || "Erreur")
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                <form onSubmit={onSubmit} className="grid gap-4 py-4">
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
                        <Button type="submit" disabled={loading}>
                            {loading ? "Ajout..." : "Ajouter"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
