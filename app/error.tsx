"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
            <h1 className="font-display text-2xl font-bold uppercase">Erreur serveur</h1>
            <p className="max-w-lg text-muted-foreground text-sm leading-relaxed">
                Très souvent après un déploiement : la base <strong>Supabase</strong> n’a pas encore le même schéma que le code
                (nouvelles tables / colonnes Prisma). Le build Vercel réussit, mais au chargement la base répond une erreur.
            </p>
            <div className="max-w-lg rounded-xl border border-border/60 bg-muted/30 p-4 text-left text-xs">
                <p className="mb-2 font-semibold">À faire :</p>
                <ol className="list-decimal space-y-1 pl-4">
                    <li>
                        Sur ton PC, avec la <strong>même</strong> <code className="rounded bg-background px-1">DATABASE_URL</code> que
                        dans Vercel :{" "}
                        <code className="rounded bg-background px-1">npx prisma db push</code>
                    </li>
                    <li>
                        Ou dans Supabase → <strong>SQL Editor</strong>, exécute le fichier{" "}
                        <code className="rounded bg-background px-1">prisma/PROD_SYNC.sql</code>
                    </li>
                    <li>
                        Vérifie que <code className="rounded bg-background px-1">DATABASE_URL</code> est définie pour{" "}
                        <strong>Production</strong> et <strong>Preview</strong> sur Vercel.
                    </li>
                </ol>
                {error.digest && (
                    <p className="mt-3 text-muted-foreground">
                        Digest (logs Vercel) : <code>{error.digest}</code>
                    </p>
                )}
            </div>
            <div className="flex gap-2">
                <Button type="button" onClick={() => reset()} className="rounded-xl">
                    Réessayer
                </Button>
                <Button type="button" variant="outline" className="rounded-xl" onClick={() => (window.location.href = "/")}>
                    Accueil
                </Button>
            </div>
        </div>
    )
}
