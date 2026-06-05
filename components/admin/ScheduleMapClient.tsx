"use client"

import { useEffect, useRef } from "react"
import { localDateKey, localHour, localMinute } from "@/lib/date-local"
import { jobDurationMinutes } from "@/lib/job-metrics"
import { formatJobPrice } from "@/lib/job-display"
import { useRouter } from "next/navigation"

export function ScheduleMapClient({ jobs, selectedDayKey }: { jobs: any[]; selectedDayKey: string }) {
    const mapRef = useRef<HTMLDivElement>(null)
    const mapInstance = useRef<any>(null)
    const router = useRouter()

    useEffect(() => {
        if (!mapRef.current) return
        
        let L: any;
        if (typeof window !== 'undefined') {
            L = require("leaflet")
            require("leaflet/dist/leaflet.css")
        }
        
        if (!L) return

        // Initialize map
        if (!mapInstance.current) {
            // Default center: Montreal
            mapInstance.current = L.map(mapRef.current).setView([45.5017, -73.5673], 10)
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
            }).addTo(mapInstance.current)

            // Fix icon issues in Next.js
            delete L.Icon.Default.prototype._getIconUrl;
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            });
        }

        const map = mapInstance.current

        // Clear existing markers
        map.eachLayer((layer: any) => {
            if (layer instanceof L.Marker || layer instanceof L.Polyline) {
                map.removeLayer(layer)
            }
        })

        // Filter jobs for selected day and that are mobile with coordinates
        const dayJobs = jobs
            .filter((j: any) => localDateKey(j.scheduledDate) === selectedDayKey && !j.isInShop && j.client?.latitude && j.client?.longitude)
            .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime())

        if (dayJobs.length === 0) return

        const latlngs: [number, number][] = []
        const bounds = L.latLngBounds()

        dayJobs.forEach((job: any, index: number) => {
            const lat = job.client.latitude
            const lng = job.client.longitude
            latlngs.push([lat, lng])
            bounds.extend([lat, lng])

            const d = new Date(job.scheduledDate)
            const timeStr = `${localHour(d)}h${String(localMinute(d)).padStart(2, "0")}`
            const clientName = job.client?.user?.name || "Client"
            const address = job.client?.address || ""

            // Custom icon with order number
            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: #3b82f6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            })

            const marker = L.marker([lat, lng], { icon }).addTo(map)
            
            marker.bindPopup(`
                <div style="font-family: inherit;">
                    <div style="font-weight: 900; font-size: 14px; margin-bottom: 4px;">#${index + 1} - ${clientName}</div>
                    <div style="color: #64748b; font-size: 12px; margin-bottom: 4px;">⏰ ${timeStr}</div>
                    <div style="color: #64748b; font-size: 11px; margin-bottom: 8px;">📍 ${address}</div>
                    <a href="/admin/job/${job.id}" style="color: #3b82f6; text-decoration: none; font-size: 12px; font-weight: 600;">Voir détails &rarr;</a>
                </div>
            `)
        })

        // Draw path connecting jobs in order
        if (latlngs.length > 1) {
            L.polyline(latlngs, {
                color: '#3b82f6',
                weight: 3,
                opacity: 0.7,
                dashArray: '5, 10'
            }).addTo(map)
        }

        // Fit map to markers
        if (latlngs.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] })
        }

    }, [jobs, selectedDayKey])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove()
                mapInstance.current = null
            }
        }
    }, [])

    return (
        <div className="relative w-full h-[600px] rounded-xl overflow-hidden border shadow-sm">
            <div ref={mapRef} className="w-full h-full z-0" />
        </div>
    )
}
