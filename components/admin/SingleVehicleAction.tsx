"use client"

import { Button } from "@/components/ui/button"
import { toast } from "sonner"

export function SingleVehicleAction({ vehicleName }: { vehicleName: string }) {
    const handleRelance = () => {
        toast.success(`Message de relance envoyé pour la ${vehicleName}.`)
    }

    return (
        <Button 
            onClick={handleRelance}
            variant="ghost" 
            size="sm" 
            className="text-[10px] font-black uppercase group-hover:bg-primary group-hover:text-black transition-all"
        >
            Relancer
        </Button>
    )
}
