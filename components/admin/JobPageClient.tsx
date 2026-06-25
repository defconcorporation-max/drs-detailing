"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Play, Square, CheckCircle2, Clock, Camera, Trash2,
    MapPin, Car, Users, DollarSign, ArrowLeft, Upload, X
} from "lucide-react"
import { startJob, completeJob, removeJobPhoto } from "@/lib/actions/jobs"
import Link from "next/link"
import { JobNotesTimeline } from "@/components/admin/JobNotesTimeline"
import { SmsDialog } from "@/components/admin/SmsDialog"

type Props = {
    job: any
}

const STATUS_LABELS: Record<string, string> = {
    PENDING: "En attente",
    CONFIRMED: "Confirmé",
    IN_PROGRESS: "En cours",
    COMPLETED: "Terminé",
    CANCELLED: "Annulé",
}

const STATUS_COLORS: Record<string, string> = {
    PENDING: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-300 border-yellow-500/30",
    CONFIRMED: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30",
    IN_PROGRESS: "bg-primary/20 text-primary border-primary/30",
    COMPLETED: "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30",
    CANCELLED: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30",
}

function ElapsedTimer({ startedAt }: { startedAt: string | null }) {
    const [elapsed, setElapsed] = useState(0)

    useEffect(() => {
        if (!startedAt) return
        const start = new Date(startedAt).getTime()
        const update = () => setElapsed(Math.floor((Date.now() - start) / 1000))
        update()
        const id = setInterval(update, 1000)
        return () => clearInterval(id)
    }, [startedAt])

    const h = Math.floor(elapsed / 3600)
    const m = Math.floor((elapsed % 3600) / 60)
    const s = elapsed % 60
    const fmt = (n: number) => String(n).padStart(2, "0")

    return (
        <div className="text-4xl font-mono font-bold tabular-nums tracking-tight text-primary">
            {fmt(h)}:{fmt(m)}:{fmt(s)}
        </div>
    )
}

