import Link from "next/link"
import { ArrowRight, Droplets, ShieldCheck, User, Wrench } from "lucide-react"
import { BrandMark } from "@/components/brand/BrandMark"

const portals = [
    {
        href: "/admin",
        bay: "01",
        title: "Pit lane",
        subtitle: "Administration",
        description: "Clients, planning, équipe, stocks, chiffres — le moteur de l’atelier.",
        icon: ShieldCheck,
    },
    {
        href: "/employee",
        bay: "02",
        title: "Baie technique",
        subtitle: "Équipe",
        description: "Agenda du jour, dispos et fiches job. Tu sais ce que tu fais sur la carrosserie.",
        icon: Wrench,
    },
    {
        href: "/client",
        bay: "03",
        title: "Drive-in client",
        subtitle: "Accueil",
        description: "RDV, historique, fidélité. L’expérience premium avant même la poignée de portière.",
        icon: User,
    },
] as const

export default function Home() {
    return (
        <div className="relative min-h-[100dvh] overflow-hidden">
            {/* Lumières atelier */}
            <div
                className="pointer-events-none absolute inset-0 opacity-90 animate-[showroom-pulse_10s_ease-in-out_infinite]"
                style={{
                    background:
                        "radial-gradient(ellipse 50% 40% at 50% -5%, oklch(0.45 0.12 195 / 0.25), transparent 70%)",
                }}
            />
            <div
                className="pointer-events-none absolute top-[20%] left-[10%] h-64 w-64 rounded-full bg-primary/15 blur-[80px] md:h-80 md:w-80"
                aria-hidden
            />
            <div
                className="pointer-events-none absolute right-[5%] bottom-[25%] h-72 w-72 rounded-full bg-cyan-500/10 blur-[90px] md:h-96 md:w-96"
                aria-hidden
            />

            <div className="showroom-vignette absolute inset-0 z-[1]" aria-hidden />

            {/* Ligne chrome entrée */}
            <div className="showroom-chrome-line absolute top-0 right-0 left-0 z-20 h-px" />

            <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-6xl flex-col px-4 pt-10 pb-16 md:px-8 md:pt-14 md:pb-20">
                {/* En-tête marque */}
                <header className="mb-12 flex flex-col items-center text-center md:mb-16">
                    <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:gap-5">
                        <BrandMark />
                        <div className="text-center sm:text-left">
                            <p className="font-display text-[11px] font-semibold tracking-[0.35em] text-muted-foreground uppercase">
                                Detailing auto · finition pro
                            </p>
                            <p className="font-display mt-1 text-2xl font-bold tracking-[0.08em] text-foreground uppercase md:text-3xl">
                                DRS <span className="text-gradient-brand">Detailing</span>
                            </p>
                        </div>
                    </div>

                    <p className="font-display mb-2 text-xs font-medium tracking-[0.28em] text-primary uppercase">
                        Bienvenue dans l&apos;atelier
                    </p>
                    <h1 className="max-w-4xl text-balance font-display text-4xl leading-[0.95] font-bold tracking-tight text-foreground uppercase sm:text-5xl md:text-6xl lg:text-7xl">
                        Finition
                        <span className="text-gradient-brand"> miroir</span>
                        <br />
                        <span className="text-3xl font-semibold tracking-wide text-muted-foreground sm:text-4xl md:text-5xl">
                            Contrôle total
                        </span>
                    </h1>
                    <p className="mx-auto mt-6 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
                        L&apos;odeur du shampoing, le silence des baies, la réflexion du vernis — on recrée cette sensation ici.
                        Choisis ta porte : comme entrer dans la shop.
                    </p>
                </header>

                {/* Baies */}
                <div className="grid flex-1 grid-cols-1 gap-5 md:grid-cols-3 md:gap-6 lg:gap-8">
                    {portals.map((portal) => {
                        const Icon = portal.icon
                        return (
                            <Link
                                key={portal.href}
                                href={portal.href}
                                className="group relative block h-full min-h-[280px] outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                            >
                                <article
                                    className="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-card/80 to-card/40 p-6 shadow-2xl backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-primary/35 hover:shadow-[0_24px_80px_-20px_oklch(0.5_0.1_195_/_0.35)] dark:from-zinc-900/60 dark:to-black/40 dark:hover:shadow-primary/20"
                                >
                                    <div className="showroom-bay-shine" />

                                    <div className="relative z-[1] mb-4 flex items-start justify-between">
                                        <span className="font-display text-5xl font-bold tabular-nums text-foreground/10 transition-colors duration-300 group-hover:text-primary/40 md:text-6xl">
                                            {portal.bay}
                                        </span>
                                        <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-primary shadow-inner backdrop-blur-sm transition-transform duration-300 group-hover:scale-105 group-hover:border-primary/30">
                                            <Icon className="h-6 w-6" strokeWidth={1.5} />
                                        </span>
                                    </div>

                                    <div className="relative z-[1] flex-1">
                                        <h2 className="font-display text-xl font-bold tracking-wide text-foreground uppercase md:text-2xl">
                                            {portal.title}
                                        </h2>
                                        <p className="mt-1 text-xs font-semibold tracking-widest text-primary uppercase">{portal.subtitle}</p>
                                        <p className="mt-4 text-sm leading-relaxed text-muted-foreground md:text-base">{portal.description}</p>
                                    </div>

                                    <div className="relative z-[1] mt-6 flex items-center gap-2 font-display text-sm font-semibold tracking-wide text-primary uppercase">
                                        Entrer
                                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                                    </div>

                                    <div
                                        className="pointer-events-none absolute right-0 bottom-0 left-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-60"
                                        aria-hidden
                                    />
                                </article>
                            </Link>
                        )
                    })}
                </div>

                <footer className="mt-14 flex flex-col items-center gap-3 border-t border-white/5 pt-10 text-center md:mt-20">
                    <Droplets className="h-5 w-5 text-primary/70" strokeWidth={1.5} aria-hidden />
                    <p className="max-w-md text-xs leading-relaxed tracking-wide text-muted-foreground uppercase">
                        Shampoing neutre · finishing sans hologrammes · traitements céramique
                    </p>
                    <p className="text-[11px] text-muted-foreground/80">DRS Detailing — intérieur d&apos;atelier, version logicielle</p>
                </footer>
            </div>
        </div>
    )
}
