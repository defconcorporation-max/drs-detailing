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

export function getLocalDateAndHourInTZ(date: Date, timeZone: string = "America/Montreal") {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    })

    const parts = formatter.formatToParts(date)
    const map: Record<string, string> = {}
    parts.forEach(p => { map[p.type] = p.value })

    return {
        dateStr: `${map.year}-${map.month}-${map.day}`,
        hour: parseInt(map.hour, 10),
        minute: parseInt(map.minute, 10)
    }
}

export function parseLocalDateInTZ(dateStr: string, timeStr: string, timeZone: string = "America/Montreal"): Date {
    const targetString = `${dateStr}T${timeStr}:00`
    const utcDate = new Date(targetString + "Z")
    
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    })
    
    const parts = formatter.formatToParts(utcDate)
    const map: Record<string, string> = {}
    parts.forEach(p => { map[p.type] = p.value })
    
    const formattedString = `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}:${map.second}`
    const diffMs = new Date(targetString + "Z").getTime() - new Date(formattedString + "Z").getTime()
    
    return new Date(utcDate.getTime() + diffMs)
}

