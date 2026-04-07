"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { createUser, updateUser, deleteUser } from "@/lib/actions/users"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import { Loader2, Trash2 } from "lucide-react"
import { USER_ROLES, type UserRole, ROLE_LABELS_FR } from "@/lib/user-roles"

export function CreateUserForm() {
    const router = useRouter()
    const [role, setRole] = useState<UserRole>("EMPLOYEE")
    const [loading, setLoading] = useState(false)

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const fd = new FormData(e.currentTarget)
        fd.set("role", role)
        try {
            const res = await createUser(fd)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Compte créé.")
                router.push("/admin/users")
                router.refresh()
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <input type="hidden" name="role" value={role} readOnly />

            <div className="grid gap-2">
                <Label>Rôle</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                    <SelectTrigger className="rounded-xl">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {USER_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                                {ROLE_LABELS_FR[r]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                    Admin : accès au tableau de bord. Employé : portail équipe. Client : réservations / profil.
                </p>
            </div>

            <div className="grid gap-2">
                <Label>Nom complet</Label>
                <Input name="name" required placeholder="Jean Dupont" className="rounded-xl" />
            </div>

            <div className="grid gap-2">
                <Label>E-mail (identifiant de connexion)</Label>
                <Input name="email" type="email" required placeholder="nom@exemple.com" className="rounded-xl" />
            </div>

            <div className="grid gap-2">
                <Label>Mot de passe initial</Label>
                <Input name="password" type="password" required autoComplete="new-password" className="rounded-xl" />
            </div>

            <div className="grid gap-2">
                <Label>Téléphone (optionnel)</Label>
                <Input name="phone" type="tel" placeholder="+1 …" className="rounded-xl" />
            </div>

            {role === "EMPLOYEE" && (
                <div className="grid gap-2">
                    <Label>Taux horaire ($)</Label>
                    <Input name="hourlyRate" type="number" step="0.5" placeholder="0" className="rounded-xl" />
                </div>
            )}

            {role === "CLIENT" && (
                <div className="grid gap-2">
                    <Label>Adresse (optionnel)</Label>
                    <Input name="address" placeholder="123 rue …" className="rounded-xl" />
                </div>
            )}

            <div className="flex flex-wrap gap-3 pt-4">
                <Button type="submit" disabled={loading} className="gap-2 rounded-xl">
                    {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Créer le compte
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" asChild>
                    <Link href="/admin/users">Annuler</Link>
                </Button>
            </div>
        </form>
    )
}

type EditUser = {
    id: string
    name: string | null
    email: string | null
    phone: string | null
    role: string
    clientProfile?: { address?: string | null } | null
    employeeProfile?: { hourlyRate?: number | null } | null
}

export function EditUserForm({ user }: { user: EditUser }) {
    const router = useRouter()
    const [role, setRole] = useState<UserRole>(() =>
        USER_ROLES.includes(user.role as UserRole) ? (user.role as UserRole) : "CLIENT"
    )
    const [loading, setLoading] = useState(false)

    async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setLoading(true)
        const fd = new FormData(e.currentTarget)
        fd.set("role", role)
        try {
            const res = await updateUser(user.id, fd)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Compte mis à jour.")
                router.refresh()
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <input type="hidden" name="role" value={role} readOnly />

            <div className="grid gap-2">
                <Label>Rôle</Label>
                <Select value={role} onValueChange={(v) => setRole(v as UserRole)}>
                    <SelectTrigger className="rounded-xl">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {USER_ROLES.map((r) => (
                            <SelectItem key={r} value={r}>
                                {ROLE_LABELS_FR[r]}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid gap-2">
                <Label>Nom complet</Label>
                <Input name="name" required defaultValue={user.name || ""} className="rounded-xl" />
            </div>

            <div className="grid gap-2">
                <Label>E-mail</Label>
                <Input name="email" type="email" defaultValue={user.email || ""} className="rounded-xl" />
            </div>

            <div className="grid gap-2">
                <Label>Téléphone</Label>
                <Input name="phone" type="tel" defaultValue={user.phone || ""} className="rounded-xl" />
            </div>

            <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
                <Label className="text-base">Mot de passe</Label>
                <p className="text-xs text-muted-foreground">
                    Laissez vide pour conserver le mot de passe actuel. Renseignez un nouveau mot de passe pour le remplacer.
                </p>
                <Input
                    name="newPassword"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Nouveau mot de passe (optionnel)"
                    className="rounded-xl"
                />
            </div>

            {role === "EMPLOYEE" && (
                <div className="grid gap-2">
                    <Label>Taux horaire ($)</Label>
                    <Input
                        name="hourlyRate"
                        type="number"
                        step="0.5"
                        defaultValue={user.employeeProfile?.hourlyRate ?? 0}
                        className="rounded-xl"
                    />
                </div>
            )}

            {role === "CLIENT" && (
                <div className="grid gap-2">
                    <Label>Adresse</Label>
                    <Input name="address" defaultValue={user.clientProfile?.address || ""} className="rounded-xl" />
                </div>
            )}

            <div className="flex flex-wrap gap-3 pt-4">
                <Button type="submit" disabled={loading} className="gap-2 rounded-xl">
                    {loading ? <Loader2 className="size-4 animate-spin" /> : null}
                    Enregistrer
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" asChild>
                    <Link href="/admin/users">Retour à la liste</Link>
                </Button>
            </div>
        </form>
    )
}

export function DeleteUserButton({ userId, label }: { userId: string; label: string }) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function onDelete() {
        if (!confirm(`Supprimer définitivement le compte « ${label} » ? Cette action peut échouer s’il reste des données liées (jobs, etc.).`)) {
            return
        }
        setLoading(true)
        try {
            const res = await deleteUser(userId)
            if (res.error) {
                toast.error(res.error)
            } else {
                toast.success("Compte supprimé.")
                router.push("/admin/users")
                router.refresh()
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <Button type="button" variant="destructive" className="gap-2 rounded-xl" disabled={loading} onClick={onDelete}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
            Supprimer le compte
        </Button>
    )
}
