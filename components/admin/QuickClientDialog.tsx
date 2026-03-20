"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/actions/clients"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"
import { Plus, UserPlus, Loader2 } from "lucide-react"

export function QuickClientDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        const res = await createClient(formData)
        setLoading(false)

        if (res.error) {
            alert(res.error)
        } else {
            setOpen(false)
            router.refresh()
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="icon" variant="outline" className="shrink-0" title="Ajouter un client">
                    <UserPlus size={16} />
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Nouveau Client Rapide</DialogTitle>
                </DialogHeader>
                <form action={handleSubmit} className="space-y-4 py-2">
                    <div className="space-y-2">
                        <Label>Nom Complet</Label>
                        <Input name="name" required placeholder="Jean Dupont" />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input name="email" type="email" required placeholder="client@exemple.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Téléphone</Label>
                        <Input name="phone" placeholder="(555) 123-4567" />
                    </div>
                    <div className="space-y-2">
                        <Label>Adresse/Ville</Label>
                        <Input name="address" placeholder="Montréal, QC" />
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin mr-2" size={16} /> : null}
                            Créer Client
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
