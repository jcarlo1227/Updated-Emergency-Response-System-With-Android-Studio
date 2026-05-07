export const TANZA_BBOX = {
    minLat: 14.30,
    maxLat: 14.42,
    minLng: 120.82,
    maxLng: 120.95,
};
export function isInsideTanza(lng, lat) {
    return (lat >= TANZA_BBOX.minLat &&
        lat <= TANZA_BBOX.maxLat &&
        lng >= TANZA_BBOX.minLng &&
        lng <= TANZA_BBOX.maxLng);
}
export function tanzaScope(lng, lat) {
    const inside = isInsideTanza(lng, lat);
    return { isInsideTanza: inside, outsideScopeFlag: !inside };
}
