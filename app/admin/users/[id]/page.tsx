import Link from "next/link"
import { notFound } from "next/navigation"
import { getUserForAdminById } from "@/lib/actions/users"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { EditUserForm, DeleteUserButton } from "@/components/admin/UserAdminForms"
import { ROLE_LABELS_FR, type UserRole, USER_ROLES } from "@/lib/user-roles"

export default async function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const data = await getUserForAdminById(id)

    if (data.error || !data.user) {
        if (data.error === "Utilisateur introuvable") notFound()
        return (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-destructive">{data.error}</div>
        )
    }

    const user = data.user as {
        id: string
        name: string | null
        email: string | null
        phone: string | null
        role: string
        clientProfile?: { address?: string | null } | null
        employeeProfile?: { hourlyRate?: number | null } | null
    }

    const roleOk = USER_ROLES.includes(user.role as UserRole)

    return (
        <div className="mx-auto max-w-2xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/users">
                        <Button variant="ghost" size="icon" className="rounded-xl">
                            <ArrowLeft size={18} />
                        </Button>
                    </Link>
                    <div>
                        <h2 className="text-3xl font-bold tracking-tight">Modifier le compte</h2>
                        <p className="text-muted-foreground text-sm">
                            {user.name || user.email} · {roleOk ? ROLE_LABELS_FR[user.role as UserRole] : user.role}
                        </p>
                    </div>
                </div>
                {user.role === "CLIENT" && (
                    <Button variant="outline" className="gap-2 rounded-xl" asChild>
                        <Link href={`/admin/clients/${user.id}`}>
                            <ExternalLink size={16} /> Fiche client
                        </Link>
                    </Button>
                )}
                {user.role === "EMPLOYEE" && (
                    <Button variant="outline" className="gap-2 rounded-xl" asChild>
                        <Link href={`/admin/team/${user.id}`}>Vue équipe / paie</Link>
                    </Button>
                )}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profil & accès</CardTitle>
                    <CardDescription>
                        E-mail et mot de passe servent à la connexion (employé : portail équipe). Ne transmettez les mots de passe
                        que de façon sécurisée.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <EditUserForm user={user} />
                </CardContent>
            </Card>

            <Card className="border-destructive/30">
                <CardHeader>
                    <CardTitle className="text-destructive">Zone sensible</CardTitle>
                    <CardDescription>La suppression est définitive et peut être refusée s’il existe des données liées.</CardDescription>
                </CardHeader>
                <CardContent>
                    <DeleteUserButton userId={user.id} label={user.name || user.email || "Sans nom"} />
                </CardContent>
            </Card>
        </div>
    )
}
