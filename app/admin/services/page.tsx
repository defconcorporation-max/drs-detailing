
import { getServices, createService, updateService, deleteService } from "@/lib/actions/services"

export const dynamic = 'force-dynamic'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Trash2, Edit, Plus, Save } from "lucide-react"
import { ServiceRow } from "@/components/admin/ServiceRow"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog"


export default async function ServicesPage() {
    const services = await getServices()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Services & Tarifs</h2>
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
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {services.map((service: any) => (
                                <ServiceRow key={service.id} service={service} />
                            ))}
                            {services.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        Aucun service configuré.
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

// function ServiceRow removed
// function DeleteServiceButton removed

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
