
import { getJobs } from "@/lib/actions/jobs"
import { getAvailability } from "@/lib/actions/availability"
import { EmployeeAgenda } from "@/components/employee/EmployeeAgenda"
import prisma from "@/lib/db"
import { cookies } from "next/headers"

export default async function EmployeeCalendarPage() {
    const cookieStore = await cookies()
    const currentUserId = cookieStore.get("drs_employee_session")?.value

    if (!currentUserId) return <div>Non connecté</div>

    // Get Employee Profile ID
    const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        include: { employeeProfile: true }
    })

    if (!user || !user.employeeProfile) return <div>Profil employé introuvable</div>

    // Filters
    const allJobs = await getJobs()
    const myJobs = allJobs.filter((j: any) => {
        if (!["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "PENDING", "REQUESTED", "RESCHEDULE_REQUESTED"].includes(j.status))
            return false
        const assigned = j.employees?.some((emp: any) => emp.user.id === currentUserId)
        const legacyAssigned = j.employee?.user?.id === currentUserId
        return assigned || legacyAssigned
    })

    // Fetch Availabilities (Large Window: +/- 2 months)
    const today = new Date()
    const start = new Date(today)
    start.setMonth(today.getMonth() - 1)
    const end = new Date(today)
    end.setMonth(today.getMonth() + 2)

    const availabilities = await getAvailability(user.id, start, end)

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Mon Calendrier</h2>
            <div className="h-[calc(100vh-150px)]">
                <EmployeeAgenda
                    jobs={myJobs}
                    availabilities={availabilities}
                />
            </div>
        </div>
    )
}
