import { cookies } from "next/headers"
import { getEmployeeWeekSchedule } from "@/lib/actions/employee"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { localDateKey, localHour, localMinute } from "@/lib/date-local"
import { jobDurationMinutes } from "@/lib/job-metrics"
import { formatJobPrice } from "@/lib/job-display"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { CalendarIcon, Car, CheckCircle2, MapPin, Store, Truck } from "lucide-react"

export const dynamic = "force-dynamic"

function getWeekDays(startOfWeek: Date) {
    const days = []
    for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek)
        d.setDate(startOfWeek.getDate() + i)
        days.push(d)
    }
    return days
}

export default async function EmployeeWeekPage() {
    const cookieStore = await cookies()
    const userId = cookieStore.get("drs_employee_session")?.value

    if (!userId) return null

    let schedule
    try {
        schedule = await getEmployeeWeekSchedule(userId)
    } catch (e) {
        return <div className="p-6">Erreur de chargement.</div>
    }

    const { jobs, availabilities, startOfWeek } = schedule
    const weekDays = getWeekDays(startOfWeek)
    const todayStr = new Date().toDateString()

    // Grouper les jobs par jour
    const jobsByDay = weekDays.map(day => {
        const dStr = localDateKey(day)
        const dayJobs = jobs.filter(j => localDateKey(new Date(j.scheduledDate)) === dStr)
        
        // Calculer dispo pour ce jour
        let dispo = availabilities.find(a => a.date && localDateKey(new Date(a.date)) === dStr)
        if (!dispo) {
            dispo = availabilities.find(a => !a.date && a.dayOfWeek === day.getDay())
        }

        // Calculer heures totales
        let totalMin = 0
        dayJobs.forEach(j => {
            if (j.status !== "CANCELLED") {
                const dur = j.durationMin || jobDurationMinutes(j.services || [])
                totalMin += dur
            }
        })
        const totalH = Math.floor(totalMin / 60)
        const totalM = totalMin % 60
        const totalTimeStr = `${totalH}h${totalM > 0 ? totalM.toString().padStart(2, '0') : ''}`

        return { day, dayJobs, dispo, totalTimeStr, isToday: day.toDateString() === todayStr }
    })

    return (
        <div className="space-y-6 max-w-5xl mx-auto p-2 pb-24 md:p-6 md:pb-6">
            <div className="flex flex-col gap-2">
                <h1 className="font-display text-3xl font-bold tracking-tight uppercase">
                    Ma Semaine
                </h1>
                <p className="text-muted-foreground text-sm">
                    Du {weekDays[0].toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} au {weekDays[6].toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {jobsByDay.map(({ day, dayJobs, dispo, totalTimeStr, isToday }, idx) => (
                    <Card key={idx} className={`flex flex-col overflow-hidden ${isToday ? "border-primary/50 ring-1 ring-primary/20 bg-primary/5" : ""}`}>
                        <div className={`px-4 py-3 border-b flex items-center justify-between ${isToday ? "bg-primary/10 border-primary/20" : "bg-muted/30"}`}>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-bold uppercase tracking-wider ${isToday ? "text-primary" : ""}`}>
                                    {day.toLocaleDateString("fr-FR", { weekday: "long" })}
                                </span>
                                <span className={`text-lg font-black tracking-tighter ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                                    {day.getDate()}
                                </span>
                            </div>
                            {dispo ? (
                                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                                    {dispo.startTime} - {dispo.endTime}
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="bg-muted text-muted-foreground text-[10px]">
                                    Off
                                </Badge>
                            )}
                        </div>

                        <CardContent className="flex-1 p-0 flex flex-col">
                            {dayJobs.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center px-4">
                                    <CalendarIcon className="h-8 w-8 text-muted-foreground/30 mb-2" />
                                    <p className="text-xs text-muted-foreground">Aucun rendez-vous assigné</p>
                                </div>
                            ) : (
                                <div className="flex flex-col divide-y divide-border">
                                    {dayJobs.map((job) => {
                                        const d = new Date(job.scheduledDate)
                                        const timeStr = `${localHour(d)}h${localMinute(d)}`
                                        const dur = job.durationMin || jobDurationMinutes(job.services || [])
                                        const isCompleted = job.status === "COMPLETED"
                                        
                                        return (
                                            <Link href={`/employee/job/${job.id}`} key={job.id} className="group block hover:bg-muted/30 transition-colors p-4">
                                                <div className="flex items-start gap-3">
                                                    <div className="flex flex-col items-center justify-center shrink-0 w-12 pt-0.5">
                                                        <span className={`text-xs font-black tracking-tighter ${isCompleted ? "text-emerald-500" : "text-foreground"}`}>{timeStr}</span>
                                                        <span className="text-[9px] font-semibold text-muted-foreground uppercase">{dur} min</span>
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                            <span className="font-bold text-sm truncate">{job.client?.user?.name || "Client"}</span>
                                                            <span className={`inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[8px] font-black uppercase leading-none ${job.isInShop ? "bg-violet-500/20 text-violet-500" : "bg-sky-500/20 text-sky-500"}`}>
                                                                {job.isInShop ? <Store size={8} /> : <Truck size={8} />}
                                                                {job.isInShop ? "Shop" : "Mobile"}
                                                            </span>
                                                            {isCompleted && (
                                                                <CheckCircle2 size={12} className="text-emerald-500" />
                                                            )}
                                                        </div>
                                                        
                                                        <div className="text-[10px] text-muted-foreground line-clamp-1 mb-1">
                                                            {job.services.map((s: any) => s.service.name).join(", ") || job.customServiceName || "Sans service"}
                                                        </div>
                                                        
                                                        {job.vehicle && (
                                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                                <Car size={10} className="shrink-0" />
                                                                <span className="truncate">{job.vehicle.make} {job.vehicle.model}</span>
                                                            </div>
                                                        )}
                                                        
                                                        {!job.isInShop && job.client?.address && (
                                                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                                                                <MapPin size={10} className="shrink-0" />
                                                                <span className="truncate">{job.client.address}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            )}
                            
                            {dayJobs.length > 0 && (
                                <div className="mt-auto px-4 py-2 border-t bg-muted/10 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground text-center flex justify-between items-center">
                                    <span>{dayJobs.length} job{dayJobs.length > 1 ? 's' : ''}</span>
                                    <span>Total : {totalTimeStr}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
