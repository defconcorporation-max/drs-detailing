"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { BrandMark } from "@/components/brand/BrandMark"
import { LayoutDashboard, History, Gift, LogOut } from "lucide-react"

const sidebarItems = [
    { href: "/client", icon: LayoutDashboard, label: "Mon compte" },
    { href: "/client/history", icon: History, label: "Historique" },
    { href: "/client/referrals", icon: Gift, label: "Parrainage & fidélité" },
]

export function ClientSidebar() {
    const pathname = usePathname()

    return (
        <div className="hidden h-screen w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground md:flex">
            <div className="border-b border-sidebar-border/50 p-6">
                <Link href="/client" className="group flex items-center gap-3">
                    <BrandMark compact className="group-hover:scale-105 transition-transform" />
                    <div className="flex min-w-0 flex-col">
                        <span className="font-display truncate text-lg leading-none font-bold tracking-wide uppercase">
                            DRS Detailing
                        </span>
                        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                            Espace client
                        </span>
                    </div>
                </Link>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
                {sidebarItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href

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

            <div className="border-t border-sidebar-border/50 bg-sidebar/50 p-4">
                <Link href="/">
                    <button
                        type="button"
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                        <LogOut size={18} />
                        <span>Quitter</span>
                    </button>
                </Link>
            </div>
        </div>
    )
}
