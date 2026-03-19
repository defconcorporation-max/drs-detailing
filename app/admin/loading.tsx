import { Loader2 } from "lucide-react"

export default function AdminLoading() {
    return (
        <div className="h-full flex flex-col items-center justify-center p-8 space-y-4 animate-in fade-in duration-500">
            <div className="bg-primary/10 p-4 rounded-full">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
            <div className="text-muted-foreground font-medium">Chargement de l'espace administrateur...</div>
        </div>
    )
}
