import type { IconName } from '@/components/ui';
import { estInstalle, FICHIERS_VISION, modeleConseille, MODELES, ramGo, VISION, visionInstallee, type Telechargeable } from '@/lib/ia/modeles';
import { cartesPretes } from '@/lib/cartes';
import { encyclopedieInstallee, packEncyclopedie } from '@/lib/encyclopedie';
import { voixConseillee, voixInstallee } from '@/lib/voix';

// Tout ce qu'il faut télécharger UNE FOIS, tant qu'Internet fonctionne, pour que l'appli soit complète hors ligne.

export type IdPack = 'fiches' | 'ia' | 'voix' | 'encyclopedie' | 'vision' | 'cartes';

export type Pack = {
  id: IdPack;
  nom: string;
  icone: IconName;
  utilite: string;
  /** Fichiers à télécharger ; vide = déjà inclus dans l'appli (fiches) ou géré à part (cartes). */
  fichiers: Telechargeable[];
  disponible: boolean;
  /** Utile mais pas indispensable : ne compte pas pour « kit prêt ». */
  facultatif?: boolean;
};

export function packs(): Pack[] {
  const ia = modeleConseille();
  const ram = ramGo();
  return [
    {
      id: 'fiches',
      nom: 'Fiches de survie',
      icone: 'book',
      utilite: 'Urgences vitales, eau, feu, abri, nourriture, sécurité… Déjà incluses dans l’appli.',
      fichiers: [],
      disponible: true,
    },
    {
      id: 'ia',
      nom: 'Assistant IA hors ligne',
      icone: 'hardware-chip',
      utilite: 'Comprend ta situation et t’aide à décider quoi faire, même sans réseau.',
      fichiers: ia ? [ia] : [],
      disponible: !!ia,
    },
    {
      id: 'voix',
      nom: 'Commande vocale',
      icone: 'mic',
      utilite: 'Parler à l’IA au lieu d’écrire : plus rapide, et utilisable les mains occupées.',
      fichiers: [voixConseillee()],
      disponible: true,
    },
    {
      id: 'encyclopedie',
      nom: 'Encyclopédie hors ligne',
      icone: 'library',
      utilite: 'Wikipédia médecine : maladies, symptômes, traitements, premiers secours. L’IA s’en sert pour mieux expliquer.',
      fichiers: [packEncyclopedie()],
      disponible: true,
    },
    {
      id: 'vision',
      nom: 'Comprendre une photo',
      icone: 'camera',
      utilite: 'Montre une photo à l’IA : lieu, objet, boîte de médicament, plante… Elle dit ce qu’elle voit.',
      fichiers: FICHIERS_VISION,
      // Trop lourde pour les petits téléphones : proposée seulement s'il y a assez de mémoire.
      disponible: ram === null || ram >= VISION.ramMinGo - 0.5,
      facultatif: true,
    },
    {
      id: 'cartes',
      nom: 'Cartes hors ligne',
      icone: 'map',
      utilite: 'Ton pays en vue d’ensemble, puis ta zone en détail : te repérer et rejoindre tes points sans réseau.',
      fichiers: [],
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
  if (p.id === 'vision') return visionInstallee();
  return false;
}

/** Part du kit indispensable déjà installée, de 0 à 1. */
export async function etatKit() {
  const utiles = packs().filter((p) => p.disponible && !p.facultatif);
  const r = await Promise.all(utiles.map(packPret));
  return r.filter(Boolean).length / utiles.length;
}

export async function telephonePret() {
  return (await etatKit()) === 1;
}
