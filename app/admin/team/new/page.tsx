
import { createEmployee } from "@/lib/actions/employee"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { UserPlus, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewEmployeePage() {
    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Link href="/admin/team">
                    <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
                </Link>
                <h2 className="text-3xl font-bold tracking-tight">Ajouter un Employé</h2>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profil Employé</CardTitle>
                    <CardDescription>
                        Créez un compte pour un membre de l'équipe. Il pourra se connecter avec ces identifiants.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={async (formData: FormData) => {
                        "use server"
                        // Next expects `form action` to return void.
                        await createEmployee(formData)
                    }} className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Nom Complet</Label>
                            <Input name="name" required placeholder="Ex: Marc Tech" />
                        </div>

                        <div className="grid gap-2">
                            <Label>Email (Identifiant)</Label>
                            <Input name="email" type="email" required placeholder="employe@drs.com" />
                        </div>

                        <div className="grid gap-2">
                            <Label>Mot de passe provisoire</Label>
                            <Input name="password" type="text" required placeholder="Secret123" />
                        </div>

                        <div className="grid gap-2">
                            <Label>Taux Horaire ($)</Label>
                            <Input name="hourlyRate" type="number" step="0.5" placeholder="0.00" />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full gap-2">
                                <UserPlus size={18} /> Créer le compte
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