export function JobPageClient({ job: initialJob }: Props) {
    const router = useRouter()
    const [job, setJob] = useState(initialJob)
    const [loading, setLoading] = useState<string | null>(null)
    const [beforePreview, setBeforePreview] = useState<string[]>(
        job.beforePhotos ? JSON.parse(job.beforePhotos) : []
    )
    const [afterPreview, setAfterPreview] = useState<string[]>(
        job.afterPhotos ? JSON.parse(job.afterPhotos) : []
    )

    const handleStart = async () => {
        setLoading("start")
        const res = await startJob(job.id)
        if (res.error) toast.error(res.error)
        else {
            toast.success("Job démarré !")
            setJob((prev: any) => ({ ...prev, status: "IN_PROGRESS", startedAt: new Date().toISOString() }))
        }
        setLoading(null)
    }

    const handleComplete = async () => {
        setLoading("complete")
        const res = await completeJob(job.id)
        if (res.error) toast.error(res.error)
        else {
            toast.success("Job terminé !")
            setJob((prev: any) => ({ ...prev, status: "COMPLETED", completedAt: new Date().toISOString() }))
        }
        setLoading(null)
    }

    const handlePhotoUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {
        const files = Array.from(e.target.files || [])
        if (!files.length) return

        // Convert to base64 for preview (in production, you'd upload to Supabase Storage)
        const urls: string[] = []
        for (const file of files) {
            const reader = new FileReader()
            await new Promise<void>((resolve) => {
                reader.onloadend = () => {
                    urls.push(reader.result as string)
                    resolve()
                }
                reader.readAsDataURL(file)
            })
        }

        // Save to DB
        const { addJobPhotos } = await import("@/lib/actions/jobs")
        const res = await addJobPhotos(job.id, type, urls)
        if (res.error) {
            toast.error(res.error)
        } else {
            if (type === "before") setBeforePreview((p) => [...p, ...urls])
            else setAfterPreview((p) => [...p, ...urls])
            toast.success(`${urls.length} photo(s) ajoutée(s)`)
        }
        e.target.value = ""
    }, [job.id])

    const handleRemovePhoto = async (type: "before" | "after", url: string) => {
        const res = await removeJobPhoto(job.id, type, url)
        if (res.error) toast.error(res.error)
        else {
            if (type === "before") setBeforePreview((p) => p.filter((u) => u !== url))
            else setAfterPreview((p) => p.filter((u) => u !== url))
        }
    }

    const scheduledDate = new Date(job.scheduledDate)
    const dateStr = scheduledDate.toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric"
    })
    const timeStr = scheduledDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })

    const totalDuration = job.completedAt && job.startedAt
        ? Math.round((new Date(job.completedAt).getTime() - new Date(job.startedAt).getTime()) / 60000)
        : null

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Link href="/admin">
                    <Button variant="ghost" size="icon" className="rounded-xl h-10 w-10">
                        <ArrowLeft size={18} />
                    </Button>
                </Link>
                <div className="flex-1 min-w-0">
                    <h1 className="font-display text-2xl font-bold tracking-tight uppercase truncate">
                        {job.client?.user?.name || "Client inconnu"}
                    </h1>
                    <p className="text-sm text-muted-foreground capitalize">{dateStr} à {timeStr}</p>
                </div>
                <SmsDialog 
                    clientId={job.clientId} 
                    clientPhone={job.client?.user?.phone} 
                    clientName={job.client?.user?.name}
                    jobId={job.id} 
                />
                <span className={`hidden md:inline-flex shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full border ${STATUS_COLORS[job.status] || ""}`}>
                    {STATUS_LABELS[job.status] || job.status}
                </span>
            </div>
            
            {/* Mobile Status Badge */}
            <div className="md:hidden flex">
                <span className={`w-full text-center text-xs font-semibold px-3 py-1.5 rounded-xl border ${STATUS_COLORS[job.status] || ""}`}>
                    {STATUS_LABELS[job.status] || job.status}
                </span>
            </div>

            {/* Chrono Card */}
            <Card className={`border-2 transition-colors ${job.status === "IN_PROGRESS" ? "border-primary/50 bg-primary/5" : "border-border/60"}`}>
                <CardContent className="pt-6 pb-5">
                    <div className="flex flex-col items-center gap-4">
                        {job.status === "IN_PROGRESS" && (
                            <>
                                <div className="text-xs font-semibold uppercase tracking-widest text-primary">Chronomètre</div>
                                <ElapsedTimer startedAt={job.startedAt} />
                            </>
                        )}

                        {job.status === "COMPLETED" && totalDuration !== null && (
                            <div className="text-center">
                                <div className="text-xs font-semibold uppercase tracking-widest text-green-600 dark:text-green-400 mb-1">Durée réelle</div>
                                <div className="text-3xl font-bold tabular-nums">
                                    {Math.floor(totalDuration / 60)}h{String(totalDuration % 60).padStart(2, "0")}
                                </div>
                            </div>
                        )}

                        <div className="flex gap-3 w-full max-w-xs">
                            {job.status !== "IN_PROGRESS" && job.status !== "COMPLETED" && (
                                <Button
                                    onClick={handleStart}
                                    disabled={loading === "start"}
                                    className="flex-1 h-12 rounded-xl gap-2 bg-primary text-primary-foreground font-semibold text-base"
                                >
                                    <Play size={18} />
                                    Commencer
                                </Button>
                            )}
                            {job.status === "IN_PROGRESS" && (
                                <Button
                                    onClick={handleComplete}
                                    disabled={loading === "complete"}
                                    className="flex-1 h-12 rounded-xl gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-base"
                                >
                                    <CheckCircle2 size={18} />
                                    Terminer la job
                                </Button>
                            )}
                            {job.status === "COMPLETED" && (
                                <div className="flex-1 flex items-center justify-center gap-2 text-green-600 dark:text-green-400 font-semibold">
                                    <CheckCircle2 size={20} />
                                    Job terminée
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <Car size={13} /> Véhicule
                        </div>
                        <div className="font-semibold text-sm">
                            {job.vehicle ? `${job.vehicle.make} ${job.vehicle.model}` : "—"}
                        </div>
                        {job.vehicle?.year && <div className="text-xs text-muted-foreground">{job.vehicle.year}</div>}
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                            <DollarSign size={13} /> Prix total
                        </div>
                        <div className="font-semibold text-sm">
                            {job.totalPrice ? `${job.totalPrice.toFixed(2)} $` : "—"}
                        </div>
                    </CardContent>
                </Card>

                <Card className="col-span-2">
                    <CardContent className="pt-4 pb-3">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Users size={13} /> Employé(s)
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {job.employees?.length > 0
                                ? job.employees.map((e: any) => (
                                    <span key={e.id} className="text-sm font-medium bg-muted px-2 py-1 rounded-lg">
                                        {e.user?.name}
                                    </span>
                                ))
                                : <span className="text-sm text-muted-foreground">Aucun employé assigné</span>
                            }
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Services */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Services</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                    {job.services?.map((js: any) => (
                        <div key={js.serviceId} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                            <div>
                                <div className="font-medium text-sm">{js.service?.name}</div>
                                <div className="text-xs text-muted-foreground">{js.service?.durationMin} min</div>
                            </div>
                            <div className="text-sm font-semibold">{js.service?.basePrice?.toFixed(2)} $</div>
                        </div>
                    ))}
                    {job.customServiceName && (
                        <div className="flex items-center justify-between py-2">
                            <div className="font-medium text-sm text-primary">{job.customServiceName}</div>
                            <div className="text-sm font-semibold">{job.customServicePrice?.toFixed(2)} $</div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Adresse */}
            {job.client?.address && (
                <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.client.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                >
                    <Card className="hover:bg-muted/50 transition-colors border-dashed cursor-pointer">
                        <CardContent className="pt-4 pb-3 flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-2.5">
                                <MapPin size={18} className="text-primary" />
                            </div>
                            <div>
                                <div className="text-xs text-muted-foreground">Adresse client</div>
                                <div className="font-medium text-sm">{job.client.address}</div>
                                <div className="text-xs text-primary mt-0.5">Ouvrir dans Google Maps →</div>
                            </div>
                        </CardContent>
                    </Card>
                </a>
            )}

            {/* Photos Avant */}
            <PhotoSection
                title="Photos AVANT"
                photos={beforePreview}
                type="before"
                onUpload={(e) => handlePhotoUpload(e, "before")}
                onRemove={(url) => handleRemovePhoto("before", url)}
            />

            {/* Photos Après */}
            <PhotoSection
                title="Photos APRÈS"
                photos={afterPreview}
                type="after"
                onUpload={(e) => handlePhotoUpload(e, "after")}
                onRemove={(url) => handleRemovePhoto("after", url)}
            />

            {job.notes && (
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Notes de réservation</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <p className="text-sm">{job.notes}</p>
                    </CardContent>
                </Card>
            )}

            {/* Internal Notes Timeline */}
            <JobNotesTimeline jobId={job.id} initialNotes={job.internalNotes || []} />
        </div>
    )
}

function PhotoSection({
    title, photos, type, onUpload, onRemove
}: {
    title: string
    photos: string[]
    type: "before" | "after"
    onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
    onRemove: (url: string) => void
}) {
    const id = `photo-upload-${type}`
    const accent = type === "before" ? "border-orange-400/40 bg-orange-500/5" : "border-green-400/40 bg-green-500/5"
    const labelColor = type === "before" ? "text-orange-600 dark:text-orange-400" : "text-green-600 dark:text-green-400"

    return (
        <Card className={`border ${accent}`}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className={`text-sm font-bold uppercase tracking-wider ${labelColor}`}>
                        <Camera size={14} className="inline mr-1.5" />
                        {title}
                    </CardTitle>
                    <label htmlFor={id} className="cursor-pointer">
                        <Button size="sm" variant="outline" className="h-8 gap-1.5 rounded-xl pointer-events-none">
                            <Upload size={13} /> Ajouter
                        </Button>
                        <input
                            id={id}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            capture="environment"
                            className="sr-only"
                            onChange={onUpload}
                        />
                    </label>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {photos.length === 0 ? (
                    <label htmlFor={id} className="cursor-pointer block">
                        <div className="rounded-xl border-2 border-dashed border-border/60 py-8 text-center text-muted-foreground hover:bg-muted/30 transition-colors">
                            <Camera size={28} className="mx-auto mb-2 opacity-40" />
                            <p className="text-sm">Appuyez pour prendre une photo ou choisir depuis la galerie</p>
                        </div>
                    </label>
                ) : (
                    <div className="grid grid-cols-3 gap-2">
                        {photos.map((url, i) => (
                            <div key={i} className="relative group aspect-square">
                                <img
                                    src={url}
                                    alt={`${type} ${i + 1}`}
                                    className="w-full h-full object-cover rounded-lg"
                                />
                                <button
                                    onClick={() => onRemove(url)}
                                    className="absolute top-1 right-1 bg-black/60 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <X size={12} className="text-white" />
                                </button>
                            </div>
                        ))}
                        <label htmlFor={id} className="cursor-pointer aspect-square flex items-center justify-center rounded-lg border-2 border-dashed border-border/60 hover:bg-muted/30 transition-colors">
                            <Upload size={20} className="text-muted-foreground" />
                        </label>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
