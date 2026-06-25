import { Suspense } from "react"
import { PublicBookingForm } from "@/components/booking/PublicBookingForm"
import { BrandMark } from "@/components/brand/BrandMark"
import { Loader2 } from "lucide-react"

export const metadata = {
    title: "Réservez en ligne | DRS Detailing",
    description: "Formulaire de réservation en ligne pour nos prestations esthétiques automobiles premium.",
}

interface PageProps {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function BookPage({ searchParams }: PageProps) {
    const resolvedParams = await searchParams
    const isEmbed = resolvedParams?.embed === "true"

    if (isEmbed) {
        return (
            <main className="min-h-screen bg-transparent antialiased py-2">
                <Suspense fallback={
                    <div className="flex h-screen flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground font-medium">Chargement du configurateur...</p>
                    </div>
                }>
                    <PublicBookingForm />
                </Suspense>
            </main>
        )
    }

    return (
        <main className="relative min-h-[100dvh] overflow-hidden bg-background">
            {/* Lumières atelier */}
            <div
                className="pointer-events-none absolute inset-0 opacity-90 animate-[showroom-pulse_10s_ease-in-out_infinite]"
                style={{
                    background:
                        "radial-gradient(ellipse 50% 40% at 50% -5%, oklch(0.45 0.12 195 / 0.25), transparent 70%)",
                }}
            />
            <div
                className="pointer-events-none absolute top-[20%] left-[10%] h-64 w-64 rounded-full bg-primary/15 blur-[80px]"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute right-[5%] bottom-[25%] h-72 w-72 rounded-full bg-cyan-500/10 blur-[90px]"
                aria-hidden
            />

            <div className="showroom-vignette absolute inset-0 z-[1]" aria-hidden />

            <div className="relative z-10 mx-auto max-w-5xl px-4 py-8 md:py-12">
                {/* Logo / Header */}
                <header className="mb-10 flex flex-col items-center text-center">
                    <div className="mb-4 flex items-center gap-3">
                        <BrandMark />
                        <div>
                            <p className="font-display text-[10px] font-semibold tracking-[0.3em] text-muted-foreground uppercase">
                                Finition pro · Esthétique
                            </p>
                            <p className="font-display mt-0.5 text-xl font-bold tracking-[0.05em] text-foreground uppercase">
                                DRS <span className="text-gradient-brand">Detailing</span>
                            </p>
                        </div>
                    </div>
                </header>

                <Suspense fallback={
                    <div className="flex h-[400px] flex-col items-center justify-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground font-medium">Chargement du configurateur...</p>
                    </div>
                }>
                    <PublicBookingForm />
                </Suspense>
            </div>
        </main>
    )
}
