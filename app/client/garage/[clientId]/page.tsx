import { DigitalGarage } from "@/components/client/DigitalGarage"
import prisma from "@/lib/db"
import { notFound } from "next/navigation"

interface GaragePageProps {
    params: {
        clientId: string
    }
}

export default async function GaragePage({ params }: GaragePageProps) {
    const client = await prisma.clientProfile.findUnique({
        where: { id: params.clientId },
        include: { 
            user: true,
            vehicles: {
                include: {
                    jobs: {
                        include: {
                            services: {
                                include: {
                                    service: true
                                }
                            }
                        }
                    }
                }
            }
        }
    })

    if (!client) {
        return notFound()
    }

    return <DigitalGarage client={client} vehicles={client.vehicles} />
}
