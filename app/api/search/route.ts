import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/db"

export async function GET(req: NextRequest) {
    const q = req.nextUrl.searchParams.get("q")?.trim()
    if (!q || q.length < 2) return NextResponse.json({ results: [] })

    const search = q.toLowerCase()

    try {
        const [clients, jobs, vehicles] = await Promise.all([
            // Clients — search by name, email, phone, address
            prisma.clientProfile.findMany({
                where: {
                    OR: [
                        { user: { name: { contains: q, mode: "insensitive" } } },
                        { user: { email: { contains: q, mode: "insensitive" } } },
                        { user: { phone: { contains: q, mode: "insensitive" } } },
                        { address: { contains: q, mode: "insensitive" } },
                    ],
                },
                take: 6,
                include: { user: true, vehicles: true },
            }),

            // Jobs — search by notes, custom service name, or client name
            prisma.job.findMany({
                where: {
                    OR: [
                        { notes: { contains: q, mode: "insensitive" } },
                        { customServiceName: { contains: q, mode: "insensitive" } },
                        { client: { user: { name: { contains: q, mode: "insensitive" } } } },
                    ],
                    NOT: { status: "CANCELLED" },
                },
                take: 6,
                orderBy: { scheduledDate: "desc" },
                include: {
                    client: { include: { user: true } },
                    vehicle: true,
                    services: { include: { service: true } },
                },
            }),

            // Vehicles — search by make, model, license plate
            prisma.vehicle.findMany({
                where: {
                    OR: [
                        { make: { contains: q, mode: "insensitive" } },
                        { model: { contains: q, mode: "insensitive" } },
                        { licensePlate: { contains: q, mode: "insensitive" } },
                    ],
                },
                take: 6,
                include: { client: { include: { user: true } } },
            }),
        ])

        return NextResponse.json({
            results: {
                clients: clients.map(c => ({
                    type: "client",
                    id: c.id,
                    label: c.user?.name || c.user?.email || "—",
                    sub: [c.user?.email, c.address].filter(Boolean).join(" · "),
                    href: `/admin/clients/${c.id}`,
                })),
                jobs: jobs.map(j => ({
                    type: "job",
                    id: j.id,
                    label: j.client?.user?.name || "—",
                    sub: [
                        j.vehicle ? `${j.vehicle.make} ${j.vehicle.model}` : null,
                        j.services.map((s: any) => s.service.name).join(", ") || j.customServiceName,
                        new Date(j.scheduledDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
                    ].filter(Boolean).join(" · "),
                    href: `/admin/job/${j.id}`,
                    status: j.status,
                })),
                vehicles: vehicles.map(v => ({
                    type: "vehicle",
                    id: v.id,
                    label: `${v.year || ""} ${v.make} ${v.model}`.trim(),
                    sub: [v.licensePlate, v.client?.user?.name].filter(Boolean).join(" · "),
                    href: `/admin/clients/${v.clientId}`,
                })),
            },
        })
    } catch (e) {
        console.error("[search]", e)
        return NextResponse.json({ results: { clients: [], jobs: [], vehicles: [] } })
    }
}
