/** Libellés compacts pour cartes calendrier / listes. */

export function collectJobEmployees(job: { employees?: any[]; employee?: any }): any[] {
    if (job.employees?.length) return job.employees
    if (job.employee) return [job.employee]
    return []
}

export function jobAssigneesNames(job: { employees?: any[]; employee?: any }): string {
    return collectJobEmployees(job)
        .map((e: any) => e.user?.name)
        .filter(Boolean)
        .join(", ")
}

/** Type · marque modèle (tout ce qui est renseigné). */
export function jobVehicleSummary(job: { vehicle?: { type?: string | null; make?: string | null; model?: string | null } | null }): string {
    const v = job.vehicle
    if (!v) return ""
    const parts = [v.type?.trim(), v.make?.trim(), v.model?.trim()].filter(Boolean) as string[]
    return parts.join(" · ")
}

export function jobServicesSummary(job: { services?: { service?: { name?: string } }[]; customServiceName?: string | null }): string {
    const list = job.services?.map((s) => s.service?.name).filter(Boolean) as string[]
    if (job.customServiceName) list.push(job.customServiceName)
    return list.join(" · ")
}

export function formatJobPrice(job: { totalPrice?: number | null }): string | null {
    if (job.totalPrice == null || Number.isNaN(Number(job.totalPrice))) return null
    return `${Number(job.totalPrice).toFixed(2)} $`
}
