export function pointInPolygon(point: [number, number], vs: [number, number][]) {
    // ray-casting algorithm based on
    // https://github.com/substack/point-in-polygon
    let x = point[0], y = point[1];
    let inside = false;
    for (let i = 0, j = vs.length - 1; i < vs.length; j = i++) {
        let xi = vs[i][0], yi = vs[i][1];
        let xj = vs[j][0], yj = vs[j][1];
        let intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

export function getZoneFromLocation(lat?: number | null, lng?: number | null, geoJson?: any) {
    if (!lat || !lng || !geoJson || geoJson.type !== "FeatureCollection") return null;
    
    // geoJson coordinates are [lng, lat]
    for (const feature of geoJson.features) {
        if (feature.geometry?.type === "Polygon") {
            const rings = feature.geometry.coordinates;
            if (rings.length > 0) {
                const exteriorRing = rings[0];
                if (pointInPolygon([lng, lat], exteriorRing)) {
                    return feature;
                }
            }
        }
    }
    return null;
}
