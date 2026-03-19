import { getAvailability } from "@/lib/actions/availability"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import prisma from "@/lib/db"
import { WeekEditor } from "@/components/employee/WeekEditor"
import { cookies } from "next/headers"

export default async function AvailabilityPage() {
    const cookieStore = await cookies()
    const userId = cookieStore.get("drs_employee_session")?.value

    if (!userId) {
        return <div className="p-8 text-center text-red-500">Non connecté.</div>
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employeeProfile: true }
    })

    if (!user || !user.employeeProfile) {
        return <div className="p-8 text-center text-red-500">Profil employé introuvable.</div>
    }

    const today = new Date()
    // Generate 4 weeks
    const weeks = [0, 1, 2, 3].map(offset => {
        const start = new Date(today)
        // Adjust to Start of Week (Sunday or Monday? User locale FR implies Monday usually)
        // But getDay() 0 is Sunday.
        // Let's align to closest previous Monday.
        const d = new Date(start)
        const day = d.getDay()
        const diff = d.getDate() - day + (day == 0 ? -6 : 1) // adjust when day is sunday
        // Correction: if day is 0 (Sun), -6 takes us to prev Mon. If 1 (Mon), +0.
        // Simple math: d.setDate(d.getDate() - (d.getDay() + 6) % 7) ? No, simpler below:
        const dayOfWeek = d.getDay() || 7 // 1..7 (Mon..Sun)
        d.setDate(d.getDate() - dayOfWeek + 1 + (offset * 7))

        const end = new Date(d)
        end.setDate(d.getDate() + 6)

        return {
            start: d,
            end,
            label: `Semaine du ${d.getDate()}/${d.getMonth() + 1}`
        }
    })

    // Fetch all availability for the 4 weeks range
    const availabilityData = await getAvailability(user.id, weeks[0].start, weeks[3].end)

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Mes Disponibilités</h2>

            <Tabs defaultValue="week-0" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    {weeks.map((w, i) => (
                        <TabsTrigger key={i} value={`week-${i}`}>{w.label}</TabsTrigger>
                    ))}
                </TabsList>
                {weeks.map((w, i) => {
                    // Normalize to YYYY-MM-DD string to avoid timezone shifts when passing to client
                    const startStr = w.start.toISOString().split('T')[0]
                    const endStr = w.end.toISOString().split('T')[0]

                    return (
                        <TabsContent key={i} value={`week-${i}`}>
                            <WeekEditor
                                userId={user.id}
                                weekStartStr={startStr}
                                weekEndStr={endStr}
                                initialData={availabilityData}
                            />
                        </TabsContent>
                    )
                })}
            </Tabs>
        </div>
    )
}
