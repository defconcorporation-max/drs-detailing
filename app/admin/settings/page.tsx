export const dynamic = 'force-dynamic'

import { updateAdminPassword } from "@/lib/actions/settings"
import { getCityColors } from "@/lib/actions/settings"
import { getServices, createService } from "@/lib/actions/services"
import { updateSystemSettings } from "@/lib/actions/dashboard"
import { CityColorManager } from "@/components/admin/CityColorManager"
import prisma from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Plus } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ServiceRow } from "@/components/admin/ServiceRow"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"

export default async function SettingsPage() {
    const services = await getServices()
    const cityColors = await getCityColors()
    let setting = await prisma.systemSetting.findUnique({ where: { id: "GLOBAL" } })
    if (!setting) {
        setting = await prisma.systemSetting.create({ data: { id: "GLOBAL", averageVehicleCost: 7.0 } })
    }

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">ParamÃ¨tres</h2>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-6 flex-wrap h-auto gap-1">
                    <TabsTrigger value="general">GÃ©nÃ©ral</TabsTrigger>
                    <TabsTrigger value="cities">Couleurs Villes</TabsTrigger>
                    <TabsTrigger value="services">Services & Tarifs</TabsTrigger>
                    <TabsTrigger value="security">SÃ©curitÃ© Admin</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-0">
                    <Card className="max-w-md">
                        <CardHeader>
                            <CardTitle>CoÃ»ts & RentabilitÃ©</CardTitle>
                            <CardDescription>ParamÃ¨tres pour les calculs du tableau de bord.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={async (formData) => {
                                "use server"
                                await updateSystemSettings({ averageVehicleCost: parseFloat(formData.get("averageVehicleCost") as string) })
                            }} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>CoÃ»t moyen pour un vÃ©hicule ($) (produits, matÃ©riel)</Label>
                                    <Input name="averageVehicleCost" type="number" step="0.01" defaultValue={setting.averageVehicleCost} required />
                                </div>
                                <Button type="submit" className="w-full gap-2">
                                    <Save size={16} /> Enregistrer
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="cities" className="mt-0">
                    <Card>
                        <CardHeader>
                            <CardTitle>Couleurs par Ville</CardTitle>
                            <CardDescription>
                                Associez une couleur Ã  chaque ville du QuÃ©bec. Ces couleurs apparaÃ®tront sur le calendrier pour identifier rapidement les secteurs.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <CityColorManager initialColors={cityColors} />
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="services" className="space-y-6 mt-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold">Services & tarifs</h3>
                            <p className="text-sm text-muted-foreground">DÃ©finissez des extras (VUS, dÃ©gÃ¢ts, etc.) par service.</p>
                        </div>
                        <AddServiceDialog />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Liste des Services</CardTitle>
                            <CardDescription>
                                GÃ©rez l'offre de services, les prix, et les durÃ©es.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom du Service</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>DurÃ©e (min)</TableHead>
                                        <TableHead className="w-[100px]">Prix ($)</TableHead>
                                        <TableHead className="min-w-[140px]">Extras</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {services.map((service: any) => (
                                        <ServiceRow key={service.id} service={service} />
                                    ))}
                                    {services.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                                Aucun service configurÃ©.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-0">
                    <Card className="max-w-md">
                        <CardHeader>
                            <CardTitle>SÃ©curitÃ© Admin</CardTitle>
                            <CardDescription>Modifiez votre mot de passe administrateur.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form action={async (formData) => {
                                "use server"
                                const res = await updateAdminPassword(formData)
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
                                    <Save size={16} /> Mettre Ã  jour
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}

function AddServiceDialog() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus size={16} />
                    Nouveau Service
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>CrÃ©er Service</DialogTitle>
                </DialogHeader>
                <form action={async (formData) => {
                    "use server"
                    await createService(formData)
                }} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Nom</Label>
                        <Input name="name" className="col-span-3" required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Description</Label>
                        <Input name="description" className="col-span-3" />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">DurÃ©e (min)</Label>
                        <Input name="duration" type="number" className="col-span-3" defaultValue={60} required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Prix ($)</Label>
                        <Input name="price" type="number" step="0.01" className="col-span-3" required />
                    </div>
                    <DialogFooter>
                        <Button type="submit">CrÃ©er</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
