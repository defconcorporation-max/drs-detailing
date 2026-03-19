"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider" // Need to install if not present, assume standard UI input for now

export default function CalculatorPage() {
    const [ratioPart1, setRatioPart1] = useState(1)
    const [ratioPart2, setRatioPart2] = useState(10) // 1:10 default
    const [containerSize, setContainerSize] = useState(1000) // ml

    const [productAmount, setProductAmount] = useState(0)
    const [waterAmount, setWaterAmount] = useState(0)

    useEffect(() => {
        // Logic: Total Parts = P1 + P2.
        // Product = (Container / Total Parts) * P1
        // Water = (Container / Total Parts) * P2

        // Example 1:10 => 11 parts. 1000ml.
        // Product = 1000/11 * 1 = 90.9
        // Water = 1000/11 * 10 = 909.0

        const totalParts = Number(ratioPart1) + Number(ratioPart2)
        if (totalParts > 0 && containerSize > 0) {
            setProductAmount((containerSize / totalParts) * ratioPart1)
            setWaterAmount((containerSize / totalParts) * ratioPart2)
        }
    }, [ratioPart1, ratioPart2, containerSize])

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight">Calculateur de Dilution</h2>

            <Card>
                <CardHeader>
                    <CardTitle>Configurer le mélange</CardTitle>
                    <CardDescription>Entrez le ratio indiqué sur la bouteille (ex: 1:10)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    <div className="flex items-center gap-4">
                        <div className="space-y-2 flex-1">
                            <Label>Produit (Parts)</Label>
                            <Input
                                type="number"
                                value={ratioPart1}
                                onChange={(e) => setRatioPart1(Number(e.target.value))}
                                min={1}
                            />
                        </div>
                        <span className="text-2xl font-bold pt-6 text-muted-foreground">:</span>
                        <div className="space-y-2 flex-1">
                            <Label>Eau (Parts)</Label>
                            <Input
                                type="number"
                                value={ratioPart2}
                                onChange={(e) => setRatioPart2(Number(e.target.value))}
                                min={1}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Taille du Contenant Final (ml)</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                value={containerSize}
                                onChange={(e) => setContainerSize(Number(e.target.value))}
                            />
                            <div className="flex gap-1">
                                <button onClick={() => setContainerSize(500)} className="text-xs border px-2 rounded hover:bg-muted">500ml</button>
                                <button onClick={() => setContainerSize(750)} className="text-xs border px-2 rounded hover:bg-muted">750ml</button>
                                <button onClick={() => setContainerSize(1000)} className="text-xs border px-2 rounded hover:bg-muted">1L</button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t">
                        <div className="bg-blue-500/10 p-4 rounded-lg text-center border border-blue-500/20">
                            <div className="text-sm font-medium text-blue-500 mb-1">Mettre Eau</div>
                            <div className="text-3xl font-bold">{Math.round(waterAmount)} ml</div>
                        </div>
                        <div className="bg-purple-500/10 p-4 rounded-lg text-center border border-purple-500/20">
                            <div className="text-sm font-medium text-purple-500 mb-1">Ajouter Produit</div>
                            <div className="text-3xl font-bold">{Math.round(productAmount)} ml</div>
                        </div>
                    </div>

                </CardContent>
            </Card>
        </div>
    )
}
