"use server"

import prisma from "@/lib/db"
import { revalidatePath } from "next/cache"

/** 
 * Mock OCR processing for now. 
 * In a real-world scenario, we would use a service like Tesseract.js, 
 * Google Cloud Vision, or AWS Textract to parse the image.
 */
export async function processExpenseOCR(formData: FormData) {
    const file = formData.get("receipt") as File
    if (!file) return { error: "Aucun fichier reçu" }

    try {
        // En attendant une vraie intégration API, on simule une réponse.
        // On pourrait aussi extraire des infos basiques si on avait un moteur JS local.
        
        // Simulation de délai de traitement
        await new Promise(resolve => setTimeout(resolve, 2000))

        const mockData = {
            amount: Math.floor(Math.random() * 150) + 20, // Montant aléatoire
            category: "SUPPLIES",
            description: `Achat ${file.name} (Détection auto)`,
            date: new Date()
        }

        return { success: true, data: mockData }
    } catch (e) {
        return { error: "Erreur lors du traitement OCR" }
    }
}

export async function createExpense(data: { amount: number, category: string, description: string, date: Date }) {
    try {
        const expense = await prisma.expense.create({
            data: {
                amount: data.amount,
                category: data.category,
                description: data.description,
                date: data.date
            }
        })
        revalidatePath('/admin/accounting')
        return { success: true, expense }
    } catch (e) {
        return { error: "Erreur création dépense" }
    }
}

export async function getExpenses() {
    return await prisma.expense.findMany({
        orderBy: { date: 'desc' }
    })
}

export async function deleteExpense(id: string) {
    try {
        await prisma.expense.delete({ where: { id } })
        revalidatePath("/admin/accounting")
        return { success: true }
    } catch (e) {
        return { error: "Erreur suppression dépense" }
    }
}
