"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Sun, CloudRain, Loader2, Zap, Send, Info, TrendingUp } from "lucide-react"
import { getWeatherCampaignStats, sendWeatherCampaign } from "@/lib/actions/weather"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function WeatherCampaign() {
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSending, setIsSending] = useState(false)

    useEffect(() => {
        async function load() {
            const res = await getWeatherCampaignStats()
            setStats(res)
            setIsLoading(false)
        }
        load()
    }, [])

    const handleSend = async () => {
        setIsSending(true)
        const res = await sendWeatherCampaign() as { success?: boolean; error?: string }
        if (res.error) toast.error(res.error)
        else {
            toast.success("Campagne météo lancée !")
            setStats({...stats, available: false}) // Optimization: mark as sent/done for now
        }
        setIsSending(false)
    }

    if (isLoading) return <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

    return (
        <Card className={cn(
            "border-2 transition-all duration-700",
            stats?.available ? "border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.1)]" : "border-border"
        )}>
            <CardHeader className="pb-2">
                <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded">
                         <Sun size={12} /> Forecast Intelligence
                    </div>
                </div>
                <CardTitle className="text-xl font-display uppercase tracking-wider">Alerte <span className="text-amber-500">Soleil Prochain</span></CardTitle>
                <CardDescription>
                    L'IA détecte une fenêtre météo favorable pour le detailing.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {stats?.available ? (
                    <div className="space-y-4 animate-in zoom-in-95 duration-500">
                        <div className="bg-amber-500/5 p-4 rounded-2xl border border-amber-500/20">
                            <div className="flex items-center gap-4 text-amber-500 mb-4">
                                <div className="size-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                                    <Sun size={28} className="animate-pulse" />
                                </div>
                                <div>
                                    <p className="text-lg font-black tracking-tight">Ciel Dégagé Prévu</p>
                                    <p className="text-xs text-amber-500/70">Prochains 48h sans pluie · 22°C moy.</p>
                                </div>
                            </div>
                            
                            <div className="space-y-2">
                                <p className="text-xs font-medium text-slate-400">Opportunité détectée :</p>
                                <div className="text-2xl font-black font-display tracking-tight text-white">
                                    {stats.count} <span className="text-sm font-normal text-slate-500">Clients n'ont pas visité depuis 14j+</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-2">
                            <Button 
                                className="w-full h-12 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-black uppercase tracking-widest group"
                                onClick={handleSend}
                                disabled={isSending}
                            >
                                {isSending ? <Loader2 className="animate-spin" /> : (
                                    <>
                                        LANCER LA RELANCE <Zap size={18} fill="currentColor" className="ml-2 group-hover:scale-125 transition-transform" />
                                    </>
                                )}
                            </Button>
                            <p className="text-[10px] text-center text-slate-500 uppercase tracking-tighter">
                                Envoie un email "Upgrade Brillance" automatique.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-6 text-center opacity-40">
                        <CloudRain size={40} className="text-slate-500 mb-3" />
                        <h4 className="text-sm font-bold uppercase tracking-widest">Veille Météo</h4>
                        <p className="text-xs text-slate-500 mt-1">{stats?.reason || "Conditions non optimales pour une campagne."}</p>
                    </div>
                )}

            </CardContent>
        </Card>
    )
}
