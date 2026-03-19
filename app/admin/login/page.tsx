"use client"

import { useState } from "react"
import { loginAdmin } from "@/lib/actions/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/brand/BrandMark"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
        <div className="marketing-backdrop flex min-h-screen items-center justify-center p-4">
            <Card className="glass-panel w-full max-w-md border-border/60">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex justify-center">
                        <BrandMark />
                    </div>
                    <div>
                        <CardTitle className="font-display text-2xl font-bold tracking-wide uppercase">Pit lane</CardTitle>
                        <CardDescription className="text-base">Accès administration — mot de passe requis</CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <Input
                            name="password"
                            type="password"
                            placeholder="Mot de passe"
                            required
                            className="h-11 rounded-xl border-border/60 text-center text-base"
                        />
                        {error && (
                            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm font-medium text-destructive">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="h-11 w-full rounded-xl text-base" disabled={loading}>
                            {loading ? <Loader2 className="size-5 animate-spin" /> : "Connexion"}
                        </Button>
                    </form>
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        <Link href="/" className="font-medium text-primary underline-offset-4 hover:underline">
                            ← Retour à l&apos;accueil
                        </Link>
                    </p>
                </CardContent>
            </Card>
        </div>
    )
}
