"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { LayoutDashboard, History, Gift, LogOut, Menu } from "lucide-react"

const sidebarItems = [
    { href: "/client", icon: LayoutDashboard, label: "Mon Compte" },
    { href: "/client/history", icon: History, label: "Historique" },
    { href: "/client/referrals", icon: Gift, label: "Parrainage & Fidélité" },
]

export function MobileClientNav() {
    const pathname = usePathname()

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Ouvrir le menu">
                    <Menu size={18} />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
                <div className="p-6 border-b">
                    <div className="text-2xl font-bold tracking-tight text-green-500">Espace Client</div>
                </div>

                <nav className="flex-1 space-y-2 px-3 py-4">
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
            </SheetContent>
        </Sheet>
    )
}

