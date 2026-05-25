import { getServiceProfitability } from "@/lib/actions/profitability"
import { getReportsData } from "@/lib/actions/reports"
import { ReportsClient } from "@/components/admin/ReportsClient"
import { BarChart3 } from "lucide-react"

export default async function ReportsPage() {
    const [data, profitability] = await Promise.all([
        getReportsData(),
        getServiceProfitability(),
    ])

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* En-tête */}
            <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
                        ANALYSES &amp; <span className="text-primary italic">RAPPORTS</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-sm">
                        Tableau de bord financier complet — données en temps réel
                    </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-2xl px-5 py-3 flex items-center gap-3 w-fit">
                    <BarChart3 className="text-primary" size={20} />
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">Période</p>
                        <p className="font-bold text-white text-sm">12 DERNIÈRES SEMAINES</p>
                    </div>
                </div>
            </header>

            <ReportsClient data={data} profitability={profitability} />
        </div>
    )
}
