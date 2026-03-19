"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    CalendarDays,
    Clock,
    ListTodo,
    Beaker,
    LogOut
} from "lucide-react"

import { logout } from "@/lib/actions/auth"

const sidebarItems = [
    { href: "/employee", icon: ListTodo, label: "Mes Tâches" },
    { href: "/employee/availability", icon: Clock, label: "Disponibilités" },
    { href: "/employee/calendar", icon: CalendarDays, label: "Mon Calendrier" },
    { href: "/employee/calculator", icon: Beaker, label: "Calculateur" },
]

export function EmployeeSidebar({ user }: { user: any }) {
    const pathname = usePathname()

    return (
        <div className="hidden md:flex h-screen w-64 flex-col border-r bg-card text-card-foreground">
            <div className="p-6">
                <h1 className="text-2xl font-bold tracking-tight text-blue-500">Espace Employé</h1>
                <div className="mt-2 text-sm text-muted-foreground">
                    Bonjour, <span className="font-semibold text-foreground">{user.name}</span>
                </div>
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
                <Button variant="outline" className="w-full gap-2 text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => logout()}>
                    <LogOut size={16} />
                    Déconnexion
                </Button>
            </div>
        </div>
    )
}
