const R = 6371000;
const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

/** Distance en mètres entre deux points (formule de haversine). */
export function distance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const dLat = rad(lat2 - lat1);
  const dLon = rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Cap en degrés (0 = nord) pour aller du point 1 au point 2. */
export function cap(lat1: number, lon1: number, lat2: number, lon2: number) {
  const y = Math.sin(rad(lon2 - lon1)) * Math.cos(rad(lat2));
  const x =
    Math.cos(rad(lat1)) * Math.sin(rad(lat2)) - Math.sin(rad(lat1)) * Math.cos(rad(lat2)) * Math.cos(rad(lon2 - lon1));
  return (deg(Math.atan2(y, x)) + 360) % 360;
}

export function formatDistance(m: number) {
  return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(m < 10000 ? 2 : 1)} km`;
}

const POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SO', 'O', 'NO'];
export const pointCardinal = (d: number) => POINTS[Math.round(d / 45) % 8];

/** Coordonnées en degrés-minutes-secondes, le format des cartes papier. */
export function dms(v: number, lat: boolean) {
  const h = lat ? (v >= 0 ? 'N' : 'S') : v >= 0 ? 'E' : 'O';
  const a = Math.abs(v);
  const d = Math.floor(a);
  const m = Math.floor((a - d) * 60);
  const s = ((a - d - m / 60) * 3600).toFixed(1);
  return `${d}°${m}′${s}″${h}`;
}

/** Accepte "48.8566, 2.3522" ou "48,8566 2,3522". */
export function parseCoords(txt: string): { lat: number; lon: number } | null {
  const nums = txt.match(/-?\d+(?:[.,]\d+)?/g);
  if (!nums || nums.length < 2) return null;
  const [lat, lon] = nums.slice(0, 2).map((n) => parseFloat(n.replace(',', '.')));
  if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat, lon };
}

/** Lien geo: que les applis de cartes hors ligne (Organic Maps, OsmAnd...) savent ouvrir. */
export const geoUri = (lat: number, lon: number, label: string) =>
  `geo:${lat},${lon}?q=${lat},${lon}(${encodeURIComponent(label)})`;
