/**
 * Couleurs calendrier = statut uniquement (plus de color picker par job).
 * Jobs non confirmés = gris + opacité réduite.
 */

export function getJobStatusCalendarClasses(status: string): { box: string; text: string; opacity?: string } {
    const s = status || "PENDING"

    if (["PENDING", "REQUESTED", "RESCHEDULE_REQUESTED"].includes(s)) {
        return {
            box: "border border-zinc-500/35 bg-zinc-700/40 backdrop-blur-sm shadow-none",
            text: "text-zinc-100",
            opacity: "opacity-[0.55]",
        }
    }

    if (s === "CANCELLED") {
        return {
            box: "border border-rose-600/40 bg-rose-950/70 line-through",
            text: "text-rose-100",
            opacity: "opacity-75",
        }
    }

    if (s === "COMPLETED") {
        return {
            box: "border border-emerald-600/35 bg-emerald-800/75",
            text: "text-emerald-50",
        }
    }

    if (s === "IN_PROGRESS") {
        return {
            box: "border border-amber-400/50 bg-amber-600 shadow-md",
            text: "text-amber-950",
        }
    }

    // SCHEDULED, CONFIRMED
    return {
        box: "border border-cyan-400/40 bg-cyan-700 shadow-md",
        text: "text-white",
    }
}
