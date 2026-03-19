import { ClientSidebar } from "@/components/client/Sidebar"
import { MobileClientNav } from "@/components/client/MobileNav"

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground animate-in fade-in transition-colors overflow-hidden">
            <ClientSidebar />
            <div className="flex-1 min-w-0 flex flex-col">
                <div className="md:hidden p-3 border-b border-sidebar-border/50 bg-background">
                    <MobileClientNav />
                </div>
                <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto max-h-screen">
                    {children}
                </main>
            </div>
        </div>
    )
}
