import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData()
        const from = formData.get("From")?.toString() || ""
        const body = formData.get("Body")?.toString() || ""
        const messageSid = formData.get("MessageSid")?.toString() || ""

        if (!from || !body) {
            return new NextResponse("<Response></Response>", {
                status: 200,
                headers: { "Content-Type": "text/xml" }
            })
        }

        // Standardize: extract last 10 digits to search DB
        const digitsOnly = from.replace(/\D/g, "")
        const last10 = digitsOnly.slice(-10)

        if (last10.length < 10) {
            return new NextResponse("<Response></Response>", {
                status: 200,
                headers: { "Content-Type": "text/xml" }
            })
        }

        // 1. Search for matching client by checking last 10 digits of User.phone
        const allUsers = await prisma.user.findMany({
            where: {
                phone: { not: null }
            },
            include: { clientProfile: true }
        })

        let matchedUser = allUsers.find(u => {
            const uDigits = u.phone!.replace(/\D/g, "")
            return uDigits.slice(-10) === last10
        })

        let clientId = ""

        if (matchedUser && matchedUser.clientProfile) {
            clientId = matchedUser.clientProfile.id
        } else {
            // 2. Create a new unknown client
            const newUser = await prisma.user.create({
                data: {
                    name: `Client Inconnu (${from})`,
                    phone: from,
                    role: "CLIENT",
                    clientProfile: {
                        create: {
                            address: "Créé automatiquement par SMS entrant"
                        }
                    }
                },
                include: { clientProfile: true }
            })
            if (newUser.clientProfile) {
                clientId = newUser.clientProfile.id
            }
        }

        if (clientId) {
            // 3. Save SMS to database
            await prisma.smsMessage.create({
                data: {
                    clientId,
                    direction: "INBOUND",
                    content: body,
                    status: "RECEIVED",
                    twilioSid: messageSid
                }
            })
        }

        // Return empty TwiML Response
        return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
            status: 200,
            headers: { "Content-Type": "text/xml" }
        })
    } catch (error) {
        console.error("SMS Webhook Error:", error)
        return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, {
            status: 200,
            headers: { "Content-Type": "text/xml" }
        })
    }
}
