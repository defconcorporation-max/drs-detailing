"use server"

import prisma from "@/lib/db"
import { serialize } from "@/lib/utils"
import { revalidatePath } from "next/cache"

export async function getClients() {
    const clients = await prisma.user.findMany({
        where: { role: 'CLIENT' },
        include: {
            clientProfile: {
                include: { vehicles: true }
            }
        },
        orderBy: { name: 'asc' }
    })
    return serialize(clients)
}

export async function getClientById(id: string) {
    const client = await prisma.user.findUnique({
        where: { id },
        include: {
            clientProfile: {
                include: {
                    vehicles: true,
                    jobs: {
                        include: { services: { include: { service: true } } },
                        orderBy: { scheduledDate: 'desc' }
                    }
                }
            }
        }
    })
    return serialize(client)
}

export async function createClient(data: FormData) {
    const name = data.get('name') as string
    const email = data.get('email') as string
    const phone = data.get('phone') as string
    const address = data.get('address') as string

    if (!name || !email) return { error: "Nom et Email requis" }

    try {
        await prisma.user.create({
            data: {
                name,
                email,
                phone,
                role: 'CLIENT',
                password: 'client', // Default password
                clientProfile: {
                    create: {
                        address
                    }
                }
            }
        })

        revalidatePath('/admin/clients')
        revalidatePath('/admin/schedule') // Ensure dropdowns update
        return { success: true }
    } catch (e) {
        return { error: "Erreur création (Email existe déjà?)" }
    }
}

export async function updateClientProfile(userId: string, data: FormData) {
    const name = data.get('name') as string
    const email = data.get('email') as string
    const phone = data.get('phone') as string
    const address = data.get('address') as string

    try {
        await prisma.user.update({
            where: { id: userId },
            data: {
                name,
                email,
                phone,
                clientProfile: {
                    update: { address }
                }
            }
        })
        revalidatePath(`/admin/clients/${userId}`)
        return { success: true }
    } catch (e) {
        return { error: "Erreur mise à jour" }
    }
}

export async function addVehicle(clientId: string, data: FormData) {
    const make = data.get('make') as string
    const model = data.get('model') as string
    const type = data.get('type') as string
    const year = parseInt(data.get('year') as string)
    const color = data.get('color') as string
    const plate = data.get('plate') as string

    if (!make || !model) return { error: "Marque et Modèle requis" }

    try {
        const client = await prisma.user.findUnique({
            where: { id: clientId },
            include: { clientProfile: true }
        })

        if (!client?.clientProfile) return { error: "Profil client introuvable" }

        await prisma.vehicle.create({
            data: {
                clientId: client.clientProfile.id,
                make,
                model,
                type: type || 'SEDAN',
                year: year || new Date().getFullYear(),
                color,
                licensePlate: plate
            }
        })
        revalidatePath(`/admin/clients/${clientId}`)
        return { success: true }
    } catch (e) {
        return { error: "Erreur ajout véhicule" }
    }
}

export async function deleteVehicle(vehicleId: string) {
    try {
        // Need to know client ID to revalidate, can fetch or just revalidate path with wildcard if needed?
        // Or revalidate layout.
        // Let's return success and let UI handle refresh or current path revalidates.
        await prisma.vehicle.delete({ where: { id: vehicleId } })
        return { success: true }
    } catch (e) {
        return { error: "Erreur suppression" }
    }
}
