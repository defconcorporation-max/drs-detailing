"use client"

import { useState, useRef, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, X, AlertCircle, Info, Image as ImageIcon } from "lucide-react"
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter 
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { addInspectionPoint, deleteInspectionPoint } from "@/lib/actions/inspections"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

// Simple SVG Car Outline (Top View)
function CarSVG({ onClick, points }: { onClick: (e: any) => void, points: any[] }) {
    return (
        <svg 
            viewBox="0 0 100 200" 
            className="w-full h-auto max-w-[400px] mx-auto cursor-crosshair bg-slate-50 dark:bg-slate-900/40 rounded-3xl border border-dashed border-border/60"
            onClick={onClick}
        >
            {/* Outline */}
            <path 
                d="M30 15 Q50 5 70 15 L75 40 Q85 60 85 100 L85 160 Q85 190 70 195 L30 195 Q15 190 15 160 L15 100 Q15 60 25 40 Z" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                className="text-muted-foreground/40"
            />
            {/* Windows */}
            <path d="M30 45 L70 45 L72 65 L28 65 Z" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/20" />
            <path d="M28 75 L72 75 L75 120 L25 120 Z" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/20" />
            <path d="M25 130 L75 130 L72 155 L28 155 Z" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/20" />
            
            {/* Headlights */}
            <ellipse cx="25" cy="25" rx="5" ry="3" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/20" />
            <ellipse cx="75" cy="25" rx="5" ry="3" fill="none" stroke="currentColor" strokeWidth="1" className="text-muted-foreground/20" />

            {/* Points already placed */}
            {points.map((p) => (
                <g key={p.id}>
                    <circle 
                        cx={p.x} 
                        cy={p.y} 
                        r="4" 
                        className={cn(
                            "opacity-80 transition-transform hover:scale-125 cursor-pointer",
                            p.type === "SCRATCH" ? "fill-red-500" : 
                            p.type === "DENT" ? "fill-orange-500" : 
                            "fill-blue-500"
                        )}
                    />
                    <title>{p.type}: {p.notes}</title>
                </g>
            ))}
        </svg>
    )
}

interface InspectionCanvasProps {
    inspection: any
    onPointsChange: () => void
}

export function InspectionCanvas({ inspection, onPointsChange }: InspectionCanvasProps) {
    const [points, setPoints] = useState<any[]>(inspection.points || [])
    const [selectedPos, setSelectedPos] = useState<{ x: number, y: number } | null>(null)
    const [isPointModalOpen, setIsPointModalOpen] = useState(false)
    const [newPoint, setNewPoint] = useState({ 
        type: "SCRATCH", 
        severity: "MEDIUM", 
        notes: "" 
    })

    const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
        const svg = e.currentTarget
        const rect = svg.getBoundingClientRect()
        const x = ((e.clientX - rect.left) / rect.width) * 100
        const y = ((e.clientY - rect.top) / rect.height) * 200
        
        setSelectedPos({ x: Math.round(x), y: Math.round(y) })
        setIsPointModalOpen(true)
    }

    const handleSavePoint = async () => {
        if (!selectedPos || !inspection) return

        const res = await addInspectionPoint(inspection.id, {
            ...selectedPos,
            ...newPoint
        })

        if (res.error) toast.error(res.error)
        else {
            toast.success("Point ajouté")
            setPoints([...points, res.point])
            setIsPointModalOpen(false)
            setNewPoint({ type: "SCRATCH", severity: "MEDIUM", notes: "" })
            onPointsChange()
        }
    }

    const handleDeletePoint = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation() // Don't trigger a new point click
        const res = await deleteInspectionPoint(id)
        if (res.error) toast.error(res.error)
        else {
            setPoints(points.filter(p => p.id !== id))
            onPointsChange()
        }
    }

    return (
        <Card className="border-border/40 overflow-hidden">
            <CardHeader className="bg-primary/5 py-4 flex flex-row items-center justify-between border-b">
                <div>
                    <CardTitle className="text-lg uppercase tracking-wider font-display">
                        Schéma d'inspection <span className="text-primary">[{inspection.type}]</span>
                    </CardTitle>
                </div>
                <Badge variant="outline" className="bg-background">{points.length} points marqués</Badge>
            </CardHeader>
            <CardContent className="p-6 flex flex-col items-center gap-8 md:flex-row md:items-start md:justify-around">
                
                {/* SVG Canvas */}
                <div className="relative group">
                    <CarSVG onClick={handleCanvasClick} points={points} />
                    <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-muted-foreground uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                        Cliquez pour marquer un défaut
                    </div>
                </div>

                {/* Legend & List */}
                <div className="flex-1 max-w-sm space-y-6">
                    <div className="space-y-3">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Légende</Label>
                        <div className="grid grid-cols-2 gap-2">
                             <div className="flex items-center gap-2 text-xs">
                                <div className="size-3 rounded-full bg-red-500" /> Rayure (SCRATCH)
                             </div>
                             <div className="flex items-center gap-2 text-xs">
                                <div className="size-3 rounded-full bg-orange-500" /> Bosse (DENT)
                             </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs uppercase tracking-widest text-muted-foreground">Points récents</Label>
                        <div className="max-h-[300px] overflow-auto space-y-2 pr-2">
                            {points.map((p) => (
                                <div key={p.id} className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-border/40 text-xs">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "size-2 rounded-full",
                                            p.type === "SCRATCH" ? "bg-red-500" : "bg-orange-500"
                                        )} />
                                        <div className="font-semibold">{p.type} <span className="text-[10px] font-normal text-muted-foreground">({p.severity})</span></div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="size-7 rounded-full text-destructive" onClick={(e) => handleDeletePoint(p.id, e)}>
                                        <X size={14} />
                                    </Button>
                                </div>
                            ))}
                            {points.length === 0 && (
                                <div className="text-center py-4 text-muted-foreground italic text-xs">Aucun point marqué.</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Modal for adding point */}
                <Dialog open={isPointModalOpen} onOpenChange={setIsPointModalOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle className="uppercase tracking-wide">Détails de l'anomalie</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Nature du défaut</Label>
                                <Select value={newPoint.type} onValueChange={(v) => setNewPoint({...newPoint, type: v})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SCRATCH">Rayure / Éraflure</SelectItem>
                                        <SelectItem value="DENT">Bosse / Enfoncement</SelectItem>
                                        <SelectItem value="CHIP">Impact / Éclat</SelectItem>
                                        <SelectItem value="STAIN">Tache / Décoloration</SelectItem>
                                        <SelectItem value="OTHER">Autre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="severity">Sévérité</Label>
                                <Select value={newPoint.severity} onValueChange={(v) => setNewPoint({...newPoint, severity: v})}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">Léger (Finition seule)</SelectItem>
                                        <SelectItem value="MEDIUM">Moyen (Polissage nécessaire)</SelectItem>
                                        <SelectItem value="HIGH">Grave (Carrosserie / Peinture)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="notes">Notes additionnelles</Label>
                                <Input 
                                    id="notes" 
                                    placeholder="Ex: Sur l'aile arrière gauche..." 
                                    value={newPoint.notes}
                                    onChange={(e) => setNewPoint({...newPoint, notes: e.target.value})}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsPointModalOpen(false)}>Annuler</Button>
                            <Button onClick={handleSavePoint}>Enregistrer le point</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    )
}

function Badge({ children, variant = "default", className }: { children: React.ReactNode, variant?: string, className?: string }) {
    return (
        <span className={cn(
            "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest",
            variant === "outline" ? "border border-border text-foreground" : "bg-primary text-primary-foreground",
            className
        )}>
            {children}
        </span>
    )
}
