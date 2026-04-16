export const dynamic = 'force-dynamic'

import { updateAdminPassword } from "@/lib/actions/settings"
import { getServices, createService } from "@/lib/actions/services"
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

    return (
        <div className="space-y-6">
            <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>

            <Tabs defaultValue="services" className="w-full">
                <TabsList className="mb-6">
                    <TabsTrigger value="services">Services & Tarifs</TabsTrigger>
                    <TabsTrigger value="security">Sécurité Admin</TabsTrigger>
                </TabsList>

                <TabsContent value="services" className="space-y-6 mt-0">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold">Services & tarifs</h3>
                            <p className="text-sm text-muted-foreground">Définissez des extras (VUS, dégâts, etc.) par service.</p>
                        </div>
                        <AddServiceDialog />
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Liste des Services</CardTitle>
                            <CardDescription>
                                Gérez l'offre de services, les prix, et les durées.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nom du Service</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead>Durée (min)</TableHead>
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
                                                Aucun service configuré.
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
                            <CardTitle>Sécurité Admin</CardTitle>
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
                                    <Save size={16} /> Mettre à jour
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
                    <DialogTitle>Créer Service</DialogTitle>
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
                        <Label className="text-right">Durée (min)</Label>
                        <Input name="duration" type="number" className="col-span-3" defaultValue={60} required />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Prix ($)</Label>
                        <Input name="price" type="number" step="0.01" className="col-span-3" required />
                    </div>
                    <DialogFooter>
                        <Button type="submit">Créer</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
