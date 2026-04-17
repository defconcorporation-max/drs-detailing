import { getBusinessById } from "@/lib/actions/clients"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
    Building2, 
    User, 
    Car, 
    Shield, 
    Mail, 
    Phone, 
    MapPin, 
    Plus, 
    TrendingUp, 
    AlertTriangle, 
    FileText, 
    Send,
    Tag,
    DollarSign
} from "lucide-react"
import Link from "next/link"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

import { BusinessActions } from "@/components/admin/BusinessActions"
import { SingleVehicleAction } from "@/components/admin/SingleVehicleAction"
import { DeleteBusinessButton } from "@/components/admin/DeleteBusinessButton"

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const business = await getBusinessById(id) as any

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    <div className="size-12 sm:size-16 shrink-0 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                        <Building2 className="size-6 sm:size-8" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase tracking-tighter truncate">{business.name}</h1>
                            <div className="flex gap-1.5 sm:gap-2">
                                <Badge variant="outline" className="text-[9px] sm:text-[10px] border-primary/20 text-primary whitespace-nowrap">B2B</Badge>
                                {business.discountRate && (
                                    <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-[9px] sm:text-[10px] font-bold whitespace-nowrap">
                                        <Tag size={10} className="mr-1 hidden sm:inline" /> -{business.discountRate}%
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <p className="text-slate-500 text-xs sm:text-sm font-medium flex items-center gap-2 truncate">
                             <User size={14} className="shrink-0" /> {business.contactName}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:self-start lg:self-center">
                    <BusinessActions />
                    <DeleteBusinessButton id={business.id} name={business.name} variant="destructive" showLabel />
                    <Button className="flex-1 sm:flex-none rounded-xl font-bold uppercase text-[10px] sm:text-xs tracking-widest gap-2">
                        <Plus size={16} /> <span className="hidden sm:inline">Nouveau Devis</span><span className="sm:hidden">Devis</span>
                    </Button>
                </div>
            </header>

            {/* Business KPIs */}
            <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-1 p-3 sm:p-4">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Valeur Totale</p>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="text-lg sm:text-2xl font-black text-white flex items-center gap-1 sm:gap-2">
                            <DollarSign className="text-primary size-4 sm:size-5" />
                            {(business.totalLtv || 0).toLocaleString()}€
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-green-500 mt-1 flex items-center gap-1 font-bold">
                            <TrendingUp size={10} /> +12%
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-1 p-3 sm:p-4">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Manqué</p>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="text-lg sm:text-2xl font-black text-orange-500 flex items-center gap-1 sm:gap-2">
                            <AlertTriangle className="size-4 sm:size-5" />
                            {(business.potentialRevenue || 0).toLocaleString()}€
                        </div>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1 italic hidden sm:block">Basé sur retards</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-1 p-3 sm:p-4">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Flotte</p>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="text-lg sm:text-2xl font-black text-white">{business.vehicles?.length || 0}</div>
                        <p className="text-[9px] sm:text-[10px] text-slate-500 mt-1">Vhs actifs</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-1 p-3 sm:p-4">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Hygiène</p>
                    </CardHeader>
                    <CardContent className="p-3 sm:p-4 pt-0">
                        <div className="text-lg sm:text-2xl font-black text-green-500">65%</div>
                        <div className="w-full bg-slate-800 h-1 rounded-full mt-2">
                            <div className="bg-green-500 h-full rounded-full w-[65%]" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Fleet Hygiene Dashboard */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h2 className="text-xs sm:text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
                        <Shield size={16} /> Analyse de l'Hygiène de Flotte
                    </h2>
                    <BusinessActions showReport={false} bulkLabel="Relancer les Retards" />
                </div>
                <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                    {[
                        { label: "Propres (< 14j)", count: (business.vehicles || []).filter((v: any) => new Date(v.lastWash) > new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)).length, color: "bg-green-500" },
                        { label: "À prévoir (14-30j)", count: (business.vehicles || []).filter((v: any) => {
                            const days = (Date.now() - new Date(v.lastWash).getTime()) / (24 * 60 * 60 * 1000)
                            return days >= 14 && days < 30
                        }).length, color: "bg-amber-500" },
                        { label: "En retard (> 30j)", count: (business.vehicles || []).filter((v: any) => {
                            const days = (Date.now() - new Date(v.lastWash).getTime()) / (24 * 60 * 60 * 1000)
                            return days >= 30 && days < 90
                        }).length, color: "bg-orange-500" },
                        { label: "Critique (> 90j)", count: (business.vehicles || []).filter((v: any) => {
                            const days = (Date.now() - new Date(v.lastWash).getTime()) / (24 * 60 * 60 * 1000)
                            return days >= 90
                        }).length, color: "bg-red-500" },
                    ].map((stat, i) => (
                        <Card key={i} className="bg-slate-950/50 border-slate-900 px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className={`size-2 rounded-full ${stat.color} ${stat.count && stat.count > 0 && i > 1 ? 'animate-pulse' : ''}`} />
                                <div className="flex-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{stat.label}</p>
                                    <p className="text-xl font-black">{stat.count || 0}</p>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Negotiated Rates */}
            <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-primary/50">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                        <Tag className="text-primary" size={16} /> Grille Tarifaire Négociée (B2B)
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { service: "Lavage Extérieur", price: "35€", orig: "45€" },
                        { service: "Intérieur + Extérieur", price: "75€", orig: "90€" },
                        { service: "Céramique Rapide", price: "120€", orig: "150€" },
                        { service: "Décontamination", price: "60€", orig: "80€" },
                    ].map((item, i) => (
                        <div key={i} className="bg-slate-950 p-3 rounded-lg border border-slate-800/50 group hover:border-primary/30 transition-colors">
                            <p className="text-[9px] text-slate-500 font-bold uppercase mb-1">{item.service}</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-lg font-black text-white">{item.price}</span>
                                <span className="text-[10px] text-slate-600 line-through font-bold">{item.orig}</span>
                            </div>
                        </div>
                    ))}
                </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Vehicles List */}
                <Card className="bg-slate-950 border-slate-900 border-t-2 border-t-primary/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                        <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <Car className="text-primary size-3.5 sm:size-4" /> Détails de la Flotte
                        </CardTitle>
                        <Button size="sm" variant="ghost" className="size-8 p-0">
                            <Plus size={16} />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-800 hover:bg-transparent">
                                        <TableHead className="text-[10px] uppercase">Véhicule</TableHead>
                                        <TableHead className="text-[10px] uppercase">Plaque</TableHead>
                                        <TableHead className="text-[10px] uppercase">Lavage</TableHead>
                                        <TableHead className="text-right text-[10px] uppercase">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {[...(business.vehicles || [])].sort((a, b) => new Date(a.lastWash || 0).getTime() - new Date(b.lastWash || 0).getTime()).map((v: any) => {
                                        const days = (Date.now() - new Date(v.lastWash).getTime()) / (24 * 60 * 60 * 1000)
                                        let statusColor = "text-green-500"
                                        let statusLabel = "RÉCENT"
                                        let dotColor = "bg-green-500"

                                        if (days >= 90) {
                                            statusColor = "text-red-500 font-black"
                                            statusLabel = "CRITIQUE"
                                            dotColor = "bg-red-500 animate-ping"
                                        } else if (days >= 30) {
                                            statusColor = "text-orange-500 font-bold"
                                            statusLabel = "RETARD"
                                            dotColor = "bg-orange-500 animate-pulse"
                                        } else if (days >= 14) {
                                            statusColor = "text-amber-500"
                                            statusLabel = "PRÉVOIR"
                                            dotColor = "bg-amber-500"
                                        }

                                        return (
                                            <TableRow key={v.id} className="border-slate-900 group hover:bg-slate-900/40 transition-colors">
                                                <TableCell className="font-bold py-3 text-xs sm:text-sm whitespace-nowrap">
                                                    {v.make} <span className="hidden sm:inline">{v.model}</span>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <Badge variant="outline" className="font-mono text-[9px] sm:text-[10px] bg-slate-900/50">
                                                        {v.licensePlate}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="py-3">
                                                    <div className="flex flex-col gap-0.5 min-w-[80px]">
                                                        <div className="flex items-center gap-1.5">
                                                            <div className={`size-1 sm:size-1.5 rounded-full ${dotColor}`} />
                                                            <span className={`text-[9px] sm:text-[10px] font-black tracking-tighter ${statusColor}`}>{statusLabel}</span>
                                                        </div>
                                                        <span className="text-[9px] text-slate-500 ml-2.5 sm:ml-3">
                                                            {new Date(v.lastWash).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right py-3">
                                                    <SingleVehicleAction vehicleName={`${v.make} ${v.model}`} />
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>

                {/* Employees List */}
                <Card className="bg-slate-950 border-slate-900 border-t-2 border-t-indigo-500/20">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
                        <CardTitle className="text-[10px] sm:text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                            <User className="text-secondary size-3.5 sm:size-4" /> Membres Liés
                        </CardTitle>
                        <Button size="sm" variant="ghost" className="size-8 p-0">
                            <Plus size={16} />
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6">
                        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-slate-800 hover:bg-transparent">
                                        <TableHead className="text-[10px] uppercase">Membre</TableHead>
                                        <TableHead className="text-[10px] uppercase">Rôle</TableHead>
                                        <TableHead className="text-right text-[10px] uppercase">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {(business.clients || []).map((member: any) => (
                                        <TableRow key={member.id} className="border-slate-800/50 hover:bg-slate-900/40">
                                            <TableCell className="font-bold py-3 text-xs sm:text-sm whitespace-nowrap">
                                                {member.user?.name}
                                            </TableCell>
                                            <TableCell className="py-3">
                                                <Badge variant="secondary" className="text-[9px] sm:text-[10px] bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                                                    MEMBRE
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right py-3 whitespace-nowrap">
                                                <Link href={`/admin/clients/${member.user?.id || member.userId}`}>
                                                    <Button variant="ghost" size="sm" className="text-[9px] sm:text-[10px] font-black uppercase h-7 px-2">Voir</Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(business.clients || []).length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center py-6 text-xs text-slate-500 italic">Aucun membre lié.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
