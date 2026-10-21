import { OfflineManager, type LngLatBounds, type OfflinePack } from '@maplibre/maplibre-react-native';
import type { Pays } from '@/data/pays';

// Cartes OpenStreetMap via OpenFreeMap (gratuit, sans compte ni clé). Les zones téléchargées
// sont stockées par MapLibre sur le téléphone : la carte fonctionne ensuite sans Internet.
export const STYLE_CARTE = 'https://tiles.openfreemap.org/styles/liberty';

/** Vue d'ensemble de chaque pays : zoom limité pour rester léger (routes, villes, relief). */
const PAYS_CARTE: Record<Pays['code'], { bounds: LngLatBounds; zoomMax: number; centre: [number, number] }> = {
  CH: { bounds: [5.95, 45.81, 10.5, 47.81], zoomMax: 12, centre: [8.23, 46.8] },
  LI: { bounds: [9.47, 47.04, 9.64, 47.28], zoomMax: 14, centre: [9.55, 47.16] },
  AT: { bounds: [9.53, 46.37, 17.17, 49.02], zoomMax: 11, centre: [13.33, 47.6] },
  FR: { bounds: [-5.2, 41.3, 9.6, 51.1], zoomMax: 10, centre: [2.4, 46.6] },
  DE: { bounds: [5.86, 47.27, 15.05, 55.06], zoomMax: 10, centre: [10.4, 51.1] },
  IT: { bounds: [6.6, 36.6, 18.6, 47.1], zoomMax: 10, centre: [12.5, 42.8] },
};

export const centrePays = (code: Pays['code']) => PAYS_CARTE[code].centre;

export type Zone = { nom: string; bounds: LngLatBounds; zoomMin: number; zoomMax: number; type: 'pays' | 'zone' };

export const zonePays = (p: Pays): Zone => ({ nom: `${p.nom} (vue d’ensemble)`, bounds: PAYS_CARTE[p.code].bounds, zoomMin: 0, zoomMax: PAYS_CARTE[p.code].zoomMax, type: 'pays' });

/** Carré d'environ `rayonKm` autour d'un point, avec les rues en détail. */
export function zoneAutour(nom: string, lat: number, lon: number, rayonKm = 15): Zone {
  const dLat = rayonKm / 111;
  const dLon = rayonKm / (111 * Math.cos((lat * Math.PI) / 180));
  return { nom, bounds: [lon - dLon, lat - dLat, lon + dLon, lat + dLat], zoomMin: 8, zoomMax: 15, type: 'zone' };
}

// Estimation de taille : nombre de tuiles × poids moyen d'une tuile vectorielle (≈ 30 Ko).
const tuilesX = (lon: number, z: number) => Math.floor(((lon + 180) / 360) * 2 ** z);
const tuilesY = (lat: number, z: number) => {
  const r = (lat * Math.PI) / 180;
  return Math.floor(((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z);
};
export function nombreTuiles(z: Zone) {
  const [o, s, e, n] = z.bounds;
  let total = 0;
  for (let k = z.zoomMin; k <= z.zoomMax; k++) total += (tuilesX(e, k) - tuilesX(o, k) + 1) * (tuilesY(s, k) - tuilesY(n, k) + 1);
  return total;
}
export const tailleEstimee = (z: Zone) => nombreTuiles(z) * 30 * 1024;

export type InfosPack = { id: string; nom: string; type: string; taille: number; pourcentage: number; termine: boolean };

export async function packs(): Promise<InfosPack[]> {
  const liste = await OfflineManager.getPacks();
  return Promise.all(
    liste.map(async (p: OfflinePack) => {
      const s = await p.status();
      return {
        id: p.id,
        nom: String(p.metadata?.nom ?? 'Zone'),
        type: String(p.metadata?.type ?? 'zone'),
        taille: s.completedResourceSize,
        pourcentage: s.percentage,
        termine: s.state === 'complete',
      };
    }),
  );
}

export async function telechargerZone(z: Zone, onProgres: (pourcentage: number) => void) {
  OfflineManager.setTileCountLimit(200_000); // la limite par défaut (6 000 tuiles) est trop basse pour un pays
  return new Promise<void>((resolve, reject) => {
    OfflineManager.createPack(
      { mapStyle: STYLE_CARTE, bounds: z.bounds, minZoom: z.zoomMin, maxZoom: z.zoomMax, metadata: { nom: z.nom, type: z.type } },
      (_pack, s) => {
        onProgres(s.percentage);
        if (s.state === 'complete') resolve();
      },
      (_pack, e) => reject(new Error(e.message)),
    ).catch(reject);
  });
}

export const supprimerZone = (id: string) => OfflineManager.deletePack(id);

export async function cartesPretes() {
  try {
    return (await packs()).some((p) => p.termine);
  } catch {
    return false;
  }
}
