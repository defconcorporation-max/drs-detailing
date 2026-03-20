/** Dates / heures en fuseau local (évite les décalages toISOString() vs colonnes du calendrier). */

export function localDateKey(d: Date | string): string {
    const x = typeof d === "string" ? new Date(d) : new Date(d.getTime())
    if (Number.isNaN(x.getTime())) return ""
    const y = x.getFullYear()
    const m = String(x.getMonth() + 1).padStart(2, "0")
    const day = String(x.getDate()).padStart(2, "0")
    return `${y}-${m}-${day}`
}

export function localHour(d: Date | string): number {
    const x = typeof d === "string" ? new Date(d) : new Date(d.getTime())
    if (Number.isNaN(x.getTime())) return 0
    return x.getHours()
}

export function localMinute(d: Date | string): number {
    const x = typeof d === "string" ? new Date(d) : new Date(d.getTime())
    if (Number.isNaN(x.getTime())) return 0
    return x.getMinutes()
}

/** HH:mm en heure locale (pour input type="time") */
export function localTimeHM(d: Date | string): string {
    const x = typeof d === "string" ? new Date(d) : new Date(d.getTime())
    if (Number.isNaN(x.getTime())) return "09:00"
    return `${String(x.getHours()).padStart(2, "0")}:${String(x.getMinutes()).padStart(2, "0")}`
}
