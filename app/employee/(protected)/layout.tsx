import { EmployeeSidebar } from "@/components/employee/Sidebar"
import { MobileEmployeeNav } from "@/components/employee/MobileNav"
import { AppChromeBar } from "@/components/showroom/AppChromeBar"
import { cookies } from "next/headers"
import prisma from "@/lib/db"
import { redirect } from "next/navigation"
import { canAccessEmployeePortal } from "@/lib/employee-portal"
import { DbSyncError } from "@/components/system/DbSyncError"

export const dynamic = "force-dynamic"

export default async function EmployeeLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const userId = cookieStore.get("drs_employee_session")?.value

    if (!userId) {
        redirect("/employee/login")
    }

    let user
    try {
        user = await prisma.user.findUnique({
            where: { id: userId },
            include: { employeeProfile: true },
        })
    } catch (e) {
        console.error("[employee/layout]", e)
        return (
            <div className="flex min-h-screen items-center justify-center p-6">
                <DbSyncError details={e instanceof Error ? e.message : String(e)} />
            </div>
        )
    }

    if (!user || !canAccessEmployeePortal(user.role)) {
        redirect("/employee/login")
    }

    return (
        <div className="flex min-h-screen animate-in fade-in overflow-hidden bg-background text-foreground transition-colors">
            <AppChromeBar />
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
