import * as Device from 'expo-device';
import * as DocumentPicker from 'expo-document-picker';
import * as FS from 'expo-file-system/legacy';

/** Un gros fichier téléchargeable une fois puis utilisé hors ligne (modèle IA, modèle vocal…). */
export type Telechargeable = { fichier: string; url: string; octets: number };

// Modèles libres (Apache 2.0), téléchargeables sans compte. Format GGUF quantifié pour llama.cpp.
export type Modele = Telechargeable & {
  id: string;
  nom: string;
  description: string;
  ramMinGo: number;
};

export const MODELES: Modele[] = [
  {
    id: 'leger',
    nom: 'Léger (Qwen3 0.6B)',
    description: 'Pour les petits téléphones. Rapide mais simple : il se contente de reformuler les fiches.',
    fichier: 'Qwen3-0.6B-Q8_0.gguf',
    url: 'https://huggingface.co/unsloth/Qwen3-0.6B-GGUF/resolve/main/Qwen3-0.6B-Q8_0.gguf',
    octets: 639447744,
    ramMinGo: 3,
  },
  {
    id: 'standard',
    nom: 'Standard (Qwen3 1.7B)',
    description: 'Le bon compromis pour la plupart des téléphones récents.',
    fichier: 'Qwen3-1.7B-Q4_K_M.gguf',
    url: 'https://huggingface.co/unsloth/Qwen3-1.7B-GGUF/resolve/main/Qwen3-1.7B-Q4_K_M.gguf',
    octets: 1107409472,
    ramMinGo: 4,
  },
  {
    id: 'avance',
    nom: 'Avancé (Qwen3 4B)',
    description: 'Meilleures réponses. Pour les téléphones haut de gamme (8 Go de mémoire ou plus).',
    fichier: 'Qwen3-4B-Instruct-2507-Q4_K_M.gguf',
    url: 'https://huggingface.co/unsloth/Qwen3-4B-Instruct-2507-GGUF/resolve/main/Qwen3-4B-Instruct-2507-Q4_K_M.gguf',
    octets: 2497281120,
    ramMinGo: 8,
  },
];

export const DOSSIER = `${FS.documentDirectory}modeles/`;
export const chemin = (m: Telechargeable) => DOSSIER + m.fichier;

export const ramGo = () => (Device.totalMemory ? Device.totalMemory / 1024 ** 3 : null);

/** Le plus gros modèle que le téléphone peut faire tourner (marge comprise pour le système). */
export function modeleConseille(): Modele | null {
  const ram = ramGo();
  if (ram === null) return MODELES[1];
  const ok = MODELES.filter((m) => ram >= m.ramMinGo - 0.5); // les « 4 Go » annoncés font souvent 3,6 Go réels
  return ok.at(-1) ?? null;
}

export const formatTaille = (o: number) => (o >= 1024 ** 3 ? `${(o / 1024 ** 3).toFixed(1)} Go` : `${Math.round(o / 1024 ** 2)} Mo`);

export async function estInstalle(m: Telechargeable) {
  const info = await FS.getInfoAsync(chemin(m));
  // Un fichier tronqué (téléchargement interrompu) ne doit pas être considéré comme installé.
  return info.exists && !info.isDirectory && info.size >= m.octets * 0.99;
}

export async function espaceLibre() {
  return FS.getFreeDiskStorageAsync();
}

export function telecharger(m: Telechargeable, onProgres: (fraction: number) => void, reprise?: string) {
  return FS.createDownloadResumable(
    m.url,
    chemin(m) + '.part',
    {},
    ({ totalBytesWritten, totalBytesExpectedToWrite }) =>
      onProgres(totalBytesWritten / (totalBytesExpectedToWrite > 0 ? totalBytesExpectedToWrite : m.octets)),
    reprise,
  );
}

export async function finaliser(m: Telechargeable) {
  await FS.moveAsync({ from: chemin(m) + '.part', to: chemin(m) });
}

export async function preparerDossier() {
  const info = await FS.getInfoAsync(DOSSIER);
  if (!info.exists) await FS.makeDirectoryAsync(DOSSIER, { intermediates: true });
}

export async function supprimer(m: Telechargeable) {
  await FS.deleteAsync(chemin(m), { idempotent: true });
  await FS.deleteAsync(chemin(m) + '.part', { idempotent: true });
}

/**
 * Importer un modèle depuis le téléphone (carte SD, clé USB, fichier reçu d'un proche) :
 * indispensable quand Internet n'est plus là.
 */
export async function importer<T extends Telechargeable>(liste: T[]): Promise<T | null> {
  const r = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: false, type: '*/*' });
  if (r.canceled) return null;
  const doc = r.assets[0];
  const m = liste.find((x) => x.fichier === doc.name);
  if (!m) throw new Error(`Fichier non reconnu : ${doc.name}. Noms attendus :\n${liste.map((x) => x.fichier).join('\n')}`);
  await preparerDossier();
  await FS.copyAsync({ from: doc.uri, to: chemin(m) });
  return m;
}
