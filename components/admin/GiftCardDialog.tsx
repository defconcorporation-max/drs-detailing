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
import { Wallet, Gift, Plus } from "lucide-react"
import { createGiftCard } from "@/lib/actions/giftcards"
import { useRouter } from "next/navigation"

export function GiftCardDialog() {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    async function onSubmit(formData: FormData) {
        const res = await createGiftCard(formData)
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
                <Button variant="outline" className="gap-2 border-primary/20 hover:bg-primary/5">
                    <Gift size={16} />
                    Nouvelle Carte Cadeau
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle>Émettre une Carte Cadeau</DialogTitle>
                    <DialogDescription>
                        Générez un crédit prépayé pour un client.
                    </DialogDescription>
                </DialogHeader>
                <form action={onSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="amount">Montant ($)</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" placeholder="100.00" required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="code">Code (Optionnel)</Label>
                        <Input id="code" name="code" placeholder="Laissez vide pour auto-générer" />
                    </div>
                    <DialogFooter>
                        <Button type="submit" className="w-full">Créer la Carte</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
