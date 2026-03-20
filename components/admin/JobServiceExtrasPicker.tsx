"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

export type ServiceWithExtras = {
    id: string
    name: string
    extras: Array<{ id: string; label: string; priceExtra: number; durationExtraMin: number }>
}

type Props = {
    services: ServiceWithExtras[]
    selectedServiceIds: string[]
    value: Record<string, string[]>
    onChange: (next: Record<string, string[]>) => void
    className?: string
}

export function JobServiceExtrasPicker({ services, selectedServiceIds, value, onChange, className }: Props) {
    function toggleExtra(serviceId: string, extraId: string) {
        const cur = value[serviceId] ?? []
        const nextIds = cur.includes(extraId) ? cur.filter((x) => x !== extraId) : [...cur, extraId]
        onChange({ ...value, [serviceId]: nextIds })
    }

    return (
        <div className={cn("space-y-4 rounded-xl border border-border/60 bg-muted/20 p-3", className)}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Extras par service</p>
            {selectedServiceIds.length === 0 && (
                <p className="text-sm text-muted-foreground">Sélectionnez d&apos;abord des services ci-dessus.</p>
            )}
            {selectedServiceIds.map((sid) => {
                const svc = services.find((s) => s.id === sid)
                if (!svc) return null
                if (!svc.extras?.length) {
                    return (
                        <div key={sid} className="text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{svc.name}</span> — aucun extra défini (Services → gérer les
                            extras).
                        </div>
                    )
                }
                return (
                    <div key={sid} className="space-y-2 rounded-lg border border-border/40 bg-card/40 p-3">
                        <p className="text-sm font-semibold">{svc.name}</p>
                        <div className="grid gap-2 sm:grid-cols-2">
                            {svc.extras.map((ex) => {
                                const checked = (value[sid] ?? []).includes(ex.id)
                                return (
                                    <div key={ex.id} className="flex items-start gap-2">
                                        <Checkbox
                                            id={`ex-${sid}-${ex.id}`}
                                            checked={checked}
                                            onCheckedChange={() => toggleExtra(sid, ex.id)}
                                        />
                                        <Label htmlFor={`ex-${sid}-${ex.id}`} className="cursor-pointer text-sm font-normal leading-tight">
                                            {ex.label}
                                            <span className="mt-0.5 block text-[11px] text-muted-foreground">
                                                +{ex.durationExtraMin} min
                                                {ex.priceExtra > 0 && ` · +${ex.priceExtra.toFixed(2)} $`}
                                            </span>
                                        </Label>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
