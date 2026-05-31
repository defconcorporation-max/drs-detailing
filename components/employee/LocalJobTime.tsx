"use client"

/**
 * Affiche la date et l'heure d'un job dans le fuseau LOCAL du navigateur.
 * À utiliser à la place de new Date(...).toLocaleTimeString() dans les
 * Server Components, qui s'exécutent en UTC sur le serveur.
 */
export function LocalJobDate({ iso }: { iso: string }) {
    const d = new Date(iso)
    return <>{d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}</>
}

export function LocalJobTime({ iso }: { iso: string }) {
    const d = new Date(iso)
    return <>{d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</>
}
