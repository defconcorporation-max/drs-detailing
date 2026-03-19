"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    LayoutDashboard,
    History,
    Gift,
    LogOut,
    Calendar
} from "lucide-react"

const sidebarItems = [
    { href: "/client", icon: LayoutDashboard, label: "Mon Compte" },
    { href: "/client/history", icon: History, label: "Historique" },
    { href: "/client/referrals", icon: Gift, label: "Parrainage & Fidélité" },
    //   { href: "/client/book", icon: Calendar, label: "Réserver" }, // Future
]

export function ClientSidebar() {
    const pathname = usePathname()

    return (
        <div className="hidden md:flex h-screen w-64 flex-col border-r bg-card text-card-foreground">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight text-green-500">Espace Client</h1>
            </div>
            <nav className="flex-1 space-y-2 px-4">
                {sidebarItems.map((item) => {
                    const Icon = item.icon
                    const isActive = pathname === item.href
                    return (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn("w-full justify-start gap-4 mb-1", isActive && "bg-secondary")}
                            >
                                <Icon size={20} />
                                {item.label}
                            </Button>
                        </Link>
                    )
                })}
            </nav>
            <div className="p-4 border-t">
                <Link href="/">
                    <Button variant="outline" className="w-full gap-2">
                        <LogOut size={16} />
                        Quitter
                    </Button>
                </Link>
            </div>
        </div>
    )
}
