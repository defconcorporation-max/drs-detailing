"use client"

import { useState } from "react"
import { loginEmployee } from "@/lib/actions/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { User, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function EmployeeLoginPage() {
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        setError("")

        const res = await loginEmployee(formData)

        if (res?.error) {
            setError(res.error)
            setLoading(false)
        } else if (res?.success) {
            router.push("/employee")
        } else {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100 p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <div className="mx-auto bg-blue-500/10 p-3 rounded-full w-fit mb-2">
                        <User className="text-blue-500 w-6 h-6" />
                    </div>
                    <CardTitle className="text-2xl">Espace Employé</CardTitle>
                    <CardDescription>Connectez-vous pour voir votre planning</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input name="email" type="email" placeholder="nom@drs.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Mot de passe</Label>
                            <Input name="password" type="password" required />
                        </div>
                        {error && <div className="text-red-500 text-sm text-center font-medium">{error}</div>}
                        <Button type="submit" className="w-full h-12 text-lg" disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : "Accéder au Planning"}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
