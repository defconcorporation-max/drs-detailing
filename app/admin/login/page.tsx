"use client"

import { useState } from "react"
import { loginAdmin } from "@/lib/actions/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function AdminLoginPage() {
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError("")

        const res = await loginAdmin(formData)

        if (res?.error) {
            setError(res.error)
            setLoading(false)
        } else if (res?.success) {
            router.push("/admin")
        } else {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-primary/10 p-3 rounded-full w-fit mb-2">
                        <Lock className="text-primary w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl">Administration DRS</CardTitle>
                    <CardDescription>Veuillez entrer le mot de passe administrateur</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <Input
                            name="password"
                            type="password"
                            placeholder="Mot de passe"
                            required
                            className="text-center text-lg"
                        />
                        {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}
                        <Button type="submit" className="w-full text-lg h-12" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : "Connexion"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
