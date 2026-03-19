
import { updateAdminPassword } from "@/lib/actions/settings"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save } from "lucide-react"

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>

            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Sécurité Admin</CardTitle>
                    <CardDescription>Modifiez votre mot de passe administrateur.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={async (formData) => {
                        "use server"
                        // Simple server action handling, normally use useFormState for feedback
                        const res = await updateAdminPassword(formData)
                        // Ideally show toast/alert based on res
                    }} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Mot de passe actuel</Label>
                            <Input name="currentPass" type="password" required />
                        </div>
                        <div className="space-y-2">
                            <Label>Nouveau mot de passe</Label>
                            <Input name="newPass" type="password" required />
                        </div>
                        <Button type="submit" className="w-full gap-2">
                            <Save size={16} /> Mettre à jour
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
