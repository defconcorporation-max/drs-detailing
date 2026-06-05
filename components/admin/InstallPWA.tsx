"use client"

import { useState, useEffect } from "react"
import { Download } from "lucide-react"

export function InstallPWA({ variant = "sidebar" }: { variant?: "sidebar" | "mobile" }) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
    const [isInstallable, setIsInstallable] = useState(false)

    useEffect(() => {
        // Enregistrer le Service Worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW registration failed:', err))
        }

        // Écouter l'événement d'installation
        const handler = (e: any) => {
            e.preventDefault()
            setDeferredPrompt(e)
            setIsInstallable(true)
        }

        window.addEventListener('beforeinstallprompt', handler)
        return () => window.removeEventListener('beforeinstallprompt', handler)
    }, [])

    const handleInstallClick = async () => {
        if (!deferredPrompt) return
        deferredPrompt.prompt()
        const { outcome } = await deferredPrompt.userChoice
        if (outcome === 'accepted') {
            setIsInstallable(false)
        }
        setDeferredPrompt(null)
    }

    if (!isInstallable) return null

    if (variant === "mobile") {
        return (
            <button
                onClick={handleInstallClick}
                className="flex w-full items-center gap-3 rounded-xl bg-primary/10 px-3 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/20 mt-2"
            >
                <Download size={18} />
                <span>Installer l'Application</span>
            </button>
        )
    }

    return (
        <button
            onClick={handleInstallClick}
            className="group flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold text-primary outline-none transition-all duration-200 hover:bg-primary hover:text-primary-foreground mt-4 border border-primary/20 bg-primary/5"
        >
            <Download size={18} className="transition-colors group-hover:text-primary-foreground" />
            <span>Installer l'App</span>
        </button>
    )
}
