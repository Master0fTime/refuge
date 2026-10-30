import * as Crypto from 'expo-crypto';
import { useSyncExternalStore } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { Maillage } from '../../modules/maillage';
import { KEYS, lire, write } from '@/lib/store';
import { profilVide, type Groupe, type Profil } from '@/lib/types';
import { t } from '@/i18n';

// Messagerie de groupe par Bluetooth, sans Internet ni réseau mobile.
// - Chaque message est chiffré (AES-256-GCM) avec une clé tirée de l'identifiant du groupe : seuls ceux qui
//   ont scanné le QR code du groupe peuvent le lire.
// - Chaque téléphone Refuge relaie les paquets qu'il reçoit (même ceux d'autres groupes, qu'il ne peut pas lire),
//   jusqu'à RELAIS rebonds : les messages vont plus loin que la portée d'un seul téléphone.

export type Genre = 'msg' | 'ok' | 'aide' | 'pos';
export type MessageGroupe = { id: string; de: string; nom: string; k: Genre; x?: string; la?: number; lo?: number; ts: number; moi?: boolean };

/** Paquet transporté : lisible par tous les relais, sauf `c` (le contenu chiffré). */
type Paquet = { v: 1; i: string; r: number; g: string; c: string };

const RELAIS = 4;
const DUREE_MS = 30 * 60_000; // un paquet est retransmis aux téléphones croisés pendant 30 minutes
const MAX_PAR_GROUPE = 200;
const LONGUEUR_MAX = 300;

type Etat = { actif: boolean; voisins: number; erreur: string | null };
let etat: Etat = { actif: false, voisins: 0, erreur: null };
const abonnes = new Set<() => void>();
const maj = (patch: Partial<Etat>) => {
  etat = { ...etat, ...patch };
  abonnes.forEach((f) => f());
};

export const maillageDisponible = () => Maillage !== null;

export function useMaillage() {
  return useSyncExternalStore(
    (f) => {
      abonnes.add(f);
      return () => {
        abonnes.delete(f);
      };
    },
    () => etat,
  );
}

// ---------- Clés ----------

const cles = new Map<string, { cle: string; tag: string }>();
async function clesGroupe(id: string) {
  let k = cles.get(id);
  if (!k) {
    const cle = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `refuge-maillage-cle:${id}`);
    const tag = (await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `refuge-maillage-tag:${id}`)).slice(0, 12);
    k = { cle, tag };
    cles.set(id, k);
  }
  return k;
}

// ---------- Messages enregistrés ----------

type Boite = Record<string, MessageGroupe[]>;
const messages = () => lire<Boite>(KEYS.messages, {});

function ranger(groupeId: string, m: MessageGroupe) {
  const tout = messages();
  const liste = tout[groupeId] ?? [];
  if (liste.some((x) => x.id === m.id)) return;
  write(KEYS.messages, { ...tout, [groupeId]: [...liste, m].sort((a, b) => a.ts - b.ts).slice(-MAX_PAR_GROUPE) });
}

export function viderDiscussion(groupeId: string) {
  const { [groupeId]: _, ...reste } = messages();
  write(KEYS.messages, reste);
}

// ---------- Réception et relais ----------

const vus = new Set<string>();
let ecoute = false;

// Le paquet ne contient que de l'ASCII (hexadécimal et base64) : atob/btoa suffisent.
const b64 = { depuis: (s: string) => atob(s), vers: (s: string) => btoa(s) };

