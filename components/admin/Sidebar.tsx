"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
// import { Button } from "@/components/ui/button" // Replaced with custom styling for sidebar
import {
    LayoutDashboard,
    Users,
    Calendar,
    Package,
    Wallet,
    Settings,
    Car,
    LogOut,
    Clock,
    Shield
} from "lucide-react"

const sidebarItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/schedule", icon: Calendar, label: "Planning / Schedule" },
    { href: "/admin/clients", icon: Users, label: "Clients" },
    { href: "/admin/team", icon: Shield, label: "Équipe" },
    { href: "/admin/availability", icon: Clock, label: "Disponibilités" },
    { href: "/admin/services", icon: Car, label: "Services & Prix" },
    { href: "/admin/inventory", icon: Package, label: "Inventaire" },
    { href: "/admin/accounting", icon: Wallet, label: "Comptabilité" },
    { href: "/admin/settings", icon: Settings, label: "Paramètres" },
]

export function AdminSidebar() {
    const pathname = usePathname()

    return (
        <div className="hidden md:flex h-screen w-72 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300">
            {/* Header / Logo */}
            <div className="p-6 border-b border-sidebar-border/50">
                <Link href="/admin" className="flex items-center gap-2 group">
                    <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                        D
                    </div>
                    <div className="flex flex-col">
                        <span className="font-bold text-lg tracking-tight leading-none">DRS Detailing</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Administration</span>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
                {sidebarItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== "/admin")

                    return (
                        <Link key={item.href} href={item.href} className="block">
                            <div className={cn(
                                "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                isActive
                                    ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-sidebar-border"
                                    : "text-muted-foreground"
                            )}>
                                <Icon
                                    size={18}
                                    className={cn(
                                        "transition-colors",
                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                                    )}
                                />
                                <span>{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shadow shadow-primary/50" />
                                )}
                            </div>
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-sidebar-border/50 bg-sidebar/50">
                <Link href="/">
                    <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10">
                        <LogOut size={18} />
                        <span>Déconnexion</span>
                    </button>
                </Link>
            </div>
        </div>
    )
}
