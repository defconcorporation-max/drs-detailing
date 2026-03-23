import prisma from "@/lib/db"
import { cookies } from "next/headers"
import { notFound, redirect } from "next/navigation"
import { getActiveTimeLog } from "@/lib/actions/time"
import { getJobInspections } from "@/lib/actions/inspections"
import { getInventoryItems, getJobProductUsages } from "@/lib/actions/inventory"
import { JobExecution } from "@/components/employee/JobExecution"

export default async function JobDetailsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params

    // 1. Get Employee ID from cookie
    const cookieStore = await cookies()
    const employeeUserId = cookieStore.get("drs_employee_session")?.value

    if (!employeeUserId) {
        redirect("/employee/login")
    }

    // 2. Fetch Employee Profile ID
    const employee = await prisma.employeeProfile.findUnique({
        where: { userId: employeeUserId },
        include: { badges: { include: { badge: true } } }
    })

    if (!employee) {
        return <div>Profil employé introuvable. Contactez l'admin.</div>
    }

    // 3. Fetch Job with full includes
    const job = await prisma.job.findUnique({
        where: { id },
        include: {
            client: { include: { user: true } },
            vehicle: true,
            services: { 
                include: { service: true },
                orderBy: { service: { name: 'asc' } }
            }
        }
    })

    if (!job) return notFound()

    // 4. Get active time log, inspections, inventory, and usages
    const [activeTimeLog, inspections, inventoryItems, productUsages] = await Promise.all([
        getActiveTimeLog(id, employee.id),
        getJobInspections(id),
        getInventoryItems(),
        getJobProductUsages(id)
    ])

    return (
        <div className="p-4 md:p-8">
            <JobExecution 
                job={job} 
                activeTimeLog={activeTimeLog} 
                inspections={inspections}
                inventoryItems={inventoryItems}
                productUsages={productUsages}
                employeeProfile={employee}
                employeeId={employee.id} 
            />
        </div>
    )
}
