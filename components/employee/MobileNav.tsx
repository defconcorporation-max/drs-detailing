"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { BrandMark } from "@/components/brand/BrandMark"
import { logout } from "@/lib/actions/auth"
import { CalendarDays, Clock, ListTodo, Beaker, Menu, LogOut } from "lucide-react"

const sidebarItems = [
    { href: "/employee", icon: ListTodo, label: "Mes tâches" },
    { href: "/employee/availability", icon: Clock, label: "Disponibilités" },
    { href: "/employee/calendar", icon: CalendarDays, label: "Mon calendrier" },
    { href: "/employee/calculator", icon: Beaker, label: "Calculateur" },
]

export function MobileEmployeeNav({ user }: { user: { name?: string | null } }) {
    const pathname = usePathname()

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="rounded-xl border-border/60 shadow-sm" aria-label="Ouvrir le menu">
                    <Menu size={18} />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex w-[min(100vw,20rem)] flex-col border-sidebar-border bg-sidebar p-0">
                <div className="border-b border-sidebar-border/50 p-6">
                    <Link href="/employee" className="group flex items-center gap-3">
                        <BrandMark compact className="group-hover:scale-105 transition-transform" />
                        <div className="flex min-w-0 flex-col">
                            <span className="font-display truncate text-lg leading-none font-bold tracking-wide uppercase">
                                DRS Detailing
                            </span>
                            <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                                Équipe
                            </span>
                        </div>
                    </Link>
                    {user?.name && (
                        <p className="mt-4 text-sm text-muted-foreground">
                            Bonjour, <span className="font-semibold text-foreground">{user.name}</span>
                        </p>
                    )}
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
                                </div>
                            </Link>
                        )
                    })}
                </nav>

                <div className="border-t border-sidebar-border/50 bg-sidebar/50 p-4">
                    <Button
                        variant="outline"
                        className="w-full gap-2 rounded-xl border-destructive/30 text-destructive hover:bg-destructive/10"
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
