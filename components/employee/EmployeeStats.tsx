"use client"

import { Progress } from "@/components/ui/progress"
import { Badge as UIBadge } from "@/components/ui/badge"
import { Trophy, Star, Shield, Zap, Sparkles } from "lucide-react"

interface EmployeeStatsProps {
    employee: any
}

export function EmployeeStats({ employee }: EmployeeStatsProps) {
    if (!employee) return null

    const xpNeeded = employee.level * 1000
    const progress = (employee.experience / xpNeeded) * 100

    return (
        <div className="flex items-center gap-6 bg-slate-900/50 p-3 rounded-2xl border border-slate-800 backdrop-blur-sm">
            {/* Level & XP */}
            <div className="flex flex-col gap-1 min-w-[120px]">
                <div className="flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase text-primary tracking-widest">Niveau {employee.level}</span>
                    <span className="text-[8px] text-slate-500 font-mono">{employee.experience} / {xpNeeded} XP</span>
                </div>
                <Progress value={progress} className="h-1.5 bg-slate-800" />
            </div>

            {/* Recent Badges */}
            <div className="flex items-center gap-2">
                {employee.badges.slice(0, 3).map((eb: any) => (
                    <div key={eb.badgeId} title={eb.badge.name} className="size-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary hover:scale-110 transition-transform cursor-help">
                        {renderIcon(eb.badge.icon)}
                    </div>
                ))}
                {employee.badges.length === 0 && (
                    <div className="text-[8px] text-slate-600 uppercase font-bold text-center leading-tight">Aucun badge<br/>débloqué</div>
                )}
            </div>
        </div>
    )
}

function renderIcon(iconName: string) {
    switch (iconName) {
        case "TROPHY": return <Trophy size={14} />
        case "STAR": return <Star size={14} />
        case "SHIELD": return <Shield size={14} />
        case "ZAP": return <Zap size={14} />
        case "SPARKLES": return <Sparkles size={14} />
        default: return <Trophy size={14} />
    }
}
