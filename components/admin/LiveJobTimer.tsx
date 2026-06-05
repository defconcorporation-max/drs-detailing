"use client"

import { useEffect, useState } from "react"
import { Timer } from "lucide-react"

interface LiveJobTimerProps {
    startedAt: string | Date
    durationMin: number
    compact?: boolean
}

function formatElapsed(totalSeconds: number) {
    const h = Math.floor(totalSeconds / 3600)
    const m = Math.floor((totalSeconds % 3600) / 60)
    const s = totalSeconds % 60
    if (h > 0) return `${h}h${String(m).padStart(2, "0")}`
    return `${m}:${String(s).padStart(2, "0")}`
}

export function LiveJobTimer({ startedAt, durationMin, compact = false }: LiveJobTimerProps) {
    const [elapsedSec, setElapsedSec] = useState(0)

    useEffect(() => {
        const start = new Date(startedAt).getTime()
        const tick = () => {
            const now = Date.now()
            setElapsedSec(Math.floor((now - start) / 1000))
        }
        tick()
        const id = setInterval(tick, 1000)
        return () => clearInterval(id)
    }, [startedAt])

    const elapsedMin = elapsedSec / 60
    const isOvertime = elapsedMin > durationMin
    const overtimeMin = Math.round(elapsedMin - durationMin)

    if (compact) {
        return (
            <span
                className={`inline-flex items-center gap-0.5 rounded px-1 py-px text-[8px] font-black tabular-nums leading-none ${
                    isOvertime
                        ? "animate-pulse bg-red-500/20 text-red-400"
                        : "bg-emerald-500/20 text-emerald-400"
                }`}
            >
                <Timer size={7} className="shrink-0" />
                {formatElapsed(elapsedSec)}
                {isOvertime && ` +${overtimeMin}m`}
            </span>
        )
    }

    return (
        <div
            className={`flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${
                isOvertime
                    ? "animate-pulse bg-red-500/20 text-red-300"
                    : "bg-emerald-500/15 text-emerald-300"
            }`}
        >
            <Timer size={9} className="shrink-0" />
            <span>{formatElapsed(elapsedSec)}</span>
            {isOvertime && (
                <span className="text-red-400">+{overtimeMin}m</span>
            )}
        </div>
    )
}
