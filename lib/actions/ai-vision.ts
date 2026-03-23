"use server"

import prisma from "@/lib/db"

export async function analyzeInspectionPhoto(photoUrl: string) {
    // Simulate AI delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Mock AI return: random damage points
    const mockDamages = [
        { x: 45, y: 30, type: "SCRATCH", severity: "MEDIUM", notes: "Détecté par IA : Rayure de surface" },
        { x: 60, y: 55, type: "DENT", severity: "LOW", notes: "Détecté par IA : Impact léger" }
    ]

    return { 
        success: true, 
        points: mockDamages,
        summary: "Analyse IA terminée : 2 défauts détectés."
    }
}
