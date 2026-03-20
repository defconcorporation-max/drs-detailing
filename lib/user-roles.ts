export const USER_ROLES = ["ADMIN", "EMPLOYEE", "CLIENT"] as const
export type UserRole = (typeof USER_ROLES)[number]

export const ROLE_LABELS_FR: Record<UserRole, string> = {
    ADMIN: "Administrateur",
    EMPLOYEE: "Employé",
    CLIENT: "Client",
}
