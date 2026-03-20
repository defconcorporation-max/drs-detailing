"use client"

import { useState, useMemo, useCallback } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { EditJobDialog } from "@/components/admin/EditJobDialog"
import { NewJobDialog } from "@/components/admin/NewJobDialog"
import { jobDurationMinutes } from "@/lib/job-metrics"
import { getJobStatusCalendarClasses } from "@/lib/job-calendar-style"
import { localDateKey, localHour } from "@/lib/date-local"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

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

export function ScheduleGridClient({ weekMeta, jobs, selectors, availabilities }: Props) {
    const [slotOpen, setSlotOpen] = useState(false)
    const [prefillDate, setPrefillDate] = useState("")
    const [prefillTime, setPrefillTime] = useState("09:00")

    const openSlot = useCallback((dateKey: string, hour: number) => {
        setPrefillDate(dateKey)
        setPrefillTime(`${String(hour).padStart(2, "0")}:00`)
        setSlotOpen(true)
    }, [])

    const hours = useMemo(() => {
        const h: number[] = []
        for (let i = START_HOUR; i <= END_HOUR; i++) h.push(i)
        return h
    }, [])

    return (
        <>
            <div className="w-full overflow-x-auto">
                <div className="min-w-[1000px] grid grid-cols-[60px_repeat(7,1fr)] overflow-hidden rounded-xl border bg-card shadow-sm">
                    <div className="sticky top-0 z-20 border-b bg-muted/50 p-2" />
                    {weekMeta.map((col, i) => (
                        <div
                            key={col.key}
                            className={`sticky top-0 z-20 border-b border-l p-2 text-center font-medium backdrop-blur-sm ${
                                col.isToday
                                    ? "border-primary/20 bg-primary/10 text-primary"
                                    : "bg-muted/30"
                            }`}
                        >
                            <div className="text-sm uppercase tracking-wide opacity-70">{col.weekdayShort}</div>
                            <div className="text-xl">{col.dayNum}</div>
                        </div>
                    ))}

                    {hours.map((hour) => (
                        <div key={hour} className="contents">
                            <div className="sticky left-0 -mt-px border-b border-r bg-background p-1 pr-2 text-right text-xs text-muted-foreground">
                                {hour}:00
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

                                return (
                                    <div
                                        key={`${dayIndex}-${hour}`}
                                        className="group relative min-h-[52px] border-b border-l transition-colors"
                                        style={availabilityStyle}
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
                                                        <JobCard job={job} selectors={selectors} />
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

function JobCard({ job, selectors }: { job: any; selectors: any }) {
    const durationMin = jobDurationMinutes(job.services || [])
    const heightPx = Math.max(28, (durationMin / 60) * 52)
    const { box, text, opacity } = getJobStatusCalendarClasses(job.status)

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div
                    className={`absolute z-10 w-full cursor-pointer overflow-hidden rounded-lg p-1.5 text-xs transition-all hover:brightness-[1.08] hover:ring-2 hover:ring-primary/30 ${box} ${text} ${opacity ?? ""}`}
                    style={{
                        height: `${heightPx}px`,
                        minHeight: "28px",
                    }}
                >
                    <div className="truncate font-bold">{job.client?.user?.name}</div>
                    <div className="truncate text-[10px] uppercase tracking-wide opacity-90">
                        {job.vehicle?.type ? `${job.vehicle.type}` : job.services?.[0]?.service?.name}
                    </div>
                    <div className="absolute right-1 bottom-1 flex -space-x-1">
                        {(() => {
                            const employees =
                                job.employees && job.employees.length > 0 ? job.employees : job.employee ? [job.employee] : []
                            return employees.slice(0, 3).map((emp: any) => (
                                <div
                                    key={emp.id}
                                    className="flex size-4 items-center justify-center rounded-full bg-white text-[8px] font-bold text-black ring-1 ring-white/50"
                                    title={emp.user?.name}
                                >
                                    {emp.user?.name?.substring(0, 2).toUpperCase()}
                                </div>
                            ))
                        })()}
                    </div>
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
                    </div>
                    <div className="text-sm">
                        <span className="font-semibold text-muted-foreground">Services :</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                            {job.services?.map((s: any) => (
                                <span key={s.serviceId} className="rounded bg-secondary px-2 py-0.5 text-[10px]">
                                    {s.service.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
