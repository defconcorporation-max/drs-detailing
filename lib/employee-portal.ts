/** Rôles autorisés sur /employee (baie technique). */
export function canAccessEmployeePortal(role: string): boolean {
    return role === "EMPLOYEE" || role === "ADMIN"
}

export function isAdminEmployeePortalView(role: string): boolean {
    return role === "ADMIN"
}

/** Statuts de jobs affichés dans la vue équipe / calendrier employé. */
export const EMPLOYEE_PORTAL_JOB_STATUSES = [
    "SCHEDULED",
    "CONFIRMED",
    "IN_PROGRESS",
    "COMPLETED",
    "PENDING",
    "REQUESTED",
    "RESCHEDULE_REQUESTED",
] as const

export function filterJobsForPortal(
    allJobs: any[],
    currentUserId: string,
    options: { isAdminView: boolean }
): any[] {
    const base = allJobs.filter((j: any) => EMPLOYEE_PORTAL_JOB_STATUSES.includes(j.status))
    if (options.isAdminView) return base
    return base.filter((j: any) => {
        const assigned = j.employees?.some((emp: any) => emp.user?.id === currentUserId)
        const legacyAssigned = j.employee?.user?.id === currentUserId
        return assigned || legacyAssigned
    })
}
