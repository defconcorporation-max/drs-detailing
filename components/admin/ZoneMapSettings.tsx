"use client"

import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { updateServiceZones } from "@/lib/actions/settings"
import { Loader2, MapPin, Save } from "lucide-react"

type Props = {
    initialGeoJson: any | null
}

const PRESET_COLORS = [
    "#3b82f6", // Blue
    "#ef4444", // Red
    "#10b981", // Green
    "#f59e0b", // Yellow/Amber
    "#8b5cf6", // Purple
    "#ec4899", // Pink
    "#14b8a6", // Teal
]

export function ZoneMapSettings({ initialGeoJson }: Props) {
    const mapContainerRef = useRef<HTMLDivElement>(null)
    const mapRef = useRef<any>(null)
    const [loading, setLoading] = useState(false)
    const [selectedFeatureLayer, setSelectedFeatureLayer] = useState<any>(null)
    const [zoneName, setZoneName] = useState("")
    const [zoneColor, setZoneColor] = useState(PRESET_COLORS[0])
    
    // We store feature layers drawn on the map
    const drawnItems = useRef<any>(null)

    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return

        const initMap = async () => {
            const L = (await import("leaflet")).default
            await import("@geoman-io/leaflet-geoman-free")

            if (!document.getElementById("leaflet-css")) {
                const link = document.createElement("link")
                link.id = "leaflet-css"
                link.rel = "stylesheet"
                link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
                document.head.appendChild(link)
            }
            if (!document.getElementById("geoman-css")) {
                const link = document.createElement("link")
                link.id = "geoman-css"
                link.rel = "stylesheet"
                link.href = "https://unpkg.com/@geoman-io/leaflet-geoman-free@2.14.2/dist/leaflet-geoman.css"
                document.head.appendChild(link)
            }

            delete (L.Icon.Default.prototype as any)._getIconUrl
            L.Icon.Default.mergeOptions({
                iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
            })

            const map = L.map(mapContainerRef.current!, {
                center: [45.55, -73.65], // Center around Montreal
                zoom: 10,
            })
            mapRef.current = map

            L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '© OpenStreetMap',
            }).addTo(map)

            drawnItems.current = L.featureGroup().addTo(map)

            // Setup Geoman controls
            map.pm.addControls({
                position: 'topleft',
                drawMarker: false,
                drawCircleMarker: false,
                drawPolyline: false,
                drawRectangle: true,
                drawPolygon: true,
                drawCircle: false,
                editMode: true,
                dragMode: true,
                cutPolygon: false,
                removalMode: true,
            })

            // Load initial GeoJson
            if (initialGeoJson && initialGeoJson.features) {
                L.geoJSON(initialGeoJson, {
                    style: (feature: any) => ({
                        color: feature?.properties?.color || "#3b82f6",
                        fillColor: feature?.properties?.color || "#3b82f6",
                        fillOpacity: 0.4,
                        weight: 2
                    }),
                    onEachFeature: (feature: any, layer: any) => {
                        // Store properties directly on the layer for easy editing
                        layer.feature = feature;
                        drawnItems.current.addLayer(layer)
                        
                        layer.on('click', () => {
                            setSelectedFeatureLayer(layer)
                            setZoneName(layer.feature?.properties?.name || "")
                            setZoneColor(layer.feature?.properties?.color || PRESET_COLORS[0])
                        })
                    }
                })
                if (drawnItems.current.getLayers().length > 0) {
                    map.fitBounds(drawnItems.current.getBounds())
                }
            }

            // Map creation events
            map.on('pm:create', (e: any) => {
                const layer = e.layer;
                layer.feature = layer.feature || { type: 'Feature', properties: {} }
                layer.feature.properties.name = "Nouvelle zone"
                layer.feature.properties.color = PRESET_COLORS[0]
                
                layer.setStyle({
                    color: layer.feature.properties.color,
                    fillColor: layer.feature.properties.color,
                    fillOpacity: 0.4,
                    weight: 2
                })

                drawnItems.current.addLayer(layer)
                
                layer.on('click', () => {
                    setSelectedFeatureLayer(layer)
                    setZoneName(layer.feature.properties.name)
                    setZoneColor(layer.feature.properties.color)
                })

                setSelectedFeatureLayer(layer)
                setZoneName("Nouvelle zone")
                setZoneColor(PRESET_COLORS[0])
            })
            
            map.on('pm:remove', (e: any) => {
                if (selectedFeatureLayer === e.layer) {
                    setSelectedFeatureLayer(null)
                }
                drawnItems.current.removeLayer(e.layer)
            })
        }

        initMap()
    }, [initialGeoJson, selectedFeatureLayer])

    const handleSaveZoneProperties = () => {
        if (!selectedFeatureLayer) return
        selectedFeatureLayer.feature.properties.name = zoneName
        selectedFeatureLayer.feature.properties.color = zoneColor
        selectedFeatureLayer.setStyle({
            color: zoneColor,
            fillColor: zoneColor,
            fillOpacity: 0.4,
            weight: 2
        })
        toast.success("Propriétés de la zone appliquées sur la carte")
    }

    const handleSaveToDB = async () => {
        if (!drawnItems.current) return
        setLoading(true)
        try {
            const geoJson = drawnItems.current.toGeoJSON()
            const res = await updateServiceZones(JSON.stringify(geoJson))
            if (res.error) toast.error(res.error)
            else toast.success("Carte des zones sauvegardée avec succès !")
        } catch (e) {
            toast.error("Erreur inattendue")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold">Zones de Service (Carte)</h3>
                    <p className="text-sm text-muted-foreground">
                        Dessinez des polygones pour délimiter vos zones. Les rendez-vous prendront automatiquement la couleur de leur zone d'appartenance.
                    </p>
                </div>
                <Button onClick={handleSaveToDB} disabled={loading} className="gap-2">
                    {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                    Sauvegarder la carte
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 h-[600px] rounded-xl overflow-hidden border">
                    <div ref={mapContainerRef} className="w-full h-full" />
                </div>
                
                <div className="bg-muted/30 border rounded-xl p-4 flex flex-col gap-4">
                    <h4 className="font-semibold text-sm">Zone Sélectionnée</h4>
                    {selectedFeatureLayer ? (
                        <div className="space-y-4 flex-1">
                            <div className="space-y-2">
                                <Label>Nom de la zone</Label>
                                <Input 
                                    value={zoneName} 
                                    onChange={(e) => setZoneName(e.target.value)} 
                                    placeholder="Ex: Rive-Nord"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Couleur</Label>
                                <div className="flex flex-wrap gap-2">
                                    {PRESET_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setZoneColor(c)}
                                            className={`size-8 rounded-full border-2 transition-all ${zoneColor === c ? 'ring-2 ring-primary ring-offset-2' : 'border-transparent'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                                <div className="mt-2 flex items-center gap-2">
                                    <Input 
                                        type="color" 
                                        value={zoneColor} 
                                        onChange={(e) => setZoneColor(e.target.value)}
                                        className="h-10 w-20 p-1"
                                    />
                                    <span className="text-xs uppercase text-muted-foreground">{zoneColor}</span>
                                </div>
                            </div>
                            <Button className="w-full mt-2" onClick={handleSaveZoneProperties} variant="secondary">
                                Appliquer à la sélection
                            </Button>
                            
                            <p className="text-xs text-muted-foreground mt-4">
                                Utilisez la corbeille sur la carte pour supprimer la zone sélectionnée. N'oubliez pas de "Sauvegarder la carte" après vos modifications.
                            </p>
                        </div>
                    ) : (
                        <div className="text-sm text-muted-foreground flex flex-col items-center justify-center text-center h-full gap-2 opacity-60">
                            <MapPin className="size-8" />
                            Cliquez sur une zone existante sur la carte ou dessinez-en une nouvelle pour modifier ses propriétés.
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
