
import { getJobs, getScheduleSelectors } from "@/lib/actions/jobs"
import { getAllAvailabilities } from "@/lib/actions/availability"
import { NewJobDialog } from "@/components/admin/NewJobDialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JobList } from "@/components/admin/JobList"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { updateJobColor } from "@/lib/actions/schedule"
import { EditJobDialog } from "@/components/admin/EditJobDialog"
import { AvailabilityGenerator } from "@/components/admin/AvailabilityGenerator"

// Helper to get week dates
function getWeekDates(baseDate: Date) {
    const start = new Date(baseDate)
    const day = start.getDay()
    const diff = start.getDate() - day + (day == 0 ? -6 : 1) // align to Monday
    // Simple fix for week alignment
    const dayOfWeek = start.getDay() || 7
    start.setDate(start.getDate() - dayOfWeek + 1)
    start.setHours(0, 0, 0, 0)

    const days = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(start)
        d.setDate(start.getDate() + i)
        days.push(d)
    }
    return days
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ date?: string, employeeId?: string }> }) {
    const { date, employeeId } = await searchParams
    const baseDate = date ? new Date(date) : new Date()
    const weekDays = getWeekDates(baseDate)
    const startDate = weekDays[0]

    // Config for navigation
    const prevDate = new Date(startDate)
    prevDate.setDate(prevDate.getDate() - 7)
    const nextDate = new Date(startDate)
    nextDate.setDate(nextDate.getDate() + 7)

    const prevLink = `/admin/schedule?date=${prevDate.toISOString().split('T')[0]}${employeeId ? `&employeeId=${employeeId}` : ''}`
    const nextLink = `/admin/schedule?date=${nextDate.toISOString().split('T')[0]}${employeeId ? `&employeeId=${employeeId}` : ''}`

    // Fetch Data
    let jobs = await getJobs()
    const selectors = await getScheduleSelectors()
    const availabilities = await getAllAvailabilities(startDate, weekDays[6])

    // Filter by Employee if param exists
    if (employeeId) {
        jobs = jobs.filter((j: any) => j.employees?.some((e: any) => e.id === employeeId))
    }

    return (
        <div className="space-y-6 flex flex-col h-[calc(100vh-100px)]">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Planning</h2>
                <div className="flex gap-2 items-center">
                    {employeeId && (
                        <div className="flex items-center gap-2 bg-yellow-100 dark:bg-yellow-900 px-3 py-1 rounded text-sm">
                            <span className="font-medium">Filtre actif</span>
                            <Link href="/admin/schedule">
                                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 hover:bg-transparent">
                                    X
                                </Button>
                            </Link>
                        </div>
                    )}
                    <NewJobDialog
                        clients={selectors.clients}
                        employees={selectors.employees}
                        services={selectors.services}
                        prefillDate={new Date().toISOString().split('T')[0]}
                    />
                    <AvailabilityGenerator
                        weekDays={weekDays}
                        jobs={jobs}
                        availabilities={availabilities}
                    />
                </div>
            </div>

            <Tabs defaultValue="calendar" className="flex-1 flex flex-col">
                <TabsList>
                    <TabsTrigger value="calendar">Vue Calendrier</TabsTrigger>
                    <TabsTrigger value="list">Vue Liste</TabsTrigger>
                </TabsList>

                <TabsContent value="calendar" className="flex-1 flex flex-col mt-4">
                    {/* Calendar Navigation */}
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center border rounded-md bg-card">
                            <Link href={prevLink}>
                                <Button variant="ghost" size="icon"><ChevronLeft /></Button>
                            </Link>
                            <span className="px-4 font-medium text-sm w-48 text-center">
                                {startDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} - {weekDays[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                            </span>
                            <Link href={nextLink}>
                                <Button variant="ghost" size="icon"><ChevronRight /></Button>
                            </Link>
                        </div>
                    </div>

                    {/* The Grid */}
                    <Card className="flex-1 flex flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto">
                            <ScheduleGrid
                                weekDays={weekDays}
                                jobs={jobs}
                                selectors={selectors}
                                availabilities={availabilities}
                            />
                        </div>
                    </Card>
                </TabsContent>

                <TabsContent value="list" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Liste des Jobs</CardTitle>
                            <CardDescription>Tous les jobs (futurs et passés).</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <JobList
                                jobs={jobs}
                                clients={selectors.clients}
                                employees={selectors.employees}
                                services={selectors.services}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}


function ScheduleGrid({ weekDays, jobs, selectors, availabilities }: any) {
    const startHour = 8
    const endHour = 19
    const hours = []
    for (let i = startHour; i <= endHour; i++) hours.push(i)

    return (
        <div className="w-full overflow-x-auto">
            {/* Inner grid keeps a minimum width; on phone we scroll horizontally */}
            <div className="min-w-[1000px] grid grid-cols-[60px_repeat(7,1fr)] bg-card rounded-xl border shadow-sm overflow-hidden">
                {/* Header Row */}
                <div className="sticky top-0 z-20 bg-muted/50 border-b p-2"></div>
                {weekDays.map((day: Date, i: number) => {
                    const isToday = new Date().toDateString() === day.toDateString()
                    return (
                        <div key={i} className={`sticky top-0 z-20 border-b border-l p-2 text-center font-medium backdrop-blur-sm ${isToday ? 'bg-primary/10 text-primary border-primary/20' : 'bg-muted/30'}`}>
                            <div className="text-sm uppercase tracking-wide opacity-70">{day.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                            <div className="text-xl">{day.getDate()}</div>
                        </div>
                    )
                })}

                {/* Time Rows */}
                {hours.map(hour => (
                    <div key={hour} className="contents">
                        {/* Time Label */}
                        <div className="border-b border-r text-xs text-muted-foreground p-1 text-right pr-2 sticky left-0 bg-background -mt-[1px]">
                            {hour}:00
                        </div>

                        {/* Day Cells */}
                        {weekDays.map((day: Date, dayIndex: number) => {
                        const dayStr = day.toISOString().split('T')[0]

                        // 1. Find jobs STARTING in this hour (for rendering)
                        const dayJobs = jobs.filter((job: any) => {
                            const jobD = new Date(job.scheduledDate)
                            const jobDateStr = jobD.toISOString().split('T')[0]
                            return jobDateStr === dayStr && jobD.getHours() === hour
                        })

                        // 2. Find ALL jobs ACTIVE in this hour (for availability calculation)
                        const activeJobs = jobs.filter((job: any) => {
                            const jobD = new Date(job.scheduledDate)
                            // Strict date check first
                            const jobDateStr = jobD.toISOString().split('T')[0]
                            if (jobDateStr !== dayStr) return false

                            const jobStartH = jobD.getHours()
                            const jobDurationMin = job.services?.reduce((acc: number, cur: any) => acc + (cur.service.durationMin || 0), 0) || 60
                            const jobEndH = jobStartH + (jobDurationMin / 60)

                            // Check if job covers this hour slot (Left inclusive, Right exclusive)
                            return (hour >= jobStartH && hour < jobEndH)
                        })

                        // 3. Check Total Availability (Unique Employees)
                        const availableEmployees = new Set()
                        availabilities?.forEach((a: any) => {
                            if (!a.date) return
                            const aD = new Date(a.date)
                            const aDateStr = aD.toISOString().split('T')[0]
                            if (aDateStr !== dayStr) return

                            // Match time range
                            const startH = parseInt(a.startTime.split(':')[0])
                            const endH = parseInt(a.endTime.split(':')[0])

                            if (hour >= startH && hour < endH) {
                                availableEmployees.add(a.employeeId)
                            }
                        })

                        const availableCount = availableEmployees.size // Total Capacity

                        // 4. Calculate Stats
                        // Busy unique employees in this slot
                        const busyEmployeeCount = new Set(
                            activeJobs.flatMap((j: any) =>
                                j.employees?.map((e: any) => e.id) || (j.employeeId ? [j.employeeId] : [])
                            )
                        ).size

                        // Remaining = Total Capacity - Busy
                        const remaining = Math.max(0, availableCount - busyEmployeeCount)

                        // 5. Layout Metrics
                        // Columns = Max(Cards starting here, Total Capacity)
                        // If we have 1 job starting, but 2 staff, we want 2 columns to show space.
                        const columns = Math.max(dayJobs.length, availableCount || 1)
                        const width = 100 / columns

                        // Styles
                        const bgClass = availableCount > 0
                            ? "bg-emerald-50/50 dark:bg-emerald-950/20"
                            : "bg-slate-50/10 dark:bg-slate-900/10"

                        const availabilityStyle = availableCount > 0 ? { backgroundColor: 'rgba(0,0,0,0.05)' } : {}

                        const dateStr = day.toISOString().split('T')[0]
                        const timeStr = `${hour.toString().padStart(2, '0')}:00`

                        return (
                            <div key={`${dayIndex}-${hour}`} className="border-b border-l min-h-[60px] relative group transition-colors" style={availabilityStyle}>
                                {/* Click to Add Trigger */}
                                <div className="absolute inset-0 z-0 hover:bg-black/5 cursor-pointer">
                                    <NewJobDialog
                                        trigger={<div className="w-full h-full" />}
                                        clients={selectors.clients}
                                        employees={selectors.employees}
                                        services={selectors.services}
                                        prefillDate={dateStr}
                                        prefillTime={timeStr}
                                    />
                                </div>

                                {/* Jobs */}
                                <div className="relative z-10 pointer-events-none p-1 h-full w-full">
                                    {dayJobs.map((job: any, idx: number) => {
                                        const left = idx * width
                                        return (
                                            <div key={job.id} className="pointer-events-auto absolute top-0 bottom-0" style={{
                                                left: `${left}%`,
                                                width: `${width}%`,
                                            }}>
                                                <JobCard job={job} selectors={selectors} />
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Availability Count Indicator (Bottom Right - Overlay) */}
                                {availableCount > 0 && (
                                    <div className="absolute bottom-1 right-1 z-50 pointer-events-none">
                                        <span className="bg-white/90 dark:bg-slate-950/90 text-xs font-bold px-1.5 py-0.5 rounded shadow-sm border text-emerald-600">
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
    )
}

function JobCard({ job, selectors }: { job: any, selectors: any }) {
    // Calculate duration in minutes (default to 60 if 0)
    const durationMin = job.services?.reduce((acc: number, curr: any) => acc + (curr.service.durationMin || 0), 0) || 60

    // Calculate height: 60px per hour
    // Subtract some padding/margin to avoid overlap if needed, or keep exact.
    const heightPx = Math.max(30, (durationMin / 60) * 60) // Min height 30px

    const bgColor = job.color || "#3b82f6" // Default blue
    const textColor = "text-white"

    return (
        <Popover>
            <PopoverTrigger asChild>
                <div
                    className="rounded p-1 text-xs overflow-hidden cursor-pointer hover:brightness-110 shadow-sm transition-all absolute w-full z-10"
                    style={{
                        backgroundColor: bgColor,
                        color: textColor,
                        height: `${heightPx}px`,
                        minHeight: '30px'
                    }}
                >
                    <div className="font-bold truncate">{job.client?.user?.name}</div>
                    <div className="truncate opacity-90 text-[10px] uppercase tracking-wide">
                        {job.vehicle?.type ? `${job.vehicle.type}` : job.services?.[0]?.service?.name}
                    </div>

                    {/* Employee Indicators */}
                    <div className="absolute bottom-1 right-1 flex -space-x-1">
                        {(() => {
                            // Combine M:N employees and fallback legacy employee
                            const employees = job.employees && job.employees.length > 0
                                ? job.employees
                                : (job.employee ? [job.employee] : [])

                            // Take max 3 to avoid overflow
                            const displayEmps = employees.slice(0, 3)

                            return displayEmps.map((emp: any) => (
                                <div key={emp.id} className="h-4 w-4 rounded-full bg-white text-black text-[8px] flex items-center justify-center font-bold ring-1 ring-white/50" title={emp.user?.name}>
                                    {emp.user?.name?.substring(0, 2).toUpperCase()}
                                </div>
                            ))
                        })()}
                        {(job.employees?.length || 0) > 3 && (
                            <div className="h-4 w-4 rounded-full bg-black/50 text-white text-[8px] flex items-center justify-center font-bold ring-1 ring-white/50">
                                +{(job.employees?.length || 0) - 3}
                            </div>
                        )}
                    </div>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 pointer-events-auto">
                <div className="p-4 space-y-4">
                    <div className="flex justify-between items-start">
                        <h3 className="font-medium text-lg">Détails du Job</h3>
                        <EditJobDialog
                            job={job}
                            clients={selectors.clients}
                            employees={selectors.employees}
                            services={selectors.services}
                        />
                    </div>

                    <div className="grid gap-2">
                        <div className="flex items-center gap-2 text-sm">
                            <CalendarIcon size={16} className="text-muted-foreground" />
                            {new Date(job.scheduledDate).toLocaleString('fr-FR')}
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                            <Clock size={16} className="text-muted-foreground" />
                            {job.services?.reduce((acc: number, curr: any) => acc + (curr.service.durationMin || 0), 0)} min (Est.)
                        </div>
                        <div className="text-sm">
                            Client: <span className="font-medium">{job.client?.user?.name}</span>
                        </div>
                    </div>

                    <div className="text-sm space-y-1">
                        <span className="font-semibold text-muted-foreground">Services:</span>
                        <div className="flex flex-wrap gap-1">
                            {job.services?.map((s: any) => (
                                <span key={s.serviceId} className="bg-secondary px-2 py-0.5 rounded text-[10px]">
                                    {s.service.name}
                                </span>
                            ))}
                        </div>
                    </div>

                    <ColorPicker id={job.id} currentColor={bgColor} />
                </div>
            </PopoverContent>
        </Popover>
    )
}

function ColorPicker({ id, currentColor }: { id: string, currentColor: string }) {
    const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#a855f7", "#ec4899", "#64748b"]

    return (
        <div className="space-y-2 pt-2 border-t">
            <span className="text-xs font-semibold">Étiquette Couleur</span>
            <div className="flex flex-wrap gap-2">
                {colors.map(c => (
                    <form key={c} action={async () => {
                        "use server"
                        await updateJobColor(id, c)
                    }}>
                        <button
                            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${currentColor === c ? 'border-black dark:border-white' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                            type="submit"
                        />
                    </form>
                ))}
            </div>
        </div>
    )
}
