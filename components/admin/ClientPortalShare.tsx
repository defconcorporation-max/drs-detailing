"use client"

import { Button } from "@/components/ui/button"
import { ExternalLink, Copy, Check, Save } from "lucide-react"
import { useState } from "react"
import Link from "next/link"

export function ClientPortalShare({ url }: { url: string }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(url)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                    <Save size={20} className="stroke-2" />
                </div>
                <div>
                    <div className="font-semibold text-blue-900">Portail Client (Magic Link)</div>
                    <div className="text-sm text-blue-700">Partagez ce lien pour un accès direct sans mot de passe.</div>
                </div>
            </div>
            <div className="flex items-center gap-2 w-full md:w-auto overflow-hidden">
                <div className="bg-white px-3 py-2 rounded border border-blue-200 text-xs font-mono text-muted-foreground select-all flex-1 md:flex-none truncate max-w-[300px] overflow-hidden text-ellipsis whitespace-nowrap">
                    {url}
                </div>
                <Button size="sm" variant="outline" className="gap-2 shrink-0" onClick={handleCopy}>
                    {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                    {copied ? "Copié!" : "Copier"}
                </Button>
                <Link href={url} target="_blank">
                    <Button size="sm" className="gap-2 shrink-0">
                        <ExternalLink size={14} />
                        Ouvrir
                    </Button>
                </Link>
            </div>
        </div>
    )
}
