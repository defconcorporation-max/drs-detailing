
import { getClientDashboardData } from "@/lib/actions/portal"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Gift, Users } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default async function ReferralPage() {
    const data = await getClientDashboardData()
    if (!data) return <div>Erreur</div>

    const { profile } = data
    const referralCode = profile.referralCode || "DRS-CLIENT-001" // Fallback if null

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">Parrainage</h2>
                <p className="text-muted-foreground">Partagez votre code et gagnez des récompenses !</p>
            </div>

            <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                <CardHeader className="text-center">
                    <Gift className="w-12 h-12 mx-auto text-indigo-500 mb-2" />
                    <CardTitle>Votre lien de parrainage</CardTitle>
                    <CardDescription>
                        Invitez vos amis. Ils reçoivent 10% de rabais, vous recevez 500 points.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <Label htmlFor="link" className="sr-only">Lien</Label>
                            <Input id="link" defaultValue={`https://drs-detailing.com/ref/${referralCode}`} readOnly />
                        </div>
                        <Button size="sm" className="px-3">
                            <span className="sr-only">Copier</span>
                            <Copy className="h-4 w-4" />
                        </Button>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="grid flex-1 gap-2">
                            <Label className="font-semibold text-center">CODE: {referralCode}</Label>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="justify-center text-sm text-muted-foreground">
                    Conditions appliquées. Points crédités après le 1er service.
                </CardFooter>
            </Card>

            <div className="grid grid-cols-2 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users size={18} />
                            Amis Parrainés
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">personnes</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Gift size={18} />
                            Points Gagnés
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-indigo-500">0</div>
                        <p className="text-xs text-muted-foreground">points via parrainage</p>
                    </CardContent>
                </Card>
            </div>

        </div>
    )
}
