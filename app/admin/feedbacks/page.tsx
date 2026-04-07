"use server"

import { getFeedbacks, updateFeedbackStatus, deleteFeedback } from "@/lib/actions/feedback"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, Trash2, CheckCircle2, AlertCircle, Clock, Trash } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export default async function BetaFeedbacksPage() {
    const feedbacks = await getFeedbacks()

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Beta Feedbacks</h1>
                    <p className="text-muted-foreground mt-1">Liste des retours utilisateurs capturés via le module beta.</p>
                </div>
                <Badge variant="outline" className="px-4 py-2 bg-primary/5 text-primary border-primary/20 animate-pulse">
                    Mode Beta Actif
                </Badge>
            </header>

            <div className="grid gap-6">
                {feedbacks.length === 0 ? (
                    <Card className="border-dashed py-20 bg-muted/50">
                        <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
                            <div className="p-4 rounded-full bg-background shadow-sm border border-border">
                                <Clock className="text-muted-foreground" size={32} />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xl font-medium">Aucun feedback pour le moment</p>
                                <p className="text-muted-foreground">Les retours apparaîtront ici dès qu&apos;ils seront soumis.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    feedbacks.map((fb: any) => (
                        <Card key={fb.id} className="overflow-hidden border-white/10 shadow-lg group">
                            <div className={`h-1.5 w-full bg-gradient-to-r ${
                                fb.status === 'OPEN' ? 'from-amber-500 to-orange-500' : 
                                fb.status === 'FIXED' ? 'from-emerald-500 to-teal-500' : 
                                'from-slate-500 to-zinc-500'
                            }`} />
                            <CardHeader className="pb-3 border-b border-white/5 bg-background/50">
                                <div className="flex flex-wrap justify-between items-start gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <Badge className={
                                                fb.status === 'OPEN' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                                                fb.status === 'FIXED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                                'bg-slate-500/10 text-slate-500 border-slate-500/20'
                                            }>
                                                {fb.status}
                                            </Badge>
                                            <span className="text-xs text-muted-foreground">
                                                {format(new Date(fb.createdAt), "PPP à p", { locale: fr })}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm font-mono text-primary truncate max-w-md mt-2">
                                            <ExternalLink size={14} className="shrink-0" />
                                            <a href={fb.pageUrl} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                                {fb.pageUrl}
                                            </a>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <form action={updateFeedbackStatus.bind(null, fb.id, 'FIXED')}>
                                            <Button size="sm" variant="outline" type="submit" className="h-9 gap-2 border-emerald-500/20 hover:bg-emerald-500/10 hover:text-emerald-500">
                                                <CheckCircle2 size={16} /> Résolu
                                            </Button>
                                        </form>
                                        <form action={deleteFeedback.bind(null, fb.id)}>
                                            <Button size="sm" variant="ghost" type="submit" className="h-9 gap-2 text-destructive hover:bg-destructive/10">
                                                <Trash size={16} />
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6 space-y-6">
                                <div className="prose prose-invert max-w-none">
                                    <p className="text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap">
                                        {fb.content}
                                    </p>
                                </div>

                                {fb.screenshots && fb.screenshots.length > 0 && (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 border-t border-white/5 pt-6">
                                        {fb.screenshots.map((src: string, idx: number) => (
                                            <a key={idx} href={src} target="_blank" rel="noopener noreferrer" 
                                               className="relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-900 shadow-inner group-hover:border-primary/30 transition-all">
                                                <img src={src} className="object-cover w-full h-full" alt="Screenshot" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                                    <ExternalLink className="text-white" size={24} />
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                )}

                                <div className="text-[10px] text-muted-foreground uppercase tracking-[0.2em] font-medium pt-2">
                                    Context: {fb.userContext || "N/A"}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
