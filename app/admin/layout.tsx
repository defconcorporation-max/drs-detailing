import { AdminSidebar } from "@/components/admin/Sidebar"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-background text-foreground animate-in fade-in transition-colors overflow-hidden">
            <AdminSidebar />
            <main className="flex-1 min-w-0 p-4 md:p-8 overflow-y-auto max-h-screen">
                {children}
            </main>
        </div>
    )
}
