"use client"

import React, { useState } from "react"
import { MessageSquarePlus, X, Send, Loader2, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { submitFeedback } from "@/lib/actions/feedback"

export function BetaFeedbackTrigger() {
    const [isOpen, setIsOpen] = useState(false)
    const [content, setContent] = useState("")
    const [screenshots, setScreenshots] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf("image") !== -1) {
                const blob = items[i].getAsFile()
                if (blob) {
                    const reader = new FileReader()
                    reader.onload = (event) => {
                        const base64 = event.target?.result as string
                        setScreenshots(prev => [...prev, base64])
                        toast.info("Image capturée depuis le presse-papier")
                    }
                    reader.readAsDataURL(blob)
                }
            }
        }
    }

    const removeScreenshot = (index: number) => {
        setScreenshots(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = async () => {
        if (!content.trim()) {
            toast.error("Veuillez entrer un commentaire")
            return
        }
        setIsSubmitting(true)

        try {
            const formData = new FormData()
            formData.append('content', content)
            formData.append('pageUrl', typeof window !== 'undefined' ? window.location.href : 'N/A')
            formData.append('userContext', typeof navigator !== 'undefined' ? navigator.userAgent : 'N/A')
            formData.append('screenshots', JSON.stringify(screenshots))

            const res = await submitFeedback(formData)
            
            if (res.success) {
                toast.success("Feedback envoyé avec succès !")
                setContent("")
                setScreenshots([])
                setIsOpen(false)
            } else {
                toast.error(res.error || "Une erreur est survenue")
            }
        } catch (err) {
            toast.error("Erreur lors de l'envoi")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="fixed bottom-6 right-6 z-[100]">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button 
                        className="h-14 w-14 rounded-full bg-primary shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-110 transition-all duration-300 border border-white/10 dark:border-white/5 active:scale-95 group"
                        size="icon"
                    >
                        <MessageSquarePlus className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                        <span className="sr-only">Envoyer un feedback beta</span>
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl bg-card/95 backdrop-blur-xl border-white/10">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-xl font-bold">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary">
                                <MessageSquarePlus size={20} />
                            </div>
                            Signalement Beta
                        </DialogTitle>
                        <DialogDescription>
                            Aidez-nous à améliorer DRS Detailing. Signalez un bug ou proposez une idée !
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        <div className="bg-primary/5 p-3 rounded-lg border border-primary/10 flex items-start gap-3 text-sm text-primary">
                            <Info className="h-5 w-5 mt-0.5 shrink-0" />
                            <p>
                                <strong>Astuce :</strong> Vous pouvez coller (Ctrl+V) des captures d&apos;écran directement dans le champ de texte pour les joindre au rapport.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <Textarea
                                placeholder="Détaillez votre feedback ici... (Ex: 'Le bouton X ne fonctionne pas sur mobile')"
                                className="min-h-[160px] bg-background/50 border-white/10 focus:ring-primary/20 transition-all resize-none text-base"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                onPaste={handlePaste}
                            />
                        </div>
                        
                        {screenshots.length > 0 && (
                            <div className="space-y-3">
                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mr-auto">Captures jointes ({screenshots.length})</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {screenshots.map((src, idx) => (
                                        <div key={idx} className="group relative aspect-video rounded-xl overflow-hidden border border-white/10 bg-slate-900 shadow-sm transition-all hover:border-primary/50">
                                            <img src={src} className="object-contain w-full h-full" alt={`Screenshot ${idx + 1}`} />
                                            <button 
                                                onClick={() => removeScreenshot(idx)}
                                                className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-destructive transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-sm"
                                                title="Supprimer l'image"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="gap-3 sm:gap-0 sm:justify-between border-t border-white/5 pt-4">
                        <p className="text-[10px] text-muted-foreground max-w-[200px] hidden sm:block">
                            L&apos;URL actuelle et les infos de votre navigateur seront automatiquement incluses.
                        </p>
                        <div className="flex gap-2 w-full sm:w-auto">
                            <Button variant="ghost" onClick={() => setIsOpen(false)} disabled={isSubmitting} className="flex-1 sm:flex-none">
                                Annuler
                            </Button>
                            <Button onClick={handleSubmit} disabled={isSubmitting || !content.trim()} className="flex-1 sm:flex-none gap-2 min-w-[140px]">
                                {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Send size={18} />}
                                {isSubmitting ? "Envoi..." : "Envoyer"}
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
