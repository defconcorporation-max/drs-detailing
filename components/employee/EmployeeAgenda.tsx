"use client"

import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { addDays, startOfWeek, format, isSameDay } from "date-fns"
import { fr } from "date-fns/locale"
import { ChevronLeft, ChevronRight, MapPin, Clock, GripVertical, Maximize2, Minimize2 } from "lucide-react"
import { rescheduleJob } from "@/lib/actions/jobs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { jobDurationMinutes } from "@/lib/job-metrics"
import { getJobStatusCalendarClasses } from "@/lib/job-calendar-style"
import {
    formatJobPrice,
    jobAssigneesNames,
    jobServicesSummary,
    jobVehicleSummary,
} from "@/lib/job-display"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

const START_HOUR = 7
const END_HOUR = 21
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60

const DRAG_MIME = "application/x-drs-job"

/** Position Y dans la colonne → heure:minute locales, cran 15 min. */
function timeFromDropY(clientY: number, rect: DOMRect) {
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top))
    const pct = rect.height > 0 ? y / rect.height : 0
    const minutesFromStart = pct * TOTAL_MINUTES
    const rawTotal = START_HOUR * 60 + minutesFromStart
    const maxTotal = END_HOUR * 60 - 1
    const clamped = Math.max(START_HOUR * 60, Math.min(maxTotal, rawTotal))
    const snapped = Math.round(clamped / 15) * 15
    const hour = Math.floor(snapped / 60)
    const minute = snapped % 60
    return { hour, minute }
}

/**
 * Calcule les positions côte à côte pour des jobs qui se chevauchent.
 * Retourne pour chaque job : { colIndex, totalCols }
 */
function computeJobLayout(jobs: any[]): Map<string, { colIndex: number; totalCols: number }> {
    // Enrichir chaque job avec startMin / endMin
    const enriched = jobs.map((job) => {
        const d = new Date(job.scheduledDate)
        const startMin = d.getHours() * 60 + d.getMinutes()
        const duration = job.durationMin || jobDurationMinutes(job.services || []) || 60
        return { id: job.id, startMin, endMin: startMin + duration }
    })

    // Trier par heure de début
    enriched.sort((a, b) => a.startMin - b.startMin)

    const layout = new Map<string, { colIndex: number; totalCols: number }>()

    // Groupes de chevauchement
    const groups: (typeof enriched)[] = []

    for (const job of enriched) {
        // Cherche un groupe existant qui chevauche ce job
        let placed = false
        for (const group of groups) {
            // Un groupe chevauche si au moins un job dans le groupe se superpose à ce job
            const overlaps = group.some((g) => g.startMin < job.endMin && g.endMin > job.startMin)
            if (overlaps) {
                group.push(job)
                placed = true
                break
            }
        }
        if (!placed) groups.push([job])
    }

    // Pour chaque groupe, assigner colIndex et totalCols
    for (const group of groups) {
        // Trier par heure début pour assigner les colonnes proprement
        const sorted = [...group].sort((a, b) => a.startMin - b.startMin)
        const cols: number[][] = [] // cols[i] = liste des endMin des jobs dans la colonne i

        for (const job of sorted) {
            // Trouver la première colonne libre
            let placed = false
            for (let c = 0; c < cols.length; c++) {
                const lastEnd = Math.max(...cols[c])
                if (job.startMin >= lastEnd) {
                    cols[c].push(job.endMin)
                    layout.set(job.id, { colIndex: c, totalCols: 0 }) // totalCols fixé après
                    placed = true
                    break
                }
            }
            if (!placed) {
                cols.push([job.endMin])
                layout.set(job.id, { colIndex: cols.length - 1, totalCols: 0 })
            }
        }

        // Mettre à jour totalCols pour tous les jobs du groupe
        for (const job of group) {
            const entry = layout.get(job.id)!
            layout.set(job.id, { ...entry, totalCols: cols.length })
        }
    }

    return layout
}

