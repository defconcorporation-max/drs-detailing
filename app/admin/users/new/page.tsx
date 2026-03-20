import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { CreateUserForm } from "@/components/admin/UserAdminForms"

export default function NewUserPage() {
    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/admin/users">
                    <Button variant="ghost" size="icon" className="rounded-xl">
                        <ArrowLeft size={18} />
                    </Button>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">Nouvel utilisateur</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Compte</CardTitle>
                    <CardDescription>
                        Choisissez le rôle puis les identifiants. Le mot de passe peut être changé plus tard depuis la fiche
                        utilisateur.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <CreateUserForm />
                </CardContent>
            </Card>
        </div>
    )
}
