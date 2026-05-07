export const TANZA_BBOX = {
  minLat: 14.30,
  maxLat: 14.42,
  minLng: 120.82,
  maxLng: 120.95,
} as const;

export function isInsideTanza(lng: number, lat: number): boolean {
  return (
    lat >= TANZA_BBOX.minLat &&
    lat <= TANZA_BBOX.maxLat &&
    lng >= TANZA_BBOX.minLng &&
    lng <= TANZA_BBOX.maxLng
  );
}

export interface TanzaScopeResult {
  isInsideTanza: boolean;
  outsideScopeFlag: boolean;
}

export function tanzaScope(lng: number, lat: number): TanzaScopeResult {
  const inside = isInsideTanza(lng, lat);
  return { isInsideTanza: inside, outsideScopeFlag: !inside };
}
