"use server"

import prisma from "@/lib/db"

export async function predictStockExhaustion(itemId: string) {
    const item = await prisma.inventoryItem.findUnique({
        where: { id: itemId },
        include: { usages: true }
    })

    if (!item) return { error: "Produit introuvable" }

    // Calculate usage rates
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000))
    
    const recentUsages = item.usages.filter(u => u.createdAt >= thirtyDaysAgo)
    const totalUsedIn30Days = recentUsages.reduce((acc, u) => acc + u.quantityUsed, 0)
    const avgDailyUsage = totalUsedIn30Days / 30

    if (avgDailyUsage <= 0) return { prediction: "Indéterminé (pas d'usage récent)" }

    const daysLeft = Math.floor(item.quantity / avgDailyUsage)
    const exhaustionDate = new Date(now.getTime() + (daysLeft * 24 * 60 * 60 * 1000))

    return {
        success: true,
        currentStock: item.quantity,
        avgDailyUsage: avgDailyUsage.toFixed(2),
        daysRemaining: daysLeft,
        predictedExhaustionDate: exhaustionDate,
        shouldOrder: daysLeft <= 7 // Suggest order if less than 7 days left
    }
}

export async function getGlobalInventoryPrediction() {
    const items = await prisma.inventoryItem.findMany()
    const predictions = await Promise.all(items.map(item => predictStockExhaustion(item.id)))
    
    return items.map((item, i) => ({
        name: item.name,
        ...predictions[i]
    }))
}
