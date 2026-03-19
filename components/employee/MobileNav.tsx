"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { logout } from "@/lib/actions/auth"
import { CalendarDays, Clock, ListTodo, Beaker, Menu, LogOut } from "lucide-react"

const sidebarItems = [
    { href: "/employee", icon: ListTodo, label: "Mes Tâches" },
    { href: "/employee/availability", icon: Clock, label: "Disponibilités" },
    { href: "/employee/calendar", icon: CalendarDays, label: "Mon Calendrier" },
    { href: "/employee/calculator", icon: Beaker, label: "Calculateur" },
]

export function MobileEmployeeNav({ user }: { user: any }) {
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
                    <div className="text-2xl font-bold tracking-tight text-blue-500">Espace Employé</div>
                    <div className="mt-2 text-sm text-muted-foreground">
                        Bonjour, <span className="font-semibold text-foreground">{user?.name}</span>
                    </div>
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
                    <Button
                        variant="outline"
                        className="w-full gap-2 text-red-500 hover:text-red-600 hover:bg-red-50"
                        onClick={() => logout()}
                    >
                        <LogOut size={16} />
                        Déconnexion
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

