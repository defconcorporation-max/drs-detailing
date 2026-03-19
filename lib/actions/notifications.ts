"use server"

// import prisma from "@/lib/db"

export async function sendSmsReminder(jobId: string) {
    // In a real app, this would use Twilio or similar
    // For now, we simulate a delay and success

    console.log(`Sending SMS for Job ${jobId}...`)

    await new Promise(resolve => setTimeout(resolve, 1000))

    return { success: true, message: "SMS envoyé au client (Simulation)" }
}
