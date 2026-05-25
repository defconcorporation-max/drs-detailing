"use client"

import { useMemo } from "react"
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts"
import { TrendingUp, TrendingDown, DollarSign, Users, CheckCircle2, Clock, Store, Truck, BarChart3, Calendar } from "lucide-react"
import type { ReportsData } from "@/lib/actions/reports"
import { AnalyticsReportCard } from "@/components/admin/AnalyticsReportCard"

const PIE_COLORS = ["#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899", "#84cc16"]

const STATUS_LABELS: Record<string, string> = {
    COMPLETED: "Terminés",
    PENDING: "En attente",
    CONFIRMED: "Confirmés",
    SCHEDULED: "Planifiés",
    IN_PROGRESS: "En cours",
    CANCELLED: "Annulés",
    REQUESTED: "Demandés",
    RESCHEDULE_REQUESTED: "Replanif.",
}
const STATUS_COLORS: Record<string, string> = {
    COMPLETED: "#10b981",
    PENDING: "#f59e0b",
    CONFIRMED: "#3b82f6",
    SCHEDULED: "#a855f7",
    IN_PROGRESS: "#06b6d4",
    CANCELLED: "#ef4444",
    REQUESTED: "#84cc16",
    RESCHEDULE_REQUESTED: "#f97316",
}

function fmt(n: number) {
    return new Intl.NumberFormat("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 }).format(n)
}

function pct(n: number, d: number) {
    if (d === 0) return 0
    return Math.round(((n - d) / d) * 100)
}

function KpiCard({ icon, label, value, sub, trend, color = "violet" }: {
    icon: React.ReactNode; label: string; value: string; sub?: string; trend?: number; color?: string
}) {
    const colorMap: Record<string, string> = {
        violet: "from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400",
        blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400",
        green: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
        amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400",
        sky: "from-sky-500/20 to-sky-500/5 border-sky-500/20 text-sky-400",
        pink: "from-pink-500/20 to-pink-500/5 border-pink-500/20 text-pink-400",
    }
    const cls = colorMap[color] || colorMap.violet
    return (
        <div className={`relative rounded-2xl border bg-gradient-to-br ${cls} p-5 overflow-hidden`}>
            <div className="flex items-start justify-between mb-3">
                <div className="opacity-80">{icon}</div>
                {trend !== undefined && (
                    <span className={`flex items-center gap-0.5 text-xs font-bold rounded-full px-2 py-0.5 ${trend >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400"}`}>
                        {trend >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                        {Math.abs(trend)}%
                    </span>
                )}
            </div>
            <p className="text-2xl font-black text-white tracking-tight">{value}</p>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400 mt-1">{label}</p>
            {sub && <p className="text-[10px] text-slate-500 mt-0.5">{sub}</p>}
        </div>
    )
}

const CustomTooltipArea = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl text-xs">
            <p className="font-bold text-white mb-1">{label}</p>
            <p className="text-violet-400">CA : <span className="font-bold text-white">{fmt(payload[0]?.value || 0)}</span></p>
            <p className="text-slate-400">Jobs : <span className="font-semibold text-white">{payload[1]?.value || 0}</span></p>
        </div>
    )
}

const CustomTooltipBar = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl text-xs">
            <p className="font-bold text-white mb-1">{label}</p>
            <p className="text-violet-400">{fmt(payload[0]?.value || 0)}<span className="text-slate-400">/h</span></p>
            <p className="text-slate-400">Durée moy. : <span className="text-white">{payload[0]?.payload?.avgDurationH}h</span></p>
            <p className="text-slate-400">CA moy. : <span className="text-white">{fmt(payload[0]?.payload?.avgRevenue)}</span></p>
        </div>
    )
}

const CustomTooltipPie = ({ active, payload }: any) => {
    if (!active || !payload?.length) return null
    return (
        <div className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 shadow-2xl text-xs">
            <p className="font-bold text-white">{payload[0]?.name}</p>
            <p className="text-slate-400">CA : <span className="font-bold text-white">{fmt(payload[0]?.value)}</span></p>
            <p className="text-slate-400">Jobs : <span className="text-white">{payload[0]?.payload?.jobCount}</span></p>
        </div>
    )
}

