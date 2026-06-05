"use client"

import { useState, useMemo, useCallback, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { EditJobDialog } from "@/components/admin/EditJobDialog"
import { EditEventDialog } from "@/components/admin/EditEventDialog"
import { NewJobDialog } from "@/components/admin/NewJobDialog"
import { jobDurationMinutes } from "@/lib/job-metrics"
import { getJobStatusCalendarClasses } from "@/lib/job-calendar-style"
import { localDateKey, localHour, localMinute } from "@/lib/date-local"
import { getZoneFromLocation } from "@/lib/geo"
import {
    formatJobPrice,
    jobAssigneesNames,
    jobServicesSummary,
    jobVehicleSummary,
} from "@/lib/job-display"
import { Calendar as CalendarIcon, Clock, Car, Users, Receipt, GripVertical, ChevronRight, MapPin, Store, Truck } from "lucide-react"
import { rescheduleJob } from "@/lib/actions/jobs"

export type WeekColumnMeta = {
    key: string
    dayNum: number
    weekdayShort: string
    isToday: boolean
}

type Props = {
    weekMeta: WeekColumnMeta[]
    jobs: any[]
    events?: any[]
    selectors: any
    availabilities: any[]
    serviceZones?: any
}

const START_HOUR = 6
const END_HOUR = 21

const DRAG_MIME = "application/x-drs-job"

/**
 * Calcule pour chaque job du jour :
 *   - lane       : index du couloir (0, 1, 2…)
 *   - totalLanes : nombre total de couloirs au moment du chevauchement max
 *
 * Algorithme greedy : on trie par heure de début, on assigne le premier
 * couloir libre, et on détermine ensuite le nombre max de couloirs
 * simultanément occupés pendant la durée de chaque job.
 */
function computeJobLaneMap(
    dayJobs: any[],
    getDuration: (job: any) => number
): Map<string, { lane: number; totalLanes: number }> {
    if (!dayJobs.length) return new Map()

    const items = dayJobs
        .map((job) => {
            const dur = Math.max(60, getDuration(job))
            const start = new Date(job.scheduledDate).getTime()
            return { id: job.id, start, end: start + dur * 60 * 1000 }
        })
        .sort((a, b) => a.start - b.start)

    // Assign lanes greedily
    const laneEndTimes: number[] = []
    const laneAssignments = new Map<string, number>()

    for (const item of items) {
        let lane = laneEndTimes.findIndex((t) => t <= item.start)
        if (lane === -1) {
            lane = laneEndTimes.length
            laneEndTimes.push(item.end)
        } else {
            laneEndTimes[lane] = item.end
        }
        laneAssignments.set(item.id, lane)
    }

    // Compute totalLanes = max concurrent lanes during each job
    const result = new Map<string, { lane: number; totalLanes: number }>()
    for (const item of items) {
        const overlapping = items.filter((o) => o.start < item.end && o.end > item.start)
        const maxLane = Math.max(...overlapping.map((o) => laneAssignments.get(o.id) ?? 0))
        result.set(item.id, { lane: laneAssignments.get(item.id)!, totalLanes: maxLane + 1 })
    }

    return result
}

export function ScheduleGridClient({ weekMeta, jobs, events = [], selectors, availabilities, serviceZones = null }: Props) {
    const router = useRouter()
    const [slotOpen, setSlotOpen] = useState(false)
    const [prefillDate, setPrefillDate] = useState("")
    const [prefillTime, setPrefillTime] = useState("09:00")
    const [dropTargetKey, setDropTargetKey] = useState<string | null>(null)

    const [viewMode, setViewMode] = useState<"day" | "week">(() => {
        if (typeof window !== "undefined") return window.innerWidth < 1024 ? "day" : "week"
        return "week"
    })
    const [selectedDayKey, setSelectedDayKey] = useState<string>("")
    
    // Swipe gestures — track both X and Y to avoid triggering on vertical scroll
    const [touchStartX, setTouchStartX] = useState<number | null>(null)
    const [touchStartY, setTouchStartY] = useState<number | null>(null)
    const [touchEndX, setTouchEndX] = useState<number | null>(null)
    const [touchEndY, setTouchEndY] = useState<number | null>(null)
    const minSwipeDistance = 60

    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchEndX(null)
        setTouchEndY(null)
        setTouchStartX(e.targetTouches[0].clientX)
        setTouchStartY(e.targetTouches[0].clientY)
    }

    const handleTouchMove = (e: React.TouchEvent) => {
        setTouchEndX(e.targetTouches[0].clientX)
        setTouchEndY(e.targetTouches[0].clientY)
    }

    const handleTouchEnd = () => {
        if (!touchStartX || !touchEndX || !touchStartY || !touchEndY) return
        const distX = touchStartX - touchEndX
        const distY = touchStartY - touchEndY
        // Only trigger swipe if horizontal movement clearly dominates vertical (not a scroll)
        if (Math.abs(distX) < Math.abs(distY) * 1.5) return
        const isLeftSwipe = distX > minSwipeDistance
        const isRightSwipe = distX < -minSwipeDistance

        if (isLeftSwipe || isRightSwipe) {
            const currentIndex = weekMeta.findIndex(m => m.key === selectedDayKey)
            if (isLeftSwipe && currentIndex < weekMeta.length - 1) {
                setSelectedDayKey(weekMeta[currentIndex + 1].key)
            }
            if (isRightSwipe && currentIndex > 0) {
                setSelectedDayKey(weekMeta[currentIndex - 1].key)
            }
        }
    }

    const openSlot = useCallback((dateKey: string, hour: number) => {
        setPrefillDate(dateKey)
        setPrefillTime(`${String(hour).padStart(2, "0")}:00`)
        setSlotOpen(true)
    }, [])

    useEffect(() => {
        const today = weekMeta.find((m) => m.isToday)
        setSelectedDayKey(today ? today.key : weekMeta[0].key)
        if (typeof window !== "undefined" && window.innerWidth < 1024) {
            setViewMode("day")
        }

        const end = () => setDropTargetKey(null)
        window.addEventListener("dragend", end)
        return () => window.removeEventListener("dragend", end)
    }, [weekMeta])

    const hours = useMemo(() => {
        const h: number[] = []
        for (let i = START_HOUR; i <= END_HOUR; i++) h.push(i)
        return h
    }, [])

    const visibleDays = viewMode === "day" ? weekMeta.filter((m) => m.key === selectedDayKey) : weekMeta
    if (visibleDays.length === 0 && weekMeta.length > 0) visibleDays.push(weekMeta[0])

    // Pré-calcul des lanes par jour — résout les chevauchements entre jobs
    const dayLaneMaps = useMemo(() => {
        const maps = new Map<string, Map<string, { lane: number; totalLanes: number }>>()
        const activeDays = viewMode === "day" ? weekMeta.filter((m) => m.key === selectedDayKey) : weekMeta
        for (const col of activeDays) {
            const dayStr = col.key
            const dayJobsForLane = jobs.filter((job: any) => localDateKey(job.scheduledDate) === dayStr)
            maps.set(
                dayStr,
                computeJobLaneMap(dayJobsForLane, (job: any) => job.durationMin || jobDurationMinutes(job.services || []))
            )
        }
        return maps
    }, [jobs, weekMeta, viewMode, selectedDayKey])

    const gridColsClass = viewMode === "day" ? "grid-cols-[60px_1fr]" : "grid-cols-[40px_repeat(7,1fr)] sm:grid-cols-[60px_repeat(7,1fr)]"
    const minWClass = "min-w-full"

    return (
        <>
            <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 rounded-xl border bg-card p-1 shadow-sm w-fit">
                    <Button 
                        variant={viewMode === "day" ? "default" : "ghost"} 
                        size="sm" 
                        onClick={() => setViewMode("day")}
                        className="rounded-lg text-xs"
                    >
                        Jour
                    </Button>
                    <Button 
                        variant={viewMode === "week" ? "default" : "ghost"} 
                        size="sm" 
                        onClick={() => setViewMode("week")}
                        className="rounded-lg text-xs"
                    >
                        Semaine
                    </Button>
                </div>
                
                {viewMode === "day" && (
                    <div className="grid grid-cols-7 w-full gap-1 pb-1">
                        {weekMeta.map((col) => (
                            <Button
                                key={col.key}
                                variant={selectedDayKey === col.key ? "default" : "outline"}
                                className={`flex-col h-auto py-2 px-0 gap-0 w-full ${selectedDayKey === col.key ? "shadow-md bg-primary text-primary-foreground ring-2 ring-primary/20" : "bg-card text-muted-foreground"}`}
                                onClick={() => setSelectedDayKey(col.key)}
                            >
                                <span className="text-[10px] uppercase font-bold">{col.weekdayShort.substring(0, 3)}</span>
                                <span className="text-sm font-black">{col.dayNum}</span>
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            <div 
                className="relative w-full overflow-x-auto scrollbar-thin scrollbar-thumb-sidebar-border/50"
                onTouchStart={viewMode === "day" ? handleTouchStart : undefined}
                onTouchMove={viewMode === "day" ? handleTouchMove : undefined}
                onTouchEnd={viewMode === "day" ? handleTouchEnd : undefined}
            >
                {/* Mobile Scroll Hint - only in week mode */}
                {viewMode === "week" && (
                    <div className="pointer-events-none absolute inset-y-0 right-0 z-30 flex w-8 items-center justify-center bg-gradient-to-l from-background/80 to-transparent md:hidden">
                        <div className="animate-pulse rounded-full bg-primary/20 p-1">
                            <ChevronRight className="size-4 text-primary" />
                        </div>
                    </div>
                )}

                <div className={`${minWClass} grid ${gridColsClass} overflow-hidden rounded-xl border bg-card/30 backdrop-blur-sm shadow-sm transition-all duration-300`}>
                    <div className="sticky top-0 left-0 z-30 border-b border-r bg-muted/80 backdrop-blur-md" />
                    {visibleDays.map((col, i) => (
                        <div
                            key={col.key}
                            className={`sticky top-0 z-20 border-b border-l p-1 sm:p-2.5 text-center font-bold backdrop-blur-md transition-colors flex flex-col justify-center items-center ${
                                col.isToday
                                    ? "border-primary/30 bg-primary/10 text-primary"
                                    : "bg-muted/50 text-muted-foreground/80"
                            }`}
                        >
                            <div className="text-[8px] sm:text-[10px] uppercase tracking-widest sm:tracking-[0.2em] font-black opacity-60 mb-0.5">{col.weekdayShort.substring(0, 3)}</div>
                            <div className="text-sm sm:text-2xl tracking-tighter">{col.dayNum}</div>
                        </div>
                    ))}

                    {hours.map((hour) => (
                        <div key={hour} className="contents">
                            <div className="sticky left-0 z-20 -mt-px border-b border-r bg-background/90 backdrop-blur-sm p-1 sm:p-1.5 pr-1.5 sm:pr-3 text-right text-[8px] sm:text-[10px] font-bold tabular-nums text-muted-foreground/70 uppercase flex items-center justify-end">
                                {hour}h
                            </div>

                            {visibleDays.map((col, dayIndex) => {
                                const dayStr = col.key

                                const dayJobs = jobs.filter((job: any) => {
                                    const jobD = job.scheduledDate
                                    return localDateKey(jobD) === dayStr && localHour(jobD) === hour
                                })

                                const dayEvents = events.filter((ev: any) => {
                                    const evD = ev.scheduledDate
                                    return localDateKey(evD) === dayStr && localHour(evD) === hour
                                })

                                const activeJobs = jobs.filter((job: any) => {
                                    const jobD = job.scheduledDate
                                    if (localDateKey(jobD) !== dayStr) return false
                                    const jobStartH = localHour(jobD)
                                    const jobDurationMin = job.durationMin || jobDurationMinutes(job.services || [])
                                    const jobEndH = jobStartH + jobDurationMin / 60
                                    return hour >= jobStartH && hour < jobEndH
                                })

                                const activeEvents = events.filter((ev: any) => {
                                    const evD = ev.scheduledDate
                                    if (localDateKey(evD) !== dayStr) return false
                                    const evStartH = localHour(evD)
                                    const evEndH = evStartH + (ev.durationMin || 60) / 60
                                    return hour >= evStartH && hour < evEndH
                                })

                                const availableEmployees = new Set<string>()
                                availabilities?.forEach((a: any) => {
                                    if (!a.date) return
                                    const aD = new Date(a.date)
                                    if (localDateKey(aD) !== dayStr) return
                                    const startH = parseInt(a.startTime.split(":")[0], 10)
                                    const endH = parseInt(a.endTime.split(":")[0], 10)
                                    if (hour >= startH && hour < endH) {
                                        availableEmployees.add(a.employeeId)
                                    }
                                })

                                const availableCount = availableEmployees.size
                                const busyEmployeeCount = new Set(
                                    activeJobs.flatMap((j: any) =>
                                        j.employees?.map((e: any) => e.id) || (j.employeeId ? [j.employeeId] : [])
                                    )
                                ).size
                                const remaining = Math.max(0, availableCount - busyEmployeeCount)
                                
                                const eventColumns = Math.max(dayEvents.length, 1)
                                const eventWidth = 100 / eventColumns
                                const availabilityStyle =
                                    availableCount > 0 ? { backgroundColor: "rgba(0,0,0,0.04)" } : undefined

                                const cellKey = `${dayStr}-${hour}`

                                return (
                                    <div
                                        key={`${dayIndex}-${hour}`}
                                        className={`group relative min-h-[52px] border-b border-l transition-colors ${
                                            dropTargetKey === cellKey ? "bg-primary/15 ring-1 ring-inset ring-primary/40" : ""
                                        }`}
                                        style={availabilityStyle}
                                        onDragOver={(e) => {
                                            e.preventDefault()
                                            e.dataTransfer.dropEffect = "move"
                                        }}
                                        onDragEnter={() => setDropTargetKey(cellKey)}
                                        onDragLeave={(e) => {
                                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                                setDropTargetKey(null)
                                            }
                                        }}
                                        onDrop={async (e) => {
                                            e.preventDefault()
                                            setDropTargetKey(null)
                                            const raw = e.dataTransfer.getData(DRAG_MIME)
                                            if (!raw) return
                                            try {
                                                const { jobId, minute } = JSON.parse(raw) as {
                                                    jobId: string
                                                    minute?: number
                                                }
                                                if (!jobId) return
                                                const res = await rescheduleJob(jobId, dayStr, hour, {
                                                    minute: typeof minute === "number" ? minute : 0,
                                                })
                                                if (res.error) toast.error(res.error)
                                                else {
                                                    toast.success("Rendez-vous déplacé")
                                                    router.refresh()
                                                }
                                            } catch {
                                                toast.error("Glisser-déposer invalide")
                                            }
                                        }}
                                    >
                                        <button
                                            type="button"
                                            className="absolute inset-0 z-0 cursor-pointer hover:bg-black/5"
                                            aria-label={`Nouveau rendez-vous ${dayStr} ${hour}h`}
                                            onClick={() => openSlot(dayStr, hour)}
                                        />

                                        <div className="pointer-events-none relative z-10 h-full w-full p-1">
                                            {dayJobs.map((job: any) => {
                                                // Récupère la lane pré-calculée pour ce job
                                                const laneInfo = dayLaneMaps.get(dayStr)?.get(job.id)
                                                const lane = laneInfo?.lane ?? 0
                                                const totalLanes = laneInfo?.totalLanes ?? 1
                                                const jobLeft = (lane / totalLanes) * 100
                                                const jobWidth = 100 / totalLanes
                                                const dur = job.durationMin || jobDurationMinutes(job.services || [])
                                                const spanRows = Math.max(1, dur / 60)
                                                const heightPx = spanRows * 52
                                                return (
                                                    <div
                                                        key={job.id}
                                                        className="pointer-events-auto absolute top-0"
                                                        style={{
                                                            left: `${jobLeft}%`,
                                                            width: `${jobWidth}%`,
                                                            height: `${heightPx}px`,
                                                            zIndex: 20,
                                                        }}
                                                    >
                                                        <JobCard job={job} selectors={selectors} dragMime={DRAG_MIME} serviceZones={serviceZones} />
                                                    </div>
                                                )
                                            })}
                                            {dayEvents.map((ev: any, idx: number) => {
                                                const left = idx * eventWidth
                                                const spanRows = Math.max(1, (ev.durationMin || 60) / 60)
                                                const heightPx = spanRows * 52
                                                return (
                                                    <div
                                                        key={ev.id}
                                                        className="pointer-events-auto absolute top-0"
                                                        style={{
                                                            left: `${left}%`,
                                                            width: `${eventWidth}%`,
                                                            height: `${heightPx}px`,
                                                            zIndex: 20,
                                                        }}
                                                    >
                                                        <EventCard event={ev} />
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {availableCount > 0 && (
                                            <div className="pointer-events-none absolute top-0.5 right-0.5 z-[5] flex items-center gap-0.5">
                                                <span className="rounded bg-emerald-500/15 border border-emerald-500/30 px-1 py-px text-[8px] font-bold text-emerald-600 dark:text-emerald-400 leading-none">
                                                    {remaining}✓
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <NewJobDialog
                clients={selectors.clients}
                employees={selectors.employees}
                services={selectors.services}
                prefillDate={prefillDate}
                prefillTime={prefillTime}
                open={slotOpen}
                onOpenChange={setSlotOpen}
                hideTrigger
            />
        </>
    )
}

function JobCard({
    job,
    selectors,
    dragMime,
    serviceZones,
}: {
    job: any
    selectors: any
    dragMime: string
    serviceZones?: any
}) {
    const durationMin = job.durationMin || jobDurationMinutes(job.services || [])
    const heightPx = Math.max(28, (durationMin / 60) * 52)
    const { box, text, opacity } = getJobStatusCalendarClasses(job.status)

    const lat = job.client?.latitude
    const lng = job.client?.longitude
    let customColor = ""
    let matchedZone = ""
    
    if (lat && lng && serviceZones) {
        const zoneFeature = getZoneFromLocation(lat, lng, serviceZones)
        if (zoneFeature) {
            customColor = zoneFeature.properties?.color || ""
            matchedZone = zoneFeature.properties?.name || ""
        }
    }

    const vehicleStr = jobVehicleSummary(job)
    const servicesStr = jobServicesSummary(job)
    const assigneesStr = jobAssigneesNames(job)
    const priceStr = formatJobPrice(job)
    const clientName = job.client?.user?.name ?? "—"
    /** Sous ~45px de hauteur, empiler tout tasserait : on fusionne en 2 lignes. */
    const compact = heightPx < 46

    const dragPayload = JSON.stringify({
        jobId: job.id,
        minute: localMinute(job.scheduledDate),
    })

    const [popoverOpen, setPopoverOpen] = useState(false)
    const lastTapRef = useRef<number>(0)

    const handleCardClick = (e: React.MouseEvent) => {
        // Double-click detection: two clicks within 350ms
        const now = Date.now()
        if (now - lastTapRef.current < 350) {
            setPopoverOpen(true)
            lastTapRef.current = 0
        } else {
            lastTapRef.current = now
        }
    }

    return (
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
                <div
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.setData(dragMime, dragPayload)
                        e.dataTransfer.effectAllowed = "move"
                    }}
                    onClick={handleCardClick}
                    className={`absolute z-10 flex w-full cursor-grab flex-col overflow-hidden rounded-lg py-1.5 pl-5 pr-1.5 text-xs transition-all active:cursor-grabbing hover:brightness-[1.08] hover:ring-2 hover:ring-primary/30 ${box} ${text} ${opacity ?? ""} h-full`}
                    style={{
                        minHeight: "28px",
                        ...(customColor ? { backgroundColor: customColor, color: "#fff", borderColor: customColor } : {})
                    }}
                    title={`Double-clic pour ouvrir · Glisser pour déplacer`}
                >
                    <div className="pointer-events-none absolute left-0 top-0 flex h-full w-4 items-start justify-center pt-0.5 opacity-40">
                        <GripVertical className="size-3.5 shrink-0" aria-hidden />
                    </div>
                    {compact ? (
                        <>
                            <div className="truncate font-bold leading-tight">{clientName}</div>
                            <div className="line-clamp-2 text-[9px] leading-tight opacity-90">
                                {[vehicleStr, servicesStr || "Sans service", matchedZone ? `📍 ${matchedZone}` : null, assigneesStr || "Non assigné", priceStr].filter(Boolean).join(" · ")}
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Ligne client + badge shop/mobile */}
                            <div className="shrink-0 flex items-center gap-1 min-w-0">
                                <span className="truncate font-bold leading-tight flex-1">{clientName}</span>
                                <span
                                    className={`shrink-0 inline-flex items-center gap-0.5 rounded-full px-1 py-0 text-[8px] font-black uppercase leading-tight ${
                                        job.isInShop
                                            ? "bg-violet-500/20 text-violet-300"
                                            : "bg-sky-500/20 text-sky-300"
                                    }`}
                                >
                                    {job.isInShop ? <Store size={7} /> : <Truck size={7} />}
                                    {job.isInShop ? "Shop" : "Mobile"}
                                </span>
                            </div>
                            {vehicleStr ? (
                                <div className="shrink-0 truncate text-[10px] leading-tight opacity-90" title={vehicleStr}>
                                    {vehicleStr}
                                </div>
                            ) : null}
                            <div className="line-clamp-2 text-[10px] leading-tight opacity-90 mt-0.5">
                                {[servicesStr || "Sans service", matchedZone ? `📍 ${matchedZone}` : null].filter(Boolean).join(" · ")}
                            </div>
                            {/* Adresse pour jobs mobiles */}
                            {!job.isInShop && job.client?.address && heightPx >= 70 && (
                                <div className="shrink-0 flex items-center gap-0.5 mt-0.5 text-[9px] leading-tight opacity-80 truncate">
                                    <MapPin size={8} className="shrink-0" />
                                    <span className="truncate">{job.client.address}</span>
                                </div>
                            )}
                            <div className="mt-auto flex shrink-0 items-end justify-between gap-1 border-t border-black/10 pt-0.5 dark:border-white/15">
                                <div className="min-w-0 flex-1 truncate text-[10px] font-medium" title={assigneesStr || undefined}>
                                    {assigneesStr ? assigneesStr : <span className="opacity-70">Non assigné</span>}
                                </div>
                                {priceStr ? (
                                    <span className="shrink-0 text-[10px] font-bold tabular-nums">{priceStr}</span>
                                ) : (
                                    <span className="shrink-0 text-[10px] opacity-60">—</span>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 rounded-xl p-0">
                <div className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-2">
                        <div>
                            <h3 className="text-lg font-semibold">Détails du job</h3>
                            <p className="text-xs text-muted-foreground">Couleur = statut</p>
                        </div>
                        <EditJobDialog
                            job={job}
                            clients={selectors.clients}
                            employees={selectors.employees}
                            services={selectors.services}
                        />
                    </div>

                    {/* Badge lieu de prestation */}
                    <div className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${
                        job.isInShop
                            ? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
                            : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                    }`}>
                        {job.isInShop
                            ? <><Store size={15} /> En shop — client en boutique</>
                            : <><Truck size={15} /> Équipe mobile — déplacement</>}
                    </div>

                    <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <CalendarIcon size={16} className="text-muted-foreground" />
                            {new Date(job.scheduledDate).toLocaleString("fr-FR")}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-muted-foreground" />
                            {(durationMin / 60).toFixed(1)}h ({durationMin} min){job.durationMin ? "" : " — estimé"}
                        </div>
                        <div>
                            Client : <span className="font-medium">{job.client?.user?.name}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Car size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                            <span>{vehicleStr || "—"}</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <Users size={16} className="mt-0.5 shrink-0 text-muted-foreground" />
                            <span>{assigneesStr || "Non assigné"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Receipt size={16} className="shrink-0 text-muted-foreground" />
                            <span className="font-semibold">{priceStr ?? "—"}</span>
                        </div>
                        {/* Adresse : toujours visible dans le popover pour les jobs mobiles */}
                        {!job.isInShop && job.client?.address && (
                            <div className="mt-1 flex items-start gap-2 rounded-lg bg-sky-500/8 border border-sky-500/20 px-2.5 py-2">
                                <MapPin size={15} className="mt-0.5 shrink-0 text-sky-500" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold uppercase text-sky-600 dark:text-sky-400 mb-0.5">Adresse de prestation</p>
                                    <a
                                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.client.address)}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-xs text-sky-600 dark:text-sky-400 underline hover:opacity-80 line-clamp-2"
                                    >
                                        {job.client.address}
                                    </a>
                                </div>
                            </div>
                        )}
                        {job.isInShop && (
                            <div className="mt-1 flex items-center gap-2 rounded-lg bg-violet-500/8 border border-violet-500/20 px-2.5 py-2 text-xs text-violet-600 dark:text-violet-400 font-medium">
                                <Store size={13} />
                                Prestation en boutique
                            </div>
                        )}
                    </div>
                    <div className="text-sm">
                        <span className="font-semibold text-muted-foreground">Services :</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                            {job.services?.length ? (
                                job.services.map((s: any) => (
                                    <span key={s.serviceId} className="rounded bg-secondary px-2 py-0.5 text-[10px]">
                                        {s.service.name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-muted-foreground">—</span>
                            )}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}

function EventCard({ event }: { event: any }) {
    const durationMin = event.durationMin || 60
    const color = event.color || "#3b82f6"
    const isBlock = event.type === "BLOCK"
    
    return (
        <EditEventDialog event={event}>
            <div
                className={`absolute z-10 flex w-full cursor-pointer flex-col overflow-hidden rounded-lg border-l-4 py-1.5 pl-3 pr-1 text-xs shadow-sm transition-all hover:brightness-110 active:scale-[0.98] h-full ${isBlock ? "opacity-90" : ""}`}
                style={{
                    ...(isBlock 
                        ? { backgroundImage: `repeating-linear-gradient(45deg, ${color}15, ${color}15 10px, ${color}30 10px, ${color}30 20px)` }
                        : { backgroundColor: `${color}15` }
                    ),
                    borderLeftColor: color,
                    minHeight: "28px",
                }}
            >
                <div className="truncate font-bold leading-tight" style={{ color }}>
                    {isBlock && <span className="mr-1">🔒</span>}
                    {event.title}
                </div>
                <div className="flex items-center gap-1 text-[9px] opacity-70" style={{ color }}>
                    <Clock size={8} /> {(durationMin / 60).toFixed(1)}h
                </div>
                {event.isCompleted && (
                    <div className="mt-auto text-[8px] font-bold uppercase text-emerald-600">✓ Terminé</div>
                )}
            </div>
        </EditEventDialog>
    )
}

