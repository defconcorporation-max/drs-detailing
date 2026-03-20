import { cookies } from "next/headers"

/** Vérifie le cookie admin (même logique que le middleware). */
export async function requireAdminSession(): Promise<string | null> {
    const cookieStore = await cookies()
    if (cookieStore.get("drs_admin_session")?.value !== "true") {
        return "Session administrateur requise."
    }
    return null
}
