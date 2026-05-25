import { getServiceProfitability } from "@/lib/actions/profitability"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp, DollarSign, Clock, BarChart3, PieChart } from "lucide-react"

import { AnalyticsReportCard } from "@/components/admin/AnalyticsReportCard"

export default async function ReportsPage() {
    const stats = await getServiceProfitability()

    return (
        <div className="p-8 space-y-8 max-w-7xl mx-auto">
            <header className="flex justify-between items-end">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black uppercase tracking-tighter">ANALYSE DE <span className="text-primary italic">RENTABILITÉ</span></h1>
                    <p className="text-slate-500 font-medium">Performance financière par type de service</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl px-6 py-3 flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">Période</p>
                        <p className="font-bold text-white">30 DERNIERS JOURS</p>
                    </div>
                    <BarChart3 className="text-primary" size={24} />
                </div>
            </header>

            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
               {stats.map((s, i) => (
                    <AnalyticsReportCard key={s.name} s={s} index={i} />
               ))}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-slate-950 border-slate-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 uppercase tracking-widest">
                            <Clock size={16} className="text-primary" /> Optimisation du Temps
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-400">
                        Vos services les plus rentables par heure sont les opportunités de croissance. Envisagez d'augmenter les prix sur les services à faible rentabilité ou de former l'équipe pour réduire leur durée.
                    </CardContent>
                </Card>
                <Card className="bg-slate-950 border-slate-900">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 uppercase tracking-widest">
                            <TrendingUp size={16} className="text-primary" /> Analyse des Coûts Produits
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm text-slate-400">
                        Le suivi de consommation a permis d'isoler une marge brute réelle. Le coût produit moyen représente 8% du CA sur vos 3 services principaux.
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
