"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { hash } from "crypto" // Dummy

export async function seedJeanTesteur() {
    const email = "jean.testeur@example.com"

    // Cleanup existing if any
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
        // Simple cascade delete might not work without schema setup, manual cleanup
        const cp = await prisma.clientProfile.findUnique({ where: { userId: existing.id }, include: { jobs: true } })
        if (cp) {
            await prisma.jobService.deleteMany({ where: { job: { clientId: cp.id } } })
            await prisma.job.deleteMany({ where: { clientId: cp.id } })
            await prisma.vehicle.deleteMany({ where: { clientId: cp.id } })
            await prisma.clientProfile.delete({ where: { id: cp.id } })
        }
        await prisma.user.delete({ where: { id: existing.id } })
    }

    // Create User & Profile
    const user = await prisma.user.create({
        data: {
            email,
            password: "mockpassword", // Won't be used
            name: "Jean Testeur",
            role: "CLIENT",
            phone: "514-555-9999",
            clientProfile: {
                create: {
                    address: "123 Rue de la Richesse, Laval, QC",
                    loyaltyPoints: 450, // Enough for visual bar
                    accessKey: "jean-testeur-magic-token"
                }
            }
        },
        include: { clientProfile: true }
    })

    const clientId = user.clientProfile!.id

    // Vehicles
    const porsche = await prisma.vehicle.create({
        data: {
            clientId,
            make: "Porsche",
            model: "911 GT3 RS",
            year: 2024,
            color: "Shark Blue",
            type: "SEDAN",
            licensePlate: "VITE",
            // photoUrl: "https://files.porsche.com/filestore/image/multimedia/none/992-gt3-rs-modelimage-sideshot/model/cfbb8ed3-1a15-11ed-80f5-005056bbdc38/porsche-model.png" // Mock URL if we had one
        }
    })

    const tesla = await prisma.vehicle.create({
        data: {
            clientId,
            make: "Tesla",
            model: "Model Y Performance",
            year: 2023,
            color: "Deep Blue Metallic",
            type: "SUV",
            licensePlate: "ELEC",
        }
    })

    const raptor = await prisma.vehicle.create({
        data: {
            clientId,
            make: "Ford",
            model: "F-150 Raptor",
            year: 2022,
            color: "Code Orange",
            type: "TRUCK",
        }
    })

    // Services (Get some existing ones or create dummies if empty?)
    // We assume seed/init data exists. If not, we fetch ANY service.
    let services = await prisma.service.findMany({ take: 2 })
    if (services.length === 0) {
        // Fallback
        const s1 = await prisma.service.create({ data: { name: "Lavage Intérieur", basePrice: 50, durationMin: 60 } })
        const s2 = await prisma.service.create({ data: { name: "Polissage", basePrice: 150, durationMin: 180 } })
        services = [s1, s2]
    }

    // Past Jobs (Completed)
    const pastDates = [
        new Date(Date.now() - 1000 * 60 * 60 * 24 * 120), // 4 months ago
        new Date(Date.now() - 1000 * 60 * 60 * 24 * 60),  // 2 months ago
        new Date(Date.now() - 1000 * 60 * 60 * 24 * 30),  // 1 month ago
        new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),  // 2 weeks ago
        new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),   // 2 days ago
    ]

    for (const d of pastDates) {
        d.setHours(9, 0, 0, 0)
        await prisma.job.create({
            data: {
                clientId,
                vehicleId: porsche.id, // Assign mostly to Porsche
                scheduledDate: d,
                status: "COMPLETED",
                totalPrice: 200,
                services: {
                    create: { serviceId: services[0].id }
                }
            }
        })
    }

    // Future Job
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + 5)
    futureDate.setHours(13, 0, 0, 0) // 1PM

    await prisma.job.create({
        data: {
            clientId,
            vehicleId: tesla.id,
            scheduledDate: futureDate,
            status: "CONFIRMED",
            services: {
                create: services.map(s => ({ serviceId: s.id }))
            }
        }
    })

    revalidatePath('/admin/clients')
    return { success: true, id: clientId }
}
