import { EmployeeSidebar } from "@/components/employee/Sidebar"
import { cookies } from "next/headers"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"

export default async function EmployeeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const userId = cookieStore.get("drs_employee_session")?.value

    if (!userId) {
        redirect("/login")
    }

    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { employeeProfile: true }
    })

    if (!user) {
        redirect("/login")
    }

    return (
        <div className="flex min-h-screen bg-background text-foreground animate-in fade-in transition-colors">
            <EmployeeSidebar user={user} />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
                {children}
            </main>
        </div>
    )
}
