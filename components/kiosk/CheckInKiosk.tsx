"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { checkInClient } from "@/lib/actions/kiosk"
import { toast } from "sonner"
import { QrCode, User, Phone, CheckCircle2, Loader2, Sparkles, Car } from "lucide-react"
import { cn } from "@/lib/utils"

export function CheckInKiosk() {
    const [step, setStep] = useState<"WELCOME" | "INPUT" | "SUCCESS">("WELCOME")
    const [inputValue, setInputValue] = useState("")
    const [loading, setLoading] = useState(false)
    const [name, setName] = useState("")

    const handleSubmit = async () => {
        setLoading(true)
        const res = await checkInClient({ phone: inputValue })
        if (res.error) {
            toast.error(res.error)
        } else {
            setName(res.clientName || "")
            setStep("SUCCESS")
            setTimeout(() => {
                setStep("WELCOME")
                setInputValue("")
                setName("")
            }, 6000)
        }
        setLoading(false)
    }

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white overflow-hidden relative">
            {/* Branded Background elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-primary/5 rounded-full blur-[120px]" />

            <div className="max-w-xl w-full relative z-10">
                {step === "WELCOME" && (
                    <div className="text-center space-y-12 animate-in fade-in zoom-in-95 duration-700">
                        <div className="space-y-4">
                            <div className="size-24 bg-primary rounded-3xl mx-auto flex items-center justify-center rotate-12 shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)]">
                                <Sparkles size={48} className="text-black" />
                            </div>
                            <h1 className="text-6xl font-black uppercase tracking-tighter">
                                BIENVENUE CHEZ <span className="text-primary italic">DRS</span>
                            </h1>
                            <p className="text-slate-500 text-xl font-medium">L'excellence de la personnalisation automobile</p>
                        </div>

                        <div className="grid gap-6">
                            <Button 
                                className="h-24 rounded-[30px] text-2xl font-black uppercase tracking-widest bg-white text-black hover:bg-slate-200"
                                onClick={() => setStep("INPUT")}
                            >
                                JE SUIS ARRIVÉ
                            </Button>
                            <Button 
                                variant="outline"
                                className="h-24 rounded-[30px] text-2xl font-black uppercase tracking-widest border-slate-800 text-slate-400"
                                onClick={() => toast.info("Veuillez demander de l'aide à un technicien")}
                            >
                                J'AI BESOIN D'INFOS
                            </Button>
                        </div>
                    </div>
                )}

                {step === "INPUT" && (
                    <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-2xl rounded-[40px] p-8 space-y-8 animate-in slide-in-from-bottom-10 duration-500">
                        <div className="text-center">
                            <h2 className="text-3xl font-black uppercase tracking-tight mb-2">IDENTIFICATION</h2>
                            <p className="text-slate-500 text-sm">Entrez votre numéro de téléphone ou scannez votre code</p>
                        </div>

                        <div className="space-y-6">
                            <div className="relative">
                                <Phone className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" size={24} />
                                <Input 
                                    className="h-20 bg-slate-950 border-slate-800 rounded-3xl pl-16 text-2xl font-bold tracking-widest text-primary focus:ring-primary/50"
                                    placeholder="06 -- -- -- --"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <Button 
                                    variant="ghost" 
                                    className="h-16 rounded-2xl text-slate-500 font-bold uppercase"
                                    onClick={() => setStep("WELCOME")}
                                >
                                    RETOUR
                                </Button>
                                <Button 
                                    className="h-16 rounded-2xl bg-primary text-black font-black uppercase tracking-widest"
                                    onClick={handleSubmit}
                                    disabled={loading || inputValue.length < 10}
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : "VALIDER"}
                                </Button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-800 flex items-center justify-center gap-4 text-slate-600 uppercase font-black text-[10px] tracking-widest">
                            <QrCode size={16} /> SCANNEZ VOTRE QR PASS
                        </div>
                    </Card>
                )}

                {step === "SUCCESS" && (
                    <div className="text-center space-y-8 animate-in fade-in zoom-in-95 duration-500">
                        <div className="size-40 bg-green-500 rounded-full mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.3)]">
                            <CheckCircle2 size={80} className="text-black" />
                        </div>
                        <div className="space-y-2">
                            <h2 className="text-5xl font-black uppercase tracking-tighter">PARFAIT, {name} !</h2>
                            <p className="text-slate-500 text-xl">Notre équipe a été notifiée de votre arrivée.</p>
                        </div>
                        <div className="pt-8 flex items-center justify-center gap-6">
                            <div className="flex flex-col items-center gap-2">
                                <div className="size-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                                    <Car size={32} className="text-primary" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">PRENEZ UN CAFÉ</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="size-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                                    <User size={32} className="text-primary" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">ON ARRIVE</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <p className="absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase tracking-[0.5em] text-slate-700">
                POWERED BY DRS DETAILING V5.0
            </p>
        </div>
    )
}