export function EmployeeAgenda({ jobs, availabilities, readOnly = true }: { jobs: any[], availabilities: any[], readOnly?: boolean }) {
    const router = useRouter()
    const [currentDate, setCurrentDate] = useState(new Date())
    const [dropTargetDayIdx, setDropTargetDayIdx] = useState<number | null>(null)
    const [viewMode, setViewMode] = useState<"day" | "week">("week")
    const [isFullscreen, setIsFullscreen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (window.innerWidth < 768) setViewMode("day")
        const end = () => setDropTargetDayIdx(null)
        window.addEventListener("dragend", end)
        return () => window.removeEventListener("dragend", end)
    }, [])

    // Gérer fullscreen via l'API navigateur + fallback CSS
    const toggleFullscreen = useCallback(async () => {
        if (!containerRef.current) return
        try {
            if (!document.fullscreenElement) {
                await containerRef.current.requestFullscreen()
                setIsFullscreen(true)
            } else {
                await document.exitFullscreen()
                setIsFullscreen(false)
            }
        } catch {
            // Fallback : toggle classe CSS fixed overlay
            setIsFullscreen((v) => !v)
        }
    }, [])

    useEffect(() => {
        const onFsChange = () => setIsFullscreen(!!document.fullscreenElement)
        document.addEventListener("fullscreenchange", onFsChange)
        return () => document.removeEventListener("fullscreenchange", onFsChange)
    }, [])

    const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 })
    const weekDaysFull = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i))
    const visibleDays = viewMode === "day" ? [currentDate] : weekDaysFull

    const nextPeriod = () => setCurrentDate(addDays(currentDate, viewMode === "week" ? 7 : 1))
    const prevPeriod = () => setCurrentDate(addDays(currentDate, viewMode === "week" ? -7 : -1))
    const today = () => setCurrentDate(new Date())

    return (
        <div
            ref={containerRef}
            className={cn(
                "flex flex-col border rounded-xl bg-background shadow-sm overflow-hidden",
                isFullscreen && !document.fullscreenElement
                    ? "fixed inset-0 z-50 rounded-none border-none"
                    : "h-[calc(100vh-200px)] sm:h-[800px]",
                // En mode fullscreen natif, le container prend tout l'écran automatiquement
                "[&:fullscreen]:h-screen [&:fullscreen]:rounded-none [&:fullscreen]:border-none"
            )}
        >
            {/* ── Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-3 py-2 border-b gap-2 shrink-0">
                <div className="flex items-center gap-3">
                    <h2 className="text-base sm:text-lg font-bold capitalize">
                        {format(currentDate, viewMode === "day" ? "EEEE d MMMM" : "MMMM yyyy", { locale: fr })}
                    </h2>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                    {/* Jour / Semaine */}
                    <div className="flex items-center rounded-md border bg-muted/50 p-0.5">
                        <Button
                            variant={viewMode === "day" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("day")}
                            className="h-7 text-xs px-2"
                        >
                            Jour
                        </Button>
                        <Button
                            variant={viewMode === "week" ? "default" : "ghost"}
                            size="sm"
                            onClick={() => setViewMode("week")}
                            className="h-7 text-xs px-2"
                        >
                            Semaine
                        </Button>
                    </div>
                    {/* Navigation */}
                    <div className="flex items-center rounded-md border bg-muted/50">
                        <Button variant="ghost" size="icon" onClick={prevPeriod} className="h-8 w-8"><ChevronLeft size={16} /></Button>
                        <Button variant="ghost" size="sm" onClick={today} className="h-8 text-xs">Aujourd'hui</Button>
                        <Button variant="ghost" size="icon" onClick={nextPeriod} className="h-8 w-8"><ChevronRight size={16} /></Button>
                    </div>
                    {/* Plein écran */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={toggleFullscreen}
                        className="h-8 w-8"
                        title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
                    >
                        {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
                    </Button>
                </div>
            </div>

            {/* ── Calendar Grid ── */}
            <div className="flex flex-1 overflow-auto min-h-0">
                {/* Time Scale */}
                <div className="w-12 sm:w-14 border-r bg-muted/10 flex-shrink-0">
                    <div className="h-10 border-b" />
                    <div className="relative" style={{ height: `${(END_HOUR - START_HOUR) * 48}px` }}>
                        {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
                            <div
                                key={i}
                                className="absolute w-full text-right pr-1 text-[10px] sm:text-xs text-muted-foreground"
                                style={{ top: `${i * 48}px` }}
                            >
                                {START_HOUR + i}:00
                            </div>
                        ))}
                    </div>
                </div>

                {/* Days Columns */}
                <div className={`flex flex-1 ${viewMode === "day" ? "min-w-full" : "min-w-[520px] sm:min-w-[700px]"}`}>
                    {visibleDays.map((day, i) => {
                        const isToday = isSameDay(day, new Date())

                        const dayAvails = availabilities.filter(a => isSameDay(new Date(a.date), day))
                        const dayJobs = jobs.filter(j => isSameDay(new Date(j.scheduledDate), day))

                        // Calcul positions côte à côte
                        const layout = computeJobLayout(dayJobs)

                        const GRID_HEIGHT = (END_HOUR - START_HOUR) * 48 // px fixes

                        return (
                            <div
                                key={i}
                                className={cn(
                                    "flex-1 border-r flex flex-col min-w-[70px] sm:min-w-[100px]",
                                    isToday && "bg-primary/5"
                                )}
                            >
                                {/* Day Header */}
                                <div className="h-10 border-b flex items-center justify-center font-medium text-xs sm:text-sm capitalize bg-background sticky top-0 z-10">
                                    <span className={cn(isToday && "text-primary font-bold")}>
                                        {format(day, "EEE d", { locale: fr })}
                                    </span>
                                </div>

                                {/* Timeline Area — hauteur fixe en px pour alignement précis */}
                                <div
                                    className={cn(
                                        "relative transition-colors",
                                        !readOnly && dropTargetDayIdx === i && "bg-primary/10 ring-1 ring-inset ring-primary/30"
                                    )}
                                    style={{ height: `${GRID_HEIGHT}px` }}
                                    onDragOver={readOnly ? undefined : (e) => {
                                        e.preventDefault()
                                        e.dataTransfer.dropEffect = "move"
                                    }}
                                    onDragEnter={readOnly ? undefined : () => setDropTargetDayIdx(i)}
                                    onDragLeave={readOnly ? undefined : (e) => {
                                        if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                            setDropTargetDayIdx(null)
                                        }
                                    }}
                                    onDrop={readOnly ? undefined : async (e) => {
                                        e.preventDefault()
                                        setDropTargetDayIdx(null)
                                        const raw = e.dataTransfer.getData(DRAG_MIME)
                                        if (!raw) return
                                        let jobId: string
                                        try { jobId = JSON.parse(raw).jobId } catch { return }
                                        if (!jobId) return
                                        const dateKey = format(day, "yyyy-MM-dd")
                                        const { hour, minute } = timeFromDropY(e.clientY, e.currentTarget.getBoundingClientRect())
                                        const res = await rescheduleJob(jobId, dateKey, hour, { minute })
                                        if (res.error) toast.error(res.error)
                                        else { toast.success("Rendez-vous déplacé"); router.refresh() }
                                    }}
                                >
                                    {/* Grid Lines (heure pleine) */}
                                    {Array.from({ length: END_HOUR - START_HOUR }).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className="absolute w-full border-t border-dashed border-muted/30 pointer-events-none"
                                            style={{ top: `${idx * 48}px` }}
                                        />
                                    ))}
                                    {/* Demi-heures */}
                                    {Array.from({ length: END_HOUR - START_HOUR }).map((_, idx) => (
                                        <div
                                            key={`h-${idx}`}
                                            className="absolute w-full border-t border-dotted border-muted/15 pointer-events-none"
                                            style={{ top: `${idx * 48 + 24}px` }}
                                        />
                                    ))}

                                    {/* Disponibilités */}
                                    {dayAvails.map((avail, idx) => {
                                        const [sh, sm] = avail.startTime.split(":").map(Number)
                                        const [eh, em] = avail.endTime.split(":").map(Number)
                                        const topPx = ((sh - START_HOUR) * 60 + sm) / TOTAL_MINUTES * GRID_HEIGHT
                                        const heightPx = ((eh - START_HOUR) * 60 + em - (sh - START_HOUR) * 60 - sm) / TOTAL_MINUTES * GRID_HEIGHT
                                        return (
                                            <div
                                                key={`av-${idx}`}
                                                className="absolute w-full bg-slate-200 dark:bg-slate-800/50 border-l-4 border-slate-400 opacity-50 rounded-sm px-1 py-0.5 pointer-events-none z-0"
                                                style={{ top: `${topPx}px`, height: `${heightPx}px` }}
                                            >
                                                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Dispo</span>
                                            </div>
                                        )
                                    })}

                                    {/* Jobs — côte à côte si chevauchement */}
                                    {dayJobs.map((job) => {
                                        const jDate = new Date(job.scheduledDate)
                                        const startMin = jDate.getHours() * 60 + jDate.getMinutes()
                                        const topPx = (startMin - START_HOUR * 60) / TOTAL_MINUTES * GRID_HEIGHT

                                        const duration = job.durationMin || jobDurationMinutes(job.services || []) || 60
                                        const heightPx = Math.max(22, duration / TOTAL_MINUTES * GRID_HEIGHT)

                                        const { colIndex, totalCols } = layout.get(job.id) ?? { colIndex: 0, totalCols: 1 }
                                        const colW = 100 / totalCols
                                        const leftPct = colIndex * colW
                                        // Légère marge entre les colonnes
                                        const GAP = totalCols > 1 ? 1.5 : 2.5
                                        const widthPct = colW - GAP

                                        const { box, text, opacity } = getJobStatusCalendarClasses(job.status)
                                        const vehicleStr = jobVehicleSummary(job)
                                        const servicesStr = jobServicesSummary(job)
                                        const assigneesStr = jobAssigneesNames(job)
                                        const priceStr = formatJobPrice(job)
                                        const compactCard = duration < 50

                                        const timeStr = `${String(jDate.getHours()).padStart(2, "0")}:${String(jDate.getMinutes()).padStart(2, "0")}`
                                        const endTotalMin = startMin + duration
                                        const endTimeStr = `${String(Math.floor(endTotalMin / 60)).padStart(2, "0")}:${String(endTotalMin % 60).padStart(2, "0")}`

                                        const dragPayload = JSON.stringify({ jobId: job.id })

                                        return (
                                            <Dialog key={job.id}>
                                                <DialogTrigger asChild>
                                                    <div
                                                        draggable={!readOnly}
                                                        onDragStart={readOnly ? undefined : (ev) => {
                                                            ev.dataTransfer.setData(DRAG_MIME, dragPayload)
                                                            ev.dataTransfer.effectAllowed = "move"
                                                        }}
                                                        className={cn(
                                                            "absolute z-10 flex flex-col overflow-hidden rounded-md border text-xs shadow-md transition-transform hover:scale-[1.02] hover:z-20",
                                                            readOnly ? "cursor-pointer pl-1.5" : "cursor-grab active:cursor-grabbing pl-4",
                                                            box, text, opacity ?? ""
                                                        )}
                                                        style={{
                                                            top: `${topPx}px`,
                                                            height: `${heightPx}px`,
                                                            left: `${leftPct + GAP / 2}%`,
                                                            width: `${widthPct}%`,
                                                        }}
                                                        title={`${timeStr} – ${endTimeStr} · ${[job.client?.user?.name, vehicleStr, servicesStr].filter(Boolean).join(" · ")}`}
                                                    >
                                                        {!readOnly && (
                                                            <div className="pointer-events-none absolute left-0.5 top-1 opacity-40">
                                                                <GripVertical className="size-3" aria-hidden />
                                                            </div>
                                                        )}
                                                        {/* Heure toujours visible */}
                                                        <div className="shrink-0 font-semibold leading-tight text-[9px] sm:text-[10px] opacity-80 pt-0.5">{timeStr}</div>
                                                        {compactCard ? (
                                                            <div className="truncate font-bold leading-tight text-[10px]">{job.client?.user?.name ?? "—"}</div>
                                                        ) : (
                                                            <>
                                                                <div className="shrink-0 truncate font-bold leading-tight text-[10px] sm:text-xs">{job.client?.user?.name ?? "—"}</div>
                                                                {vehicleStr && (
                                                                    <div className="shrink-0 truncate text-[9px] opacity-80">{vehicleStr}</div>
                                                                )}
                                                                <div className="min-h-0 flex-1 text-[9px] leading-tight opacity-75 line-clamp-2">
                                                                    {servicesStr || <span className="opacity-60">Aucun service</span>}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </DialogTrigger>

                                                <DialogContent>
                                                    <DialogHeader>
                                                        <DialogTitle>Détails du Rendez-vous</DialogTitle>
                                                    </DialogHeader>
                                                    <div className="space-y-4 pt-4">
                                                        <div className="flex justify-between items-center">
                                                            <Badge>{job.status}</Badge>
                                                            <div className="text-sm font-bold flex items-center gap-1">
                                                                <Clock size={16} /> {timeStr} - {endTimeStr}
                                                            </div>
                                                        </div>
                                                        <div className="bg-muted p-4 rounded-lg">
                                                            <div className="font-bold text-lg mb-1">{job.client?.user?.name ?? "—"}</div>
                                                            <div className="text-muted-foreground text-sm flex items-center gap-2">
                                                                <MapPin size={14} className="text-primary" />
                                                                {job.client.address ? (
                                                                    <a
                                                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.client.address)}`}
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        className="text-primary underline hover:text-primary/80"
                                                                    >
                                                                        {job.client.address}
                                                                    </a>
                                                                ) : "Aucune adresse"}
                                                            </div>
                                                            <div className="text-sm mt-2 font-medium">
                                                                {[jobVehicleSummary(job), job.vehicle?.color].filter(Boolean).join(" · ") || "—"}
                                                            </div>
                                                        </div>
                                                        <div className="text-sm">
                                                            <span className="font-semibold">Équipe :</span>{" "}
                                                            <span>{jobAssigneesNames(job) || "Non assigné"}</span>
                                                        </div>
                                                        <div className="text-sm">
                                                            <span className="font-semibold">Total :</span>{" "}
                                                            <span className="font-bold">{formatJobPrice(job) ?? "—"}</span>
                                                        </div>
                                                        <div>
                                                            <div className="font-semibold text-sm mb-2">Services:</div>
                                                            <div className="flex flex-wrap gap-2">
                                                                {job.services?.length ? (
                                                                    job.services.map((s: any) => (
                                                                        <Badge key={s.service?.id ?? s.serviceId} variant="outline">
                                                                            {s.service?.name ?? "—"}
                                                                        </Badge>
                                                                    ))
                                                                ) : (
                                                                    <span className="text-muted-foreground text-sm">—</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </DialogContent>
                                            </Dialog>
                                        )
                                    })}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
