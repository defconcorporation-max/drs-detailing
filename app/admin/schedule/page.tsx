
import { getJobs, getScheduleSelectors } from "@/lib/actions/jobs"
import { getAllAvailabilities } from "@/lib/actions/availability"
import { NewJobDialog } from "@/components/admin/NewJobDialog"
import { ScheduleGridClient } from "@/components/admin/ScheduleGridClient"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { JobList } from "@/components/admin/JobList"
import { AvailabilityGenerator } from "@/components/admin/AvailabilityGenerator"
import { localDateKey } from "@/lib/date-local"

function getWeekDates(baseDate: Date) {
    const start = new Date(baseDate)
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

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ date?: string; employeeId?: string }> }) {
    const { date, employeeId } = await searchParams
    const baseDate = date ? new Date(date + "T12:00:00") : new Date()
    const weekDays = getWeekDates(baseDate)
    const startDate = weekDays[0]

    const prevDate = new Date(startDate)
    prevDate.setDate(prevDate.getDate() - 7)
    const nextDate = new Date(startDate)
    nextDate.setDate(nextDate.getDate() + 7)

    const prevLink = `/admin/schedule?date=${prevDate.toISOString().split("T")[0]}${employeeId ? `&employeeId=${employeeId}` : ""}`
    const nextLink = `/admin/schedule?date=${nextDate.toISOString().split("T")[0]}${employeeId ? `&employeeId=${employeeId}` : ""}`

    let jobs = await getJobs()
    const selectors = await getScheduleSelectors()
    const availabilities = await getAllAvailabilities(startDate, weekDays[6])

    if (employeeId) {
        jobs = jobs.filter((j: any) => j.employees?.some((e: any) => e.id === employeeId))
    }

    const weekMeta = weekDays.map((d) => ({
        key: localDateKey(d),
        dayNum: d.getDate(),
        weekdayShort: d.toLocaleDateString("fr-FR", { weekday: "short" }),
        isToday: new Date().toDateString() === d.toDateString(),
    }))

    return (
        <div className="flex h-[calc(100vh-100px)] flex-col space-y-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="font-display text-3xl font-bold tracking-tight uppercase">Planning</h2>
                    <p className="text-xs text-muted-foreground">
                        Grille 6h–21h · dates en heure locale · Couleurs = statut (gris = attente / demande)
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {employeeId && (
                        <div className="flex items-center gap-2 rounded bg-yellow-100 px-3 py-1 text-sm dark:bg-yellow-900">
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
                        prefillDate={new Date().toISOString().split("T")[0]}
                    />
                    <AvailabilityGenerator weekDays={weekDays} jobs={jobs} availabilities={availabilities} />
                </div>
            </div>

            <Tabs defaultValue="calendar" className="flex flex-1 flex-col">
                <TabsList>
                    <TabsTrigger value="calendar">Vue Calendrier</TabsTrigger>
                    <TabsTrigger value="list">Vue Liste</TabsTrigger>
                </TabsList>

                <TabsContent value="calendar" className="mt-4 flex flex-1 flex-col">
                    <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center rounded-md border bg-card">
                            <Link href={prevLink}>
                                <Button variant="ghost" size="icon">
                                    <ChevronLeft />
                                </Button>
                            </Link>
                            <span className="w-48 px-4 text-center text-sm font-medium">
                                {startDate.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })} -{" "}
                                {weekDays[6].toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}
                            </span>
                            <Link href={nextLink}>
                                <Button variant="ghost" size="icon">
                                    <ChevronRight />
                                </Button>
                            </Link>
                        </div>
                    </div>

                    <Card className="flex flex-1 flex-col overflow-hidden">
                        <div className="flex-1 overflow-y-auto">
                            <ScheduleGridClient
                                weekMeta={weekMeta}
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
