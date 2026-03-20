import type { ServiceLineLike } from "@/lib/job-metrics"
import { jobDurationMinutes, jobPriceEstimate } from "@/lib/job-metrics"
import prisma from "@/lib/db"

export function parseServiceExtrasMap(data: FormData): Record<string, string[]> {
    const raw = data.get("serviceExtras") as string | null
    if (!raw || raw === "{}") return {}
    try {
        const o = JSON.parse(raw) as Record<string, unknown>
        const out: Record<string, string[]> = {}
        for (const k of Object.keys(o)) {
            const v = o[k]
            out[k] = Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []
        }
        return out
    } catch {
        return {}
    }
}

export async function buildLinesFromIds(
    serviceIds: string[],
    extrasMap: Record<string, string[]>
): Promise<ServiceLineLike[]> {
    if (!serviceIds.length) return []
    const services = await prisma.service.findMany({
        where: { id: { in: serviceIds } },
        include: { extras: { orderBy: { sortOrder: "asc" } } },
    })
    const lines: ServiceLineLike[] = []
    for (const sid of serviceIds) {
        const service = services.find((s) => s.id === sid)
        if (!service) continue
        lines.push({
            serviceId: sid,
            selectedExtraIds: extrasMap[sid] ?? [],
            service,
        })
    }
    return lines
}

export function totalsFromLines(lines: ServiceLineLike[]) {
    return {
        durationMin: jobDurationMinutes(lines),
        totalPrice: jobPriceEstimate(lines),
    }
}
