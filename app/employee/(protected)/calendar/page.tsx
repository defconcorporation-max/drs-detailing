import { getJobs } from "@/lib/actions/jobs"
import { getAvailability } from "@/lib/actions/availability"
import { EmployeeAgenda } from "@/components/employee/EmployeeAgenda"
import prisma from "@/lib/db"
import { cookies } from "next/headers"
import { filterJobsForPortal, isAdminEmployeePortalView } from "@/lib/employee-portal"

export default async function EmployeeCalendarPage() {
    const cookieStore = await cookies()
    const currentUserId = cookieStore.get("drs_employee_session")?.value

    if (!currentUserId) return <div>Non connecté</div>

    const user = await prisma.user.findUnique({
        where: { id: currentUserId },
        include: { employeeProfile: true },
    })

    if (!user) return <div>Non connecté</div>

    const adminView = isAdminEmployeePortalView(user.role)
    if (!adminView && !user.employeeProfile) return <div>Profil employé introuvable</div>

    const allJobs = await getJobs()
    const myJobs = filterJobsForPortal(allJobs, currentUserId, { isAdminView: adminView })

    const today = new Date()
    const start = new Date(today)
    start.setMonth(today.getMonth() - 1)
    const end = new Date(today)
    end.setMonth(today.getMonth() + 2)

    const availabilities = adminView && !user.employeeProfile ? [] : await getAvailability(user.id, start, end)

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{adminView ? "Calendrier équipe" : "Mon Calendrier"}</h2>
                {adminView && (
                    <p className="text-sm text-muted-foreground">
                        Vue administrateur : tous les jobs. Les plages &quot;dispo&quot; personnelles ne s&apos;affichent que si ce compte a aussi un profil employé.
                    </p>
                )}
            </div>
            <div className="h-[calc(100vh-150px)]">
                <EmployeeAgenda
                    jobs={myJobs}
                    availabilities={availabilities}
                />
            </div>
        </div>
    )
}
