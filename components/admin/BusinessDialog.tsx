"use client"

import { useState } from "react"
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
import { Building2, Loader2 } from "lucide-react"
import { createBusiness } from "@/lib/actions/clients"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function BusinessDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function onSubmit(formData: FormData) {
        setLoading(true)
        const res = await createBusiness(formData)
        if (res?.error) {
            toast.error(res.error)
        } else {
            toast.success("Compte B2B créé avec succès !")
            setOpen(false)
            router.refresh()
        }
        setLoading(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <Building2 size={16} />
                    Nouveau Compte B2B
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Ajouter une Entreprise / Flotte</DialogTitle>
                    <DialogDescription>
                        Créez un profil pour un partenaire B2B ou une gestion de flotte.
                    </DialogDescription>
                </DialogHeader>
                <form action={onSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name">Nom de l'entreprise</Label>
                        <Input id="name" name="name" placeholder="Ex: Garage du Nord" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="contactName">Nom du contact</Label>
                        <Input id="contactName" name="contactName" placeholder="Jean Dupont" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" placeholder="b2b@company.com" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="phone">Téléphone</Label>
                        <Input id="phone" name="phone" placeholder="514-000-0000" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="address">Adresse</Label>
                        <Input id="address" name="address" placeholder="123 Rue de l'Atelier" />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : "Créer le compte"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
