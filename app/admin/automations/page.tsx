export const dynamic = 'force-dynamic'

import prisma from "@/lib/db"
import { AutomationSettingsForm } from "@/components/admin/AutomationSettingsForm"

export default async function AutomationsPage() {
    let setting = await prisma.systemSetting.findUnique({ where: { id: "GLOBAL" } })
    if (!setting) {
        setting = await prisma.systemSetting.create({ data: { id: "GLOBAL", averageVehicleCost: 7.0 } })
    }

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h2 className="text-3xl font-bold tracking-tight uppercase font-display bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                    Automatisations SMS
                </h2>
                <p className="text-muted-foreground text-sm mt-1">
                    Gérez et personnalisez les envois de SMS automatiques (confirmations, rappels et relances de rétention).
                </p>
            </div>
            
            <AutomationSettingsForm initialSettings={setting as any} />
        </div>
    )
}
