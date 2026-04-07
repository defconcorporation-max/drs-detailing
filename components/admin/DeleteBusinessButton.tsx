"use client"

import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { deleteBusiness } from "@/lib/actions/clients"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface DeleteBusinessButtonProps {
    id: string
    name: string
    variant?: "default" | "outline" | "ghost" | "destructive"
    showLabel?: boolean
}

export function DeleteBusinessButton({ id, name, variant = "ghost", showLabel = false }: DeleteBusinessButtonProps) {
    const router = useRouter()

    const handleDelete = async () => {
        if (confirm(`Êtes-vous sûr de vouloir supprimer l'entreprise "${name}" ? Cela supprimera également tous les véhicules de la flotte et les rendez-vous associés.`)) {
            const res = await deleteBusiness(id)
            if (res.success) {
                toast.success("Entreprise supprimée")
                router.push('/admin/clients')
                router.refresh()
            } else {
                toast.error(res.error || "Erreur lors de la suppression")
            }
        }
    }

    return (
        <Button 
            variant={variant} 
            size={showLabel ? "default" : "icon"} 
            className={variant === "destructive" ? "" : "text-destructive hover:text-destructive hover:bg-destructive/10"}
            onClick={handleDelete}
        >
            <Trash2 size={16} className={showLabel ? "mr-2" : ""} />
            {showLabel && "Supprimer l'entreprise"}
        </Button>
    )
}
