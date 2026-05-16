"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MapPin, DollarSign, Car, TrendingUp, Users } from "lucide-react"
import Link from "next/link"

type ClientPin = {
    id: string
    name: string
    address: string
    lat: number
    lng: number
    totalSpent: number
    jobCount: number
    cityColor?: string
}

type Props = {
    clients: ClientPin[]
    cityColors: Record<string, string>
}

export function ClientMapLeaflet({ clients, cityColors }: Props) {
    const mapRef = useRef<HTMLDivElement>(null)
    const leafletMap = useRef<any>(null)
    const [selected, setSelected] = useState<ClientPin | null>(null)
    const [initialized, setInitialized] = useState(false)

    // Get city color based on address
    const getCityColor = (address: string) => {
        for (const [city, color] of Object.entries(cityColors)) {
            if (address.toLowerCase().includes(city.toLowerCase())) return color
        }
        return "#3b82f6" // default blue
    }

    useEffect(() => {
        if (!mapRef.current || initialized) return

        // Dynamic import of Leaflet (client-side only)
        const initMap = async () => {
            const L = (await import("leaflet")).default

            // Inject leaflet CSS if not already present
            if (!document.getElementById("leaflet-css")) {
                const link = document.createElement("link")
                link.id = "leaflet-css"
                link.rel = "stylesheet"
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                document.head.appendChild(link)
            }

            // Fix default icon issue
            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            })

            // Center on Montréal region
            const map = L.map(mapRef.current!, {
                center: [45.55, -73.65],
                zoom: 11,
                zoomControl: true,
            })

            // OpenStreetMap tiles (no API key needed)
            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            }).addTo(map)

            // Add markers for each client
            for (const client of clients) {
                const color = getCityColor(client.address)

                // Custom colored marker
                const icon = L.divIcon({
                    className: "",
                    html: `
                        <div style="
                            width: 32px; height: 32px;
                            background: ${color};
                            border-radius: 50% 50% 50% 0;
                            transform: rotate(-45deg);
                            border: 2px solid white;
                            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                            display: flex; align-items: center; justify-content: center;
                        ">
                            <div style="
                                transform: rotate(45deg);
                                color: white;
                                font-size: 12px;
                                font-weight: bold;
                                line-height: 1;
                            ">$</div>
                        </div>
                    `,
                    iconSize: [32, 32],
                    iconAnchor: [16, 32],
                    popupAnchor: [0, -36],
                })

                const marker = L.marker([client.lat, client.lng], { icon })

                marker.bindPopup(`
                    <div style="font-family: system-ui; min-width: 180px;">
                        <div style="font-weight: bold; font-size: 14px; margin-bottom: 4px;">${client.name}</div>
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 8px;">${client.address}</div>
                        <div style="display: flex; gap: 12px; font-size: 12px;">
                            <span><strong>${client.totalSpent.toFixed(0)}$</strong> dépensé</span>
                            <span><strong>${client.jobCount}</strong> jobs</span>
                        </div>
                        <a href="/admin/clients/${client.id}" style="display: block; margin-top: 8px; font-size: 12px; color: #3b82f6;">Voir le dossier →</a>
                    </div>
                `)

                marker.on("click", () => setSelected(client))
                marker.addTo(map)
            }

            leafletMap.current = map
            setInitialized(true)
        }

        initMap()
    }, [clients, initialized, cityColors])

    // Stats
    const topClients = [...clients].sort((a, b) => b.totalSpent - a.totalSpent).slice(0, 5)
    const totalRevenue = clients.reduce((s, c) => s + c.totalSpent, 0)

    return (
        <div className="space-y-4">
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-3">
                <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                        <div className="text-2xl font-bold">{clients.length}</div>
                        <div className="text-xs text-muted-foreground">Clients mappés</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                        <div className="text-2xl font-bold">{totalRevenue.toFixed(0)}$</div>
                        <div className="text-xs text-muted-foreground">Revenus totaux</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4 pb-3 text-center">
                        <div className="text-2xl font-bold">
                            {clients.reduce((s, c) => s + c.jobCount, 0)}
                        </div>
                        <div className="text-xs text-muted-foreground">Jobs totaux</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Map */}
                <div className="lg:col-span-2">
                    <Card className="overflow-hidden">
                        <div
                            ref={mapRef}
                            className="w-full"
                            style={{ height: "500px" }}
                        />
                        {clients.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                                <div className="text-center text-muted-foreground">
                                    <MapPin size={40} className="mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">Aucun client avec adresse géocodée</p>
                                </div>
                            </div>
                        )}
                    </Card>
                    {Object.keys(cityColors).length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2 px-1">
                            {Object.entries(cityColors).map(([city, color]) => (
                                <span
                                    key={city}
                                    className="text-xs px-2 py-0.5 rounded-full font-medium"
                                    style={{ background: color + "22", color, border: `1px solid ${color}66` }}
                                >
                                    {city}
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                {/* Sidebar: Top clients */}
                <div className="space-y-3">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                        Top Clients
                    </h3>
                    {topClients.map((c, i) => (
                        <Link key={c.id} href={`/admin/clients/${c.id}`}>
                            <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                                <CardContent className="pt-3 pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl font-black text-muted-foreground/40">
                                                {i + 1}
                                            </span>
                                            <div>
                                                <div className="font-semibold text-sm">{c.name}</div>
                                                <div className="text-xs text-muted-foreground truncate max-w-[140px]">
                                                    {c.address}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className="font-bold text-sm text-primary">{c.totalSpent.toFixed(0)}$</div>
                                            <div className="text-xs text-muted-foreground">{c.jobCount} jobs</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}

                    {selected && (
                        <Card className="border-primary/40 bg-primary/5">
                            <CardContent className="pt-3 pb-3">
                                <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Sélectionné</div>
                                <div className="font-bold">{selected.name}</div>
                                <div className="text-xs text-muted-foreground">{selected.address}</div>
                                <div className="mt-2 flex gap-3 text-xs">
                                    <span className="font-semibold">{selected.totalSpent.toFixed(0)}$</span>
                                    <span>{selected.jobCount} jobs</span>
                                </div>
                                <Link href={`/admin/clients/${selected.id}`} className="block mt-2 text-xs text-primary font-semibold">
                                    Voir le dossier →
                                </Link>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
