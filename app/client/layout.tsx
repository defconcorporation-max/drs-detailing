import { ClientSidebar } from "@/components/client/Sidebar"

export default function ClientLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground animate-in fade-in transition-colors">
            <ClientSidebar />
            <main className="flex-1 p-4 md:p-8 overflow-y-auto max-h-screen">
                {children}
            </main>
        </div>
    )
}
