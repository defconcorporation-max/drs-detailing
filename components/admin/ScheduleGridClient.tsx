"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { EditJobDialog } from "@/components/admin/EditJobDialog"
import { NewJobDialog } from "@/components/admin/NewJobDialog"
import { jobDurationMinutes } from "@/lib/job-metrics"
import { getJobStatusCalendarClasses } from "@/lib/job-calendar-style"
import { localDateKey, localHour, localMinute } from "@/lib/date-local"
import {
    formatJobPrice,
    jobAssigneesNames,
    jobServicesSummary,
    jobVehicleSummary,
} from "@/lib/job-display"
import { Calendar as CalendarIcon, Clock, Car, Users, Receipt, GripVertical, ChevronRight } from "lucide-react"
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
    selectors: any
    availabilities: any[]
}

const START_HOUR = 6
const END_HOUR = 21

const DRAG_MIME = "application/x-drs-job"

export function ScheduleGridClient({ weekMeta, jobs, selectors, availabilities }: Props) {
    const router = useRouter()
    const [slotOpen, setSlotOpen] = useState(false)
    const [prefillDate, setPrefillDate] = useState("")
    const [prefillTime, setPrefillTime] = useState("09:00")
    const [dropTargetKey, setDropTargetKey] = useState<string | null>(null)

    const openSlot = useCallback((dateKey: string, hour: number) => {
        setPrefillDate(dateKey)
        setPrefillTime(`${String(hour).padStart(2, "0")}:00`)
        setSlotOpen(true)
    }, [])

    useEffect(() => {
        const end = () => setDropTargetKey(null)
        window.addEventListener("dragend", end)
        return () => window.removeEventListener("dragend", end)
    }, [])

    const hours = useMemo(() => {
        const h: number[] = []
        for (let i = START_HOUR; i <= END_HOUR; i++) h.push(i)
        return h
    }, [])

    return (
        <>
            <div className="relative w-full overflow-x-auto scrollbar-thin scrollbar-thumb-sidebar-border/50">
                {/* Mobile Scroll Hint */}
                <div className="pointer-events-none absolute inset-y-0 right-0 z-30 flex w-8 items-center justify-center bg-gradient-to-l from-background/80 to-transparent md:hidden">
                    <div className="animate-pulse rounded-full bg-primary/20 p-1">
                        <ChevronRight className="size-4 text-primary" />
                    </div>
                </div>

                <div className="min-w-[1000px] grid grid-cols-[60px_repeat(7,1fr)] overflow-hidden rounded-xl border bg-card/30 backdrop-blur-sm shadow-sm">
                    <div className="sticky top-0 left-0 z-30 border-b border-r bg-muted/80 backdrop-blur-md" />
                    {weekMeta.map((col, i) => (
                        <div
                            key={col.key}
                            className={`sticky top-0 z-20 border-b border-l p-2.5 text-center font-bold backdrop-blur-md transition-colors ${
                                col.isToday
                                    ? "border-primary/30 bg-primary/10 text-primary"
                                    : "bg-muted/50 text-muted-foreground/80"
                            }`}
                        >
                            <div className="text-[10px] uppercase tracking-[0.2em] font-black opacity-60 mb-0.5">{col.weekdayShort}</div>
                            <div className="text-2xl tracking-tighter">{col.dayNum}</div>
                        </div>
                    ))}

                    {hours.map((hour) => (
                        <div key={hour} className="contents">
                            <div className="sticky left-0 z-20 -mt-px border-b border-r bg-background/90 backdrop-blur-sm p-1.5 pr-3 text-right text-[10px] font-bold tabular-nums text-muted-foreground/70 uppercase">
                                {hour}h
                            </div>

                            {weekMeta.map((col, dayIndex) => {
                                const dayStr = col.key

                                const dayJobs = jobs.filter((job: any) => {
                                    const jobD = job.scheduledDate
                                    return localDateKey(jobD) === dayStr && localHour(jobD) === hour
                                })

                                const activeJobs = jobs.filter((job: any) => {
                                    const jobD = job.scheduledDate
                                    if (localDateKey(jobD) !== dayStr) return false
                                    const jobStartH = localHour(jobD)
                                    const jobDurationMin = jobDurationMinutes(job.services || [])
                                    const jobEndH = jobStartH + jobDurationMin / 60
                                    return hour >= jobStartH && hour < jobEndH
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
                                const columns = Math.max(dayJobs.length, availableCount || 1)
                                const width = 100 / columns
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
                                            {dayJobs.map((job: any, idx: number) => {
                                                const left = idx * width
                                                return (
                                                    <div
                                                        key={job.id}
                                                        className="pointer-events-auto absolute top-0 bottom-0"
                                                        style={{
                                                            left: `${left}%`,
                                                            width: `${width}%`,
                                                        }}
                                                    >
                                                        <JobCard job={job} selectors={selectors} dragMime={DRAG_MIME} />
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        {availableCount > 0 && (
                                            <div className="pointer-events-none absolute right-1 bottom-1 z-[5]">
                                                <span className="rounded border bg-white/90 px-1.5 py-0.5 text-xs font-bold text-emerald-600 shadow-sm dark:bg-slate-950/90">
                                                    {remaining} dispo
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
}: {
    job: any
    selectors: any
    dragMime: string
}) {
    const durationMin = jobDurationMinutes(job.services || [])
    const heightPx = Math.max(28, (durationMin / 60) * 52)
    const { box, text, opacity } = getJobStatusCalendarClasses(job.status)

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

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div
                    draggable
                    onDragStart={(e) => {
                        e.dataTransfer.setData(dragMime, dragPayload)
                        e.dataTransfer.effectAllowed = "move"
                    }}
                    className={`absolute z-10 flex w-full cursor-grab flex-col overflow-hidden rounded-lg py-1.5 pl-5 pr-1.5 text-xs transition-all active:cursor-grabbing hover:brightness-[1.08] hover:ring-2 hover:ring-primary/30 ${box} ${text} ${opacity ?? ""}`}
                    style={{
                        height: `${heightPx}px`,
                        minHeight: "28px",
                    }}
                    title={`Glisser pour déplacer — ${[clientName, vehicleStr, servicesStr, assigneesStr, priceStr].filter(Boolean).join(" · ")}`}
                >
                    <div className="pointer-events-none absolute left-0 top-0 flex h-full w-4 items-start justify-center pt-0.5 opacity-40">
                        <GripVertical className="size-3.5 shrink-0" aria-hidden />
                    </div>
                    {compact ? (
                        <>
                            <div className="truncate font-bold leading-tight">{clientName}</div>
                            <div className="line-clamp-2 text-[9px] leading-tight opacity-90">
                                {[vehicleStr, servicesStr || "Sans service", assigneesStr || "Non assigné", priceStr].filter(Boolean).join(" · ")}
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="shrink-0 truncate font-bold leading-tight">{clientName}</div>
                            {vehicleStr ? (
                                <div className="shrink-0 truncate text-[10px] leading-tight opacity-90" title={vehicleStr}>
                                    {vehicleStr}
                                </div>
                            ) : null}
                            <div
                                className="min-h-0 flex-1 text-[10px] leading-tight opacity-85 line-clamp-2"
                                title={servicesStr || undefined}
                            >
                                {servicesStr || <span className="opacity-70">Aucun service</span>}
                            </div>
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
                    <div className="grid gap-2 text-sm">
                        <div className="flex items-center gap-2">
                            <CalendarIcon size={16} className="text-muted-foreground" />
                            {new Date(job.scheduledDate).toLocaleString("fr-FR")}
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock size={16} className="text-muted-foreground" />
                            {durationMin} min (estimé)
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
