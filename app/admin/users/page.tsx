import Link from "next/link"
import { getUsersForAdmin } from "@/lib/actions/users"
import { ROLE_LABELS_FR, USER_ROLES, type UserRole } from "@/lib/user-roles"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { UserPlus, Pencil, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

function roleBadgeVariant(role: string): "default" | "secondary" | "outline" {
    if (role === "ADMIN") return "default"
    if (role === "EMPLOYEE") return "secondary"
    return "outline"
}

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
    const sp = await searchParams
    const rawFilter = sp.role || ""
    const roleFilter = USER_ROLES.includes(rawFilter as UserRole) ? (rawFilter as UserRole) : null

    const data = await getUsersForAdmin()
    if ("error" in data && data.error) {
        return (
            <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-destructive">
                {data.error}
            </div>
        )
    }

    const users = (data.users ?? []) as any[]

    const filtered = roleFilter ? users.filter((u) => u.role === roleFilter) : users

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Utilisateurs & rôles</h2>
                    <p className="text-muted-foreground mt-1 text-sm">
                        Créez des comptes (admin, employé, client), modifiez les infos et les mots de passe.
                    </p>
                </div>
                <Link href="/admin/users/new">
                    <Button className="gap-2 rounded-xl">
                        <UserPlus size={16} /> Nouvel utilisateur
                    </Button>
                </Link>
            </div>

            <div className="flex flex-wrap gap-2">
                <FilterChip href="/admin/users" active={!roleFilter} label="Tous" count={users.length} />
                {USER_ROLES.map((r) => (
                    <FilterChip
                        key={r}
                        href={`/admin/users?role=${r}`}
                        active={roleFilter === r}
                        label={ROLE_LABELS_FR[r]}
                        count={users.filter((u) => u.role === r).length}
                    />
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Comptes ({filtered.length})</CardTitle>
                    <CardDescription>
                        Les employés apparaissent aussi dans <Link href="/admin/team" className="underline">Équipe</Link> pour la
                        paie.
                    </CardDescription>
                </CardHeader>
                <CardContent className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nom</TableHead>
                                <TableHead>E-mail</TableHead>
                                <TableHead>Rôle</TableHead>
                                <TableHead>Téléphone</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtered.map((u) => (
                                <TableRow key={u.id}>
                                    <TableCell className="font-medium">{u.name || "—"}</TableCell>
                                    <TableCell className="text-sm">{u.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={roleBadgeVariant(u.role)}>
                                            {ROLE_LABELS_FR[u.role as UserRole] || u.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-muted-foreground text-sm">{u.phone || "—"}</TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {u.role === "CLIENT" && (
                                                <Link href={`/admin/clients/${u.id}`}>
                                                    <Button size="icon" variant="outline" className="rounded-xl" title="Fiche client">
                                                        <ExternalLink size={16} />
                                                    </Button>
                                                </Link>
                                            )}
                                            <Link href={`/admin/users/${u.id}`}>
                                                <Button size="icon" variant="ghost" className="rounded-xl" title="Modifier le compte">
                                                    <Pencil size={16} />
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filtered.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                                        Aucun utilisateur pour ce filtre.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

function FilterChip({
    href,
    active,
    label,
    count,
}: {
    href: string
    active: boolean
    label: string
    count: number
}) {
    return (
        <Link href={href}>
            <span
                className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card text-muted-foreground hover:bg-muted/60"
                )}
            >
                {label}
                <span className="rounded-md bg-background/80 px-1.5 text-xs tabular-nums">{count}</span>
            </span>
        </Link>
    )
}
