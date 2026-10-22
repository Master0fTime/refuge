import type { IconName } from '@/components/ui';
import { estInstalle, modeleConseille, MODELES, type Telechargeable } from '@/lib/ia/modeles';
import { cartesPretes } from '@/lib/cartes';
import { encyclopedieInstallee, packEncyclopedie } from '@/lib/encyclopedie';
import { voixConseillee, voixInstallee } from '@/lib/voix';

// Tout ce qu'il faut télécharger UNE FOIS, tant qu'Internet fonctionne, pour que l'appli soit complète hors ligne.

export type Pack = {
  id: 'fiches' | 'ia' | 'voix' | 'encyclopedie' | 'cartes';
  nom: string;
  icone: IconName;
  utilite: string;
  /** Fichier à télécharger ; absent = déjà inclus dans l'appli ou pas encore disponible. */
  fichier?: Telechargeable;
  disponible: boolean;
};

export function packs(): Pack[] {
  const ia = modeleConseille();
  return [
    {
      id: 'fiches',
      nom: 'Fiches de survie',
      icone: 'book',
      utilite: 'Urgences vitales, eau, feu, abri, nourriture, sécurité… Déjà incluses dans l’appli.',
      disponible: true,
    },
    {
      id: 'ia',
      nom: 'Assistant IA hors ligne',
      icone: 'hardware-chip',
      utilite: 'Comprend ta situation et t’aide à décider quoi faire, même sans réseau.',
      fichier: ia ?? undefined,
      disponible: !!ia,
    },
    {
      id: 'voix',
      nom: 'Commande vocale',
      icone: 'mic',
      utilite: 'Parler à l’IA au lieu d’écrire : plus rapide, et utilisable les mains occupées.',
      fichier: voixConseillee(),
      disponible: true,
    },
    {
      id: 'encyclopedie',
      nom: 'Encyclopédie hors ligne',
      icone: 'library',
      utilite: 'Wikipédia médecine : maladies, symptômes, traitements, premiers secours. L’IA s’en sert pour mieux expliquer.',
      fichier: packEncyclopedie(),
      disponible: true,
    },
    {
      id: 'cartes',
      nom: 'Cartes hors ligne',
      icone: 'map',
      utilite: 'Ton pays en vue d’ensemble, puis ta zone en détail : te repérer et rejoindre tes points sans réseau.',
      disponible: true,
    },
  ];
}

/** Un pack est prêt si un fichier équivalent est déjà là (ex. un autre modèle IA déjà installé convient). */
export async function packPret(p: Pack): Promise<boolean> {
  if (p.id === 'fiches') return true;
  if (p.id === 'ia') {
    for (const m of MODELES) if (await estInstalle(m)) return true;
    return false;
  }
  if (p.id === 'voix') return (await voixInstallee()) !== null;
  if (p.id === 'cartes') return cartesPretes();
  if (p.id === 'encyclopedie') return encyclopedieInstallee();
  return false;
}

export async function telephonePret() {
  const r = await Promise.all(packs().filter((p) => p.disponible).map(packPret));
  return r.every(Boolean);
}
