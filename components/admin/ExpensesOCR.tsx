"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select"
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Sparkles } from "lucide-react"
import { processExpenseOCR, createExpense } from "@/lib/actions/expenses"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export function ExpensesOCR() {
    const [file, setFile] = useState<File | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const [extractedData, setExtractedData] = useState<any>(null)
    const [isSaving, setIsSaving] = useState(false)

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0])
            setExtractedData(null)
        }
    }

    const handleProcess = async () => {
        if (!file) return
        setIsProcessing(true)
        
        const formData = new FormData()
        formData.append("receipt", file)

        const res = await processExpenseOCR(formData)
        if (res.error) {
            toast.error(res.error)
        } else {
            setExtractedData(res.data)
            toast.success("Ticket analysé avec succès !")
        }
        setIsProcessing(false)
    }

    const handleConfirm = async () => {
        if (!extractedData) return
        setIsSaving(true)
        const res = await createExpense(extractedData)
        if (res.error) {
            toast.error(res.error)
        } else {
            toast.success("Dépense enregistrée")
            setFile(null)
            setExtractedData(null)
        }
        setIsSaving(false)
    }

    return (
        <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 uppercase tracking-wider font-display">
                    <Sparkles className="text-primary size-5" /> Importation <span className="text-gradient-brand">Intelligente</span>
                </CardTitle>
                <CardDescription>
                    Scannez vos factures et tickets. L'IA extrait automatiquement les montants.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                
                {!extractedData ? (
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/60 rounded-2xl p-10 bg-background/50 transition-colors hover:border-primary/40">
                        <div className="size-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <Upload className="text-primary" size={32} />
                        </div>
                        <input 
                            type="file" 
                            id="receipt-upload" 
                            className="hidden" 
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                        />
                        <Label htmlFor="receipt-upload" className="cursor-pointer text-center">
                            <span className="font-bold text-lg">Cliquez pour téléverser</span>
                            <p className="text-sm text-muted-foreground mt-1">PNG, JPG ou PDF (max. 5MB)</p>
                        </Label>

                        {file && (
                            <div className="mt-6 flex items-center gap-3 bg-secondary/50 px-4 py-2 rounded-xl border border-border">
                                <FileText size={18} className="text-primary" />
                                <span className="text-sm font-medium italic">{file.name}</span>
                                <Button 
                                    size="sm" 
                                    className="rounded-lg ml-2" 
                                    onClick={handleProcess}
                                    disabled={isProcessing}
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" size={16} /> : "Analyser"}
                                </Button>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-xl flex items-center gap-3">
                            <CheckCircle className="text-green-500" size={20} />
                            <p className="text-sm font-medium">Analyse terminée. Veuillez vérifier les informations.</p>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>Montant reconnu</Label>
                                <div className="relative">
                                    <Input 
                                        type="number" 
                                        value={extractedData.amount} 
                                        onChange={(e) => setExtractedData({...extractedData, amount: parseFloat(e.target.value)})}
                                        className="pl-8 font-bold text-lg"
                                    />
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-muted-foreground">$</span>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Catégorie</Label>
                                <Select 
                                    value={extractedData.category} 
                                    onValueChange={(v) => setExtractedData({...extractedData, category: v})}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="SUPPLIES">Produits / Shampoings</SelectItem>
                                        <SelectItem value="EQUIPMENT">Équipement</SelectItem>
                                        <SelectItem value="RENT">Loyer / Charges</SelectItem>
                                        <SelectItem value="MARKETING">Marketing</SelectItem>
                                        <SelectItem value="OTHER">Autre</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="sm:col-span-2 space-y-2">
                                <Label>Description</Label>
                                <Input 
                                    value={extractedData.description} 
                                    onChange={(e) => setExtractedData({...extractedData, description: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <Button 
                                variant="outline" 
                                className="flex-1 rounded-xl" 
                                onClick={() => setExtractedData(null)}
                            >
                                Recommencer
                            </Button>
                            <Button 
                                className="flex-1 rounded-xl font-bold" 
                                onClick={handleConfirm}
                                disabled={isSaving}
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={18} /> : "Confirmer & Enregistrer"}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
