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
    Shield,
    UserCog,
} from "lucide-react"
import { BrandMark } from "@/components/brand/BrandMark"

const sidebarItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/schedule", icon: Calendar, label: "Planning / Schedule" },
    { href: "/admin/clients", icon: Users, label: "Clients" },
    { href: "/admin/users", icon: UserCog, label: "Utilisateurs" },
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
        <div className="hidden md:flex h-screen w-72 flex-col border-r border-sidebar-border/80 bg-sidebar/92 text-sidebar-foreground shadow-[inset_-1px_0_0_0_rgba(255,255,255,0.05)] backdrop-blur-xl transition-all duration-300 dark:bg-gradient-to-b dark:from-sidebar dark:via-sidebar dark:to-black/25">
            {/* Header / Logo */}
            <div className="border-b border-sidebar-border/50 p-6">
                <Link href="/admin" className="group flex items-center gap-3">
                    <BrandMark compact className="group-hover:scale-105 transition-transform" />
                    <div className="flex min-w-0 flex-col">
                        <span className="font-display truncate text-lg leading-none font-bold tracking-wide uppercase">
                            DRS Detailing
                        </span>
                        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Administration
                        </span>
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
                            <div
                                className={cn(
                                    "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium outline-none transition-all duration-200 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                                    isActive
                                        ? "border-l-2 border-primary bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-primary/15"
                                        : "border-l-2 border-transparent text-muted-foreground"
                                )}
                            >
                                <Icon
                                    size={18}
                                    className={cn(
                                        "transition-colors",
                                        isActive ? "text-primary" : "text-muted-foreground group-hover:text-sidebar-foreground"
                                    )}
                                />
                                <span>{item.label}</span>
                                {isActive && <div className="ml-auto size-1.5 rounded-full bg-primary opacity-90" />}
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
