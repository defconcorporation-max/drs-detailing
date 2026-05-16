export const dynamic = "force-dynamic"

import { getClients } from "@/lib/actions/clients"
import { getCityColors } from "@/lib/actions/settings"
import { ClientMapLeaflet } from "@/components/admin/ClientMapLeaflet"
import { MapPin, AlertCircle } from "lucide-react"

type ClientPin = {
    id: string
    name: string
    address: string
    lat: number
    lng: number
    totalSpent: number
    jobCount: number
}

/** Geocode an address using Nominatim (OpenStreetMap, no API key) */
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
    try {
        const encoded = encodeURIComponent(address + ", Québec, Canada")
        const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encoded}&format=json&limit=1`,
            {
                headers: { "User-Agent": "DRS-Detailing-Software/1.0" },
                next: { revalidate: 86400 }, // Cache 24h
            }
        )
        const data = await res.json()
        if (data && data.length > 0) {
            return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
        }
        return null
    } catch {
        return null
    }
}

export default async function MapPage() {
    const [clients, cityColors] = await Promise.all([
        getClients(),
        getCityColors(),
    ])

    const clientsWithAddress = clients.filter((c: any) => c.clientProfile?.address)

    // Geocode all addresses in parallel (with rate limiting — 1 req at a time to respect Nominatim)
    const pins: ClientPin[] = []
    for (const client of clientsWithAddress) {
        const address = client.clientProfile?.address
        if (!address) continue

        // Use stored lat/lng if available
        let lat = client.clientProfile?.latitude
        let lng = client.clientProfile?.longitude

        if (!lat || !lng) {
            const coords = await geocodeAddress(address)
            if (coords) {
                lat = coords.lat
                lng = coords.lng
            }
        }

        if (lat && lng) {
            const jobs = (client.clientProfile as any)?.jobs || []
            pins.push({
                id: client.id,
                name: client.name || "Client",
                address,
                lat,
                lng,
                totalSpent: jobs.reduce((s: number, j: any) => s + (j.totalPrice || 0), 0),
                jobCount: jobs.length,
            })
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Carte des Clients</h2>
                    <p className="text-muted-foreground text-sm mt-1">
                        {pins.length} client{pins.length !== 1 ? "s" : ""} géolocalisé{pins.length !== 1 ? "s" : ""}
                        {clientsWithAddress.length - pins.length > 0 && (
                            <span className="ml-2 text-amber-600">
                                · {clientsWithAddress.length - pins.length} adresse(s) non géocodée(s)
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {pins.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
                    <MapPin size={48} className="mb-4 opacity-30" />
                    <h3 className="text-lg font-semibold mb-1">Aucun client géolocalisé</h3>
                    <p className="text-sm max-w-sm">
                        Ajoutez des adresses complètes dans les profils clients pour les voir apparaître sur la carte.
                    </p>
                </div>
            ) : (
                <ClientMapLeaflet clients={pins} cityColors={cityColors} />
            )}
        </div>
    )
}
