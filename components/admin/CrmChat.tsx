"use client"

import { useState, useEffect, useRef } from "react"
import { 
    Search, 
    Send, 
    MessageSquare, 
    Phone, 
    User, 
    Clock, 
    Check, 
    AlertCircle, 
    Loader2, 
    RefreshCw
} from "lucide-react"
import { getSmsConversations, getSmsHistory, sendSMS } from "@/lib/actions/sms"
import { toast } from "sonner"

type Conversation = {
    clientId: string
    clientName: string
    clientPhone: string
    lastMessage: string
    lastMessageDate: Date
    direction: "INBOUND" | "OUTBOUND" | null
    status: string | null
}

type SmsMessage = {
    id: string
    clientId: string
    jobId: string | null
    direction: "INBOUND" | "OUTBOUND"
    content: string
    status: string
    twilioSid: string | null
    createdAt: Date
}

export function CrmChat() {
    const [conversations, setConversations] = useState<Conversation[]>([])
    const [activeClientId, setActiveClientId] = useState<string | null>(null)
    const [activeHistory, setActiveHistory] = useState<SmsMessage[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [inputMessage, setInputMessage] = useState("")
    const [loadingConversations, setLoadingConversations] = useState(true)
    const [loadingHistory, setLoadingHistory] = useState(false)
    const [sending, setSending] = useState(false)
    const [refreshing, setRefreshing] = useState(false)

    const chatEndRef = useRef<HTMLDivElement>(null)

    // Load list of conversations
    const loadConversations = async (silent = false) => {
        if (!silent) setLoadingConversations(true)
        const res = await getSmsConversations()
        if (res.success && res.conversations) {
            // Convert string date representations to actual Date objects
            const formatted = res.conversations.map((c: any) => ({
                ...c,
                lastMessageDate: new Date(c.lastMessageDate)
            }))
            setConversations(formatted)
        } else {
            toast.error(res.error || "Erreur de chargement des conversations")
        }
        setLoadingConversations(false)
    }

    // Load chat history for selected client
    const loadHistory = async (clientId: string, silent = false) => {
        if (!silent) setLoadingHistory(true)
        const res = await getSmsHistory(clientId)
        if (res.success && res.messages) {
            // Convert date strings to Date objects
            const formatted = res.messages.map((m: any) => ({
                ...m,
                createdAt: new Date(m.createdAt)
            }))
            setActiveHistory(formatted)
        } else {
            toast.error(res.error || "Erreur de chargement des messages")
        }
        setLoadingHistory(false)
    }

    // Load conversations on mount
    useEffect(() => {
        loadConversations()
    }, [])

    // Refresh active history when active client changes
    useEffect(() => {
        if (activeClientId) {
            loadHistory(activeClientId)
        } else {
            setActiveHistory([])
        }
    }, [activeClientId])

    // Scroll to bottom when history loads or updates
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
    }, [activeHistory])

    // Poll for new messages (real-time feel)
    useEffect(() => {
        const interval = setInterval(() => {
            loadConversations(true)
            if (activeClientId) {
                loadHistory(activeClientId, true)
            }
        }, 5000)
        return () => clearInterval(interval)
    }, [activeClientId])

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!activeClientId || !inputMessage.trim() || sending) return

        const activeClient = conversations.find(c => c.clientId === activeClientId)
        if (!activeClient || !activeClient.clientPhone) {
            toast.error("Le client n'a pas de numéro de téléphone valide.")
            return
        }

        setSending(true)
        const text = inputMessage.trim()
        setInputMessage("")

        // Optimistic update
        const tempId = Math.random().toString()
        const optimisticMsg: SmsMessage = {
            id: tempId,
            clientId: activeClientId,
            jobId: null,
            direction: "OUTBOUND",
            content: text,
            status: "PENDING",
            twilioSid: null,
            createdAt: new Date()
        }
        setActiveHistory(prev => [...prev, optimisticMsg])

        // Call Server Action
        const res = await sendSMS(activeClientId, activeClient.clientPhone, text)
        
        if (res.error) {
            toast.error(res.error)
            // Update message status to FAILED in history
            setActiveHistory(prev => 
                prev.map(m => m.id === tempId ? { ...m, status: "FAILED" } : m)
            )
        } else {
            // Load fresh history and list
            loadHistory(activeClientId, true)
            loadConversations(true)
        }
        setSending(false)
    }

    const handleManualRefresh = async () => {
        setRefreshing(true)
        await loadConversations(true)
        if (activeClientId) {
            await loadHistory(activeClientId, true)
        }
        setRefreshing(false)
        toast.success("Messagerie rafraîchie")
    }

    // Filter conversations based on search text
    const filteredConversations = conversations.filter(c => 
        c.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.clientPhone.includes(searchTerm)
    )

    const activeClient = conversations.find(c => c.clientId === activeClientId)

    const formatTime = (date: Date) => {
        if (date.getTime() === 0) return ""
        const now = new Date()
        const isToday = date.toDateString() === now.toDateString()
        if (isToday) {
            return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
        }
        return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" })
    }

    return (
        <div className="flex h-[calc(100vh-140px)] min-h-[500px] w-full rounded-2xl border border-white/10 bg-card/40 backdrop-blur-xl shadow-2xl overflow-hidden">
            {/* LEFT COLUMN: LIST */}
            <div className="w-80 border-r border-border/60 flex flex-col bg-background/25">
                {/* Search Bar */}
                <div className="p-4 border-b border-border/60 flex items-center justify-between gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Rechercher un client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-background/50 text-xs outline-none focus:ring-1 focus:ring-primary text-foreground"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={handleManualRefresh}
                        disabled={refreshing}
                        className="h-9 w-9 rounded-lg border border-border bg-background/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all shrink-0"
                        title="Rafraîchir"
                    >
                        <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
                    </button>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto divide-y divide-border/30">
                    {loadingConversations ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <span className="text-xs">Chargement...</span>
                        </div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="text-center py-12 text-xs text-muted-foreground italic">
                            Aucun client trouvé
                        </div>
                    ) : (
                        filteredConversations.map((c) => {
                            const isActive = c.clientId === activeClientId
                            const hasHistory = c.lastMessageDate.getTime() > 0
                            return (
                                <div
                                    key={c.clientId}
                                    onClick={() => setActiveClientId(c.clientId)}
                                    className={`p-4 cursor-pointer flex flex-col gap-1 transition-all hover:bg-muted/15 ${
                                        isActive ? "bg-primary/10 border-l-4 border-primary" : "border-l-4 border-transparent"
                                    }`}
                                >
                                    <div className="flex justify-between items-baseline gap-2">
                                        <h4 className="font-bold text-sm text-foreground truncate">{c.clientName}</h4>
                                        <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
                                            {formatTime(c.lastMessageDate)}
                                        </span>
                                    </div>
                                    <div className="text-xs text-muted-foreground font-mono truncate">
                                        {c.clientPhone || "Pas de numéro"}
                                    </div>
                                    {hasHistory && (
                                        <p className="text-xs text-muted-foreground truncate mt-1 leading-snug">
                                            {c.direction === "OUTBOUND" ? (
                                                <span className="text-primary font-semibold mr-1">Vous :</span>
                                            ) : null}
                                            {c.lastMessage}
                                        </p>
                                    )}
                                </div>
                            )
                        })
                    )}
                </div>
            </div>

            {/* RIGHT COLUMN: CHAT WINDOW */}
            <div className="flex-1 flex flex-col bg-background/10">
                {activeClientId && activeClient ? (
                    <>
                        {/* Chat Header */}
                        <div className="p-4 border-b border-border/60 bg-card/60 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary font-black uppercase text-sm">
                                    {activeClient.clientName.substring(0, 2)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-foreground leading-none">{activeClient.clientName}</h3>
                                    <span className="text-xs text-muted-foreground font-mono mt-1 block">{activeClient.clientPhone}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <a
                                    href={`tel:${activeClient.clientPhone}`}
                                    className="h-9 px-3 rounded-lg border border-border bg-background/50 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/20 transition-all font-semibold"
                                >
                                    <Phone size={14} />
                                    <span>Appeler</span>
                                </a>
                            </div>
                        </div>

                        {/* Message Stream */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {loadingHistory ? (
                                <div className="flex h-full items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : activeHistory.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center text-center gap-3 py-12">
                                    <MessageSquare size={36} className="text-muted-foreground/30" />
                                    <div className="text-sm font-semibold text-muted-foreground">Aucun message échangé</div>
                                    <p className="text-xs text-muted-foreground max-w-xs">Démarrez la conversation en envoyant un texto ci-dessous.</p>
                                </div>
                            ) : (
                                activeHistory.map((m) => {
                                    const isMe = m.direction === "OUTBOUND"
                                    return (
                                        <div 
                                            key={m.id}
                                            className={`flex ${isMe ? "justify-end" : "justify-start"} items-end gap-1.5`}
                                        >
                                            {!isMe && (
                                                <div className="h-6 w-6 rounded-full bg-muted border border-border/50 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                                                    {activeClient.clientName.substring(0, 1)}
                                                </div>
                                            )}
                                            <div className="flex flex-col gap-0.5 max-w-[70%]">
                                                <div className={`rounded-2xl px-4 py-2 text-sm leading-relaxed ${
                                                    isMe 
                                                        ? "bg-primary text-primary-foreground rounded-br-none" 
                                                        : "bg-muted/50 border border-border/50 text-foreground rounded-bl-none"
                                                }`}>
                                                    {m.content}
                                                </div>
                                                <div className={`text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
                                                    <span>{m.createdAt.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
                                                    {isMe && (
                                                        <span>
                                                            {m.status === "PENDING" && <Loader2 size={8} className="animate-spin" />}
                                                            {m.status === "SENT" && <Check size={10} />}
                                                            {m.status === "DELIVERED" && <Check size={10} className="text-emerald-400" />}
                                                            {m.status === "FAILED" && <AlertCircle size={10} className="text-destructive" />}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                            <div ref={chatEndRef} />
                        </div>

                        {/* Input Composer */}
                        <form onSubmit={handleSend} className="p-4 border-t border-border/60 bg-card/40 flex items-center gap-3">
                            <input
                                type="text"
                                placeholder={`Répondre à ${activeClient.clientName}...`}
                                value={inputMessage}
                                onChange={(e) => setInputMessage(e.target.value)}
                                disabled={sending}
                                className="flex-1 h-11 px-4 rounded-xl border border-border bg-background/50 text-sm outline-none focus:ring-1 focus:ring-primary text-foreground disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={!inputMessage.trim() || sending}
                                className="h-11 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:brightness-[1.05] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shrink-0"
                            >
                                {sending ? (
                                    <Loader2 size={16} className="animate-spin" />
                                ) : (
                                    <>
                                        <Send size={14} />
                                        <span className="hidden sm:inline">Envoyer</span>
                                    </>
                                )}
                            </button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                        <div className="h-16 w-16 rounded-full bg-muted/20 border border-dashed border-border flex items-center justify-center text-muted-foreground/45 mb-2">
                            <MessageSquare size={32} />
                        </div>
                        <h3 className="font-display text-lg font-bold text-foreground uppercase tracking-wide">Messagerie CRM SMS</h3>
                        <p className="text-xs text-muted-foreground max-w-sm">Sélectionnez un client dans le panneau de gauche pour consulter l&apos;historique des échanges et lui envoyer des SMS.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
