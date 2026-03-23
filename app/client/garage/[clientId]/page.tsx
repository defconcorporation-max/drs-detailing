import { DigitalGarage } from "@/components/client/DigitalGarage"
import prisma from "@/lib/db"
import { notFound } from "next/navigation"
import { DbSyncError } from "@/components/system/DbSyncError"

export default async function GaragePage({ params }: { params: Promise<{ clientId: string }> }) {
    const { clientId } = await params

    let client
    try {
        client = await prisma.clientProfile.findUnique({
            where: { id: clientId },
            include: {
                user: true,
                vehicles: {
                    include: {
                        jobs: {
                            include: {
                                services: {
                                    include: {
                                        service: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        })
    } catch (e) {
        console.error("[client/garage]", e)
        return (
            <div className="p-6">
                <DbSyncError details={e instanceof Error ? e.message : String(e)} />
            </div>
        )
    }

    if (!client) {
        return notFound()
    }

    return <DigitalGarage client={client} vehicles={client.vehicles} />
}
