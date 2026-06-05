"use client"

import { useState } from "react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { Send, MessageSquare } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addJobNote } from "@/lib/actions/jobs"
import { toast } from "sonner"

export function JobNotesTimeline({ jobId, initialNotes }: { jobId: string, initialNotes: any[] }) {
    const [notes, setNotes] = useState(initialNotes || [])
    const [content, setContent] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!content.trim()) return

        setIsSubmitting(true)
        const res = await addJobNote(jobId, content)
        setIsSubmitting(false)

        if (res.success && res.note) {
            setNotes([res.note, ...notes])
            setContent("")
        } else {
            toast.error(res.error || "Erreur d'ajout de note")
        }
    }

    return (
        <Card>
            <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                    <MessageSquare size={16} />
                    Notes Internes
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-col gap-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <Input
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="Ajouter une note (visible par l'équipe uniquement)..."
                        className="flex-1 bg-muted/50 border-border/50"
                        disabled={isSubmitting}
                    />
                    <Button type="submit" size="icon" disabled={isSubmitting || !content.trim()}>
                        <Send size={16} />
                    </Button>
                </form>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {notes.length === 0 ? (
                        <div className="text-center py-6 text-sm text-muted-foreground italic">
                            Aucune note pour le moment.
                        </div>
                    ) : (
                        <div className="relative border-l border-border/60 ml-3 pl-4 space-y-4 pb-2">
                            {notes.map((note: any) => (
                                <div key={note.id} className="relative">
                                    <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary/40 ring-4 ring-background" />
                                    <div className="bg-muted/30 rounded-xl p-3 text-sm">
                                        <p className="text-foreground">{note.content}</p>
                                        <div className="text-[10px] text-muted-foreground mt-2 font-medium uppercase tracking-widest">
                                            {format(new Date(note.createdAt), "dd MMM yyyy à HH:mm", { locale: fr })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    )
}