async function recevoir(donnees: string) {
  let p: Paquet;
  try {
    p = JSON.parse(b64.depuis(donnees));
  } catch {
    return;
  }
  if (p.v !== 1 || typeof p.i !== 'string' || vus.has(p.i)) return;
  vus.add(p.i);
  if (vus.size > 2000) vus.clear();

  // Relayer d'abord : même un téléphone qui n'est pas du groupe aide le message à avancer.
  if (p.r > 0) Maillage?.diffuser(p.i, b64.vers(JSON.stringify({ ...p, r: p.r - 1 })), DUREE_MS);

  const moi = lire<Profil>(KEYS.profil, profilVide('')).id;
  for (const g of lire<Groupe[]>(KEYS.groupes, [])) {
    const { cle, tag } = await clesGroupe(g.id);
    if (tag !== p.g) continue;
    const clair = Maillage?.dechiffrer(cle, p.c);
    if (!clair) return;
    try {
      const m = JSON.parse(clair) as Omit<MessageGroupe, 'id'>;
      if (m.de === moi) return;
      ranger(g.id, { ...m, id: p.i, x: m.x?.slice(0, LONGUEUR_MAX) });
    } catch {
      // Contenu illisible : ignoré.
    }
    return;
  }
}

/** Demande les autorisations Bluetooth, puis allume l'annonce et la recherche. Renvoie un message d'erreur ou null. */
export async function demarrer(): Promise<string | null> {
  if (!Maillage) {
    const m = t('La messagerie Bluetooth demande la nouvelle version complète de Refuge (Réglages → Mises à jour).');
    maj({ erreur: m });
    return m;
  }
  if (etat.actif) return null;
  const bt = Maillage.etatBluetooth();
  if (bt === 'absent') return t('Ce téléphone n’a pas de Bluetooth compatible.');
  if (bt === 'eteint') return t('Le Bluetooth est éteint : allume-le dans les réglages rapides, puis réessaie.');

  const perms =
    Number(Platform.Version) >= 31
      ? [PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN, PermissionsAndroid.PERMISSIONS.BLUETOOTH_ADVERTISE, PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  const r = await PermissionsAndroid.requestMultiple(perms);
  if (perms.some((p) => r[p] !== PermissionsAndroid.RESULTS.GRANTED)) {
    return t('Autorise « Appareils à proximité » pour Refuge : c’est ce qui permet de trouver les téléphones autour de toi.');
  }

  if (!ecoute) {
    ecoute = true;
    Maillage.addListener('recu', (e) => {
      recevoir(e.donnees);
    });
    Maillage.addListener('voisins', (e) => maj({ voisins: e.nombre }));
    Maillage.addListener('erreur', (e) => maj({ erreur: e.message }));
  }
  maj({ erreur: null });
  Maillage.demarrer();
  maj({ actif: true });
  return null;
}

export function arreter() {
  Maillage?.arreter();
  maj({ actif: false, voisins: 0 });
}

// ---------- Envoi ----------

export async function envoyer(g: Groupe, contenu: Pick<MessageGroupe, 'k' | 'x' | 'la' | 'lo'>) {
  if (!Maillage) throw new Error(t('La messagerie Bluetooth demande la nouvelle version complète de Refuge (Réglages → Mises à jour).'));
  const profil = lire<Profil>(KEYS.profil, profilVide(''));
  const m: Omit<MessageGroupe, 'id'> = {
    ...contenu,
    x: contenu.x?.slice(0, LONGUEUR_MAX),
    de: profil.id,
    nom: profil.prenom.trim() || t('Moi'),
    ts: Date.now(),
  };
  const { cle, tag } = await clesGroupe(g.id);
  const id = Array.from(Crypto.getRandomBytes(6), (o) => o.toString(16).padStart(2, '0')).join('');
  const paquet: Paquet = { v: 1, i: id, r: RELAIS, g: tag, c: Maillage.chiffrer(cle, JSON.stringify(m)) };
  vus.add(id);
  ranger(g.id, { ...m, id, moi: true });
  Maillage.diffuser(id, b64.vers(JSON.stringify(paquet)), DUREE_MS);
}

/** « Je vais bien » / « J'ai besoin d'aide » à tous ses groupes, par Bluetooth (en plus du SMS). */
export async function diffuserStatut(k: 'ok' | 'aide', position?: { la: number; lo: number }) {
  if (!Maillage || (await demarrer())) return 0;
  const groupes = lire<Groupe[]>(KEYS.groupes, []);
  for (const g of groupes) await envoyer(g, { k, ...position });
  return groupes.length;
}
