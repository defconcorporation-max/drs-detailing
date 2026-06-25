"use client"

import { useState } from "react"
import { Save, Loader2, Sparkles, CheckSquare, Settings } from "lucide-react"
import { updateAutomationSettings } from "@/lib/actions/settings"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

type AutomationSettingsProps = {
    initialSettings: {
        smsConfirmEnabled: boolean
        smsConfirmTemplate: string
        smsJ1Enabled: boolean
        smsJ1Template: string
        smsH2Enabled: boolean
        smsH2Template: string
        smsM7Enabled: boolean
        smsM7Template: string
        smsRetention30Enabled: boolean
        smsRetention30Template: string
        smsRetention60Enabled: boolean
        smsRetention60Template: string
    }
}

export function AutomationSettingsForm({ initialSettings }: AutomationSettingsProps) {
    const [settings, setSettings] = useState(initialSettings)
    const [saving, setSaving] = useState(false)

    const handleToggle = (key: keyof typeof initialSettings) => {
        setSettings(prev => ({
            ...prev,
            [key]: !prev[key]
        }))
    }

    const handleTextChange = (key: keyof typeof initialSettings, value: string) => {
        setSettings(prev => ({
            ...prev,
            [key]: value
        }))
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        const res = await updateAutomationSettings(settings as any)
        setSaving(false)
        if (res.success) {
            toast.success("Automatisations enregistrées avec succès !")
        } else {
            toast.error(res.error || "Erreur de sauvegarde")
        }
    }

    return (
        <form onSubmit={handleSave} className="space-y-8 max-w-4xl">
            {/* Top Info Bar */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground flex flex-col gap-2">
                <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider">
                    <Sparkles size={14} /> Variables disponibles pour vos messages
                </div>
                <p className="leading-relaxed">
                    Vous pouvez insérer des variables dynamiques qui seront automatiquement remplacées lors de l'envoi :
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-1 font-mono text-[10px] text-foreground">
                    <div className="bg-background/60 p-1.5 rounded border border-border/40"><strong>{"{name}"}</strong> : Nom complet du client</div>
                    <div className="bg-background/60 p-1.5 rounded border border-border/40"><strong>{"{date}"}</strong> : Date du RDV (ex: 2026-06-26)</div>
                    <div className="bg-background/60 p-1.5 rounded border border-border/40"><strong>{"{time}"}</strong> : Heure du RDV (ex: 08:00)</div>
                </div>
            </div>

            {/* Block 1: Confirmation */}
            <Card className="border-border/40 bg-card/50">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-base font-bold">1. Confirmation de réservation</CardTitle>
                            <CardDescription className="text-xs">
                                Envoyé instantanément au client dès que vous passez son rendez-vous au statut "Confirmé".
                            </CardDescription>
                        </div>
                        <button
                            type="button"
                            onClick={() => handleToggle("smsConfirmEnabled")}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                settings.smsConfirmEnabled ? "bg-primary" : "bg-muted"
                            }`}
                        >
                            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                                settings.smsConfirmEnabled ? "translate-x-5" : "translate-x-0"
                            }`} />
                        </button>
                    </div>
                </CardHeader>
                {settings.smsConfirmEnabled && (
                    <CardContent className="space-y-4 pt-0">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-muted-foreground">Message personnalisé</Label>
                            <Textarea
                                value={settings.smsConfirmTemplate}
                                onChange={(e) => handleTextChange("smsConfirmTemplate", e.target.value)}
                                className="min-h-[80px] resize-none text-xs"
                                placeholder="Bonjour {name}..."
                            />
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Block 2: Reminders */}
            <Card className="border-border/40 bg-card/50">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold">2. Rappels automatiques (J-1, Jour J &amp; H-2)</CardTitle>
                    <CardDescription className="text-xs">
                        SMS envoyés automatiquement par le serveur selon l'échéance du rendez-vous.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-0 divide-y divide-border/40">
                    
                    {/* J-1 */}
                    <div className="space-y-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-bold text-foreground block">Rappel la veille (24h avant)</Label>
                                <span className="text-xs text-muted-foreground block mt-0.5">Envoi automatique 24 heures avant l&apos;heure du rendez-vous.</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle("smsJ1Enabled")}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    settings.smsJ1Enabled ? "bg-primary" : "bg-muted"
                                }`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                                    settings.smsJ1Enabled ? "translate-x-5" : "translate-x-0"
                                }`} />
                            </button>
                        </div>
                        {settings.smsJ1Enabled && (
                            <div className="space-y-1.5">
                                <Textarea
                                    value={settings.smsJ1Template}
                                    onChange={(e) => handleTextChange("smsJ1Template", e.target.value)}
                                    className="min-h-[80px] resize-none text-xs"
                                />
                            </div>
                        )}
                    </div>

                    {/* Same day morning */}
                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-bold text-foreground block">Rappel le matin même à 7h00</Label>
                                <span className="text-xs text-muted-foreground block mt-0.5">Envoyé à 7h00 pile le jour de la prestation.</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle("smsM7Enabled")}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    settings.smsM7Enabled ? "bg-primary" : "bg-muted"
                                }`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                                    settings.smsM7Enabled ? "translate-x-5" : "translate-x-0"
                                }`} />
                            </button>
                        </div>
                        {settings.smsM7Enabled && (
                            <div className="space-y-1.5">
                                <Textarea
                                    value={settings.smsM7Template}
                                    onChange={(e) => handleTextChange("smsM7Template", e.target.value)}
                                    className="min-h-[80px] resize-none text-xs"
                                />
                            </div>
                        )}
                    </div>

                    {/* H-2 */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-bold text-foreground block">Rappel express H-2 (2h avant)</Label>
                                <span className="text-xs text-muted-foreground block mt-0.5">Rappel final envoyé 2 heures avant le début prévu.</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle("smsH2Enabled")}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    settings.smsH2Enabled ? "bg-primary" : "bg-muted"
                                }`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                                    settings.smsH2Enabled ? "translate-x-5" : "translate-x-0"
                                }`} />
                            </button>
                        </div>
                        {settings.smsH2Enabled && (
                            <div className="space-y-1.5">
                                <Textarea
                                    value={settings.smsH2Template}
                                    onChange={(e) => handleTextChange("smsH2Template", e.target.value)}
                                    className="min-h-[80px] resize-none text-xs"
                                />
                            </div>
                        )}
                    </div>

                </CardContent>
            </Card>

            {/* Block 3: Retention */}
            <Card className="border-border/40 bg-card/50">
                <CardHeader className="pb-4">
                    <CardTitle className="text-base font-bold">3. Relances de Rétention Automatique</CardTitle>
                    <CardDescription className="text-xs">
                        SMS de fidélisation envoyés aux clients inactifs à 9h00 du matin.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-0 divide-y divide-border/40">
                    
                    {/* 1 Month */}
                    <div className="space-y-4 pb-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-bold text-foreground block">Relance 1 Mois (30 jours après le service)</Label>
                                <span className="text-xs text-muted-foreground block mt-0.5">Envoyé exactement 30 jours après leur dernière prestation complétée.</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle("smsRetention30Enabled")}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    settings.smsRetention30Enabled ? "bg-primary" : "bg-muted"
                                }`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                                    settings.smsRetention30Enabled ? "translate-x-5" : "translate-x-0"
                                }`} />
                            </button>
                        </div>
                        {settings.smsRetention30Enabled && (
                            <div className="space-y-1.5">
                                <Textarea
                                    value={settings.smsRetention30Template}
                                    onChange={(e) => handleTextChange("smsRetention30Template", e.target.value)}
                                    className="min-h-[80px] resize-none text-xs"
                                />
                            </div>
                        )}
                    </div>

                    {/* 2 Months */}
                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label className="text-sm font-bold text-foreground block">Relance 2 Mois (60 jours après le service)</Label>
                                <span className="text-xs text-muted-foreground block mt-0.5">Offre promotionnelle envoyée 60 jours après leur dernière visite.</span>
                            </div>
                            <button
                                type="button"
                                onClick={() => handleToggle("smsRetention60Enabled")}
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                    settings.smsRetention60Enabled ? "bg-primary" : "bg-muted"
                                }`}
                            >
                                <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                                    settings.smsRetention60Enabled ? "translate-x-5" : "translate-x-0"
                                }`} />
                            </button>
                        </div>
                        {settings.smsRetention60Enabled && (
                            <div className="space-y-1.5">
                                <Textarea
                                    value={settings.smsRetention60Template}
                                    onChange={(e) => handleTextChange("smsRetention60Template", e.target.value)}
                                    className="min-h-[80px] resize-none text-xs"
                                />
                            </div>
                        )}
                    </div>

                </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
                <Button type="submit" disabled={saving} className="gap-2 px-6 rounded-xl font-bold uppercase tracking-wider text-xs h-11">
                    {saving ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Sauvegarde...
                        </>
                    ) : (
                        <>
                            <Save size={16} />
                            Enregistrer les automatisations
                        </>
                    )}
                </Button>
            </div>
        </form>
    )
}
