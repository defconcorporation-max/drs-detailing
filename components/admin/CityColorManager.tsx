"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { updateCityColors } from "@/lib/actions/settings"
import { Plus, Trash2, Save, MapPin } from "lucide-react"

const PRESET_COLORS = [
    "#3b82f6", // blue
    "#f59e0b", // amber
    "#ec4899", // pink
    "#ef4444", // red
    "#10b981", // green
    "#8b5cf6", // violet
    "#f97316", // orange
    "#06b6d4", // cyan
    "#84cc16", // lime
    "#6366f1", // indigo
]

const SUGGESTED_CITIES = [
    "Montréal", "Laval", "Longueuil", "Brossard", "Saint-Jérôme",
    "Saint-Sauveur", "Blainville", "Terrebonne", "Repentigny", "Boisbriand",
    "Mirabel", "Mascouche", "Sainte-Thérèse", "Rosemère", "Deux-Montagnes",
]

type CityEntry = { city: string; color: string }

export function CityColorManager({ initialColors }: { initialColors: Record<string, string> }) {
    const [entries, setEntries] = useState<CityEntry[]>(
        Object.entries(initialColors).map(([city, color]) => ({ city, color }))
    )
    const [saving, setSaving] = useState(false)

    const addEntry = (cityName?: string) => {
        const nextColor = PRESET_COLORS[entries.length % PRESET_COLORS.length]
        setEntries((prev) => [...prev, { city: cityName || "", color: nextColor }])
    }

    const remove = (i: number) => setEntries((prev) => prev.filter((_, idx) => idx !== i))

    const update = (i: number, field: keyof CityEntry, val: string) => {
        setEntries((prev) => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e))
    }

    const save = async () => {
        const map: Record<string, string> = {}
        for (const { city, color } of entries) {
            if (city.trim()) map[city.trim()] = color
        }
        setSaving(true)
        const res = await updateCityColors(map)
        setSaving(false)
        if (res.error) toast.error(res.error)
        else toast.success("Couleurs des villes sauvegardées !")
    }

    // Suggested cities not yet added
    const notAdded = SUGGESTED_CITIES.filter((c) => !entries.find((e) => e.city === c))

    return (
        <div className="space-y-6">
            {/* Current entries */}
            <div className="space-y-3">
                {entries.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                        Aucune ville configurée. Ajoutez-en ci-dessous.
                    </p>
                )}
                {entries.map((entry, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <div className="relative">
                            <input
                                type="color"
                                value={entry.color}
                                onChange={(e) => update(i, "color", e.target.value)}
                                className="w-10 h-10 rounded-lg border border-border cursor-pointer p-0.5 bg-transparent"
                                title="Choisir une couleur"
                            />
                        </div>
                        <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: entry.color }}
                        />
                        <Input
                            value={entry.city}
                            onChange={(e) => update(i, "city", e.target.value)}
                            placeholder="Nom de la ville"
                            className="flex-1 h-10"
                        />
                        <button
                            onClick={() => remove(i)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))}
            </div>

            {/* Add new */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => addEntry()}
                className="gap-2 rounded-xl"
            >
                <Plus size={14} /> Ajouter une ville
            </Button>

            {/* Quick add suggestions */}
            {notAdded.length > 0 && (
                <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">Ajout rapide :</p>
                    <div className="flex flex-wrap gap-2">
                        {notAdded.slice(0, 10).map((city) => (
                            <button
                                key={city}
                                onClick={() => addEntry(city)}
                                className="text-xs px-2.5 py-1 rounded-full border border-border/60 bg-muted/30 hover:bg-muted/60 hover:border-primary/40 transition-colors flex items-center gap-1"
                            >
                                <MapPin size={10} />
                                {city}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Preview */}
            {entries.length > 0 && (
                <div>
                    <p className="text-xs text-muted-foreground font-medium mb-2">Aperçu :</p>
                    <div className="flex flex-wrap gap-2">
                        {entries.filter((e) => e.city.trim()).map((e, i) => (
                            <span
                                key={i}
                                className="text-xs px-2.5 py-1 rounded-full font-semibold"
                                style={{
                                    backgroundColor: e.color + "33",
                                    color: e.color,
                                    border: `1px solid ${e.color}66`
                                }}
                            >
                                {e.city}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Save */}
            <Button onClick={save} disabled={saving} className="gap-2 w-full sm:w-auto">
                <Save size={16} />
                {saving ? "Sauvegarde..." : "Enregistrer les couleurs"}
            </Button>
        </div>
    )
}
