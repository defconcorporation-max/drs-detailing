"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { renameCustomService } from "@/lib/actions/profitability"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Edit2 } from "lucide-react"

export function AnalyticsReportCard({ s, index }: { s: any; index: number }) {
    const router = useRouter()
    const { toast } = useToast()
    const [isOpen, setIsOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [newName, setNewName] = useState(s.originalName || "")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleRename = async () => {
        if (!newName || newName === s.originalName) {
            setIsEditing(false)
            return
        }
        setIsSubmitting(true)
        const res = await renameCustomService(s.originalName, newName)
        setIsSubmitting(false)
        
        if (res.success) {
            toast({ title: "Service renommé", description: `${res.updatedCount} job(s) mis à jour.` })
            setIsEditing(false)
            setIsOpen(false)
            router.refresh()
        } else {
            toast({ title: "Erreur", description: res.error, variant: "destructive" })
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Card className="bg-slate-900/40 border-slate-800 overflow-hidden relative group hover:border-primary/50 transition-all cursor-pointer hover:bg-slate-900/80">
                    {index === 0 && (
                        <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest z-10">
                            TOP PERFORMANCE
                        </div>
                    )}
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">{s.name}</CardTitle>
                        <CardDescription className="text-xs">{s.jobCount} Jobs réalisés</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Rentabilité / Heure</p>
                            <div className="text-3xl font-black text-white flex items-baseline gap-1">
                                {s.profitPerHour}€ <span className="text-xs text-slate-500">/h</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">CA Total</p>
                                <p className="font-bold text-slate-200">{s.totalRevenue}€</p>
                            </div>
                            <div>
                                <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">Marge Moy.</p>
                                <p className="font-bold text-green-500">{s.avgProfitPerJob.toFixed(0)}€</p>
                            </div>
                        </div>

                        <div className="w-full bg-slate-950 h-1 rounded-full mt-2 overflow-hidden">
                            <div 
                                className="bg-primary h-full transition-all duration-1000" 
                                style={{ width: `${Math.min(100, (s.profitPerHour / 150) * 100)}%` }} 
                            />
                        </div>
                    </CardContent>
                </Card>
            </DialogTrigger>

            <DialogContent className="max-w-xl max-h-[80vh] overflow-hidden flex flex-col bg-slate-950 border-slate-800">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        {s.isCustom && isEditing ? (
                            <div className="flex items-center gap-2 w-full">
                                <Input 
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="h-8 max-w-[200px]"
                                    autoFocus
                                    onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                                />
                                <Button size="sm" onClick={handleRename} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sauvegarder"}
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2">
                                <span>{s.name}</span>
                                {s.isCustom && (
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-white" onClick={() => setIsEditing(true)}>
                                        <Edit2 className="w-3 h-3" />
                                    </Button>
                                )}
                            </div>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="overflow-y-auto pr-4 space-y-3 mt-4 flex-1 pb-4">
                    {s.jobs && s.jobs.map((job: any) => (
                        <div key={job.id} className="bg-slate-900 border border-slate-800 rounded-lg p-3 flex justify-between items-center hover:border-slate-700 transition-colors">
                            <div>
                                <p className="text-sm font-semibold text-slate-200">
                                    {format(new Date(job.scheduledDate), "dd MMM yyyy", { locale: fr })}
                                </p>
                                {job.customServiceName && (
                                    <p className="text-xs text-slate-500">Nom original: {job.customServiceName}</p>
                                )}
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-primary">
                                    {s.isCustom ? job.customServicePrice : job.totalPrice}€
                                </p>
                                <a href={`/admin/schedule`} className="text-[10px] text-blue-400 hover:underline">
                                    Voir Calendrier
                                </a>
                            </div>
                        </div>
                    ))}
                    {(!s.jobs || s.jobs.length === 0) && (
                        <p className="text-sm text-slate-500 italic text-center py-4">Aucun job détaillé trouvé.</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
