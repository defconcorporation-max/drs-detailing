"use client"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Search, X, UserCircle, Phone } from "lucide-react"

type Client = {
    id: string
    user: { name: string; phone?: string | null; email?: string | null }
    vehicles?: any[]
}

export function ClientSearchSelect({
    clients,
    value,
    onChange,
}: {
    clients: Client[]
    value: string
    onChange: (id: string) => void
}) {
    const [query, setQuery] = useState("")
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    const selected = clients.find((c) => c.id === value)

    const filtered = query.trim()
        ? clients.filter((c) => {
              const q = query.toLowerCase()
              const name = (c.user.name || "").toLowerCase()
              const phone = (c.user.phone || "").toLowerCase().replace(/[^0-9]/g, "")
              const qDigits = q.replace(/[^0-9]/g, "")
              return name.includes(q) || (qDigits.length >= 3 && phone.includes(qDigits))
          })
        : clients

    // Close dropdown on outside click
    useEffect(() => {
        function handleClick(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClick)
        return () => document.removeEventListener("mousedown", handleClick)
    }, [])

    function handleSelect(id: string) {
        onChange(id)
        setQuery("")
        setIsOpen(false)
    }

    function handleClear() {
        onChange("")
        setQuery("")
    }

    return (
        <div ref={containerRef} className="relative flex-1">
            {/* Selected client chip OR search input */}
            {selected && !isOpen ? (
                <button
                    type="button"
                    onClick={() => setIsOpen(true)}
                    className="flex w-full items-center gap-2 rounded-xl border border-input bg-background px-3 py-2 text-sm transition-colors hover:bg-muted/50"
                >
                    <UserCircle size={16} className="shrink-0 text-primary" />
                    <span className="flex-1 truncate text-left font-medium">{selected.user.name}</span>
                    {selected.user.phone && (
                        <span className="text-xs text-muted-foreground">{selected.user.phone}</span>
                    )}
                    <X
                        size={14}
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                            e.stopPropagation()
                            handleClear()
                        }}
                    />
                </button>
            ) : (
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Rechercher par nom ou téléphone…"
                        value={query}
                        onChange={(e) => {
                            setQuery(e.target.value)
                            setIsOpen(true)
                        }}
                        onFocus={() => setIsOpen(true)}
                        className="rounded-xl pl-9"
                        autoComplete="off"
                    />
                </div>
            )}

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 max-h-56 w-full overflow-y-auto rounded-xl border border-border/60 bg-popover p-1 shadow-xl animate-in fade-in-0 zoom-in-95">
                    {filtered.length === 0 ? (
                        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                            Aucun client trouvé
                        </div>
                    ) : (
                        filtered.slice(0, 50).map((c) => (
                            <button
                                key={c.id}
                                type="button"
                                onClick={() => handleSelect(c.id)}
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted/60 ${
                                    c.id === value ? "bg-primary/10 font-semibold text-primary" : ""
                                }`}
                            >
                                <UserCircle size={18} className="shrink-0 text-muted-foreground" />
                                <div className="min-w-0 flex-1">
                                    <div className="truncate font-medium">{c.user.name}</div>
                                    <div className="flex gap-2 text-[11px] text-muted-foreground">
                                        {c.user.phone && (
                                            <span className="flex items-center gap-0.5">
                                                <Phone size={10} /> {c.user.phone}
                                            </span>
                                        )}
                                        {c.user.email && <span className="truncate">{c.user.email}</span>}
                                    </div>
                                </div>
                                {c.vehicles && c.vehicles.length > 0 && (
                                    <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] font-bold text-muted-foreground">
                                        {c.vehicles.length} véh.
                                    </span>
                                )}
                            </button>
                        ))
                    )}
                </div>
            )}
        </div>
    )
}
