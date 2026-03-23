"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getJobByAccessKey } from "@/lib/actions/client-view"
import { getClientReferralData } from "@/lib/actions/referral"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Clock, CheckCircle2, ShieldCheck, Zap, Phone, MapPin, Construction, Sparkles, Car, Trophy } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface LiveStatusProps {
    job: any
    activeTimeLog?: any
}

export function LiveStatus({ job: initialJob, activeTimeLog }: LiveStatusProps) {
    const [job, setJob] = useState(initialJob)
    const [seconds, setSeconds] = useState(0)
    const [progress, setProgress] = useState(0)
    const [referralData, setReferralData] = useState<any>(null)

    useEffect(() => {
        async function loadReferral() {
            const data = await getClientReferralData(job.client.id)
            setReferralData(data)
        }
        loadReferral()
    }, [job.client.id])

    // Calculate progress based on done services
    useEffect(() => {
        const total = job.services.length
        const done = job.services.filter((s: any) => s.isDone).length
        setProgress(total > 0 ? (done / total) * 100 : 0)
    }, [job.services])

    // Timer logic for active session
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (activeTimeLog) {
            const start = new Date(activeTimeLog.startTime).getTime()
            interval = setInterval(() => {
                const now = new Date().getTime()
                setSeconds(Math.floor((now - start) / 1000))
            }, 1000)
        }
        return () => clearInterval(interval)
    }, [activeTimeLog])

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600)
        const m = Math.floor((totalSeconds % 3600) / 60)
        const s = totalSeconds % 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Brand Header */}
            <div className="flex flex-col items-center text-center space-y-2 py-6">
                <div className="bg-primary/10 px-4 py-1 rounded-full text-xs font-bold text-primary uppercase tracking-[0.3em] flex items-center gap-2">
                    <Sparkles size={14} /> DRS Detailing Experience
                </div>
                <h1 className="text-4xl font-black uppercase text-gradient-brand tracking-tighter sm:text-5xl">
                    Live <span className="text-white">Shop</span>
                </h1>
                <p className="text-slate-400 max-w-xs text-sm">Votre véhicule est entre de bonnes mains. Suivez la transformation en direct.</p>
            </div>

            {/* Primary Status Card */}
            <Card className="border-primary/20 bg-slate-900/50 backdrop-blur-md shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Zap size={120} className="text-primary" />
                </div>
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center mb-4">
                        <Badge variant="outline" className="border-primary/30 text-primary bg-primary/5 uppercase tracking-widest px-3 py-1">
                            Status: {job.status}
                        </Badge>
                        <div className="flex items-center gap-2 text-slate-400 text-xs">
                            <Clock size={14} /> Mise à jour en direct
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <CardTitle className="text-3xl font-bold font-display uppercase">Progression</CardTitle>
                            <span className="text-primary font-black text-2xl">{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-4 rounded-full bg-slate-800" />
                    </div>
                </CardHeader>
                <CardContent className="pt-6 grid grid-cols-2 gap-4 border-t border-slate-800/50 mt-4">
                     <div className="space-y-1">
                         <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Chronomètre de session</p>
                         <p className={cn(
                             "text-2xl font-mono font-bold tracking-tighter",
                             activeTimeLog ? "text-primary animate-pulse" : "text-slate-600"
                         )}>
                             {activeTimeLog ? formatTime(seconds) : "00:00:00"}
                         </p>
                     </div>
                     <div className="space-y-1">
                         <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Sortie prévue</p>
                         <p className="text-xl font-bold">{new Date(job.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                     </div>
                </CardContent>
            </Card>

            {/* Service Timeline */}
            <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 pl-1">Avancement des étapes</h3>
                <div className="grid gap-3">
                    {job.services.map((svc: any) => (
                        <div key={svc.serviceId} className={cn(
                            "group p-4 rounded-2xl border transition-all duration-500",
                            svc.isDone 
                                ? "bg-primary/10 border-primary/20 opacity-100" 
                                : "bg-slate-900/40 border-slate-800 opacity-60"
                        )}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "size-10 rounded-xl flex items-center justify-center transition-colors shadow-lg",
                                        svc.isDone ? "bg-primary text-primary-foreground" : "bg-slate-800 text-slate-500"
                                    )}>
                                        {svc.isDone ? <CheckCircle2 size={24} /> : <Construction size={22} />}
                                    </div>
                                    <div>
                                        <p className={cn(
                                            "font-bold uppercase tracking-wide",
                                            svc.isDone ? "text-white" : "text-slate-400"
                                        )}>
                                            {svc.service.name}
                                        </p>
                                        <p className="text-[10px] text-slate-500 uppercase">{svc.isDone ? "Terminé" : "En attente"}</p>
                                    </div>
                                </div>
                                {svc.isDone && (
                                    <Badge className="bg-primary/20 text-primary border-none text-[8px] px-2 py-0">QUALITÉ OK</Badge>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Inspection Card (Quick View) */}
            {job.inspections.length > 0 && (
                 <Card className="bg-slate-900/40 border-dashed border-2 lg:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                            <ShieldCheck size={16} /> Rapport d'Inspection d'Entrée
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center py-6">
                        <div className="relative w-full max-w-[200px]">
                             <CarSVGReadonly points={job.inspections[0].points} />
                        </div>
                        <p className="text-[10px] text-slate-500 text-center mt-4 uppercase max-w-[200px]">
                            {job.inspections[0].points.length} anomalies identifiées et documentées avant traitement.
                        </p>
                    </CardContent>
                 </Card>
            )}

            {/* Footer Contact */}
            <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-50">
                <div className="bg-slate-900 border border-slate-800 p-3 rounded-2xl shadow-2xl flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-slate-800 overflow-hidden border border-slate-700">
                             {/* Placeholder avatar or job employee */}
                             <div className="size-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                                 {job.employees[0]?.user.name?.[0] || "D"}
                             </div>
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white uppercase">{job.employees[0]?.user.name || "Équipe DRS"}</p>
                            <p className="text-[10px] text-slate-500">Votre Expert Detailing</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                         <a href="tel:555-555-5555" className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition-colors">
                             <Phone size={18} className="text-primary" />
                         </a>
                         <a href="mailto:info@drs.com" className="bg-primary p-2 rounded-xl text-primary-foreground hover:bg-primary/90 transition-colors">
                             <Zap size={18} fill="currentColor" />
                         </a>
                    </div>
                </div>
            </div>

            {/* Referral & Rewards */}
            {referralData && (
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden relative group">
                    <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                        <Sparkles size={120} className="text-primary" />
                    </div>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-xl font-display uppercase tracking-widest flex items-center gap-2">
                            <Trophy className="text-primary" size={20} /> Devenez Ambassadeur
                        </CardTitle>
                        <CardDescription className="text-xs uppercase font-bold tracking-tighter text-slate-500">Gagnez des Points Brillance</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">Votre Solde</p>
                                    <div className="text-3xl font-black font-display text-white">{referralData.loyaltyPoints} PTS</div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">Parrainages</p>
                                    <div className="text-xl font-bold text-primary">{referralData._count.referrals}</div>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                                    <span>Prochain Cadeau : Lavage Offert</span>
                                    <span>{referralData.loyaltyPoints} / 500</span>
                                </div>
                                <Progress value={(referralData.loyaltyPoints / 500) * 100} className="h-2 bg-slate-950" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">Votre Code de Parrainage</label>
                            <div className="flex gap-2">
                                <div className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 font-mono font-bold text-primary text-center tracking-widest uppercase">
                                    {referralData.referralCode?.slice(0, 8)}
                                </div>
                                <Button 
                                    className="rounded-xl px-6 bg-primary text-primary-foreground font-black uppercase text-xs tracking-widest"
                                    onClick={() => {
                                        navigator.clipboard.writeText(referralData.referralCode?.slice(0, 8))
                                        toast.success("Code copié !")
                                    }}
                                >
                                    COPIER
                                </Button>
                            </div>
                            <p className="text-[10px] text-center text-slate-500 uppercase tracking-tight italic">
                                Partagez ce code : +100 PTS pour vous, +50 PTS pour votre ami !
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function CarSVGReadonly({ points }: { points: any[] }) {
    return (
        <svg viewBox="0 0 100 200" className="w-full text-slate-700">
            <path d="M30 15 Q50 5 70 15 L75 40 Q85 60 85 100 L85 160 Q85 190 70 195 L30 195 Q15 190 15 160 L15 100 Q15 60 25 40 Z" fill="none" stroke="currentColor" strokeWidth="2" />
            {points.map((p) => (
                <circle 
                    key={p.id} 
                    cx={p.x} 
                    cy={p.y} 
                    r="4" 
                    className={p.type === "SCRATCH" ? "fill-red-500" : "fill-orange-500"} 
                />
            ))}
        </svg>
    )
}
