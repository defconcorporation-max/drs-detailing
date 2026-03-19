"use server"

import prisma from "@/lib/db"
import { serialize } from "@/lib/utils"
import { revalidatePath } from "next/cache"

export async function getExpenses() {
    const expenses = await prisma.expense.findMany({
        orderBy: { date: 'desc' }
    })
    return serialize(expenses)
}

export async function createExpense(data: FormData) {
    const category = data.get('category') as string
    const description = data.get('description') as string
    const amount = parseFloat(data.get('amount') as string)
    const dateStr = data.get('date') as string

    if (!category || !amount || !dateStr) {
        return { error: "Données manquantes" }
    }

    try {
        await prisma.expense.create({
            data: {
                category,
                amount,
                description,
                date: new Date(dateStr)
            }
        })
        revalidatePath('/admin/accounting')
        return { success: true }
    } catch (e) {
        return { error: "Erreur création dépense" }
    }
}
