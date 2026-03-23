import { getServiceProfitability } from "@/lib/actions/profitability"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { TrendingUp, DollarSign, Clock, BarChart3, PieChart } from "lucide-react"

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
                    <Card key={s.name} className="bg-slate-900/40 border-slate-800 overflow-hidden relative group hover:border-primary/30 transition-all">
                        {i === 0 && (
                            <div className="absolute top-0 right-0 bg-primary text-black text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest z-10">
                                TOP PERFORMANCE
                            </div>
                        )}
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-slate-400">{s.name}</CardTitle>
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

                            {/* visual bar */}
                            <div className="w-full bg-slate-950 h-1 rounded-full mt-2 overflow-hidden">
                                <div 
                                    className="bg-primary h-full transition-all duration-1000" 
                                    style={{ width: `${Math.min(100, (s.profitPerHour / 150) * 100)}%` }} 
                                />
                            </div>
                        </CardContent>
                    </Card>
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
