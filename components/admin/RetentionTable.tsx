"use client"

import { RetentionBuckets, RetentionClient } from "@/lib/actions/marketing"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { CalendarClock, Phone, Mail, Car } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export function RetentionTable({ data }: { data: RetentionBuckets }) {
    const buckets = [
        { id: "recent", label: "Récents", desc: "< 14 jours", clients: data.recent, color: "bg-zinc-500/10 text-zinc-500 border-zinc-500/20" },
        { id: "weeks2", label: "2 Semaines", desc: "14 à 30 jours", clients: data.weeks2, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
        { id: "month1", label: "1 Mois", desc: "30 à 60 jours", clients: data.month1, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
        { id: "months2", label: "2 Mois", desc: "60 à 90 jours", clients: data.months2, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
        { id: "months3", label: "3 Mois", desc: "90 à 120 jours", clients: data.months3, color: "bg-orange-500/10 text-orange-500 border-orange-500/20" },
        { id: "months3Plus", label: "3+ Mois", desc: "+120 jours", clients: data.months3Plus, color: "bg-red-500/10 text-red-500 border-red-500/20" },
        { id: "never", label: "Jamais", desc: "Aucun historique", clients: data.never, color: "bg-muted text-muted-foreground border-border/40" },
    ]

    return (
        <Card className="border-border/40 shadow-lg mt-8">
            <CardHeader className="border-b border-border/40 bg-card/50 pb-4">
                <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest mb-1">
                    <CalendarClock size={16} /> Suivi d'entretien (Rétention)
                </div>
                <CardTitle className="text-xl font-display">Clients à recontacter</CardTitle>
                <CardDescription>
                    Liste des clients segmentée par date de dernier service. Utile pour les relances d'entretien.
                </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
                <Tabs defaultValue="month1" className="w-full">
                    <TabsList className="mb-6 flex-wrap h-auto gap-2 bg-transparent justify-start">
                        {buckets.map(b => (
                            <TabsTrigger 
                                key={b.id} 
                                value={b.id}
                                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground border border-border/40 rounded-xl px-4 py-2"
                            >
                                <div className="flex flex-col items-start text-left">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold">{b.label}</span>
                                        <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                                            {b.clients.length}
                                        </Badge>
                                    </div>
                                    <span className="text-[10px] opacity-70">{b.desc}</span>
                                </div>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {buckets.map(b => (
                        <TabsContent key={b.id} value={b.id} className="mt-0">
                            {b.clients.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground border border-dashed border-border/60 rounded-xl">
                                    Aucun client dans cette période.
                                </div>
                            ) : (
                                <div className="overflow-x-auto rounded-xl border border-border/40">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="bg-muted/50 border-b border-border/40">
                                                <th className="text-left py-3 px-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Client</th>
                                                <th className="text-left py-3 px-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Véhicule</th>
                                                <th className="text-right py-3 px-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Dernier Service</th>
                                                <th className="text-center py-3 px-4 font-bold uppercase tracking-widest text-[10px] text-muted-foreground">Contact</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {b.clients.map((c, i) => (
                                                <tr key={c.id} className="border-b border-border/20 hover:bg-muted/30 transition-colors last:border-0">
                                                    <td className="py-3 px-4 font-medium text-foreground">
                                                        {c.name}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center gap-2 text-muted-foreground">
                                                            <Car size={14} />
                                                            {c.vehicleStr}
                                                        </div>
                                                    </td>
                                                    <td className="py-3 px-4 text-right">
                                                        {c.daysSinceLastJob !== null ? (
                                                            <>
                                                                <div className="font-semibold text-foreground">
                                                                    Il y a {c.daysSinceLastJob} jours
                                                                </div>
                                                                <div className="text-[11px] text-muted-foreground">
                                                                    {c.lastBookingDate && format(new Date(c.lastBookingDate), "d MMMM yyyy", { locale: fr })}
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="font-semibold text-muted-foreground italic">
                                                                Aucun service
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-3 px-4">
                                                        <div className="flex items-center justify-center gap-2">
                                                            {c.phone ? (
                                                                <a href={`tel:${c.phone}`} className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors" title="Appeler">
                                                                    <Phone size={14} />
                                                                </a>
                                                            ) : (
                                                                <span className="p-2 opacity-30"><Phone size={14} /></span>
                                                            )}
                                                            {c.email ? (
                                                                <a href={`mailto:${c.email}`} className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors" title="Email">
                                                                    <Mail size={14} />
                                                                </a>
                                                            ) : (
                                                                <span className="p-2 opacity-30"><Mail size={14} /></span>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </TabsContent>
                    ))}
                </Tabs>
            </CardContent>
        </Card>
    )
}
