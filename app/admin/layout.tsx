/** Évite le pré-rendu au build (Prisma / DB pas toujours alignée en CI locale). */
export const dynamic = "force-dynamic"

import { AdminSidebar } from "@/components/admin/Sidebar"
import { MobileAdminNav } from "@/components/admin/MobileNav"
import { AppChromeBar } from "@/components/showroom/AppChromeBar"
import { BetaFeedbackTrigger } from "@/components/feedback/BetaFeedbackTrigger"
import { GlobalSearch } from "@/components/admin/GlobalSearch"
import { cookies } from "next/headers"

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const role = cookieStore.get("drs_admin_session")?.value || "admin"

    return (
        <div className="flex min-h-screen animate-in fade-in overflow-hidden bg-background text-foreground transition-colors">
            <AppChromeBar />
            <AdminSidebar role={role} />
            <div className="flex-1 min-w-0 flex flex-col">
                <div className="flex items-center justify-between gap-3 md:hidden p-3 border-b border-sidebar-border/50 bg-background">
                    <MobileAdminNav role={role} />
                    <GlobalSearch />
                </div>
                {/* Desktop search bar */}
                <div className="hidden md:flex items-center justify-end px-8 pt-4">
                    <GlobalSearch />
                </div>
                <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto overflow-x-hidden max-h-screen">
                    {children}
                </main>
            </div>
            <BetaFeedbackTrigger />
        </div>
    )
}
