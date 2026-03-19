import { EmployeeSidebar } from "@/components/employee/Sidebar"
import { MobileEmployeeNav } from "@/components/employee/MobileNav"
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
        <div className="flex min-h-screen bg-background text-foreground animate-in fade-in transition-colors overflow-hidden">
            <EmployeeSidebar user={user} />
            <div className="flex-1 min-w-0 flex flex-col">
                <div className="md:hidden p-3 border-b border-sidebar-border/50 bg-background">
                    <MobileEmployeeNav user={user} />
                </div>
                <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto max-h-screen">
                    {children}
                </main>
            </div>
        </div>
    )
}
