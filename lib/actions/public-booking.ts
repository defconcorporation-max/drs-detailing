"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"
import { sendSMS } from "@/lib/actions/sms"
import { parseLocalDateInTZ } from "@/lib/date-local"
import { getPublicAvailabilitySmart } from "./client-booking"

export async function getPublicServices() {
    try {
        const services = await prisma.service.findMany({
            orderBy: { basePrice: "asc" },
            include: { extras: { orderBy: { sortOrder: "asc" } } }
        })
        return { success: true, services }
    } catch (e) {
        return { error: "Impossible de charger les services" }
    }
}

export type PublicBookingInput = {
    // Client Details
    name: string
    email: string
    phone: string
    address: string
    
    // Vehicle Details
    vehicleType: string // SEDAN, SUV, PICKUP, TRUCK, OTHER
    vehicleYear?: number
    vehicleMake: string
    vehicleModel: string
    vehicleColor?: string
    vehicleLicensePlate?: string

    // Booking Details
    serviceId: string
    selectedExtraIds: string[]
    dateStr: string // "YYYY-MM-DD"
    timeStr: string // "HH:MM"
    notes?: string
    isInShop?: boolean
}

export async function createPublicBooking(data: PublicBookingInput) {
    const {
        name,
        email,
        phone,
        address,
        vehicleType,
        vehicleYear,
        vehicleMake,
        vehicleModel,
        vehicleColor,
        vehicleLicensePlate,
        serviceId,
        selectedExtraIds,
        dateStr,
        timeStr,
        notes,
        isInShop = false
    } = data

    if (!name || !email || !phone || !address || !vehicleType || !vehicleMake || !vehicleModel || !serviceId || !dateStr || !timeStr) {
        return { error: "Tous les champs obligatoires doivent être remplis." }
    }

    try {
        // 1. Validate slot availability
        const dayAvailability = await getPublicAvailabilitySmart({
            startDate: dateStr,
            days: 1,
            serviceId,
        })
        const day = dayAvailability[0]
        const chosenSlot = day?.slots?.find((s) => s.time === timeStr)
        if (!chosenSlot || !chosenSlot.available) {
            return { error: "Ce créneau n'est plus disponible. Veuillez en choisir un autre." }
        }

        // 2. Find or create User & ClientProfile
        const normalizedEmail = email.toLowerCase().trim()
        let user = await prisma.user.findUnique({
            where: { email: normalizedEmail }
        })

        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: normalizedEmail,
                    name: name.trim(),
                    phone: phone.trim(),
                    role: "CLIENT"
                }
            })
        } else {
            // Update contact info if existing
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    name: name.trim(),
                    phone: phone.trim()
                }
            })
        }

        let client = await prisma.clientProfile.findUnique({
            where: { userId: user.id }
        })

        if (!client) {
            client = await prisma.clientProfile.create({
                data: {
                    userId: user.id,
                    address: address.trim()
                }
            })
        } else {
            // Update address
            await prisma.clientProfile.update({
                where: { id: client.id },
                data: { address: address.trim() }
            })
        }

        // 3. Create Vehicle for Client
        const vehicle = await prisma.vehicle.create({
            data: {
                clientId: client.id,
                type: vehicleType,
                make: vehicleMake.trim(),
                model: vehicleModel.trim(),
                year: vehicleYear ? Number(vehicleYear) : null,
                color: vehicleColor || null,
                licensePlate: vehicleLicensePlate || null,
            }
        })

        // 4. Calculate pricing & duration based on service & extras
        const service = await prisma.service.findUnique({
            where: { id: serviceId },
            include: { extras: true }
        })
        if (!service) return { error: "Service introuvable." }

        const selectedExtras = service.extras.filter(ext => selectedExtraIds.includes(ext.id))
        const durationMin = service.durationMin + selectedExtras.reduce((acc, ext) => acc + ext.durationExtraMin, 0)
        const totalPrice = service.basePrice + selectedExtras.reduce((acc, ext) => acc + ext.priceExtra, 0)

        // Parse scheduled Date in Montreal local timezone
        const scheduledDate = parseLocalDateInTZ(dateStr, timeStr)

        // 5. Create Job
        const job = await prisma.job.create({
            data: {
                clientId: client.id,
                vehicleId: vehicle.id,
                scheduledDate: scheduledDate,
                status: "REQUESTED",
                totalPrice: totalPrice,
                durationMin: durationMin,
                isInShop: isInShop,
                notes: notes ? notes.trim() : "Demande de réservation en ligne (Wix)",
                services: {
                    create: {
                        serviceId: service.id,
                        selectedExtraIds: selectedExtraIds
                    }
                }
            }
        })

        // 6. Send instant confirmation SMS if phone is provided
        if (phone.trim()) {
            const dateFormatted = scheduledDate.toLocaleDateString('fr-CA')
            await sendSMS(
                client.id,
                phone.trim(),
                `DRS Detailing: Demande reçue pour le ${dateFormatted} à ${timeStr}. Nous confirmons votre rendez-vous très rapidement par SMS. Merci !`,
                job.id
            ).catch(err => console.error("Error sending booking notification SMS:", err))
        }

        revalidatePath('/admin')
        return { success: true, jobId: job.id }
    } catch (e: any) {
        console.error("Public Booking Error:", e)
        return { error: e.message || "Erreur lors de la réservation." }
    }
}

export async function getPublicAvailabilityForDay(dateStr: string, serviceId: string) {
    try {
        const availability = await getPublicAvailabilitySmart({
            startDate: dateStr,
            days: 1,
            serviceId
        })
        return { success: true, slots: availability[0]?.slots || [] }
    } catch (e) {
        console.error("Error fetching day availability:", e)
        return { error: "Erreur lors de la récupération des disponibilités." }
    }
}

