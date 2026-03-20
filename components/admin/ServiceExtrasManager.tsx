"use client"

import { useState } from "react"
import { createServiceExtra, deleteServiceExtra } from "@/lib/actions/services"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog"
import { ListPlus, Trash2 } from "lucide-react"

type Extra = { id: string; label: string; priceExtra: number; durationExtraMin: number }

export function ServiceExtrasManager({ serviceId, serviceName, extras }: { serviceId: string; serviceName: string; extras: Extra[] }) {
    const [open, setOpen] = useState(false)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm" className="gap-1 rounded-lg text-xs">
                    <ListPlus className="size-3.5" />
                    Extras ({extras.length})
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle className="font-display uppercase">Extras — {serviceName}</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                    VUS, pickup, dégâts majeurs, etc. Ajoutent du temps et/ou du prix au rendez-vous lorsque le client (ou l&apos;admin)
                    les coche.
                </p>

                <ul className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border/50 p-2">
                    {extras.length === 0 && <li className="text-sm text-muted-foreground">Aucun extra pour l&apos;instant.</li>}
                    {extras.map((ex) => (
                        <li key={ex.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/30 px-2 py-1.5 text-sm">
                            <div>
                                <span className="font-medium">{ex.label}</span>
                                <span className="ml-2 text-xs text-muted-foreground">
                                    +{ex.durationExtraMin} min
                                    {ex.priceExtra > 0 && ` · +${ex.priceExtra.toFixed(2)} $`}
                                </span>
                            </div>
                            <form
                                action={async () => {
                                    await deleteServiceExtra(ex.id)
                                }}
                            >
                                <Button type="submit" size="icon" variant="ghost" className="size-8 text-destructive" title="Supprimer">
                                    <Trash2 className="size-3.5" />
                                </Button>
                            </form>
                        </li>
                    ))}
                </ul>

                <form
                    action={async (fd) => {
                        const r = await createServiceExtra(serviceId, fd)
                        if (r && "error" in r && r.error) alert(r.error)
                    }}
                    className="space-y-3 rounded-xl border border-dashed border-primary/30 p-3"
                >
                    <p className="text-xs font-semibold uppercase text-primary">Nouvel extra</p>
                    <div className="space-y-1">
                        <Label className="text-xs">Libellé</Label>
                        <Input name="label" placeholder="ex. VUS / grand véhicule" required className="h-9" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                            <Label className="text-xs">+ Durée (min)</Label>
                            <Input name="durationExtraMin" type="number" min={0} defaultValue={15} className="h-9" />
                        </div>
                        <div className="space-y-1">
                            <Label className="text-xs">+ Prix ($)</Label>
                            <Input name="priceExtra" type="number" step="0.01" min={0} defaultValue={0} className="h-9" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" size="sm" className="w-full rounded-lg">
                            Ajouter l&apos;extra
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
