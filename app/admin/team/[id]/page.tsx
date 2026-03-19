
import { getEmployeeById, updateEmployee, deleteEmployee } from "@/lib/actions/employee"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Save, ArrowLeft, Trash2 } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

export default async function EditEmployeePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const employee = await getEmployeeById(id)

    if (!employee) notFound()

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/team">
                        <Button variant="ghost" size="icon"><ArrowLeft size={18} /></Button>
                    </Link>
                    <h2 className="text-3xl font-bold tracking-tight">Modifier Employé</h2>
                </div>
                <form action={async () => {
                    "use server"
                    await deleteEmployee(id)
                }}>
                    <Button variant="destructive" size="icon" title="Supprimer">
                        <Trash2 size={18} />
                    </Button>
                </form>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Profil: {employee.name}</CardTitle>
                </CardHeader>
                <CardContent>
                    <form action={async (formData) => {
                        "use server"
                        await updateEmployee(id, formData)
                    }} className="space-y-4">
                        <div className="grid gap-2">
                            <Label>Nom Complet</Label>
                            <Input name="name" defaultValue={employee.name || ""} required />
                        </div>

                        <div className="grid gap-2">
                            <Label>Email (Identifiant)</Label>
                            <Input name="email" type="email" defaultValue={employee.email || ""} required />
                        </div>

                        <div className="grid gap-2">
                            <Label>Mot de passe</Label>
                            <Input name="password" type="text" defaultValue={employee.password || ""} required />
                        </div>

                        <div className="grid gap-2">
                            <Label>Taux Horaire ($)</Label>
                            <Input name="hourlyRate" type="number" step="0.5" defaultValue={employee.employeeProfile?.hourlyRate || 0} />
                        </div>

                        <div className="pt-4">
                            <Button type="submit" className="w-full gap-2">
                                <Save size={18} /> Mettre à jour
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
