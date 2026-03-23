"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Play, Square, CheckCircle2, Clock, User, Car, Check, AlertCircle, Plus, Sparkles, Loader2, Shield, Mic, MicOff } from "lucide-react"
import { startTimeLog, stopTimeLog } from "@/lib/actions/time"
import { toggleJobServiceDone, updateJobStatus } from "@/lib/actions/jobs"
import { createInspection } from "@/lib/actions/inspections"
import { recordProductUsage } from "@/lib/actions/inventory"
import { addExperience } from "@/lib/actions/gamification"
import { triggerNpsAutomation } from "@/lib/actions/nps"
import { EmployeeStats } from "./EmployeeStats"
import { InspectionCanvas } from "./InspectionCanvas"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

import { 
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface JobExecutionProps {
    job: any
    activeTimeLog?: any
    inspections: any[]
    inventoryItems: any[]
    productUsages: any[]
    employeeProfile: any
    employeeId: string
}

export function JobExecution({ job, activeTimeLog, inspections: initialInspections, inventoryItems, productUsages: initialUsages, employeeProfile, employeeId }: JobExecutionProps) {
    const [isRunning, setIsRunning] = useState(!!activeTimeLog)
    const [seconds, setSeconds] = useState(0)
    const [inspections, setInspections] = useState(initialInspections)
    const [usages, setUsages] = useState(initialUsages)
    const [isCreatingInspection, setIsCreatingInspection] = useState(false)
    const [selectedProduct, setSelectedProduct] = useState("")
    const [qty, setQty] = useState("0")
    const [isRecordingUsage, setIsRecordingUsage] = useState(false)
    const [isShowroomMode, setIsShowroomMode] = useState(false)
    const [isListening, setIsListening] = useState(false)
    
    // Exit Checklist State
    const [exitChecklist, setExitChecklist] = useState({
        keys: false,
        belongings: false,
        finalPhotos: false,
        walkaround: false
    })

    const checkIn = inspections.find(i => i.type === "CHECK_IN")

    // Actualiser le timer si un log est actif
    useEffect(() => {
        let interval: NodeJS.Timeout
        if (isRunning && activeTimeLog) {
            const start = new Date(activeTimeLog.startTime).getTime()
            interval = setInterval(() => {
                const now = new Date().getTime()
                setSeconds(Math.floor((now - start) / 1000))
            }, 1000)
        } else {
            setSeconds(0)
        }
        return () => clearInterval(interval)
    }, [isRunning, activeTimeLog])

    const formatTime = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600)
        const m = Math.floor((totalSeconds % 3600) / 60)
        const s = totalSeconds % 60
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }

    const handleStart = async () => {
        const res = await startTimeLog(job.id, employeeId)
        if (res.error) toast.error(res.error)
        else {
            setIsRunning(true)
            toast.success("Chronomètre démarré")
        }
    }

    const handleStop = async () => {
        if (!activeTimeLog) return
        const res = await stopTimeLog(activeTimeLog.id)
        if (res.error) toast.error(res.error)
        else {
            setIsRunning(false)
            toast.success("Chronomètre arrêté")
        }
    }

    const handleToggleService = async (serviceId: string, checked: boolean) => {
        const res = await toggleJobServiceDone(job.id, serviceId, checked)
        if (res.error) toast.error(res.error)
        else {
            toast.success(checked ? "Service marqué comme fait" : "Service réouvert")
        }
    }

    const handleCreateCheckIn = async () => {
        setIsCreatingInspection(true)
        const res = await createInspection(job.id, "CHECK_IN", employeeId)
        if (res.error) toast.error(res.error)
        else {
            setInspections([res.inspection, ...inspections])
            toast.success("Inspection Check-in créée")
        }
        setIsCreatingInspection(false)
    }

    const isExitChecklistComplete = Object.values(exitChecklist).every(Boolean)

    const handleCompleteJob = async () => {
        if (!isExitChecklistComplete) {
            toast.error("Veuillez compléter la check-list de sortie.")
            return
        }
        const res = await updateJobStatus(job.id, "COMPLETED")
        if (res.error) toast.error(res.error)
        else {
            toast.success("Job marqué comme terminé !")
            
            // Trigger NPS
            await triggerNpsAutomation(job.id)
            toast.info("Relance NPS envoyée au client")

            // Reward XP
            const gamification = await addExperience(employeeId, 100) // 100 XP per job
            if (gamification.success) {
                toast.success("+100 XP d'expérience technique !")
                if (gamification.levelUp) {
                    toast.success(`Niveau Supérieur ! Bienvenue au Niveau ${gamification.newLevel}`, {
                        icon: <Sparkles className="text-amber-500" />
                    })
                }
            }
        }
    }

    const handleRecordUsage = async () => {
        if (!selectedProduct || parseFloat(qty) <= 0) return
        setIsRecordingUsage(true)
        const res = await recordProductUsage({
            jobId: job.id,
            itemId: selectedProduct,
            quantityUsed: parseFloat(qty),
            unit: "ml" // Dynamic if needed
        })

        if (res.error) toast.error(res.error)
        else {
            setUsages([res.usage, ...usages])
            toast.success("Consommation enregistrée")
            setQty("0")
        }
        setIsRecordingUsage(false)
    }

    // Voice Command Logic
    useEffect(() => {
        if (!isListening) return

        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition
        if (!SpeechRecognition) {
            toast.error("Reconnaissance vocale non supportée")
            setIsListening(false)
            return
        }

        const recognition = new SpeechRecognition()
        recognition.lang = 'fr-FR'
        recognition.continuous = true
        recognition.interimResults = false

        recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase()
            console.log("Voice Command:", transcript)

            if (transcript.includes("démarrer") || transcript.includes("commencer")) {
                if (!isRunning) handleStart()
            } else if (transcript.includes("arrêter") || transcript.includes("terminer") || transcript.includes("pause")) {
                if (isRunning) handleStop()
            } else if (transcript.includes("fini") || transcript.includes("fait")) {
                 // Try to match a service name (very basic)
                 job.services.forEach((js: any) => {
                     if (transcript.includes(js.service.name.toLowerCase())) {
                         handleToggleService(js.serviceId, true)
                     }
                 })
            }
        }

        recognition.onerror = () => setIsListening(false)
        recognition.start()

        return () => recognition.stop()
    }, [isListening, isRunning])

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            {/* Showroom & Voice Toggles */}
            <div className="flex justify-end gap-4">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className={cn(
                        "text-[10px] uppercase font-bold tracking-widest transition-all gap-2",
                        isListening ? "text-red-500" : "text-slate-500"
                    )}
                    onClick={() => setIsListening(!isListening)}
                >
                    {isListening ? <Mic size={14} className="animate-pulse" /> : <MicOff size={14} />}
                    {isListening ? "Écoute active..." : "Activer Voice Control"}
                </Button>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[10px] uppercase font-bold tracking-widest text-slate-500 hover:text-primary"
                    onClick={() => setIsShowroomMode(!isShowroomMode)}
                >
                    {isShowroomMode ? "Mode Standard" : "Mode Showroom / Tablette"}
                </Button>
            </div>

            {isShowroomMode ? (
                <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                    {/* Simplified High-Visibility UI */}
                    <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                        <div className="size-32 rounded-full border-4 border-primary flex items-center justify-center animate-pulse">
                            <span className="text-5xl font-black font-mono">{formatTime(seconds)}</span>
                        </div>
                        <h2 className="text-4xl font-black uppercase tracking-tighter">
                            {job.vehicle?.make} {job.vehicle?.model}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {job.services.map((js: any) => (
                           <div 
                                key={js.service.id}
                                className={cn(
                                    "p-8 rounded-3xl border-4 flex items-center justify-between transition-all active:scale-95 cursor-pointer",
                                    js.isDone ? "bg-green-500/20 border-green-500 text-green-500" : "bg-slate-900 border-slate-800 text-slate-300"
                                )}
                                onClick={() => handleToggleService(js.service.id, !js.isDone)}
                           >
                                <span className="text-2xl font-black uppercase tracking-tight">{js.service.name}</span>
                                {js.isDone ? <CheckCircle2 size={40} /> : <div className="size-10 rounded-full border-4 border-slate-700" />}
                           </div>
                        ))}
                    </div>

                    <div className="pt-10">
                        <Button 
                            className={cn(
                                "w-full h-24 rounded-[40px] text-3xl font-black uppercase tracking-widest transition-all",
                                isRunning ? "bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.3)]" : "bg-green-500 text-black shadow-[0_0_30px_rgba(34,197,94,0.3)]"
                            )}
                            onClick={isRunning ? handleStop : handleStart}
                        >
                            {isRunning ? "PAUSE" : "DÉMARRER"}
                        </Button>
                    </div>
                </div>
            ) : (
                <>
                {/* Header & Status */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-xl font-bold uppercase tracking-tight text-slate-300">
                        {job.vehicle?.make} {job.vehicle?.model}
                    </h1>
                    <p className="text-muted-foreground">Exécution technique en cours</p>
                </div>
                <div className="flex items-center gap-4">
                    <EmployeeStats employee={employeeProfile} />
                    <Badge className={cn(
                        "text-lg px-4 py-1 rounded-full uppercase font-display tracking-wider",
                        job.status === "COMPLETED" ? "bg-green-500/20 text-green-500 border-green-500/30" : "bg-primary/20 text-primary border-primary/30"
                    )}>
                        {job.status}
                    </Badge>
                </div>
                {job.status !== "COMPLETED" && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-full border-green-500/50 text-green-500 hover:bg-green-500/10 group"
                        onClick={handleCompleteJob}
                    >
                        <CheckCircle2 size={16} className="mr-2" /> 
                        <span className="group-hover:translate-x-1 transition-transform">Finaliser le Job</span>
                    </Button>
                )}
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Timer Card */}
                <Card className={cn(
                    "md:col-span-1 border-2 transition-all duration-500",
                    isRunning ? "border-primary shadow-[0_0_20px_rgba(var(--primary-rgb),0.2)]" : "border-border"
                )}>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                            <Clock size={16} /> Temps passé
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center justify-center py-6">
                        <div className={cn(
                            "text-5xl font-bold font-mono tracking-tighter mb-6",
                            isRunning ? "text-primary animate-pulse" : "text-muted-foreground opacity-50"
                        )}>
                            {formatTime(seconds)}
                        </div>
                        
                        {!isRunning ? (
                            <Button size="lg" className="w-full gap-2 rounded-xl" onClick={handleStart}>
                                <Play size={18} fill="currentColor" /> Démarrer le job
                            </Button>
                        ) : (
                            <Button size="lg" variant="destructive" className="w-full gap-2 rounded-xl" onClick={handleStop}>
                                <Square size={18} fill="currentColor" /> Arrêter
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* Client & Vehicle Quick Info */}
                <Card className="md:col-span-2">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Informations</CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <article className="space-y-1">
                            <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-tighter">
                                <User size={14} /> Client
                            </div>
                            <div className="font-bold text-lg leading-tight">{job.client.user.name}</div>
                            <div className="text-sm text-muted-foreground">{job.client.user.phone || "Pas de téléphone"}</div>
                        </article>
                        <article className="space-y-1">
                            <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-tighter">
                                <Car size={14} /> Véhicule
                            </div>
                            <div className="font-bold text-lg leading-tight">
                                {job.vehicle?.make} {job.vehicle?.model}
                            </div>
                            <div className="text-sm text-muted-foreground">
                                {job.vehicle?.color} · {job.vehicle?.licensePlate || "Sans plaque"}
                            </div>
                        </article>
                    </CardContent>
                </Card>
            </div>

            {/* Service Checklist */}
            <Card className="border-border/40 bg-card/30 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 uppercase tracking-wide">
                        <CheckCircle2 className="text-primary" /> Services à réaliser
                    </CardTitle>
                    <CardDescription>Cochez chaque étape une fois terminée</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-3">
                        {job.services.map((js: any) => (
                            <div 
                                key={js.serviceId} 
                                className={cn(
                                    "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300",
                                    js.isDone 
                                        ? "bg-primary/5 border-primary/20 opacity-80" 
                                        : "bg-background border-border hover:border-primary/30"
                                )}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "flex h-6 w-6 items-center justify-center rounded-full border transition-colors",
                                        js.isDone ? "bg-primary border-primary" : "border-muted-foreground/30"
                                    )}>
                                        <Checkbox 
                                            id={`svc-${js.serviceId}`} 
                                            checked={js.isDone}
                                            onCheckedChange={(checked) => handleToggleService(js.serviceId, checked as boolean)}
                                            className="opacity-0 absolute size-6"
                                        />
                                        {js.isDone && <Check size={14} className="text-primary-foreground font-bold" />}
                                    </div>
                                    <label 
                                        htmlFor={`svc-${js.serviceId}`} 
                                        className={cn(
                                            "font-semibold cursor-pointer select-none",
                                            js.isDone && "line-through text-muted-foreground"
                                        )}
                                    >
                                        {js.service.name}
                                    </label>
                                </div>
                                <div className="hidden sm:block text-xs font-medium text-muted-foreground uppercase tracking-widest bg-secondary px-2 py-1 rounded">
                                    {js.service.durationMin} MIN
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Inspection Section */}
            {checkIn ? (
                <InspectionCanvas 
                    inspection={checkIn} 
                    onPointsChange={() => {}} // Could refetch if needed, but local state in canvas handles it
                />
            ) : (
                <Card className="border-dashed border-2 border-primary/40 bg-primary/5">
                    <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                            <AlertCircle className="text-primary animate-pulse" size={32} />
                        </div>
                        <h3 className="font-bold text-xl uppercase tracking-wider font-display">Check-in requis</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mt-2 mb-8">
                            Avant de commencer le travail, effectuez l'inspection du véhicule pour documenter l'état actuel.
                        </p>
                        <Button 
                            className="rounded-xl gap-2 font-bold px-8" 
                            size="lg"
                            onClick={handleCreateCheckIn}
                            disabled={isCreatingInspection}
                        >
                            <Plus size={20} /> Commencer l'inspection
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Product Usage Section */}
            <Card className="bg-slate-900/40 border-primary/10">
                <CardHeader className="pb-2">
                     <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <Sparkles size={16} /> Consommation Produits
                     </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-3">
                        <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-slate-500">Produit utilisé</Label>
                            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                                <SelectTrigger className="bg-slate-950/50 border-slate-800">
                                    <SelectValue placeholder="Sélectionner..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {inventoryItems.map(item => (
                                        <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-slate-500">Quantité (ml)</Label>
                                <Input 
                                    type="number" 
                                    value={qty} 
                                    onChange={(e) => setQty(e.target.value)}
                                    className="bg-slate-950/50 border-slate-800"
                                />
                            </div>
                            <div className="flex items-end">
                                <Button 
                                    className="w-full bg-primary/20 text-primary border-primary/20 hover:bg-primary/30"
                                    onClick={handleRecordUsage}
                                    disabled={isRecordingUsage || !selectedProduct}
                                >
                                    {isRecordingUsage ? <Loader2 className="animate-spin" /> : "Ajouter"}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* SDS Links if available */}
                    {selectedProduct && inventoryItems.find(i => i.id === selectedProduct)?.sdsUrl && (
                        <div className="bg-red-500/10 border border-red-500/30 p-3 rounded-xl flex items-center justify-between animate-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 text-red-500">
                                <AlertCircle size={16} />
                                <span className="text-[10px] font-bold uppercase tracking-tight">Fiche de Sécurité (FDS) disponible</span>
                            </div>
                            <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-7 text-[10px] border-red-500/50 text-red-500 hover:bg-red-500/20"
                                onClick={() => window.open(inventoryItems.find(i => i.id === selectedProduct)?.sdsUrl, '_blank')}
                            >
                                VOIR FDS
                            </Button>
                        </div>
                    )}

                    <div className="space-y-2 mt-4">
                        {usages.map((u: any) => (
                            <div key={u.id} className="flex justify-between items-center text-xs p-2 rounded bg-slate-950/30 border border-slate-800/50">
                                <span className="font-medium text-slate-300">{u.item.name}</span>
                                <span className="font-mono text-primary">{u.quantityUsed} {u.unit}</span>
                            </div>
                        ))}
                        {usages.length === 0 && <p className="text-[10px] italic text-slate-600 text-center py-2">Aucune consommation enregistrée.</p>}
                    </div>
                </CardContent>
            </Card>

            {/* Secure Exit Checklist */}
            {job.status !== "COMPLETED" && (
                <Card className="bg-orange-500/5 border-orange-500/20 shadow-[0_0_15px_rgba(245,158,11,0.05)]">
                    <CardHeader className="pb-2">
                         <CardTitle className="text-sm font-bold uppercase tracking-widest text-orange-500 flex items-center gap-2">
                            <Shield size={16} /> Check-list de Sortie Sécurisée
                         </CardTitle>
                         <CardDescription className="text-[10px] text-orange-200/50">Vérifiez ces points avant de remettre les clés au client.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <ExitCheckItem 
                            label="Clés du véhicule récupérées et sécurisées" 
                            checked={exitChecklist.keys} 
                            onChange={(v) => setExitChecklist({...exitChecklist, keys: v})} 
                        />
                        <ExitCheckItem 
                            label="Objets personnels du client remis en place" 
                            checked={exitChecklist.belongings} 
                            onChange={(v) => setExitChecklist({...exitChecklist, belongings: v})} 
                        />
                        <ExitCheckItem 
                            label="Photos finales d'inspection prises" 
                            checked={exitChecklist.finalPhotos} 
                            onChange={(v) => setExitChecklist({...exitChecklist, finalPhotos: v})} 
                        />
                        <ExitCheckItem 
                            label="Tour du véhicule effectué avec le client (si présent)" 
                            checked={exitChecklist.walkaround} 
                            onChange={(v) => setExitChecklist({...exitChecklist, walkaround: v})} 
                        />

                        <div className="pt-4">
                            <Button 
                                className={cn(
                                    "w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl transition-all duration-500",
                                    isExitChecklistComplete 
                                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-black hover:scale-[1.02]" 
                                        : "bg-slate-800 text-slate-500 cursor-not-allowed"
                                )}
                                onClick={handleCompleteJob}
                                disabled={!isExitChecklistComplete}
                            >
                                {isExitChecklistComplete ? "FINALISER LE JOB & ENVOYER RAPPORT" : "COMPLÉTEZ LA CHECK-LIST"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}
            </>)}
        </div>
    )
}

function ExitCheckItem({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <div 
            className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                checked ? "bg-orange-500/10 border-orange-500/30 text-orange-100" : "bg-slate-900/40 border-slate-800 text-slate-400 opacity-60 hover:opacity-100"
            )}
            onClick={() => onChange(!checked)}
        >
            <Checkbox checked={checked} onCheckedChange={(v) => onChange(!!v)} className="border-orange-500 data-[state=checked]:bg-orange-500 data-[state=checked]:text-black" />
            <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
        </div>
    )
}
