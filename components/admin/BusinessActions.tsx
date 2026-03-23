"use client"

import { Button } from "@/components/ui/button"
import { FileText, Send } from "lucide-react"
import { toast } from "sonner"

interface BusinessActionsProps {
    reportLabel?: string
    bulkLabel?: string
    showReport?: boolean
    showBulk?: boolean
}

export function BusinessActions({ 
    reportLabel = "Rapport", 
    bulkLabel = "Relance Groupée",
    showReport = true,
    showBulk = true
}: BusinessActionsProps) {
    const handleReport = () => {
        toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
            loading: 'Génération du rapport de flotte...',
            success: 'Le rapport PDF a été généré et envoyé au gestionnaire.',
            error: 'Erreur lors de la génération.',
        })
    }

    const handleBulk = () => {
        toast.promise(new Promise(resolve => setTimeout(resolve, 1500)), {
            loading: 'Préparation des messages de relance...',
            success: '20 messages WhatsApp/Email envoyés aux conducteurs en retard.',
            error: 'Erreur lors de l\'envoi.',
        })
    }

    return (
        <div className="flex gap-2">
            {showReport && (
                <Button 
                    onClick={handleReport}
                    variant="outline" 
                    className="rounded-xl font-bold uppercase text-xs tracking-widest gap-2"
                >
                    <FileText size={16} /> {reportLabel}
                </Button>
            )}
            {showBulk && (
                <Button 
                    onClick={handleBulk}
                    className="rounded-xl font-bold uppercase text-xs tracking-widest gap-2 bg-red-600 hover:bg-red-700"
                >
                    <Send size={16} /> {bulkLabel}
                </Button>
            )}
        </div>
    )
}
