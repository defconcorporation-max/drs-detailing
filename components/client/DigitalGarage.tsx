"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Car, History, Camera, Sparkles, Calendar, ArrowRight } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface DigitalGarageProps {
    client: any
    vehicles: any[]
}

export function DigitalGarage({ client, vehicles }: DigitalGarageProps) {
    const [selectedVehicle, setSelectedVehicle] = useState(vehicles[0]?.id)
    const currentVehicle = vehicles.find(v => v.id === selectedVehicle)

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12 space-y-12">
            <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-primary font-black uppercase tracking-[0.3em] text-xs">
                        <Sparkles size={16} /> Luxe & Perfection
                    </div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter">
                        VOTRE <span className="text-primary italic">GARAGE</span> DIGITAL
                    </h1>
                    <p className="text-slate-500 font-medium">L'historique complet de votre passion automobile</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-900/50 border border-slate-800 p-4 rounded-3xl">
                    <div className="size-12 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                        <History className="text-primary" size={24} />
                    </div>
                    <div>
                        <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest leading-none">Membre depuis</p>
                        <p className="font-bold text-white uppercase italic">{new Date(client.user.createdAt).getFullYear()}</p>
                    </div>
                </div>
            </header>

            <div className="grid lg:grid-cols-4 gap-8">
                {/* Vehicle Selection Sidebar */}
                <aside className="lg:col-span-1 space-y-4">
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-500 px-4">Mes Véhicules</h2>
                    <div className="space-y-2">
                        {vehicles.map(v => (
                            <div 
                                key={v.id}
                                className={cn(
                                    "p-4 rounded-2xl border transition-all cursor-pointer group",
                                    selectedVehicle === v.id 
                                        ? "bg-primary border-primary text-black" 
                                        : "bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-400"
                                )}
                                onClick={() => setSelectedVehicle(v.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <Car size={20} className={cn(selectedVehicle === v.id ? "text-black" : "text-primary")} />
                                    <div>
                                        <div className="font-black uppercase tracking-tight text-sm leading-none">{v.make}</div>
                                        <div className="text-[10px] uppercase font-bold opacity-60 leading-tight">{v.model}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="lg:col-span-3 space-y-8">
                    {currentVehicle ? (
                        <>
                            {/* Vehicle Stats Hero */}
                            <div className="relative h-64 rounded-[40px] overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
                                <div className="absolute inset-0 bg-slate-900 animate-pulse" /> // Placeholder for real image
                                <div className="absolute bottom-8 left-8 z-20 space-y-2">
                                    <Badge className="bg-primary text-black font-black">ENTRETENU DRS</Badge>
                                    <h3 className="text-4xl font-black uppercase tracking-tighter">{currentVehicle.year} {currentVehicle.make} {currentVehicle.model}</h3>
                                    <p className="text-slate-300 font-medium opacity-80">{currentVehicle.licensePlate} · {currentVehicle.color}</p>
                                </div>
                            </div>

                            {/* Job History Timeline */}
                            <section className="space-y-6">
                                <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="text-primary" size={20} /> Carnet d'Entretien
                                </h2>
                                <div className="grid gap-4">
                                    {currentVehicle.jobs?.map((job: any) => (
                                        <Card key={job.id} className="bg-slate-950 border-slate-800/50 hover:bg-slate-900 transition-colors rounded-3xl group">
                                            <CardContent className="p-6 flex items-center justify-between">
                                                <div className="flex items-center gap-6">
                                                    <div className="size-16 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center">
                                                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-500">
                                                            {new Date(job.createdAt).toLocaleDateString('fr-FR', { month: 'short' })}
                                                        </span>
                                                        <span className="text-2xl font-black text-primary">
                                                            {new Date(job.createdAt).getDate()}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-black uppercase tracking-tight">PROTECTION CÉRAMIQUE COMPLÈTE</h4>
                                                        <div className="flex gap-2 mt-1">
                                                            {job.services?.map((js: any) => (
                                                                <Badge key={js.id} variant="outline" className="text-[8px] border-slate-700 text-slate-500 uppercase">{js.service.name}</Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" className="group-hover:translate-x-2 transition-transform opacity-30 group-hover:opacity-100">
                                                    <Camera size={20} className="text-primary" />
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    ))}
                                    {(!currentVehicle.jobs || currentVehicle.jobs.length === 0) && (
                                        <div className="text-center py-20 bg-slate-900/20 border border-dashed border-slate-800 rounded-[40px]">
                                            <p className="text-slate-600 uppercase font-black tracking-widest">Aucun historique pour ce véhicule</p>
                                        </div>
                                    )}
                                </div>
                            </section>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-slate-700 grayscale">
                            <Car size={120} />
                            <p className="font-black uppercase tracking-[0.5em] mt-8">Sélectionnez un véhicule</p>
                        </div>
                    )}
                </main>
            </div>
        </div>
    )
}
