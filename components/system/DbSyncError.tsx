/**
 * Affiché quand Prisma échoue (souvent : schéma local ≠ base Vercel).
 */
export function DbSyncError({
    title = "Problème de base de données",
    details,
}: {
    title?: string
    details?: string
}) {
    return (
        <div className="mx-auto max-w-lg p-8 rounded-xl border border-amber-500/30 bg-amber-500/5">
            <h1 className="text-lg font-semibold text-foreground">{title}</h1>
            <p className="text-sm text-muted-foreground mt-3 leading-relaxed">
                L&apos;application n&apos;arrive pas à lire la base distante. Vérifiez que la base
                utilisée par Vercel est à jour avec le schéma Prisma : même variable{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">DATABASE_URL</code> que celle
                avec laquelle vous exécutez{" "}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">npx prisma db push</code> (ou
                migrations).
            </p>
            {details && process.env.NODE_ENV === "development" && (
                <pre className="text-xs mt-4 p-3 bg-muted rounded-md overflow-auto max-h-48 text-destructive">
                    {details}
                </pre>
            )}
        </div>
    )
}
