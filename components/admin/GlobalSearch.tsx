"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, User, Briefcase, Car, Loader2, X } from "lucide-react"

interface SearchResult {
    type: string
    id: string
    label: string
    sub: string
    href: string
    status?: string
}

interface SearchResults {
    clients: SearchResult[]
    jobs: SearchResult[]
    vehicles: SearchResult[]
}

export function GlobalSearch() {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState("")
    const [results, setResults] = useState<SearchResults | null>(null)
    const [loading, setLoading] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const containerRef = useRef<HTMLDivElement>(null)
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const router = useRouter()

    // Open on Cmd+K / Ctrl+K
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "k") {
                e.preventDefault()
                setOpen(true)
            }
            if (e.key === "Escape") setOpen(false)
        }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [])

    // Focus input when opened
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50)
        } else {
            setQuery("")
            setResults(null)
        }
    }, [open])

    // Click outside to close
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false)
            }
        }
        if (open) document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [open])

    const search = useCallback(async (q: string) => {
        if (q.length < 2) { setResults(null); return }
        setLoading(true)
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
            const data = await res.json()
            setResults(data.results)
        } catch {
            setResults(null)
        } finally {
            setLoading(false)
        }
    }, [])

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value
        setQuery(q)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => search(q), 300)
    }

    const navigate = (href: string) => {
        setOpen(false)
        router.push(href)
    }

    const total = results ? results.clients.length + results.jobs.length + results.vehicles.length : 0

    return (
        <>
            {/* Trigger button */}
            <button
                onClick={() => setOpen(true)}
                className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted/60 hover:border-border"
                title="Recherche globale (⌘K)"
            >
                <Search size={14} />
                <span className="hidden sm:inline">Rechercher...</span>
                <kbd className="hidden sm:inline ml-1 rounded bg-muted px-1 py-px text-[10px] font-mono border border-border/50">⌘K</kbd>
            </button>

            {/* Modal */}
            {open && (
                <div className="fixed inset-0 z-[200] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[15vh]">
                    <div
                        ref={containerRef}
                        className="w-full max-w-lg mx-4 rounded-2xl border border-border bg-card shadow-2xl overflow-hidden"
                    >
                        {/* Input */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
                            {loading ? (
                                <Loader2 size={16} className="shrink-0 text-muted-foreground animate-spin" />
                            ) : (
                                <Search size={16} className="shrink-0 text-muted-foreground" />
                            )}
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={handleInput}
                                placeholder="Rechercher un client, job, véhicule..."
                                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            />
                            {query && (
                                <button onClick={() => { setQuery(""); setResults(null); inputRef.current?.focus() }}>
                                    <X size={14} className="text-muted-foreground hover:text-foreground" />
                                </button>
                            )}
                            <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground">Esc</kbd>
                        </div>

                        {/* Results */}
                        <div className="max-h-[60vh] overflow-y-auto">
                            {!query && (
                                <div className="py-10 text-center text-sm text-muted-foreground">
                                    Tapez pour rechercher dans clients, jobs et véhicules
                                </div>
                            )}

                            {query.length >= 2 && !loading && results && total === 0 && (
                                <div className="py-10 text-center text-sm text-muted-foreground">
                                    Aucun résultat pour &ldquo;{query}&rdquo;
                                </div>
                            )}

                            {results && (
                                <div className="p-2 space-y-1">
                                    {/* Clients */}
                                    {results.clients.length > 0 && (
                                        <div>
                                            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                Clients
                                            </div>
                                            {results.clients.map(r => (
                                                <button
                                                    key={r.id}
                                                    onClick={() => navigate(r.href)}
                                                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/60 transition-colors"
                                                >
                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-500/15">
                                                        <User size={12} className="text-blue-500" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate text-sm font-medium">{r.label}</div>
                                                        <div className="truncate text-[11px] text-muted-foreground">{r.sub}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Jobs */}
                                    {results.jobs.length > 0 && (
                                        <div>
                                            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                Jobs
                                            </div>
                                            {results.jobs.map(r => (
                                                <button
                                                    key={r.id}
                                                    onClick={() => navigate(r.href)}
                                                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/60 transition-colors"
                                                >
                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                                                        <Briefcase size={12} className="text-emerald-500" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate text-sm font-medium">{r.label}</div>
                                                        <div className="truncate text-[11px] text-muted-foreground">{r.sub}</div>
                                                    </div>
                                                    {r.status && (
                                                        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                                                            {r.status}
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Véhicules */}
                                    {results.vehicles.length > 0 && (
                                        <div>
                                            <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                                                Véhicules
                                            </div>
                                            {results.vehicles.map(r => (
                                                <button
                                                    key={r.id}
                                                    onClick={() => navigate(r.href)}
                                                    className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted/60 transition-colors"
                                                >
                                                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-orange-500/15">
                                                        <Car size={12} className="text-orange-500" />
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="truncate text-sm font-medium">{r.label}</div>
                                                        <div className="truncate text-[11px] text-muted-foreground">{r.sub}</div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
