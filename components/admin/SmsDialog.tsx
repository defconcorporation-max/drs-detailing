"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { MessageSquare, Send, Loader2 } from "lucide-react"
import { sendSMS } from "@/lib/actions/sms"

interface SmsDialogProps {
    clientId: string
    clientPhone?: string | null
    clientName?: string | null
    jobId?: string
    compact?: boolean
}

export function SmsDialog({ clientId, clientPhone, clientName, jobId, compact }: SmsDialogProps) {
    const [open, setOpen] = useState(false)
    const [content, setContent] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSend = async () => {
        if (!clientPhone) {
            setError("Le client n'a pas de numéro de téléphone enregistré.")
            return
        }

        if (!content.trim()) {
            setError("Le message ne peut pas être vide.")
            return
        }

        setLoading(true)
        setError("")

        const res = await sendSMS(clientId, clientPhone, content, jobId)

        setLoading(false)
        if (res.error) {
            setError(res.error)
        } else {
            setOpen(false)
            setContent("")
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {compact ? (
                    <Button variant="outline" size="icon" className="h-8 w-8 text-primary border-primary/20 hover:bg-primary/10" title="Envoyer un SMS">
                        <MessageSquare size={14} />
                    </Button>
                ) : (
                    <Button variant="outline" size="sm" className="gap-2 text-primary border-primary/20 hover:bg-primary/10">
                        <MessageSquare size={16} />
                        <span className="hidden sm:inline">Envoyer un SMS</span>
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Envoyer un texto</DialogTitle>
                    <DialogDescription>
                        Envoyer un SMS au client {clientName ? `(${clientName})` : ""}.
                        {clientPhone && <span className="block mt-1 font-medium text-foreground">{clientPhone}</span>}
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    {!clientPhone ? (
                        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
                            Vous devez d'abord ajouter un numéro de téléphone au profil du client.
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Textarea
                                placeholder="Tapez votre message ici..."
                                className="min-h-[120px] resize-none"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                            />
                            {error && (
                                <div className="text-sm text-destructive font-medium">{error}</div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
                    <Button onClick={handleSend} disabled={!clientPhone || !content.trim() || loading} className="gap-2">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Envoyer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
