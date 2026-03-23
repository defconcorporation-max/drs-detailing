"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldCheck, Plus, Car, User, Settings2 } from "lucide-react"
import { createWarranty } from "@/lib/actions/warranties"
import { getClients } from "@/lib/actions/clients"
import { getServices } from "@/lib/actions/services"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function WarrantyDialog() {
    const [open, setOpen] = useState(false)
    const [clients, setClients] = useState<any[]>([])
    const [services, setServices] = useState<any[]>([])
    const [selectedClientId, setSelectedClientId] = useState("")
    const [vehicles, setVehicles] = useState<any[]>([])
    const router = useRouter()

    useEffect(() => {
        if (open) {
            loadData()
        }
    }, [open])

    async function loadData() {
        const c = await getClients()
        const s = await getServices()
        setClients(c)
        setServices(s)
    }

    useEffect(() => {
        if (selectedClientId) {
            const client = clients.find(c => c.id === selectedClientId)
            setVehicles(client?.clientProfile?.vehicles || [])
        }
    }, [selectedClientId, clients])

    async function onSubmit(formData: FormData) {
        const res = await createWarranty(formData)
        if (res?.error) {
            alert(res.error)
        } else {
            setOpen(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-green-600 hover:bg-green-700">
                    <ShieldCheck size={16} />
                    Émettre une Garantie
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Certificat de Garantie Numérique</DialogTitle>
                    <DialogDescription>
                        Générez un certificat officiel pour une protection céramique ou PPF.
                    </DialogDescription>
                </DialogHeader>
                <form action={onSubmit} className="grid gap-6 py-4">
                    <div className="grid gap-2">
                        <Label>Client</Label>
                        <Select name="clientId" onValueChange={setSelectedClientId} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un client" />
                            </SelectTrigger>
                            <SelectContent>
                                {clients.map(c => (
                                    <SelectItem key={c.id} value={c.clientProfile?.id || ""}>
                                        {c.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Véhicule</Label>
                        <Select name="vehicleId" required disabled={!selectedClientId}>
                            <SelectTrigger>
                                <SelectValue placeholder="Sélectionnez un véhicule" />
                            </SelectTrigger>
                            <SelectContent>
                                {vehicles.map(v => (
                                    <SelectItem key={v.id} value={v.id}>
                                        {v.make} {v.model} ({v.licensePlate})
                                    </SelectItem>
                                ))}
                                {vehicles.length === 0 && <SelectItem value="none" disabled>Aucun véhicule enregistré</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label>Service Appliqué</Label>
                        <Select name="serviceId" required>
                            <SelectTrigger>
                                <SelectValue placeholder="Type de protection" />
                            </SelectTrigger>
                            <SelectContent>
                                {services.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="years">Durée de la garantie (Années)</Label>
                        <Input id="years" name="years" type="number" defaultValue="5" min="1" max="10" />
                    </div>

                    <DialogFooter>
                        <Button type="submit" className="w-full">Générer le Certificat</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
