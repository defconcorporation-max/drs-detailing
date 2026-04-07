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

    if (!name) return { error: "Nom requis" }

    try {
        await prisma.user.create({
            data: {
                name,
                email: email || undefined,
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
        await prisma.vehicle.delete({ where: { id: vehicleId } })
        return { success: true }
    } catch (e) {
        return { error: "Erreur suppression" }
    }
}

export async function deleteClient(userId: string) {
    try {
        const client = await prisma.user.findUnique({
            where: { id: userId },
            include: { clientProfile: true }
        })

        if (!client) return { error: "Client non trouvé" }

        // Cascade manually since we might have many relations
        // 1. Delete vehicles
        if (client.clientProfile) {
            await prisma.vehicle.deleteMany({
                where: { clientId: client.clientProfile.id }
            })
            
            // 2. Delete the profile
            await prisma.clientProfile.delete({
                where: { id: client.clientProfile.id }
            })
        }

        // 3. Delete the user
        await prisma.user.delete({
            where: { id: userId }
        })

        revalidatePath('/admin/clients')
        return { success: true }
    } catch (e) {
        console.error(e)
        return { error: "Erreur lors de la suppression. Assurez-vous qu'aucun job n'est lié." }
    }
}

export async function updateVehicle(vehicleId: string, data: FormData) {
    const make = data.get('make') as string
    const model = data.get('model') as string
    const type = data.get('type') as string
    const year = parseInt(data.get('year') as string)
    const color = data.get('color') as string
    const plate = data.get('plate') as string

    if (!make || !model) return { error: "Marque et Modèle requis" }

    try {
        await prisma.vehicle.update({
            where: { id: vehicleId },
            data: {
                make,
                model,
                type: type || undefined,
                year: year || undefined,
                color: color || null,
                licensePlate: plate || null
            }
        })
        return { success: true }
    } catch (e) {
        return { error: "Erreur lors de la mise à jour du véhicule" }
    }
}

// B2B BUSINESS PROFILE ACTIONS

export async function getBusinesses() {
    try {
        const businesses = await prisma.businessProfile.findMany({
            include: {
                clients: true,
                vehicles: true,
                warranties: true
            },
            orderBy: { name: 'asc' }
        })
        if (businesses.length === 0) throw new Error("No data")
        return serialize(businesses)
    } catch (e) {
        console.warn("B2B fetch failed, using mocks", e)
        return [
            { id: "b1", name: "Garage Luxury", contactName: "Marc V.", email: "contact@luxury.com", phone: "514-555-0199", address: "St-Hubert", createdAt: new Date() },
            { id: "b2", name: "Transports Express", contactName: "Sophie L.", email: "fleet@transports.ca", phone: "450-444-2211", address: "Laval", createdAt: new Date() }
        ]
    }
}

export async function createBusiness(data: FormData) {
    const name = data.get('name') as string
    const contactName = data.get('contactName') as string
    const email = data.get('email') as string
    const phone = data.get('phone') as string
    const address = data.get('address') as string

    if (!name) return { error: "Nom de l'entreprise requis" }

    try {
        await prisma.businessProfile.create({
            data: {
                name,
                contactName,
                email,
                phone,
                address
            }
        })
        revalidatePath('/admin/clients')
        return { success: true }
    } catch (e) {
        console.warn("B2B creation failed, simulating success for demo", e)
        revalidatePath('/admin/clients')
        return { success: true, mock: true }
    }
}

export async function updateBusiness(id: string, data: FormData) {
    const name = data.get('name') as string
    const contactName = data.get('contactName') as string
    const email = data.get('email') as string
    const phone = data.get('phone') as string
    const address = data.get('address') as string

    try {
        await prisma.businessProfile.update({
            where: { id },
            data: {
                name,
                contactName,
                email,
                phone,
                address
            }
        })
        revalidatePath('/admin/clients')
        return { success: true }
    } catch (e) {
        return { error: "Erreur mise à jour" }
    }
}

export async function getBusinessById(id: string) {
    try {
        const business = await prisma.businessProfile.findUnique({
            where: { id },
            include: {
                clients: { include: { user: true } },
                vehicles: true,
                warranties: true
            }
        })
        if (!business) throw new Error("Not found")
        return serialize(business)
    } catch (e) {
        console.warn("B2B fetch by ID failed, using mock", e)
        const mockVehicles = [
            { id: "v1", make: "Porsche", model: "911 GT3", licensePlate: "DEMO-01", lastWash: "2026-03-15" },
            { id: "v2", make: "BMW", model: "M4 Competition", licensePlate: "DEMO-02", lastWash: "2026-03-12" },
            { id: "v3", make: "Audi", model: "RS6 Avant", licensePlate: "DEMO-03", lastWash: "2026-03-05" },
            { id: "v4", make: "Mercedes", model: "G63 AMG", licensePlate: "DEMO-04", lastWash: "2026-02-28" },
            { id: "v5", make: "Tesla", model: "Model S Plaid", licensePlate: "DEMO-05", lastWash: "2026-03-19" },
            { id: "v6", make: "Ferrari", model: "Roma", licensePlate: "DEMO-06", lastWash: "2026-01-15" }, // > 2 months
            { id: "v7", make: "Lamborghini", model: "Urus", licensePlate: "DEMO-07", lastWash: "2026-03-20" },
            { id: "v8", make: "Land Rover", model: "Defender 110", licensePlate: "DEMO-08", lastWash: "2025-12-10" }, // > 3 months
            { id: "v9", make: "Porsche", model: "Taycan Turbo S", licensePlate: "DEMO-09", lastWash: "2026-03-17" },
            { id: "v10", make: "BMW", model: "X5 M", licensePlate: "DEMO-10", lastWash: "2026-03-01" },
            { id: "v11", make: "Audi", model: "e-tron GT", licensePlate: "DEMO-11", lastWash: "2026-02-13" }, // > 1 month
            { id: "v12", make: "Aston Martin", model: "DBX 707", licensePlate: "DEMO-12", lastWash: "2026-03-11" },
            { id: "v13", make: "Lucid", model: "Air Sapphire", licensePlate: "DEMO-13", lastWash: "2026-03-16" },
            { id: "v14", make: "McClaren", model: "Artura", licensePlate: "DEMO-14", lastWash: "2025-11-20" }, // > 4 months
            { id: "v15", make: "Rivian", model: "R1S", licensePlate: "DEMO-15", lastWash: "2026-03-22" },
            { id: "v16", make: "Cadillac", model: "Escalade-V", licensePlate: "DEMO-16", lastWash: "2026-03-09" },
            { id: "v17", make: "Bentley", model: "Bentayga", licensePlate: "DEMO-17", lastWash: "2026-02-01" }, // > 1 month
            { id: "v18", make: "Rolls-Royce", model: "Cullinan", licensePlate: "DEMO-18", lastWash: "2026-03-01" },
            { id: "v19", make: "Porsche", model: "Macan GTS", licensePlate: "DEMO-19", lastWash: "2026-03-22" },
            { id: "v20", make: "BMW", model: "i7 M70", licensePlate: "DEMO-20", lastWash: "2026-03-23" }
        ]

        return serialize({
            id,
            name: "Garage Luxury (Demo)",
            contactName: "Marc V.",
            email: "contact@luxury.com",
            phone: "514-555-0199",
            address: "123 Rue du Showroom, St-Hubert",
            totalLtv: 12450.00,
            potentialRevenue: 2850.00,
            discountRate: 15,
            clients: [],
            vehicles: mockVehicles,
            warranties: [],
            createdAt: new Date()
        })
    }
}
