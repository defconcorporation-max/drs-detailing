"use client"

import { useState } from "react"
import { loginEmployee } from "@/lib/actions/auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { BrandMark } from "@/components/brand/BrandMark"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
        <div className="marketing-backdrop flex min-h-screen items-center justify-center p-4">
            <Card className="glass-panel w-full max-w-md border-border/60">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex justify-center">
                        <BrandMark />
                    </div>
                    <div>
                        <CardTitle className="font-display text-2xl font-bold tracking-wide uppercase">Baie technique</CardTitle>
                        <CardDescription className="text-base">
                            Employés : e-mail + mot de passe. Les <strong>administrateurs</strong> peuvent aussi se connecter avec leurs
                            identifiants pour consulter le planning équipe.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent>
                    <form action={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email-emp">Email</Label>
                            <Input
                                id="email-emp"
                                name="email"
                                type="email"
                                placeholder="nom@drs.com"
                                required
                                className="h-11 rounded-xl border-border/60"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="pw-emp">Mot de passe</Label>
                            <Input id="pw-emp" name="password" type="password" required className="h-11 rounded-xl border-border/60" />
                        </div>
                        {error && (
                            <div className="rounded-lg bg-destructive/10 px-3 py-2 text-center text-sm font-medium text-destructive">
                                {error}
                            </div>
                        )}
                        <Button type="submit" className="h-11 w-full rounded-xl text-base" disabled={loading}>
                            {loading ? <Loader2 className="size-5 animate-spin" /> : "Accéder au planning"}
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
