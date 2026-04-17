/** Évite le pré-rendu au build (Prisma / DB pas toujours alignée en CI locale). */
export const dynamic = "force-dynamic"

import { AdminSidebar } from "@/components/admin/Sidebar"
import { MobileAdminNav } from "@/components/admin/MobileNav"
import { AppChromeBar } from "@/components/showroom/AppChromeBar"
import { BetaFeedbackTrigger } from "@/components/feedback/BetaFeedbackTrigger"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen animate-in fade-in overflow-hidden bg-background text-foreground transition-colors">
            <AppChromeBar />
            <AdminSidebar />
            <div className="flex-1 min-w-0 flex flex-col">
                <div className="md:hidden p-3 border-b border-sidebar-border/50 bg-background">
                    <MobileAdminNav />
                </div>
                <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto overflow-x-hidden max-h-screen">
                    {children}
                </main>
            </div>
            <BetaFeedbackTrigger />
        </div>
    )
}
