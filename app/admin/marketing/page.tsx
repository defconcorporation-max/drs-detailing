import { getClientSegments, sendMarketingCampaign } from "@/lib/actions/marketing"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Mail, Sparkles, Zap, Target, History, TrendingUp, Sun } from "lucide-react"
import { WeatherCampaign } from "@/components/admin/WeatherCampaign"
import { cn } from "@/lib/utils"

export default async function MarketingPage() {
    const segments = await getClientSegments()

    return (
        <div className="space-y-8 max-w-6xl mx-auto p-2">
            <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-4xl font-extrabold tracking-tight uppercase font-display bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                        Marketing <span className="text-foreground">Predictif</span>
                    </h1>
                    <p className="text-muted-foreground italic mt-1 flex items-center gap-2">
                        <Sparkles size={16} className="text-primary" /> Segmentez et engagez votre base client automatiquement
                    </p>
                </div>
            </header>

            {/* Segments & AI Insights */}
            <div className="grid gap-6 lg:grid-cols-4">
                <div className="lg:col-span-1">
                    <WeatherCampaign />
                </div>
                
                <div className="lg:col-span-3 grid gap-6 md:grid-cols-3">
                    <SegmentCard 
                        title="Tous les Clients" 
                        count={segments.all} 
                        icon={<Users size={20} />}
                        description="Votre base de données complète"
                        variant="default"
                        segmentKey="ALL"
                    />
                    <SegmentCard 
                        title="Promoteurs (VIP)" 
                        count={segments.promoters} 
                        icon={<TrendingUp size={20} />}
                        description="Clients avec NPS > 9"
                        variant="promoter"
                        segmentKey="PROMOTERS"
                    />
                    <SegmentCard 
                        title="Clients Inactifs" 
                        count={segments.sleepers} 
                        icon={<History size={20} />}
                        description="Aucun job depuis 90 jours"
                        variant="sleeper"
                        segmentKey="SLEEPERS"
                    />
                </div>
            </div>

            {/* Campaign Builder */}
            <Card className="border-primary/20 bg-gradient-to-b from-card to-primary/5 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                    <Zap size={100} className="text-primary" />
                </div>
                <CardHeader>
                    <div className="flex items-center gap-2 text-primary font-bold uppercase text-xs tracking-widest mb-2">
                        <Target size={14} /> Centre de Campagnes
                    </div>
                    <CardTitle className="text-2xl font-display uppercase tracking-wider">Lancer une Action Rapide</CardTitle>
                    <CardDescription>Sélectionnez un template et une cible pour envoyer une relance immédiate.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        <CampaignTemplate 
                            title="Relance Météo" 
                            description="Beau temps prévu : invitez les clients pour un lavage extérieur."
                            target="SLEEPERS"
                        />
                        <CampaignTemplate 
                            title="Upgrade Céramique" 
                            description="Proposez une protection longue durée à vos meilleurs clients."
                            target="PROMOTERS"
                        />
                        <CampaignTemplate 
                            title="Check-up Saison" 
                            description="Offre spéciale changement de saison pour toute la base."
                            target="ALL"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

function SegmentCard({ title, count, icon, description, variant, segmentKey }: any) {
    return (
        <Card className={cn(
            "relative group transition-all duration-300 hover:scale-[1.02] border border-border/40",
            variant === "promoter" && "border-primary/30 bg-primary/5 shadow-[0_0_15px_rgba(var(--primary-rgb),0.05)]",
            variant === "sleeper" && "border-orange-500/20 bg-orange-500/5"
        )}>
            <CardHeader className="pb-2">
                <div className={cn(
                    "size-10 rounded-xl flex items-center justify-center mb-2 transition-colors",
                    variant === "promoter" ? "bg-primary text-primary-foreground" : 
                    variant === "sleeper" ? "bg-orange-500 text-white" : "bg-muted"
                )}>
                    {icon}
                </div>
                <CardTitle className="text-sm font-bold uppercase tracking-widest">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="text-4xl font-black font-display tracking-tight">{count}</div>
                <p className="text-xs text-muted-foreground mt-2">{description}</p>
            </CardContent>
        </Card>
    )
}

function CampaignTemplate({ title, description, target }: any) {
    return (
        <article className="p-4 rounded-2xl border border-border/40 bg-background/50 flex flex-col justify-between group hover:border-primary/50 transition-all">
            <div className="space-y-2">
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-tighter border-primary/20 text-primary">
                    Cible : {target === "ALL" ? "Tous" : target}
                </Badge>
                <h4 className="font-bold uppercase tracking-wide group-hover:text-primary transition-colors">{title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </div>
            
            <form action={async () => {
                "use server"
                await sendMarketingCampaign(target, title)
            }}>
                <Button size="sm" className="w-full mt-4 rounded-xl gap-2 font-bold uppercase text-[10px] tracking-widest">
                    <Mail size={12} /> Envoyer
                </Button>
            </form>
        </article>
    )
}
