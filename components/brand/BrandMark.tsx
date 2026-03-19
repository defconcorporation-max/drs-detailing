import { cn } from "@/lib/utils"

export function BrandMark({ className, compact = false }: { className?: string; compact?: boolean }) {
    return (
        <div
            className={cn(
                "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-lg",
                "bg-gradient-to-br from-zinc-400 via-zinc-700 to-zinc-950",
                "ring-2 ring-white/20 ring-offset-2 ring-offset-background",
                "before:absolute before:inset-0 before:bg-gradient-to-tr before:from-white/40 before:via-transparent before:to-transparent before:opacity-50",
                compact ? "size-8" : "size-11",
                className
            )}
            aria-hidden
        >
            <span
                className={cn(
                    "font-display relative z-[1] font-bold tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]",
                    compact ? "text-sm" : "text-xl"
                )}
            >
                D
            </span>
        </div>
    )
}
