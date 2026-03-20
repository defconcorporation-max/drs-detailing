"use client"

import { updateService, deleteService } from "@/lib/actions/services"
import { TableRow, TableCell } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Save, Trash2 } from "lucide-react"
import { ServiceExtrasManager } from "@/components/admin/ServiceExtrasManager"

export function ServiceRow({ service }: { service: any }) {
    const formId = `service-form-${service.id}`
    const extras = service.extras ?? []

    return (
        <TableRow>
            <TableCell>
                <Input form={formId} name="name" defaultValue={service.name} className="h-8 w-full min-w-[150px]" required />
            </TableCell>
            <TableCell>
                <Input
                    form={formId}
                    name="description"
                    defaultValue={service.description || ""}
                    className="h-8 w-full"
                    placeholder="Desc..."
                />
            </TableCell>
            <TableCell>
                <Input form={formId} name="duration" type="number" defaultValue={service.durationMin} className="h-8 w-20" required />
            </TableCell>
            <TableCell>
                <Input form={formId} name="price" type="number" step="0.01" defaultValue={service.basePrice} className="h-8 w-24" required />
            </TableCell>
            <TableCell>
                <ServiceExtrasManager serviceId={service.id} serviceName={service.name} extras={extras} />
            </TableCell>
            <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                    <form
                        id={formId}
                        action={async (formData) => {
                            await updateService(service.id, formData)
                        }}
                        className="hidden"
                    />

                    <Button size="icon" variant="ghost" type="submit" form={formId} title="Enregistrer">
                        <Save size={16} className="text-primary" />
                    </Button>

                    <DeleteServiceButton id={service.id} />
                </div>
            </TableCell>
        </TableRow>
    )
}

function DeleteServiceButton({ id }: { id: string }) {
    return (
        <form
            action={async () => {
                await deleteService(id)
            }}
        >
            <Button size="icon" variant="ghost" type="submit" className="text-destructive">
                <Trash2 size={16} />
            </Button>
        </form>
    )
}