export function ReportsClient({ data, profitability }: { data: ReportsData; profitability: any[] }) {
    const growthPct = pct(data.revenueThisMonth, data.revenuePrevMonth)
    const shopPct = data.shopJobsCount + data.mobileJobsCount > 0
        ? Math.round((data.shopJobsCount / (data.shopJobsCount + data.mobileJobsCount)) * 100)
        : 0

    const maxBar = Math.max(...data.profitabilityByService.map(s => s.profitPerHour), 1)

    return (
        <div className="space-y-8">

            {/* ── KPIs ── */}
            <section>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Indicateurs clés</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                    <KpiCard
                        icon={<DollarSign size={20} />}
                        label="CA cette semaine"
                        value={fmt(data.revenueThisWeek)}
                        color="violet"
                    />
                    <KpiCard
                        icon={<Calendar size={20} />}
                        label="CA ce mois"
                        value={fmt(data.revenueThisMonth)}
                        sub={`Mois précédent : ${fmt(data.revenuePrevMonth)}`}
                        trend={growthPct}
                        color="blue"
                    />
                    <KpiCard
                        icon={<TrendingUp size={20} />}
                        label="CA total (all-time)"
                        value={fmt(data.revenueAllTime)}
                        sub={`Moy. ${fmt(data.avgJobRevenue)}/job`}
                        color="green"
                    />
                    <KpiCard
                        icon={<CheckCircle2 size={20} />}
                        label="Jobs complétés"
                        value={String(data.jobsCompleted)}
                        sub={`Taux de complétion : ${data.jobsCompletionRate}%`}
                        color="sky"
                    />
                    <KpiCard
                        icon={<Users size={20} />}
                        label="Clients actifs"
                        value={String(data.totalClients)}
                        color="amber"
                    />
                    <KpiCard
                        icon={<Store size={20} />}
                        label="Shop vs Mobile"
                        value={`${shopPct}% / ${100 - shopPct}%`}
                        sub={`${data.shopJobsCount} shop · ${data.mobileJobsCount} mobile`}
                        color="pink"
                    />
                </div>
            </section>

            {/* ── Graphique CA semaine par semaine ── */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight text-white">Chiffre d'affaires</h2>
                        <p className="text-xs text-slate-500">12 dernières semaines</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="w-3 h-0.5 bg-violet-500 inline-block rounded" /> CA ($)
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={data.weeklyRevenue} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#a855f7" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#a855f7" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="gradJobs" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                        <XAxis dataKey="weekLabel" tick={{ fill: "#64748b", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}$`} />
                        <Tooltip content={<CustomTooltipArea />} />
                        <Area type="monotone" dataKey="revenue" stroke="#a855f7" strokeWidth={2.5} fill="url(#gradRevenue)" dot={false} activeDot={{ r: 5, fill: "#a855f7" }} />
                        <Area type="monotone" dataKey="jobs" stroke="#3b82f6" strokeWidth={1.5} fill="url(#gradJobs)" dot={false} activeDot={{ r: 4, fill: "#3b82f6" }} yAxisId={1} hide />
                    </AreaChart>
                </ResponsiveContainer>

                {/* Mini stats de chaque semaine en bas */}
                <div className="grid grid-cols-6 md:grid-cols-12 gap-1 mt-4">
                    {data.weeklyRevenue.slice(-12).map((w, i) => (
                        <div key={i} className="text-center">
                            <div className="text-[9px] text-slate-600 font-bold">{w.weekLabel}</div>
                            <div className="text-[10px] font-black text-slate-300">{w.jobs}<span className="text-slate-600 font-normal">j</span></div>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Graphiques côte à côte ── */}
            <div className="grid md:grid-cols-2 gap-6">

                {/* PieChart — Répartition services */}
                <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                    <h2 className="text-sm font-black uppercase tracking-tight text-white mb-1">Répartition des services</h2>
                    <p className="text-xs text-slate-500 mb-4">CA par service (all-time)</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                            <Pie
                                data={data.serviceBreakdown}
                                cx="50%" cy="50%"
                                innerRadius={60} outerRadius={95}
                                dataKey="revenue"
                                nameKey="name"
                                paddingAngle={3}
                            >
                                {data.serviceBreakdown.map((_, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="transparent" />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomTooltipPie />} />
                            <Legend
                                formatter={(v) => <span style={{ color: "#94a3b8", fontSize: 11 }}>{v}</span>}
                                iconSize={8}
                                iconType="circle"
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </section>

                {/* BarChart — Rentabilité $/h */}
                <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                    <h2 className="text-sm font-black uppercase tracking-tight text-white mb-1">Rentabilité par service</h2>
                    <p className="text-xs text-slate-500 mb-4">$/heure moyen (all-time)</p>
                    <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={data.profitabilityByService} layout="vertical" margin={{ left: 8, right: 30 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                            <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}$`} />
                            <YAxis type="category" dataKey="name" tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} width={100} />
                            <Tooltip content={<CustomTooltipBar />} />
                            <Bar dataKey="profitPerHour" radius={[0, 6, 6, 0]}>
                                {data.profitabilityByService.map((s, i) => (
                                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </section>
            </div>

            {/* ── Activité par jour + statuts ── */}
            <div className="grid md:grid-cols-2 gap-6">

                {/* Activité par jour de semaine */}
                <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                    <h2 className="text-sm font-black uppercase tracking-tight text-white mb-1">Activité par jour</h2>
                    <p className="text-xs text-slate-500 mb-4">Nombre de jobs complétés par jour (all-time)</p>
                    <ResponsiveContainer width="100%" height={200}>
                        <BarChart data={data.dayOfWeekActivity}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="day" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 12, fontSize: 12 }} labelStyle={{ color: "#fff", fontWeight: 700 }} />
                            <Bar dataKey="jobs" fill="#a855f7" radius={[6, 6, 0, 0]} name="Jobs" />
                        </BarChart>
                    </ResponsiveContainer>
                </section>

                {/* Répartition statuts */}
                <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                    <h2 className="text-sm font-black uppercase tracking-tight text-white mb-1">Statuts des jobs</h2>
                    <p className="text-xs text-slate-500 mb-4">12 dernières semaines</p>
                    <div className="space-y-3">
                        {data.statusBreakdown.sort((a, b) => b.count - a.count).map((s) => {
                            const total = data.statusBreakdown.reduce((a, x) => a + x.count, 0)
                            const pctVal = total > 0 ? Math.round((s.count / total) * 100) : 0
                            const color = STATUS_COLORS[s.status] || "#64748b"
                            return (
                                <div key={s.status}>
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-xs font-semibold text-slate-300">{STATUS_LABELS[s.status] || s.status}</span>
                                        <span className="text-xs font-black text-slate-400">{s.count} <span className="text-slate-600">({pctVal}%)</span></span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pctVal}%`, backgroundColor: color }} />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </section>
            </div>

            {/* ── Shop vs Mobile ── */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="text-sm font-black uppercase tracking-tight text-white mb-4">Shop vs Équipe Mobile</h2>
                <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-xl bg-violet-500/10 border border-violet-500/20 p-4 text-center">
                        <Store size={24} className="text-violet-400 mx-auto mb-2" />
                        <p className="text-2xl font-black text-white">{data.shopJobsCount}</p>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Jobs en shop</p>
                        <p className="text-sm font-bold text-violet-400 mt-1">{fmt(data.shopRevenue)}</p>
                    </div>
                    <div className="rounded-xl bg-sky-500/10 border border-sky-500/20 p-4 text-center">
                        <Truck size={24} className="text-sky-400 mx-auto mb-2" />
                        <p className="text-2xl font-black text-white">{data.mobileJobsCount}</p>
                        <p className="text-xs text-slate-400 font-semibold uppercase tracking-wide">Jobs mobiles</p>
                        <p className="text-sm font-bold text-sky-400 mt-1">{fmt(data.mobileRevenue)}</p>
                    </div>
                </div>
                {/* Barre ratio */}
                <div className="mt-4 h-3 w-full rounded-full overflow-hidden flex">
                    <div className="h-full bg-violet-500 transition-all duration-700" style={{ width: `${shopPct}%` }} />
                    <div className="h-full bg-sky-500 flex-1" />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                    <span className="font-bold text-violet-400">{shopPct}% shop</span>
                    <span className="font-bold text-sky-400">{100 - shopPct}% mobile</span>
                </div>
            </section>

            {/* ── Top clients ── */}
            <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6">
                <h2 className="text-sm font-black uppercase tracking-tight text-white mb-1">Top 5 Clients</h2>
                <p className="text-xs text-slate-500 mb-4">Par chiffre d'affaires total</p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-slate-800">
                                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 pb-3">#</th>
                                <th className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500 pb-3">Client</th>
                                <th className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500 pb-3">Jobs</th>
                                <th className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500 pb-3">CA Total</th>
                                <th className="text-right text-[10px] font-black uppercase tracking-widest text-slate-500 pb-3">Dernier RDV</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.topClients.map((c, i) => (
                                <tr key={c.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                                    <td className="py-3 pr-4">
                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-black ${i === 0 ? "bg-amber-500/20 text-amber-400" : i === 1 ? "bg-slate-600/40 text-slate-300" : "bg-slate-800 text-slate-500"}`}>
                                            {i + 1}
                                        </span>
                                    </td>
                                    <td className="py-3 font-semibold text-white">{c.name}</td>
                                    <td className="py-3 text-right text-slate-400">{c.jobCount}</td>
                                    <td className="py-3 text-right font-black text-violet-400">{fmt(c.totalRevenue)}</td>
                                    <td className="py-3 text-right text-slate-500 text-xs">{c.lastJobDate || "—"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* ── Rentabilité par service (cartes existantes) ── */}
            <section>
                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-4">Détail Rentabilité par Service</h2>
                <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-4">
                    {profitability.map((s: any, i: number) => (
                        <AnalyticsReportCard key={s.name} s={s} index={i} />
                    ))}
                </div>
            </section>

            {/* ── Métriques moyennes ── */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Revenu moyen / job", value: fmt(data.avgJobRevenue), icon: <DollarSign size={16} />, color: "text-violet-400" },
                    { label: "Durée moy. / job", value: `${data.avgJobDurationH}h`, icon: <Clock size={16} />, color: "text-blue-400" },
                    { label: "Taux de complétion", value: `${data.jobsCompletionRate}%`, icon: <CheckCircle2 size={16} />, color: "text-emerald-400" },
                    { label: "Clients total", value: String(data.totalClients), icon: <Users size={16} />, color: "text-amber-400" },
                ].map((m, i) => (
                    <div key={i} className="rounded-xl bg-slate-900/60 border border-slate-800 p-4 flex items-center gap-3">
                        <div className={`${m.color} opacity-70`}>{m.icon}</div>
                        <div>
                            <p className="text-lg font-black text-white">{m.value}</p>
                            <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">{m.label}</p>
                        </div>
                    </div>
                ))}
            </section>
        </div>
    )
}
