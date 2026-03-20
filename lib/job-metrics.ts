/** Durée / prix d’une ligne job (service + extras sélectionnés) */

export function parseExtraIds(raw: unknown): string[] {
    if (!raw) return []
    if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === "string")
    return []
}

export type ServiceLineLike = {
    serviceId: string
    selectedExtraIds?: unknown
    service: {
        durationMin: number
        basePrice: number
        extras?: Array<{ id: string; durationExtraMin: number; priceExtra: number }>
    }
}

export function lineDurationMinutes(line: ServiceLineLike): number {
    const base = line.service.durationMin || 60
    const ids = new Set(parseExtraIds(line.selectedExtraIds))
    const extras = line.service.extras || []
    const add = extras.filter((e) => ids.has(e.id)).reduce((a, e) => a + (e.durationExtraMin || 0), 0)
    return base + add
}

export function linePrice(line: ServiceLineLike): number {
    const base = line.service.basePrice || 0
    const ids = new Set(parseExtraIds(line.selectedExtraIds))
    const extras = line.service.extras || []
    const add = extras.filter((e) => ids.has(e.id)).reduce((a, e) => a + (e.priceExtra || 0), 0)
    return base + add
}

export function jobDurationMinutes(lines: ServiceLineLike[]): number {
    if (!lines.length) return 60
    return lines.reduce((a, l) => a + lineDurationMinutes(l), 0)
}

export function jobPriceEstimate(lines: ServiceLineLike[]): number {
    return lines.reduce((a, l) => a + linePrice(l), 0)
}
