import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useEffect, useSyncExternalStore } from 'react';
import { espaceLibre, estInstalle, finaliser, formatTaille, MODELES, preparerDossier, telecharger } from '@/lib/ia/modeles';
import { tailleEstimee, telechargerZone, zonePays } from '@/lib/cartes';
import { packPret, packs, type IdPack, type Pack } from '@/lib/packs';
import { paysActuel } from '@/lib/pays';
import { KEYS, lire, write } from '@/lib/store';
import { t } from '@/i18n';

// Le téléchargement du kit tourne ici, hors des écrans : on peut quitter la fenêtre et voir les tuiles
// de l'accueil s'allumer au fur et à mesure.

type Etat = {
  prets: Partial<Record<IdPack, boolean>>;
  progres: Partial<Record<IdPack, number>>;
  enCours: IdPack | null;
  /** Packs encore en attente dans la file. */
  file: IdPack[];
  erreur: string | null;
};

let etat: Etat = { prets: {}, progres: {}, enCours: null, file: [], erreur: null };
const abonnes = new Set<() => void>();
const maj = (patch: Partial<Etat>) => {
  etat = { ...etat, ...patch };
  abonnes.forEach((f) => f());
};

export function usePreparation() {
  const e = useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => {
        abonnes.delete(f);
      };
    },
    () => etat,
  );
  useEffect(() => {
    rafraichir();
  }, []);
  return e;
}

export async function rafraichir() {
  const prets: Etat['prets'] = {};
  for (const p of packs()) prets[p.id] = await packPret(p);
  maj({ prets });
}

/** Taille à télécharger pour un pack (estimation pour les cartes). */
export const taillePack = (p: Pack) => (p.id === 'cartes' ? tailleEstimee(zonePays(paysActuel())) : p.fichiers.reduce((s, f) => s + f.octets, 0));

export const enTelechargement = () => etat.enCours !== null;

/** Lance le téléchargement des packs choisis, l'un après l'autre. Renvoie un message d'erreur ou null. */
export async function preparer(ids: IdPack[]): Promise<string | null> {
  if (etat.enCours) return null;
  const liste = packs().filter((p) => ids.includes(p.id) && p.disponible && !etat.prets[p.id]);
  const total = liste.reduce((s, p) => s + taillePack(p), 0);
  const libre = await espaceLibre();
  if (libre < total * 1.1) {
    return t('Il faut {v1} libres, il reste {v2}. Libère de la place (photos, vidéos) puis réessaie.', { v1: formatTaille(total), v2: formatTaille(libre) });
  }
  await preparerDossier();
  await activateKeepAwakeAsync('preparation'); // l'écran ne doit pas s'éteindre pendant un long téléchargement
  maj({ file: liste.map((p) => p.id), erreur: null });
  try {
    for (const p of liste) {
      maj({ enCours: p.id, file: etat.file.filter((x) => x !== p.id), progres: { ...etat.progres, [p.id]: 0 } });
      const avancer = (x: number) => maj({ progres: { ...etat.progres, [p.id]: x } });
      try {
        if (p.id === 'cartes') {
          await telechargerZone(zonePays(paysActuel()), (x) => avancer(x / 100));
        } else {
          const total = taillePack(p);
          let fait = 0;
          for (const f of p.fichiers) {
            if (await estInstalle(f)) {
              fait += f.octets;
              continue;
            }
            const r = await telecharger(f, (x) => avancer((fait + x * f.octets) / total)).downloadAsync();
            if (!r || r.status >= 400) throw new Error(t('Téléchargement interrompu.'));
            await finaliser(f);
            fait += f.octets;
          }
          if (p.id === 'ia' && !lire<string | null>(KEYS.modele, null)) write(KEYS.modele, MODELES.find((m) => m.fichier === p.fichiers[0]?.fichier)?.id ?? null);
        }
        maj({ prets: { ...etat.prets, [p.id]: true } });
      } catch (e) {
        const message = t('{nom} : {v2}\nVérifie ta connexion puis relance.', { nom: t(p.nom), v2: e instanceof Error ? e.message : String(e) });
        maj({ erreur: message });
        return message;
      }
    }
    return null;
  } finally {
    maj({ enCours: null, file: [] });
    deactivateKeepAwake('preparation');
    await rafraichir();
  }
}
